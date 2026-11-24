// WhatsApp auto-reply engine for the shop number. Pure: no imports, no I/O, so `node src/lib/wa-bot.test.ts` can test it.
// Every price and stock line comes from the live catalog passed in; nothing is invented.
// Ordering (PLAN 74p): numbered menus -> quantity -> more items -> area or pin -> name -> summary -> YES = real order.
// The chat's OrderState goes in and the next one comes out; the webhook stores it per chat.

export interface BotProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  format?: string;
  cartonPrice: number | string;
  fiveCartonPrice?: number | string;
  inStock?: boolean;
  // facts the AI may quote when a customer asks (PLAN 74r)
  strength?: string;
  flavor?: string;
  tar?: string;
  nicotine?: string;
  origin?: string;
  subCategory?: string;
}

export interface BotSettings {
  storeName: string;
  supportPhoneDisplay?: string;
  expressDeliveryMinutes?: string;
  freeDeliveryThreshold?: number;
  standardDeliveryFee?: number;
}

export interface CartItem { productId: string; title: string; brand: string; qty: number; carton: number; five: number; unit: string }
export interface OrderState {
  step: "brand" | "product" | "qty" | "more" | "area" | "name" | "phone" | "confirm";
  options?: string[]; // what the numbers of the last menu mean: brand names (step brand) or product ids (step product)
  pick?: string; // product id waiting for its quantity
  want?: number; // quantity typed with a brand ("2 dunhill blue"), used once the exact product is picked
  cart: CartItem[];
  area?: string;
  name?: string;
  phone?: string; // website chat only: the visitor's WhatsApp number
}
export interface PlacedOrder { cart: CartItem[]; area: string; name: string; phone?: string; subtotal: number; deliveryFee: number; feeLater: boolean; total: number }
export interface LastOrder { cart: CartItem[]; area: string; name: string }

export type Intent = "welcome" | "brands" | "product" | "brand" | "delivery" | "human" | "order" | "media" | "thanks" | "cart" | "cancel";

export interface BotResult {
  intent: Intent;
  reply: string;
  handover: boolean; // a person must take over (bot pauses for this chat, staff are alerted)
  productIds: string[];
  state: OrderState | null; // next order state of this chat (null = no order open)
  order?: PlacedOrder; // set when the customer confirmed: the webhook saves it and puts its number in {ORDER}
  understood: boolean; // false = generic fallback: the AI layer may read the message better
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
const COURIER = ["abu dhabi", "al ain", "ras al khaimah", "fujairah", "umm al quwain"]; // fee set by our team
export const PIN = "📍 location pin";

const COMMON = new Set(["white", "gold", "blue", "black", "silver", "green", "fox", "mint", "original", "classic", "slims", "lights"]);
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
const num = (v: unknown) => Number(v) || 0;
const aed = (v: unknown) => `AED ${num(v)}`;
const unit = (p: BotProduct) => (/carton/i.test(p.format || "") || p.category === "cigarettes" ? "carton" : "pack");
const units = (n: number, u: string) => `${n} ${u}${n === 1 ? "" : "s"}`;
const has = (q: string, words: string[]) => words.some((w) => new RegExp(`(^| )${w}( |$)`).test(q));
const minutes = (s: BotSettings) => s.expressDeliveryMinutes || "45–75 min";
const title = (a: string) => a.replace(/\b\w/g, (c) => c.toUpperCase());
const orderable = (p?: BotProduct) => !!p && p.inStock !== false && num(p.cartonPrice) > 0;

export function findArea(text: string): string {
  const q = ` ${norm(text)} `;
  return AREAS.filter((a) => q.includes(` ${a} `)).sort((a, b) => b.length - a.length)[0] || ""; // longest: "al nahda sharjah" over "al nahda"
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

// Numbered cigarette brands, most products first: the numbers map to `options`.
function brandMenu(products: BotProduct[]) {
  const by = new Map<string, number[]>();
  for (const p of products) {
    if (p.category !== "cigarettes" || !orderable(p)) continue;
    by.set(p.brand, [...(by.get(p.brand) || []), num(p.cartonPrice)]);
  }
  const top = [...by.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 9);
  return {
    options: top.map(([b]) => b),
    lines: top.map(([b, prices], i) => {
      const lo = Math.min(...prices), hi = Math.max(...prices);
      return `*${i + 1}* ${b}: ${lo === hi ? aed(lo) : `AED ${lo}–${hi}`} a carton`;
    }),
  };
}

function productMenu(list: BotProduct[]) {
  const top = list.filter(orderable).sort((a, b) => num(a.cartonPrice) - num(b.cartonPrice)).slice(0, 12);
  return { options: top.map((p) => p.id), lines: top.map((p, i) => `*${i + 1}* ${p.title}: ${aed(p.cartonPrice)} a ${unit(p)}`) };
}

function deliveryLine(s: BotSettings): string {
  const free = num(s.freeDeliveryThreshold);
  const fee = num(s.standardDeliveryFee);
  const cost = free > 0 ? ` Free delivery from AED ${free}${fee > 0 ? `, otherwise AED ${fee}` : ""}.` : fee > 0 ? ` Delivery AED ${fee}.` : "";
  return `🛵 Delivery in ${minutes(s)} across Dubai & Sharjah, courier to the other Emirates.${cost}`;
}

// 5 or more of one product: each full 5 at the 5-carton price, the rest at the single price.
export function lineTotal(i: CartItem): number {
  const bundles = i.five > 0 ? Math.floor(i.qty / 5) : 0;
  return bundles * i.five + (i.qty - bundles * 5) * i.carton;
}

export function totals(cart: CartItem[], area: string, s: BotSettings) {
  const subtotal = cart.reduce((t, i) => t + lineTotal(i), 0);
  const feeLater = COURIER.some((c) => ` ${norm(area)} `.includes(` ${c} `));
  const free = num(s.freeDeliveryThreshold);
  const deliveryFee = feeLater || (free > 0 && subtotal >= free) ? 0 : num(s.standardDeliveryFee);
  return { subtotal, deliveryFee, feeLater, total: subtotal + deliveryFee };
}

const cartLine = (i: CartItem) =>
  `• ${i.qty} × ${i.title}: AED ${lineTotal(i)}${i.five > 0 && i.qty >= 5 ? ` (5-${i.unit} price)` : ""}`;

// Current prices and stock for a saved cart ("same again"); gone or sold-out items drop out.
function refresh(cart: CartItem[], products: BotProduct[]): CartItem[] {
  return cart.flatMap((i) => {
    const p = products.find((x) => x.id === i.productId);
    return orderable(p) ? [{ ...i, title: p!.title, carton: num(p!.cartonPrice), five: num(p!.fiveCartonPrice) }] : [];
  });
}

const ORDER_ASK = "Reply *menu* to order step by step, or type the product name.";
const YES = ["yes", "y", "confirm", "confirmed", "ok", "okay", "yes please", "sure", "haan", "ha", "naam", "نعم", "تمام"];
const NO_MORE = ["0", "no", "done", "finish", "that s all", "thats all", "nothing", "checkout", "no thanks", "nothing else"];
const MORE = ["1", "add", "more", "yes", "another", "add more"];
const MENU = ["menu", "order", "start", "buy", "shop", "order now", "i want to order", "new order", "list", "price list"];
const PRICE_WORDS = ["price", "prices", "rate", "brands", "brand", "cigarettes", "cigarette", "carton"];

export function botReply(
  text: string, type: string, products: BotProduct[], s: BotSettings, hadReplyBefore: boolean,
  st: OrderState | null = null, last: LastOrder | null = null, ch: "wa" | "web" = "wa",
): BotResult {
  const q = norm(text);
  const cart = st?.cart || [];
  const web = ch === "web"; // website chat: no location pin, asks for a phone number, no staff inside the chat
  const base = { cart, area: st?.area, name: st?.name, phone: st?.phone };
  const out = (intent: Intent, lines: string[], state: OrderState | null, x: Partial<BotResult> = {}): BotResult => ({
    intent, reply: lines.join("\n"), handover: false, productIds: [], state, understood: true, ...x,
  });

  const brands = (intent: Intent, head: string[], keep: Partial<OrderState> = {}, x: Partial<BotResult> = {}) => {
    const m = brandMenu(products);
    return out(intent, [...head, ...m.lines, "", "Other brands, pouches or vapes: just type the name.", `All prices: ${SITE}/cigarette-prices-dubai`],
      { step: "brand", options: m.options, ...base, ...keep }, x);
  };
  const brandItems = (b: string, list: BotProduct[], want?: number) => {
    const m = productMenu(list);
    if (!m.options.length) return out("brand", [`*${b}* is out of stock right now. A team member can suggest a similar one.`], st, { handover: true });
    return out("brand", [`*${b}* in stock. Which one would you like? Reply with its number:`, ...m.lines],
      { step: "product", options: m.options, ...base, want }, { productIds: m.options });
  };
  const askQty = (p: BotProduct, area = st?.area) => {
    const five = num(p.fiveCartonPrice);
    return out("product", [
      `*${p.title}*: ${aed(p.cartonPrice)} a ${unit(p)}${five > 0 ? `, 5 ${unit(p)}s ${aed(five)}` : ""}.`,
      `How many ${unit(p)}s? Reply with a number, for example *1* or *5*.`,
    ], { step: "qty", pick: p.id, ...base, area }, { productIds: [p.id] });
  };
  // after the cart changes: ask what is still missing, else show the summary
  const next = (o: OrderState, head: string[] = []): BotResult => {
    if (!o.cart.length) return brands("cart", [...head, "What would you like? Reply with a number:"], o);
    if (!o.area) return out("cart", [...head, web ? "Where should we deliver? Type your area and building (for example *Marina Gate 2, Dubai Marina*)." :
      "Where should we deliver? Type your area (for example *Dubai Marina*) or send your 📍 location pin."], { ...o, step: "area" });
    if (!o.name) return out("cart", [...head, "What name should the rider ask for?"], { ...o, step: "name" });
    if (web && !o.phone) return out("cart", [...head, "What is your WhatsApp number? Our team confirms the order and the rider calls you on it."], { ...o, step: "phone" });
    const t = totals(o.cart, o.area, s);
    return out("cart", [
      ...head,
      "🧾 *Your order*",
      ...o.cart.map(cartLine),
      t.feeLater ? `Delivery to ${title(o.area)}: courier fee confirmed by our team` :
        `Delivery to ${o.area === PIN ? "your location" : title(o.area)}: ${t.deliveryFee ? aed(t.deliveryFee) : "free"}`,
      `*Total: AED ${t.total}*${t.feeLater ? " + courier fee" : ""}, cash or card on delivery.`,
      `Name: ${o.name}`,
      ...(o.phone ? [`Phone: +${o.phone}`] : []),
      "",
      "Reply *YES* to place the order, *EDIT* to change it, or *CANCEL*.",
    ], { ...o, step: "confirm", options: undefined, pick: undefined });
  };

  if (type === "LOCATION") {
    if (cart.length && st) return next({ ...st, area: PIN }, ["📍 Location received, thank you."]);
    return brands("order", ["📍 Location received, thank you. What would you like? Reply with a number:"], { area: PIN });
  }
  if (type !== "TEXT" && !q) {
    return out("media", [
      "Thanks! I can read text messages only.",
      "Type the product you want (for example *Marlboro Gold*), or reply *menu* to order step by step.",
    ], st);
  }
  if (has(q, ["human", "agent", "person", "staff", "call me", "call", "manager", "operator"]) || /talk to (a )?(person|someone|human)/.test(q)) {
    return out("human", [web ? "Sure! Tap *Live WA* below to chat with our team on WhatsApp. 🙏" : "Sure, a team member will reply to you here shortly. 🙏"], st, { handover: true });
  }
  if (st && has(q, ["cancel", "stop", "clear", "reset"]) && q.split(" ").length <= 3) {
    return out("cancel", ["Order cancelled. Reply *menu* any time to start again."], null);
  }
  if (last?.cart.length && /\b(same (again|order|as (last|before))|reorder|repeat( my)?( last)? order|order again)\b/.test(q)) {
    const again = refresh(last.cart, products);
    if (!again.length) return brands("cart", ["Sorry, the items of your last order are out of stock right now. Reply with a number:"]);
    return next({ step: "confirm", cart: again, area: last.area, name: last.name, phone: st?.phone }, ["Sure, the same as last time:"]);
  }
  if (MENU.includes(q)) return brands("brands", ["What would you like? Reply with a number:"]);

  const n = /^\d{1,3}$/.test(q) ? Number(q) : NaN;
  const qty = q.match(/^(\d{1,3})( (cartons?|packs?|pcs|pieces|x|boxes?))?$/);
  const named = matchProducts(text, products);
  const namesProduct = !!(named.brand || named.exact);
  if (st) {
    const opt = st.options || [];
    if (st.step === "brand" && n >= 1 && n <= opt.length) return brandItems(opt[n - 1], products.filter((p) => p.brand === opt[n - 1]));
    if (st.step === "product" && n >= 1 && n <= opt.length) {
      const p = products.find((x) => x.id === opt[n - 1]);
      // "2 dunhill blue" showed a list: the 2 is kept and used once the exact one is picked
      if (orderable(p) && st.want) return botReply(String(st.want), "TEXT", products, s, true, { ...st, step: "qty", pick: p!.id, options: undefined, want: undefined }, last, ch);
      if (orderable(p)) return askQty(p!);
    }
    if (st.step === "product" && isNaN(n) && q) {
      // a word typed on a list narrows it: "vista" on the Marlboro list -> the Vista ones
      const list = opt.map((id) => products.find((p) => p.id === id)).filter(orderable) as BotProduct[];
      const tw = (p: BotProduct) => norm(p.title).split(" ");
      const words = q.split(" ").filter((w) => w.length >= 3 && list.some((p) => tw(p).some((t) => t.startsWith(w))));
      const hit = words.length ? list.filter((p) => words.every((w) => tw(p).some((t) => t.startsWith(w)))) : [];
      if (hit.length === 1) {
        if (st.want) return botReply(String(st.want), "TEXT", products, s, true, { ...st, step: "qty", pick: hit[0].id, options: undefined, want: undefined }, last, ch);
        return askQty(hit[0]);
      }
      if (hit.length > 1 && hit.length < list.length) {
        const m = productMenu(hit);
        return out("product", ["Here they are. Which one would you like? Reply with its number:", ...m.lines], { ...st, options: m.options }, { productIds: m.options });
      }
    }
    if (st.step === "qty" && qty) {
      const p = products.find((x) => x.id === st.pick);
      const k = Number(qty[1]);
      if (!orderable(p)) return brands("cart", ["Sorry, that one just went out of stock. Reply with a number:"]);
      if (k < 1 || k > 50) return out("cart", ["Please reply with a number from 1 to 50 (for more, reply *agent*)."], st);
      const item: CartItem = { productId: p!.id, title: p!.title, brand: p!.brand, qty: k, carton: num(p!.cartonPrice), five: num(p!.fiveCartonPrice), unit: unit(p!) };
      const nc = [...cart.filter((i) => i.productId !== p!.id), item];
      return out("cart", [
        `✅ Added ${units(k, item.unit)} of *${p!.title}*: AED ${lineTotal(item)}.`,
        "Reply *1* to add another product, or *0* to finish.",
      ], { ...st, step: "more", pick: undefined, options: undefined, cart: nc }, { productIds: [p!.id] });
    }
    if (st.step === "more" && NO_MORE.includes(q)) return next({ ...st, step: "area" });
    if (st.step === "more" && MORE.includes(q)) return brands("cart", ["What else would you like? Reply with a number:"]);
    if (st.step === "area" && q && isNaN(n) && !namesProduct) {
      // the whole address as typed: the rider needs "JLT cluster D, tower 3", not just "jlt"
      return next({ ...st, area: text.trim().replace(/[*_~`]/g, "").replace(/\s+/g, " ").slice(0, 100) });
    }
    if (st.step === "name" && q && isNaN(n) && !namesProduct && text.trim().length <= 60) {
      return next({ ...st, name: text.trim().replace(/[*_~`]/g, "").replace(/\s+/g, " ") });
    }
    if (st.step === "phone" && q && !namesProduct) {
      let d = text.replace(/\D/g, "");
      if (d.startsWith("00")) d = d.slice(2);
      if (/^05\d{8}$/.test(d)) d = "971" + d.slice(1); // UAE mobile typed locally
      if (d.length < 9 || d.length > 15) return out("cart", ["Please send a valid mobile number, for example *050 123 4567*."], st);
      return next({ ...st, phone: d });
    }
    if (st.step === "confirm" && cart.length) {
      if (YES.includes(q) || YES.includes(text.trim())) {
        const t = totals(cart, st.area || "", s);
        return out("order", [
          "✅ Thank you! Your order *#{ORDER}* is placed.",
          `A team member will confirm it ${web ? "on WhatsApp" : "here"} shortly. Delivery takes about ${minutes(s)}${t.feeLater ? " in Dubai & Sharjah; other Emirates go by courier" : ""}.`,
          "Payment: cash or card on delivery. Adults 18+ only: the rider may ask for ID.",
        ], null, { order: { cart, area: st.area || "", name: st.name || "", phone: st.phone, ...t } });
      }
      if (has(q, ["edit", "change", "modify"])) return brands("cart", ["OK, let's pick the items again. Reply with a number:"], { cart: [] });
      if (has(q, ["no"])) return out("cancel", ["Order cancelled. Reply *menu* any time to start again."], null);
    }
    if (!isNaN(n) && st.step !== "area" && st.step !== "name" && st.step !== "phone") {
      const hint = st.step === "qty" ? "Please reply with how many, for example *2*." :
        st.step === "more" ? "Reply *1* to add another product, or *0* to finish." :
        st.step === "confirm" ? "Reply *YES* to place the order, *EDIT* to change it, or *CANCEL*." :
        `Please reply with a number from 1 to ${opt.length}.`;
      return out("cart", [hint], st);
    }
  }

  const { brand, items, exact } = named;
  const area = findArea(text);

  if (!brand && !items.length && !area && has(q, ["thanks", "thank you", "thank", "thx", "ok", "okay", "shukran"]) && q.split(" ").length <= 3) {
    return out("thanks", ["You are welcome! " + ORDER_ASK], st);
  }

  // greeting = the first words only ("bas itna hi" is Hindi for "that's all"); an open order is never reset by it
  const greet = has(q.split(" ").slice(0, 2).join(" "), ["hi", "hello", "hey", "salam", "salaam", "assalamualaikum", "assalamu alaikum", "marhaba", "good morning", "good evening"]);
  if (greet && !st && !brand && !items.length && !area && q.split(" ").length <= 4) hadReplyBefore = false; // a fresh "hi" gets the welcome again

  // "2 marlboro gold" / "2 dibba marlboro gold bhej do": a lone number that is not part of a product name
  const lone = Number((q.match(/(?:^| )(\d{1,2})(?= |$)/) || [])[1] || 0);
  const wantOf = (list: BotProduct[]) =>
    lone >= 1 && lone <= 50 && !list.some((p) => norm(p.title).split(" ").includes(String(lone))) ? lone : undefined;
  if (exact && (items.length === 1 || area)) {
    const p = items[0];
    if (!orderable(p)) {
      return out("product", [`*${p.title}* is out of stock right now. A team member can suggest a similar one.`], st, { handover: true, productIds: [p.id] });
    }
    const k = wantOf([p]);
    if (k) return botReply(String(k), "TEXT", products, s, true, { step: "qty", pick: p.id, ...base, area: area || st?.area }, last, ch);
    return askQty(p, area || st?.area);
  }
  if (exact && items.length <= 3) {
    const m = productMenu(items);
    if (!m.options.length) return out("product", ["Those are out of stock right now. A team member can suggest a similar one."], st, { handover: true });
    return out("product", ["I found these. Which one would you like? Reply with its number:", ...m.lines],
      { step: "product", options: m.options, ...base, area: area || st?.area, want: wantOf(items) }, { productIds: m.options });
  }
  if (brand) {
    // "3 cartons of the blue dunhill": the product whose whole name (less "cigarettes") is in the message
    const qw = q.split(" ");
    const core = (p: BotProduct) => norm(p.title).split(" ").filter((w) => !/^cigarettes?$/.test(w));
    const tight = items.filter((p) => orderable(p) && core(p).every((w) => qw.includes(w))).sort((a, b) => core(b).length - core(a).length)[0];
    if (tight) {
      const k = wantOf([tight]);
      if (k) return botReply(String(k), "TEXT", products, s, true, { step: "qty", pick: tight.id, ...base, area: area || st?.area }, last, ch);
      return askQty(tight, area || st?.area);
    }
    return brandItems(brand, items, wantOf(items));
  }
  // "deliver to my place in jlt" is an address, "how long to jlt?" a question
  if ((!area || isQuestion(text)) && (has(q, ["delivery", "deliver", "how long", "time", "shipping", "courier", "fee", "free"]) || /how (long|much time)/.test(q))) {
    return out("delivery", [deliveryLine(s), "Payment: cash or card on delivery.", ...stepPrompt(st, products, ch)], st);
  }
  if (area) {
    const full = text.trim().replace(/[*_~`]/g, "").replace(/\s+/g, " ") // keep the building too, drop "deliver to my place in"
      .replace(/^(please )?(deliver|delivery|send it|send|bring it|bring) (to|at) (my (place|home|house|flat|office|room|building) (in|at) )?/i, "").slice(0, 100);
    if (cart.length && st) return next({ ...st, area: full });
    if (st?.step === "product" || st?.step === "qty") return out("order", [`📍 Yes, we deliver to ${title(area)}!`, ...stepPrompt(st, products, ch)], { ...st, area: full });
    if (st) return out("order", [`📍 Yes, we deliver to ${title(area)}! What would you like? Type a product name, or reply *menu* for the list.`], { ...st, area: full });
    return brands("order", [`📍 Yes, we deliver to ${title(area)}. What would you like? Reply with a number:`], { area: full });
  }
  if (has(q, ["order", "buy", "purchase", "can i get", "i want", "i need"])) {
    return brands("brands", ["Yes, you can order right here! What would you like? Reply with a number:"]);
  }
  const asked = has(q, PRICE_WORDS);
  if (st && !asked && hadReplyBefore) {
    // not understood inside an order: ask the current question again (the AI layer tries the message first)
    return out("cart", stepPrompt(st, products, ch), st, { understood: false });
  }
  if (asked || hadReplyBefore) {
    return brands("brands", ["Cigarette prices today. Reply with a number to order:"], {}, { understood: asked });
  }
  return brands("welcome", [
    `Hello, welcome to *${s.storeName}* 👋 (adults 18+ only)`,
    deliveryLine(s),
    "",
    "What would you like? Reply with a number:",
  ], {}, { understood: !q || greet });
}

// The question the chat is waiting on, asked again (after a not-understood message or an AI answer).
export function stepPrompt(st: OrderState | null, products: BotProduct[], ch: "wa" | "web" = "wa"): string[] {
  if (!st) return [ORDER_ASK];
  if (st.step === "product") {
    const list = (st.options || []).map((id) => products.find((p) => p.id === id)).filter(orderable) as BotProduct[];
    if (list.length) return ["Which one would you like? Reply with its number:", ...productMenu(list).lines];
  }
  if (st.step === "qty") {
    const p = products.find((x) => x.id === st.pick);
    return [`How many${p ? ` *${p.title}*` : ""} would you like? Just reply with a number, for example *2*.`];
  }
  if (st.step === "more") return ["Would you like anything else? Reply *1* to add another product, or *0* to finish."];
  if (st.step === "area") return [ch === "web" ? "Where should we deliver? Type your area and building." : "Where should we deliver? Type your area or send your 📍 location pin."];
  if (st.step === "name") return ["What name should the rider ask for?"];
  if (st.step === "phone") return ["What is your WhatsApp number?"];
  if (st.step === "confirm") return ["Shall I place it? Reply *YES* to place the order, *EDIT* to change it, or *CANCEL*."];
  return ["Which brand would you like? Type a product name like *Marlboro Gold*, or reply *menu* to see the list again."];
}

// A real question, not an instruction: the AI answers it from the catalog facts first (PLAN 74r).
export function isQuestion(text: string): boolean {
  const q = norm(text);
  return /\?/.test(text) || has(q, ["which", "what", "why", "difference", "different", "cheaper", "cheapest", "stronger", "strongest",
    "lighter", "lightest", "smoother", "best", "recommend", "suggest", "similar", "compare", "vs", "original", "fresh", "taste", "flavour", "flavor"]);
}

// The catalog facts the AI may use for this message: the list on screen, the cart, the products named,
// and cheaper ones of the same kind. Nothing outside these lines may appear as a number in its answer.
export function factsFor(text: string, st: OrderState | null, products: BotProduct[], s: BotSettings): string {
  const byId = (id: string) => products.find((p) => p.id === id);
  const named = matchProducts(text, products);
  const pool: BotProduct[] = [
    ...(st?.options || []).map(byId), ...(st?.cart || []).map((i) => byId(i.productId)), st?.pick ? byId(st.pick) : undefined,
    ...named.items.slice(0, 10),
  ].filter(Boolean) as BotProduct[];
  const anchor = named.items[0] || pool[0];
  if (anchor) {
    pool.push(...products.filter((p) => orderable(p) && p.category === anchor.category && num(p.cartonPrice) < num(anchor.cartonPrice))
      .sort((a, b) => num(b.cartonPrice) - num(a.cartonPrice)).slice(0, 8));
  }
  const seen = new Set<string>();
  const lines = pool.filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 25).map((p) => [
    `- ${p.title}: ${aed(p.cartonPrice)} a ${unit(p)}${num(p.fiveCartonPrice) > 0 ? `, 5 for ${aed(p.fiveCartonPrice)}` : ""}`,
    p.strength && `strength ${p.strength}`, p.flavor && `flavour ${p.flavor}`, p.subCategory,
    p.tar && p.tar !== "N/A" && `tar ${p.tar}`, p.nicotine && p.nicotine !== "N/A" && `nicotine ${p.nicotine}`,
    p.origin && `made in ${p.origin}`, p.inStock === false ? "OUT OF STOCK" : "in stock",
  ].filter(Boolean).join(" | "));
  // nothing named in English letters (Arabic, Hindi, typos): every in-stock product, one short line each
  const all = products.filter(orderable).map((p) => `- ${p.title}: ${aed(p.cartonPrice)} a ${unit(p)}`);
  return [
    "Products:", ...(lines.length ? lines : all),
    "Shop:", `- ${deliveryLine(s).replace("🛵 ", "")}`, "- Payment: cash or card on delivery.", "- Adults 18+ only.",
  ].join("\n");
}

// Gate for an AI answer to a question: every number and link must come from the facts it was given.
export function answerOk(answer: string, facts: string): boolean {
  const a = answer.trim();
  if (!a || a.length > 900) return false;
  const nums = new Set(facts.match(/\d+(\.\d+)?/g) || []);
  if ((a.match(/\d+(\.\d+)?/g) || []).some((x) => !nums.has(x))) return false;
  return !/https?:\/\/|www\./i.test(a);
}

// Gate for an AI-worded reply (PLAN 74p): the AI may change the wording, never the facts. Every menu,
// cart and price line of the draft must be there unchanged, and every number and link in the AI text
// must come from the draft. Anything else -> the draft is sent as it is.
export function replyOk(draft: string, ai: string): boolean {
  const a = ai.trim();
  if (!a || a.length > draft.length * 1.6 + 200) return false;
  const lines = new Set(a.split("\n").map((l) => l.trim()));
  for (const l of draft.split("\n").map((x) => x.trim())) {
    if ((/^(\*\d+\*|•|🧾|Name:|Phone:|Delivery to|\*Total)/.test(l) || /AED|https?:\/\//.test(l)) && !lines.has(l)) return false;
  }
  const nums = new Set(draft.match(/\d+/g) || []);
  if ((a.match(/\d+/g) || []).some((x) => !nums.has(x))) return false;
  const urls = new Set(draft.match(/https?:\/\/\S+/g) || []);
  if ((a.match(/https?:\/\/\S+|www\.\S+/gi) || []).some((x) => !urls.has(x))) return false;
  // reply commands (*1*, *0*, *YES*, *menu*...), the order number and the age rule must survive any translation
  for (const w of draft.match(/\*(\d+|[A-Z]{2,}|menu|agent|cancel)\*|\{ORDER\}|18\+/g) || []) if (!a.includes(w)) return false;
  return true;
}
