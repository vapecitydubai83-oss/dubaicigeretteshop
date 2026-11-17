// WhatsApp auto-reply engine for the shop number. Pure: no imports, no I/O, so `node src/lib/wa-bot.test.ts` can test it.
// Every price and stock line comes from the live catalog passed in; nothing is invented.

export interface BotProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  format?: string;
  cartonPrice: number | string;
  fiveCartonPrice?: number | string;
  inStock?: boolean;
}

export interface BotSettings {
  storeName: string;
  supportPhoneDisplay?: string;
  expressDeliveryMinutes?: string;
  freeDeliveryThreshold?: number;
  standardDeliveryFee?: number;
}

export type Intent = "welcome" | "brands" | "product" | "brand" | "delivery" | "human" | "order" | "media" | "thanks";

export interface BotResult {
  intent: Intent;
  reply: string;
  handover: boolean; // a person must take over (bot pauses for this chat, staff are alerted)
  productIds: string[];
}

const SITE = "https://dubaicigeretteshop.ae";

const AREAS = [
  "dubai marina", "marina", "jlt", "jumeirah", "jbr", "downtown", "business bay", "deira", "bur dubai", "karama",
  "al barsha", "barsha", "al nahda", "nahda", "al qusais", "qusais", "mirdif", "silicon oasis", "dso", "jvc", "jvt",
  "international city", "discovery gardens", "al quoz", "satwa", "al rigga", "rigga", "muhaisnah", "al warqa",
  "sports city", "motor city", "arabian ranches", "palm", "difc", "media city", "internet city", "tecom",
  "sharjah", "al majaz", "al taawun", "al khan", "al nahda sharjah", "muwaileh", "ajman", "abu dhabi", "al ain",
  "ras al khaimah", "fujairah", "umm al quwain",
];

const COMMON = new Set(["white", "gold", "blue", "black", "silver", "green", "fox", "mint", "original", "classic", "slims", "lights"]);
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
const num = (v: unknown) => Number(v) || 0;
const aed = (v: unknown) => `AED ${num(v)}`;
const unit = (p: BotProduct) => (/carton/i.test(p.format || "") || p.category === "cigarettes" ? "carton" : "pack");
const has = (q: string, words: string[]) => words.some((w) => new RegExp(`(^| )${w}( |$)`).test(q));
const minutes = (s: BotSettings) => s.expressDeliveryMinutes || "45–75 min";

export function findArea(text: string): string {
  const q = ` ${norm(text)} `;
  return AREAS.find((a) => q.includes(` ${a} `)) || "";
}

// Products the message names: whole brand words + the best title overlap. Returns the best matches first.
export function matchProducts(text: string, products: BotProduct[]): { brand: string; items: BotProduct[]; exact: boolean } {
  const q = norm(text);
  if (!q) return { brand: "", items: [], exact: false };
  const words = new Set(q.split(" ").filter((w) => w.length > 1));
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
  // full brand name first; else a distinctive brand word ("terea" -> "IQOS TEREA")
  const brand = brands
    .filter((b) => ` ${q} `.includes(` ${norm(b)} `))
    .sort((a, b) => b.length - a.length)[0] ||
    brands.find((b) => norm(b).split(" ").some((w) => w.length >= 4 && !COMMON.has(w) && words.has(w))) || "";
  const pool = brand ? products.filter((p) => p.brand === brand) : products;
  const scored = pool
    .map((p) => {
      const tw = norm(p.title).split(" ").filter((w) => w.length > 1 && w !== norm(p.brand));
      const hit = tw.filter((w) => words.has(w)).length;
      return { p, hit, score: tw.length ? hit / tw.length : 0 };
    })
    .filter((x) => (brand ? true : x.hit >= 2 || (x.hit >= 1 && x.score >= 0.5)))
    .sort((a, b) => b.hit - a.hit || b.score - a.score || num(a.p.cartonPrice) - num(b.p.cartonPrice));
  const best = scored[0]?.hit || 0;
  const items = best > 0 ? scored.filter((x) => x.hit === best).map((x) => x.p) : brand ? scored.map((x) => x.p) : [];
  return { brand, items, exact: best > 0 };
}

function brandList(products: BotProduct[]): string[] {
  const by = new Map<string, number[]>();
  for (const p of products) {
    if (p.category !== "cigarettes" || p.inStock === false || num(p.cartonPrice) <= 0) continue;
    by.set(p.brand, [...(by.get(p.brand) || []), num(p.cartonPrice)]);
  }
  return [...by.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
    .map(([b, prices]) => {
      const lo = Math.min(...prices), hi = Math.max(...prices);
      return `• *${b}*: ${lo === hi ? aed(lo) : `AED ${lo}–${hi}`} a carton`;
    });
}

function deliveryLine(s: BotSettings): string {
  const free = num(s.freeDeliveryThreshold);
  const fee = num(s.standardDeliveryFee);
  const cost = free > 0 ? ` Free delivery from AED ${free}${fee > 0 ? `, otherwise AED ${fee}` : ""}.` : fee > 0 ? ` Delivery AED ${fee}.` : "";
  return `🛵 Delivery in ${minutes(s)} across Dubai & Sharjah, courier to the other Emirates.${cost}`;
}

const ORDER_ASK = "To order, reply with the product and your area, or send your 📍 location pin.";

export function botReply(text: string, type: string, products: BotProduct[], s: BotSettings, hadReplyBefore: boolean): BotResult {
  const q = norm(text);
  const out = (intent: Intent, lines: string[], handover = false, productIds: string[] = []): BotResult => ({
    intent, reply: lines.filter((l) => l !== null).join("\n"), handover, productIds,
  });

  if (type === "LOCATION") {
    return out("order", [
      "📍 Thank you, location received.",
      "A team member is confirming your order and delivery time now. Please also type the product if you have not yet.",
    ], true);
  }
  if (type !== "TEXT" && !q) {
    return out("media", [
      "Thanks! I can read text messages only.",
      "Type the product you want (for example *Marlboro Gold*), or send your 📍 location pin to order.",
    ]);
  }
  if (has(q, ["human", "agent", "person", "staff", "call me", "call", "manager", "operator"]) || /talk to (a )?(person|someone|human)/.test(q)) {
    return out("human", ["Sure, a team member will reply to you here shortly. 🙏"], true);
  }
  const { brand, items, exact } = matchProducts(text, products);
  const area = findArea(text);

  if (!brand && !items.length && !area && has(q, ["thanks", "thank you", "thank", "thx", "ok", "okay", "shukran"]) && q.split(" ").length <= 3) {
    return out("thanks", ["You are welcome! " + ORDER_ASK]);
  }

  const greet = has(q, ["hi", "hello", "hey", "salam", "salaam", "assalamualaikum", "assalamu alaikum", "marhaba", "good morning", "good evening"]);
  if (greet && !brand && !items.length && !area && q.split(" ").length <= 4) hadReplyBefore = false; // a fresh "hi" gets the welcome again

  if (items.length && exact && area) {
    const p = items[0];
    return out("order", [
      `✅ Order request: *${p.title}* to *${area.replace(/\b\w/g, (c) => c.toUpperCase())}*.`,
      `${unit(p) === "carton" ? "1 carton" : "1 pack"}: ${aed(p.cartonPrice)}.`,
      "A team member will confirm the total and delivery time in a few minutes.",
    ], true, [p.id]);
  }
  if (exact && items.length <= 3) {
    const lines: string[] = [];
    for (const p of items.slice(0, 3)) {
      const five = num(p.fiveCartonPrice);
      lines.push(
        `*${p.title}*${p.inStock === false ? " (out of stock right now)" : ""}`,
        `• 1 ${unit(p)}: ${aed(p.cartonPrice)}` + (five > 0 ? `\n• 5 ${unit(p)}s: ${aed(five)}` : ""),
        `${SITE}/product/${p.id}`,
        "",
      );
    }
    const none = items.every((p) => p.inStock === false);
    return out("product", [...lines, deliveryLine(s), none ? "A team member can suggest a similar one in stock." : ORDER_ASK],
      none, items.slice(0, 3).map((p) => p.id));
  }
  if (brand) {
    const list = items.filter((p) => p.inStock !== false && num(p.cartonPrice) > 0)
      .sort((a, b) => num(a.cartonPrice) - num(b.cartonPrice)).slice(0, 8);
    if (!list.length) {
      return out("brand", [`*${brand}* is out of stock right now. A team member can suggest a similar one.`], true);
    }
    return out("brand", [
      `*${brand}* in stock:`,
      ...list.map((p) => `• ${p.title}: ${aed(p.cartonPrice)} a ${unit(p)}`),
      "",
      "Reply with the exact one you want. " + ORDER_ASK,
    ], false, list.map((p) => p.id));
  }
  if (has(q, ["delivery", "deliver", "how long", "time", "shipping", "courier", "fee", "free"]) || /how (long|much time)/.test(q)) {
    return out("delivery", [deliveryLine(s), "Payment: cash or card on delivery.", ORDER_ASK]);
  }
  if (area) {
    return out("order", [
      `📍 We deliver to ${area.replace(/\b\w/g, (c) => c.toUpperCase())}. Which product would you like?`,
      "A team member will confirm the total and delivery time.",
    ], true);
  }
  if (has(q, ["price", "prices", "list", "menu", "brands", "brand", "cigarettes", "cigarette", "carton", "rate"]) || hadReplyBefore) {
    return out("brands", [
      "Cigarette prices today:",
      ...brandList(products),
      "",
      `Full list with photos: ${SITE}/cigarette-prices-dubai`,
      "Reply with a brand or product name for its prices.",
    ]);
  }
  return out("welcome", [
    `Hello, welcome to *${s.storeName}* 👋 (adults 18+ only)`,
    "Tell me the product you want (for example *Marlboro Gold* or *Dunhill*) and I will send the price.",
    deliveryLine(s),
    `Prices: ${SITE}/cigarette-prices-dubai`,
  ]);
}
