// One bot turn, shared by the WhatsApp webhook and the website chat (PLAN 74p/74q):
// rule bot -> AI reading if not understood -> save a confirmed order -> AI wording (fact-checked).
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, Product } from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";
import { botReply, factsFor, findArea, isQuestion, lineTotal, matchProducts, missingStep, phoneDigits, stepPrompt, type BotResult, type BotSettings, type LastOrder, type OrderState, type PlacedOrder } from "@/lib/wa-bot";
import { applyAgent, parseAgent } from "@/lib/chat-agent";
import { converse, humanize, interpret } from "@/lib/wa-ai";

export async function liveCatalog() {
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

export type Channel = "wa" | "web";

// Save a confirmed chat order through the site's own orders API (same checks, admin panel, lead + staff alert).
async function saveOrder(o: PlacedOrder, phone: string, chatName: string, ch: Channel): Promise<string | null> {
  const items = o.cart.flatMap((i) => {
    const bundles = i.five > 0 ? Math.floor(i.qty / 5) : 0;
    const rest = i.qty - bundles * 5;
    const base = { productId: i.productId, title: i.title, brand: i.brand };
    return [
      ...(bundles ? [{ ...base, packTier: "5-cartons", quantity: bundles, unitPrice: i.five }] : []),
      ...(rest ? [{ ...base, packTier: "1-carton", quantity: rest, unitPrice: i.carton }] : []),
    ];
  });
  const where = ch === "web" ? "website chat" : "WhatsApp chat";
  const order = {
    id: `${ch === "web" ? "WC" : "WA"}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: o.name || chatName || "Chat customer",
    customerPhone: phone ? `+${phone}` : "WhatsApp chat (number hidden)",
    deliveryArea: o.area,
    addressNote: (o.area.startsWith("📍") ? "Location pin sent in the WhatsApp chat. " : "") +
      (o.feeLater ? "Courier fee to confirm with the customer. " : "") + `Ordered in the ${where}.`,
    paymentMethod: "Cash on Delivery",
    items,
    deliveryFee: o.deliveryFee,
    source: ch === "web" ? "Website Chat" : "WhatsApp Bot",
  };
  try {
    const r = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_API_KEY || "" },
      body: JSON.stringify({ action: "create", order }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.id) { console.error("bot order not saved:", r.status); return null; }
    return String(j.id);
  } catch (e) {
    console.error("bot order not saved:", (e as Error)?.message || e);
    return null;
  }
}

export interface TurnInput {
  text: string; type: string; ch: Channel;
  state: OrderState | null; last: LastOrder | null;
  hadBot: boolean; lastBot: string; recent: string[];
  phone: string; name: string; // WhatsApp: the chat's number and push name
}

async function agentTurn(a: TurnInput, products: Product[], settings: BotSettings): Promise<BotResult | null> {
  const web = a.ch === "web";
  const st = a.state;
  // products named now; only if none, the ones from the last messages ("which is cheaper?")
  const query = matchProducts(a.text, products).items.length ? a.text : `${a.text} ${a.recent.slice(-4).join(" ")}`;
  const facts = factsFor(query, st, products, settings, true);
  const cart = st?.cart || [];
  const order = [
    cart.length ? cart.map((i) => `- [${i.productId}] ${i.qty} × ${i.title}: AED ${lineTotal(i)}`).join("\n") : "- cart empty",
    `- delivery address: ${st?.area || "not given"}`, `- name: ${st?.name || "not given"}`,
    ...(web ? [`- WhatsApp number: ${st?.phone ? "+" + st.phone : "not given"}`] : []),
    st?.step === "confirm" ? "- the order summary is on screen: waiting for their yes" : "",
    // "same again": their previous order, so the AI can add it back (prices come from today's catalog)
    a.last?.cart?.length ? `- their previous order (for "same again"): ${a.last.cart.map((i) => `[${i.productId}] ${i.qty} × ${i.title}`).join(", ")}, to ${a.last.area}, name ${a.last.name}` : "",
  ].filter(Boolean).join("\n");
  const need = { brand: "what they want (product + quantity)", area: "delivery address", name: "name for the rider", phone: "WhatsApp number", confirm: "their yes to place the order" } as Record<string, string>;
  const missing = need[missingStep({ step: "brand", ...(st || {}), cart }, web)] || "nothing";
  const allowed = [facts, a.text, a.recent.join(" "), a.lastBot].join(" ");
  // what the word-matching bot reads as an exact product + quantity ("1 marlboro red"), as a hint for a retry
  const rule = botReply(a.text, "TEXT", products, settings, true, st, a.last, a.ch).state?.cart || [];
  const ruleAdds = rule.filter((i) => !cart.some((c) => c.productId === i.productId && c.qty === i.qty));
  let problem = "";
  for (let i = 0; i < 2; i++) { // one retry, told what was wrong
    const g = parseAgent(await converse(a.text, order, missing, web, a.lastBot, a.recent, facts, problem));
    if (!g) return null;
    // waiting for a name and they sent one or two words: that is the name ("Imran"), not a question
    const bare = a.text.trim();
    if (i === 0 && missing === need.name && /^\p{L}[\p{L} .'-]{1,29}$/u.test(bare) && bare.split(/\s+/).length <= 3 &&
        !/^(yes|no|ok|okay|haan|han|nahi|sure|done|cancel|thanks?|hi|hello|نعم|لا)$/i.test(bare) && !g.actions.some((x) => x.do === "name")) {
      problem = `they just gave their name "${bare}": save it with a name action and move on`;
      continue;
    }
    if (i === 0 && ruleAdds.length && !g.actions.some((x) => x.do === "qty")) {
      problem = `the message already gives the quantity: ${ruleAdds.map((x) => `${x.qty} × ${x.title} [${x.productId}]`).join(", ")}. Add it with a qty action instead of asking how many`;
      continue;
    }
    // backstop: an area we know ("jlt", "al nahda") given while the address is missing is always saved
    const known = findArea(a.text);
    if (known && !st?.area && a.text.trim().split(/\s+/).length <= 6 && !g.actions.some((x) => x.do === "area" || x.do === "qty"))
      g.actions.push({ do: "area", value: a.text });
    // and a message that is only a phone number is the number
    if (web && /^[\d\s+()-]{9,20}$/.test(a.text.trim()) && phoneDigits(a.text) && !g.actions.some((x) => x.do === "phone"))
      g.actions.push({ do: "phone", value: a.text });
    const r = applyAgent(st, g.actions, g.reply, products, settings, web, allowed);
    if (typeof r !== "string") return r;
    problem = r;
    console.error("chat agent answer rejected:", r);
  }
  return null;
}

export async function runTurn(a: TurnInput): Promise<{ r: BotResult; reply: string; orderId: string }> {
  const { products, settings } = await liveCatalog();
  const run = (t: string, type: string) => botReply(t, type, products, settings, a.hadBot, a.state, a.last, a.ch);
  // PLAN 74s: the AI leads the chat; the rule bot below answers only when the AI is off, down or fails a check
  const led = process.env.CHAT_AGENT !== "0" && a.type === "TEXT" && a.text.trim() ? await agentTurn(a, products, settings) : null;
  let r = led || run(a.text, a.type);
  let answered = led ? r.reply : "";
  // the rules miss it, or it is a real question (the rules only match words): the AI reads what is meant
  if (!led && a.text && (!r.understood || (isQuestion(a.text) && !r.order && r.intent !== "human"))) {
    const it = await interpret(a.text, a.state?.step, a.lastBot, a.recent, factsFor(a.text, a.state, products, settings));
    if (it?.answer) {
      // answer the question, then the order carries on: "do you have marlboro gold?" keeps the rule's next step
      // (how many?), "something cheaper than gold?" stays where the chat was
      const compare = /cheap|similar|like|differ|strong|light|smooth|best|recommend|suggest|\bvs\b|compar|alternative|other/i.test(a.text);
      // an answer that suggests several products ("menthol ones?") must not pick one of them
      const several = products.filter((p) => it.answer!.toLowerCase().includes(p.title.toLowerCase().replace(/ cigarettes?$/, ""))).length > 1;
      const keep = r.understood && !compare && !several ? r.state : a.state;
      answered = [it.answer, "", ...stepPrompt(keep, products, a.ch)].join("\n");
      r = { ...r, state: keep, order: undefined, handover: false, reply: answered };
    } else if (it?.command) {
      const r2 = run(it.command, "TEXT");
      if (r2.understood) r = r2;
    }
  }
  let reply = r.reply;
  let orderId = "";
  if (r.order) {
    orderId = (await saveOrder(r.order, r.order.phone || a.phone, a.name, a.ch)) || "";
    if (!orderId) {
      r = { ...r, handover: true, state: a.state };
      reply = a.ch === "web"
        ? "Sorry, I could not save your order just now. Please tap *Live WA* below and our team will take it from there. 🙏"
        : "Sorry, I could not save your order just now. A team member will take it from here in a few minutes. 🙏";
    }
  }
  // a bare "hi" gets the welcome as written (the AI only doubled its question); "how are you?" gets a human answer
  const bareHi = r.intent === "welcome" && a.text.trim().split(/ +/).length <= 2;
  if (!bareHi && !answered) reply =(await humanize(a.text || `[${a.type.toLowerCase()}]`, reply, a.recent)) || reply;
  return { r, reply: reply.replace("{ORDER}", orderId), orderId };
}
