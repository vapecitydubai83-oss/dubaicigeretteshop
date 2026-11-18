import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, Product } from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";
import { botReply } from "@/lib/wa-bot";
import { addMsg, chatOf, update } from "@/lib/wa-bot-store";

// WhatsApp auto-replies for the shop number. The WhatsApp gateway (WA-AKG, session WA_NOTIFY_SESSION)
// POSTs every message here, signed with WA_BOT_SECRET (X-Webhook-Signature: sha256=<hmac of the body>).
// The bot answers prices/stock/delivery from the live catalog; orders, location pins and "talk to a person"
// alert the shop and pause the bot in that chat. A message staff type on the phone also pauses it.
const PAUSE_MS = 60 * 60 * 1000;
const MIN_GAP_MS = 20 * 1000; // at most one bot reply per chat every 20 s
const DAY_MAX = 15; // bot replies per chat per day
const HOUR_MAX = 200; // bot replies per hour, all chats
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
    // the bot's own replies come back here too; anything else was typed by staff: the bot steps back
    await update((s) => {
      const c = s.chats[jid];
      if (!c) return;
      if (c.msgs.some((m) => m.from === "bot" && m.text === text && now - m.at < 5 * 60 * 1000)) return;
      addMsg(c, "staff", text || `[${String(d.type || "message").toLowerCase()}]`, now);
      c.pausedUntil = now + PAUSE_MS;
      c.needsPerson = false;
    });
    return;
  }
  if (ev.event !== "message.received") return;

  const type = String(d.type || "TEXT");
  const plan = await update(async (s) => {
    const c = chatOf(s, jid, String(d.pushName || ""));
    const hadBot = c.msgs.some((m) => m.from === "bot");
    addMsg(c, "customer", text || `[${type.toLowerCase()}]`, now);
    if (!s.enabled || c.pausedUntil > now) return null;
    const day = new Date(now + 4 * 3600 * 1000).toISOString().slice(0, 10); // Dubai day
    if (c.botDay !== day) { c.botDay = day; c.botCount = 0; }
    while (sentTimes.length && sentTimes[0] < now - 3600 * 1000) sentTimes.shift();
    if (now - c.lastBotAt < MIN_GAP_MS || c.botCount >= DAY_MAX || sentTimes.length >= HOUR_MAX) return null;
    const { products, settings } = await liveCatalog();
    const r = botReply(text, type, products, settings, hadBot);
    c.lastBotAt = now;
    c.botCount += 1;
    sentTimes.push(now);
    addMsg(c, "bot", r.reply, now); // saved before sending, so its echo is not taken for staff
    if (r.handover) { c.pausedUntil = now + PAUSE_MS; c.needsPerson = true; }
    return { r, name: c.name };
  });
  if (!plan) return;
  await send(jid, plan.r.reply);
  if (plan.r.handover) {
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
  handle(ev).catch((e) => console.error("wa-bot error:", e?.message || e));
  return NextResponse.json({ ok: true });
}
