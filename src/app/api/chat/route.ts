import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { runTurn } from "@/lib/bot-turn";
import type { LastOrder, OrderState } from "@/lib/wa-bot";

// Website chat box (PLAN 74q): the same order bot and AI wording as WhatsApp. The order state stays here on
// the server, keyed by a random session id from the browser, so a visitor can never send in their own prices.
// shortcut: chats live in this process's memory (lost on restart; one container), fine for a short shop chat;
// move them to the _store volume if the site ever runs more than one copy.
interface WebChat { state: OrderState | null; last: LastOrder | null; msgs: string[]; lastBot: string; count: number; at: number }
const chats = new Map<string, WebChat>();
const chains = new Map<string, Promise<unknown>>();
const ipHits = new Map<string, number[]>();
const hourTimes: number[] = [];
const MAX_CHATS = 2000;
const TTL_MS = 6 * 3600 * 1000;
const IP_MAX = 40; // messages per IP per 10 minutes
const CHAT_MAX = 80; // messages per chat session
const HOUR_MAX = 300; // messages per hour, whole site: caps the monthly AI uses a flood could burn

function limited(ip: string, now: number): boolean {
  while (hourTimes.length && hourTimes[0] < now - 3600 * 1000) hourTimes.shift();
  const hits = (ipHits.get(ip) || []).filter((t) => t > now - 10 * 60 * 1000);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) ipHits.clear();
  if (hits.length >= IP_MAX || hourTimes.length >= HOUR_MAX) return true;
  hits.push(now);
  hourTimes.push(now);
  return false;
}

async function turn(sid: string, text: string) {
  const now = Date.now();
  let c = chats.get(sid);
  if (!c || now - c.at > TTL_MS) c = { state: null, last: c?.last || null, msgs: [], lastBot: "", count: 0, at: now };
  if (c.count >= CHAT_MAX) {
    return { reply: "That's a long chat! Please tap *Live WA* below to carry on with our team on WhatsApp. 🙏", handover: true };
  }
  const { r, reply, orderId } = await runTurn({
    text, type: "TEXT", ch: "web", state: c.state, last: c.last, hadBot: c.msgs.length > 0,
    lastBot: c.lastBot, recent: c.msgs.slice(-6), phone: "", name: "",
  });
  c.state = r.state;
  if (r.order && orderId) c.last = { cart: r.order.cart, area: r.order.area, name: r.order.name };
  c.msgs.push(`customer: ${text.slice(0, 200)}`, `bot: ${reply.slice(0, 200)}`);
  c.msgs = c.msgs.slice(-12);
  c.lastBot = reply;
  c.count += 1;
  c.at = Date.now();
  chats.delete(sid); // re-insert: the Map keeps the most recently used chats last
  chats.set(sid, c);
  if (chats.size > MAX_CHATS) chats.delete(chats.keys().next().value!);
  return { reply, handover: r.handover };
}

export async function POST(request: NextRequest) {
  let body: { sid?: unknown; text?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  const sid = typeof body.sid === "string" && /^[0-9a-f-]{36}$/.test(body.sid) ? body.sid : randomUUID();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
  if (limited(ip, Date.now())) {
    return NextResponse.json({ sid, reply: "I'm getting a lot of messages right now. Please tap *Live WA* below to chat with our team on WhatsApp. 🙏" }, { status: 429 });
  }
  // one message at a time per chat, so order steps keep their order
  const job = (chains.get(sid) || Promise.resolve()).then(() => turn(sid, text));
  const done = job.catch(() => undefined);
  chains.set(sid, done);
  done.finally(() => { if (chains.get(sid) === done) chains.delete(sid); });
  try {
    return NextResponse.json({ sid, ...(await job) });
  } catch (e) {
    console.error("web chat error:", (e as Error)?.message || e);
    return NextResponse.json({ sid, reply: "Sorry, something went wrong. Please tap *Live WA* below to chat with our team on WhatsApp." }, { status: 500 });
  }
}
