import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, Product } from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";
import { botReply, type BotResult, type PlacedOrder } from "@/lib/wa-bot";
import { humanize, understand } from "@/lib/wa-ai";
import { addMsg, chatOf, update } from "@/lib/wa-bot-store";

// WhatsApp auto-replies for the shop number. The WhatsApp gateway (WA-AKG, session WA_NOTIFY_SESSION)
// POSTs every message here, signed with WA_BOT_SECRET (X-Webhook-Signature: sha256=<hmac of the body>).
// The bot answers prices/stock/delivery from the live catalog; orders, location pins and "talk to a person"
// alert the shop and pause the bot in that chat. A message staff type on the phone also pauses it.
const PAUSE_MS = 60 * 60 * 1000;
const MIN_GAP_MS = 4 * 1000; // at most one bot reply per chat every 4 s (20 s dropped real quick follow-ups)
const DAY_MAX = 15; // bot replies per chat per day
const HOUR_MAX = 200; // bot replies per hour, all chats
// while an order is open (PLAN 74p) the customer answers menus quickly: a short gap and a higher daily cap
const ORDER_GAP_MS = 3 * 1000;
const ORDER_DAY_MAX = 60;
const ORDER_TTL_MS = 6 * 3600 * 1000; // an order left open this long starts again
const chains = new Map<string, Promise<unknown>>(); // one message at a time per chat, so order steps keep their order
const sentTimes: number[] = [];

function verify(raw: string, header: string | null): boolean {
  const secret = process.env.WA_BOT_SECRET || "";
  if (!secret || !header?.startsWith("sha256=")) return false;
  const a = Buffer.from(header);
  const b = Buffer.from("sha256=" + createHmac("sha256", secret).update(raw).digest("hex"));
  return a.length === b.length && timingSafeEqual(a, b);
}

async function liveCatalog() {
  const store = await readCatalogStore();
  const deleted = new Set(store.deleted || []);
  const over = store.products || {};
  const base = new Set(INITIAL_PRODUCTS.map((p) => p.id));
  const products: Product[] = [
    ...Object.values(over).filter((p) => !base.has(p.id)),
    ...INITIAL_PRODUCTS.map((p) => over[p.id] ?? p),
  ].filter((p) => p?.id && !deleted.has(p.id));
  return { products, settings: { ...INITIAL_SETTINGS, ...(store.settings || {}) } };
}

const shopNumbers = () =>
  (process.env.WA_NOTIFY_TO || "").split(",").map((x) => x.replace(/\D/g, "")).filter((x) => x.length >= 9);

async function send(jid: string, text: string) {
  const { WA_NOTIFY_URL: url, WA_NOTIFY_KEY: key, WA_NOTIFY_SESSION: session } = process.env;
  if (!url || !key || !session) return false;
  const r = await fetch(`${url.replace(/\/$/, "")}/api/messages/${encodeURIComponent(session)}/${encodeURIComponent(jid)}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify({ message: { text } }),
    signal: AbortSignal.timeout(15000),
  }).catch((e) => { console.error("wa-bot send failed:", e?.message || e); return null; });
  if (r && !r.ok) console.error("wa-bot send refused:", r.status);
  return !!r?.ok;
}

const flat = (s: string) => s.replace(/\s+/g, " ").slice(0, 300);

// Save a confirmed chat order through the site's own orders API (same checks, admin panel, lead + staff alert).
async function saveOrder(o: PlacedOrder, phone: string, chatName: string): Promise<string | null> {
  const items = o.cart.flatMap((i) => {
    const bundles = i.five > 0 ? Math.floor(i.qty / 5) : 0;
    const rest = i.qty - bundles * 5;
    const base = { productId: i.productId, title: i.title, brand: i.brand };
    return [
      ...(bundles ? [{ ...base, packTier: "5-cartons", quantity: bundles, unitPrice: i.five }] : []),
      ...(rest ? [{ ...base, packTier: "1-carton", quantity: rest, unitPrice: i.carton }] : []),
    ];
  });
  const order = {
    id: `WA-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: o.name || chatName || "WhatsApp customer",
    customerPhone: phone ? `+${phone}` : "WhatsApp chat (number hidden)",
    deliveryArea: o.area,
    addressNote: (o.area.startsWith("📍") ? "Location pin sent in the WhatsApp chat. " : "") +
      (o.feeLater ? "Courier fee to confirm with the customer. " : "") + "Ordered in the WhatsApp chat.",
    paymentMethod: "Cash on Delivery",
    items,
    deliveryFee: o.deliveryFee,
    source: "WhatsApp Bot",
  };
  try {
    const r = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_API_KEY || "" },
      body: JSON.stringify({ action: "create", order }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.id) { console.error("wa-bot order not saved:", r.status); return null; }
    return String(j.id);
  } catch (e) {
    console.error("wa-bot order not saved:", (e as Error)?.message || e);
    return null;
  }
}

const phoneOf = (jid: string) => (jid.endsWith("@s.whatsapp.net") ? jid.split("@")[0] : "");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handle(ev: { event?: string; sessionId?: string; data?: Record<string, any> }) {
  const d = ev.data || {};
  if (ev.sessionId !== process.env.WA_NOTIFY_SESSION) return;
  if (d.isGroup || (d.chatType && d.chatType !== "PERSONAL")) return;
  const jid = String(d.key?.remoteJid || "");
  if (!/^[\w.+-]+@(s\.whatsapp\.net|lid)$/.test(jid)) return;
  if (shopNumbers().includes(phoneOf(jid))) return; // the shop's own alert chat
  const text = String(d.content || d.caption || "").trim();
  const now = Date.now();

  if (ev.event === "message.sent" || d.key?.fromMe) {
    if (text.includes("dubaicigeretteshop.ae/review/")) return; // automatic review request, not staff typing
    // the bot's own replies come back here too; anything else was typed by staff: the bot steps back
    await update((s) => {
      const c = s.chats[jid];
      if (!c) return;
      if (c.msgs.some((m) => m.from === "bot" && m.text === text && now - m.at < 5 * 60 * 1000)) return;
      addMsg(c, "staff", text || `[${String(d.type || "message").toLowerCase()}]`, now);
      c.pausedUntil = now + PAUSE_MS;
      c.needsPerson = false;
      c.order = undefined; // staff took over: the bot's open order is theirs now
    });
    return;
  }
  if (ev.event !== "message.received") return;

  const type = String(d.type || "TEXT");
  // step 1 (short, under the store lock): record the message, apply the limits, read the chat's order
  const plan = await update((s) => {
    const c = chatOf(s, jid, String(d.pushName || ""));
    const hadBot = c.msgs.some((m) => m.from === "bot");
    const lastBot = [...c.msgs].reverse().find((m) => m.from === "bot")?.text || "";
    const recent = c.msgs.slice(-6).map((m) => `${m.from}: ${m.text.slice(0, 200)}`);
    addMsg(c, "customer", text || `[${type.toLowerCase()}]`, now);
    if (!s.enabled || c.pausedUntil > now) return null;
    if (c.order && now - c.order.at > ORDER_TTL_MS) c.order = undefined;
    const day = new Date(now + 4 * 3600 * 1000).toISOString().slice(0, 10); // Dubai day
    if (c.botDay !== day) { c.botDay = day; c.botCount = 0; }
    while (sentTimes.length && sentTimes[0] < now - 3600 * 1000) sentTimes.shift();
    const gap = c.order ? ORDER_GAP_MS : MIN_GAP_MS;
    const dayMax = c.order ? ORDER_DAY_MAX : DAY_MAX;
    if (now - c.lastBotAt < gap || c.botCount >= dayMax || sentTimes.length >= HOUR_MAX) return null;
    c.lastBotAt = now;
    c.botCount += 1;
    sentTimes.push(now);
    return { name: c.name, hadBot, lastBot, recent, state: c.order || null, last: c.last || null };
  });
  if (!plan) return;

  // step 2 (no lock: AI and saving can take seconds): rule bot -> AI reading if not understood -> order -> AI wording
  const { products, settings } = await liveCatalog();
  const run = (t: string) => botReply(t, type, products, settings, plan.hadBot, plan.state, plan.last);
  let r: BotResult = run(text);
  if (!r.understood && text) {
    const cmd = await understand(text, plan.state?.step, plan.lastBot);
    if (cmd) {
      const r2 = botReply(cmd, "TEXT", products, settings, plan.hadBot, plan.state, plan.last);
      if (r2.understood) r = r2;
    }
  }
  let reply = r.reply;
  let orderId = "";
  if (r.order) {
    orderId = (await saveOrder(r.order, phoneOf(jid), plan.name)) || "";
    if (!orderId) {
      r = { ...r, handover: true, state: plan.state };
      reply = "Sorry, I could not save your order just now. A team member will take it from here in a few minutes. 🙏";
    }
  }
  // the welcome is already written to be friendly; the AI only doubled its question
  if (r.intent !== "welcome") reply = (await humanize(text || `[${type.toLowerCase()}]`, reply, plan.recent)) || reply;
  reply = reply.replace("{ORDER}", orderId);

  // step 3: save the new state and the reply before sending, so its echo is not taken for staff
  await update((s) => {
    const c = chatOf(s, jid);
    c.order = r.state ? { ...r.state, at: Date.now() } : undefined;
    if (r.order && orderId) c.last = { cart: r.order.cart, area: r.order.area, name: r.order.name };
    addMsg(c, "bot", reply, Date.now());
    if (r.handover) { c.pausedUntil = Date.now() + PAUSE_MS; c.needsPerson = true; }
  });
  await send(jid, reply);
  if (r.handover) {
    const who = phoneOf(jid) ? `+${phoneOf(jid)} (wa.me/${phoneOf(jid)})` : "a customer (number hidden by WhatsApp)";
    const alert = [
      `🙋 *Customer needs a person*: ${flat(plan.name || "no name")} · ${who}`,
      `Said: "${flat(text || `[${type.toLowerCase()}]`)}"`,
      `Bot is paused in that chat for 60 min. Reply to them in WhatsApp.`,
    ].join("\n");
    for (const n of shopNumbers()) await send(`${n}@s.whatsapp.net`, alert);
  }
}

export async function GET() {
  return NextResponse.json({ status: "active", service: "Dubai Cigerette Shop WhatsApp auto-reply" });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verify(raw, request.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let ev;
  try { ev = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  // the gateway waits only 10 s: answer now, reply in the background
  const jid = String(ev?.data?.key?.remoteJid || "");
  const prev = chains.get(jid) || Promise.resolve();
  const job = prev.then(() => handle(ev)).catch((e) => console.error("wa-bot error:", e?.message || e));
  chains.set(jid, job);
  job.finally(() => { if (chains.get(jid) === job) chains.delete(jid); });
  return NextResponse.json({ ok: true });
}
