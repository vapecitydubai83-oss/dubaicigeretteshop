// AI-led chat (PLAN 74s): the AI talks, the code keeps the order. The AI sends back its reply plus the
// actions it wants; applyAgent() checks every action against the live catalog and is the only thing that
// changes the cart. The order summary, totals and the "placed" message are written here, never by the AI.
import {
  cartItem, lineTotal, missingStep, phoneDigits, placedLines, summaryLines, totals,
  type BotProduct, type BotResult, type BotSettings, type OrderState,
} from "./wa-bot.ts";

export type AgentAction =
  | { do: "qty"; id: string; qty: number } // final quantity of that product in the cart, 0 removes it
  | { do: "area" | "name" | "phone"; value: string }
  | { do: "place" } | { do: "cancel" } | { do: "agent" };

const SITE = "https://dubaicigeretteshop.ae";
const orderable = (p?: BotProduct) => !!p && p.inStock !== false && Number(p.cartonPrice) > 0;
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[*_~`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

// Every number the AI may write: the facts, the chat, and the cart after its actions. "" = fine, else the problem.
export function agentProblem(reply: string, allowed: string): string {
  const r = reply.trim();
  if (!r || r.length > 700) return "reply empty or too long";
  const nums = new Set(allowed.match(/\d+(\.\d+)?/g) || []);
  const bad = (r.match(/\d+(\.\d+)?/g) || []).filter((x) => !nums.has(x));
  if (bad.length) return `the number(s) ${bad.join(", ")} are not in FACTS or the order`;
  if ((r.match(/https?:\/\/\S+|www\.\S+/gi) || []).some((u) => !u.startsWith(SITE))) return "links are not allowed";
  // only the code places an order; the AI must not say it did, nor write its own summary
  if (/(order|it)('s| is| has been| will be)? (placed|confirmed|booked|on (its|the) way|being (prepared|processed|packed)|dispatched|sent out)|placed your order|on its way|on the way|all set|في الطريق|جاهز|🧾|\{ORDER\}/i.test(r))
    return "never say the order is placed, confirmed or on its way: the system does that after their yes to the summary";
  // shop copy rule: no claims we cannot prove
  if (/\b(genuine|authentic|licen[cs]ed|counterfeit|fake|best prices?|cheapest in|lowest prices?)\b/i.test(r))
    return "make no claims about genuineness, licences or best/lowest prices; just help them choose";
  return "";
}
export const agentReplyOk = (reply: string, allowed: string) => !agentProblem(reply, allowed);

export function applyAgent(
  st: OrderState | null, actions: AgentAction[], reply: string, products: BotProduct[], s: BotSettings,
  web: boolean, allowed: string,
): BotResult | string {
  const o: OrderState = { step: "brand", ...(st || {}), cart: [...(st?.cart || [])], options: undefined, pick: undefined, want: undefined };
  let changed = false, handover = false;
  for (const a of actions.slice(0, 8)) {
    if (a.do === "qty") {
      const p = products.find((x) => x.id === a.id);
      const k = Number(a.qty);
      if (!Number.isInteger(k) || k < 0 || k > 50) return "qty must be a whole number from 0 to 50 (more = agent)";
      if (k > 0 && !p) return `no product with id ${a.id}: use an id in [brackets] from FACTS`;
      if (k > 0 && !orderable(p)) return `${p!.title} is out of stock: suggest another from FACTS`;
      o.cart = o.cart.filter((i) => i.productId !== a.id);
      if (k > 0) o.cart.push(cartItem(p!, k));
      changed = true;
    } else if (a.do === "area") {
      const v = clean(a.value, 100);
      if (v.length < 2) return "address too short";
      if (v !== o.area) { o.area = v; changed = true; }
    } else if (a.do === "name") {
      const v = clean(a.value, 40);
      if (!/\p{L}/u.test(v)) return "name must contain letters";
      if (v !== o.name) { o.name = v; changed = true; }
    } else if (a.do === "phone") {
      const d = phoneDigits(String(a.value));
      if (!d) return "that is not a valid phone number: ask again";
      if (d !== o.phone) { o.phone = d; changed = true; }
    } else if (a.do === "cancel") {
      const bad = agentProblem(reply, allowed);
      if (bad) return bad;
      return { intent: "cancel", reply, handover: false, productIds: [], state: null, understood: true };
    } else if (a.do === "agent") handover = true;
  }
  const cartNums = o.cart.flatMap((i) => [i.qty, lineTotal(i), i.carton, i.five]);
  const t = totals(o.cart, o.area || "", s);
  const problem = agentProblem(reply, [allowed, ...cartNums, t.subtotal, t.total, t.deliveryFee].join(" "));

  // "place" counts only when the summary was on screen and nothing changed since
  if (actions.some((a) => a.do === "place") && st?.step === "confirm" && !changed && missingStep(o, web) === "confirm") {
    return {
      intent: "order", reply: placedLines(o, s, web).join("\n"), handover: false, productIds: [], state: null, understood: true,
      order: { cart: o.cart, area: o.area || "", name: o.name || "", phone: o.phone, ...t },
    };
  }
  if (problem) return problem;
  // it must not say it changed the cart without doing it ("removing the gold" with no qty action)
  if (!actions.length && /\b(added|adding|removed|removing|updated|updating|changed|changing|made it|replaced)\b/i.test(reply))
    return "you said you changed the cart but sent no qty action: send {\"do\":\"qty\",...} for every change (qty 0 removes)";
  o.step = missingStep(o, web);
  const showSummary = o.step === "confirm" && (changed || st?.step !== "confirm");
  const lines = [reply.trim()];
  if (showSummary) lines.push("", ...summaryLines(o, s), "", "Shall I place it? Just say *yes*, or tell me what to change.");
  return {
    intent: handover ? "human" : "cart", reply: lines.join("\n"), handover, state: o.cart.length || o.area ? o : null,
    productIds: o.cart.map((i) => i.productId), understood: true,
  };
}

export function parseAgent(out: string | null): { reply: string; actions: AgentAction[] } | null {
  const m = out?.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const reply = typeof j.reply === "string" ? j.reply.trim() : "";
    const actions = Array.isArray(j.actions) ? j.actions.filter((a: unknown) => a && typeof a === "object" && typeof (a as { do?: unknown }).do === "string") : [];
    return reply ? { reply, actions } : null;
  } catch { return null; }
}
