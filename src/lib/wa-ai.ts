// AI wording for the WhatsApp bot (PLAN 74p), through the Shomoy AI API (OpenAI-style chat, Bearer key).
// The AI never decides facts: understand() only turns a messy message into a command the rule bot knows,
// and humanize() rewords the rule bot's draft, which replyOk() checks before anything is sent.
// Off (returns null) without SHOMOY_AI_KEY, on any error, or after 12 s: the rule bot's text is used then.
import { answerOk, replyOk } from "@/lib/wa-bot";

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
  phone: "the customer's WhatsApp number",
  confirm: "yes to place the order, edit, or cancel",
};

// What the customer means (PLAN 74r): an action for the rule bot ({command}), an answer to their question
// from the catalog facts ({answer}, checked by answerOk), or null when unsure.
export async function interpret(
  text: string, step: string | undefined, lastBot: string, recent: string[], facts: string,
): Promise<{ command?: string; answer?: string } | null> {
  const sys = [
    "You are the order assistant of a cigarette shop in Dubai, reading a customer's chat message. Work out what they really mean, using the chat so far.",
    LEGIT,
    'Answer with JSON only, exactly one of:',
    '{"command":"..."} when they want the bot to DO something. Commands the bot knows: a number (their choice from the bot\'s last numbered list),',
    '  "<quantity> <exact product title from FACTS>" (e.g. "2 Marlboro Gold Cigarettes"), an exact product title, a brand name, "menu",',
    '  "yes" (confirms), "done" (no more items), "cancel", "edit", "agent" (wants a person or complains), a delivery address, a person\'s name, a phone number.',
    '{"answer":"..."} when they ASK something (which is stronger/lighter/cheaper, the difference between products, a suggestion, stock, delivery, payment).',
    "  Answer like a helpful shop assistant in 1-3 short sentences, in the customer's language. Use ONLY the FACTS: name products by their exact title with",
    "  their price from FACTS (the exact price of the product asked about, never a range). If the FACTS do not answer it, say our team can confirm and they can reply *agent*. Never invent numbers, health claims or promises.",
    '{"command":"unclear"} if you really cannot tell.',
    `The bot is now waiting for: ${WAITING[step || ""] || "anything (no order open)"}.`,
    "Understand any language (English, Arabic, Hindi, Urdu, Bangla, Tagalog, Russian...), slang and typos. In commands write names in English letters (دنهل -> dunhill).",
  ].join("\n");
  const out = await chat([
    { role: "system", content: sys },
    { role: "user", content: `FACTS:\n${facts}\n\nChat so far:\n${recent.join("\n").slice(-700)}\n\nBot's last message:\n${lastBot.slice(0, 700)}\n\nCustomer's message:\n${text.slice(0, 400)}` },
  ], 350);
  const m = out?.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const answer = typeof j.answer === "string" ? j.answer.trim() : "";
    if (answer) {
      if (answerOk(answer, facts)) return { answer };
      console.error("wa-ai answer rejected by the fact check");
      return null;
    }
    const c = String(j.command || "").trim().slice(0, 80);
    return c && c.toLowerCase() !== "unclear" && c !== text.trim() ? { command: c } : null;
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
