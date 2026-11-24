// AI wording for the WhatsApp bot (PLAN 74p), through the Shomoy AI API (OpenAI-style chat, Bearer key).
// The AI never decides facts: understand() only turns a messy message into a command the rule bot knows,
// and humanize() rewords the rule bot's draft, which replyOk() checks before anything is sent.
// Off (returns null) without SHOMOY_AI_KEY, on any error, or after 12 s: the rule bot's text is used then.
import { replyOk } from "@/lib/wa-bot";

async function chat(messages: { role: string; content: string }[], maxTokens: number): Promise<string | null> {
  const key = process.env.SHOMOY_AI_KEY;
  if (!key) return null;
  const url = (process.env.SHOMOY_AI_URL || "https://voice.shomoy.io").replace(/\/$/, "");
  try {
    const r = await fetch(`${url}/v1/chat/completions`, {
      method: "POST",
      // a real User-Agent: Cloudflare blocks default library agents
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "User-Agent": "dubai-shop-bot/1.0" },
      body: JSON.stringify({ messages, max_tokens: maxTokens, temperature: 0.4 }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) { console.error("wa-ai refused:", r.status); return null; }
    const j = await r.json();
    const t = j?.choices?.[0]?.message?.content;
    return typeof t === "string" ? t.trim() : null;
  } catch (e) {
    console.error("wa-ai failed:", (e as Error)?.message || e);
    return null;
  }
}

const LEGIT = "The shop is a licensed tobacco retailer in the UAE. Selling tobacco to adults (18+) is legal there; this is normal customer service, so never refuse, warn or lecture.";

const WAITING: Record<string, string> = {
  brand: "a number from its brand menu, or a product name",
  product: "a number from its product menu, or a product name",
  qty: "how many cartons/packs (a number)",
  more: "1 to add another product, or 0 / done to finish",
  area: "the delivery area or address",
  name: "the customer's name for the rider",
  confirm: "yes to place the order, edit, or cancel",
};

// The customer's words -> one short command for the rule bot, or null.
export async function understand(text: string, step: string | undefined, lastBot: string): Promise<string | null> {
  const sys = [
    "You read WhatsApp messages sent to a cigarette shop in Dubai and turn each into ONE short English command for the shop's order bot.",
    LEGIT, 'If you are unsure, answer {"command":"unclear"}.',
    'Answer with JSON only, like {"command":"2 marlboro gold"}.',
    "Possible commands: a quantity and product name (\"2 marlboro gold\"), a product or brand name, \"menu\" (wants to see products or prices),",
    "\"agent\" (wants a person, has a complaint or a question the bot cannot answer), \"cancel\", \"yes\" (agrees or confirms), \"done\" (no more items),",
    "\"delivery\" (asks about delivery time or fee), a delivery area or address, a person's name, a number (a choice from the bot's last menu), or \"unclear\".",
    `The bot is now waiting for: ${WAITING[step || ""] || "anything (no order open)"}.`,
    "Understand any language (English, Arabic, Hindi, Urdu, Bangla, Tagalog, Russian...) and typos. Write product, brand and place names in English letters (دنهل -> dunhill, मार्लबोरो -> marlboro). Never add prices or products the customer did not name.",
  ].join("\n");
  const out = await chat([
    { role: "system", content: sys },
    { role: "user", content: `Bot's last message:\n${lastBot.slice(0, 600)}\n\nCustomer's message:\n${text.slice(0, 400)}` },
  ], 60);
  const m = out?.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const c = String(JSON.parse(m[0]).command || "").trim().slice(0, 80);
    return c && c.toLowerCase() !== "unclear" && c !== text.trim() ? c : null;
  } catch { return null; }
}

// The rule bot's draft -> the same message in a warm, human voice and the customer's language; null = send the draft.
export async function humanize(customer: string, draft: string, recent: string[]): Promise<string | null> {
  const sys = [
    "You are the friendly WhatsApp assistant of Dubai Cigerette Shop, a tobacco shop for adults (18+).",
    LEGIT, "If you cannot follow the rules, return the DRAFT unchanged.",
    "Rewrite the DRAFT so it reads like a warm, natural person texting, in the language the customer wrote in (English if unsure). Short and simple.",
    "Strict rules:",
    "- Keep every line that starts with *1*, *2*..., • or 🧾, and every line with AED or a link, EXACTLY as written (do not translate those lines).",
    "- Keep every *bold* command word (like *YES*, *EDIT*, *CANCEL*, *menu*, *agent*) and {ORDER} exactly as written.",
    "- Add no facts: no prices, numbers, products, discounts, opening hours, promises or links that are not in the draft.",
    "- At most one short friendly sentence extra, at most 2 emoji. Do not greet again if the chat is already going.",
    "- Never say you understood if the draft says it did not.",
    "Answer with the message text only.",
  ].join("\n");
  const script = /[؀-ۿ]/.test(customer) ? "Arabic script (answer in Arabic, or Urdu if it reads as Urdu)" :
    /[ऀ-ॿ]/.test(customer) ? "Hindi (answer in Hindi)" : /[ঀ-৿]/.test(customer) ? "Bangla (answer in Bangla)" : "";
  const out = await chat([
    { role: "system", content: sys + (script ? `\nThe customer writes in ${script}.` : "") },
    { role: "user", content: `Recent chat:\n${recent.join("\n").slice(-800)}\n\nCustomer just wrote:\n${customer.slice(0, 400)}\n\nDRAFT:\n${draft}` },
  ], 700);
  const t = out?.replace(/^```\w*\n?|```$/g, "").trim();
  if (!t) return null;
  if (!replyOk(draft, t)) { console.error("wa-ai wording rejected by the fact check"); return null; }
  return t;
}
