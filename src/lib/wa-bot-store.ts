import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { LastOrder, OrderState } from "@/lib/wa-bot";

// WhatsApp auto-reply state: on/off switch + the last messages of each chat (for the admin panel and
// so the bot knows whether it already greeted). One Node process: every change goes through `update`.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "wa-bot.json");
const MAX_CHATS = 300;
const MAX_MSGS = 30;

export type Who = "customer" | "bot" | "staff";
export interface ChatMsg { at: number; from: Who; text: string }
export interface Chat {
  jid: string;
  name: string;
  msgs: ChatMsg[];
  pausedUntil: number; // bot stays quiet in this chat until then (a person is handling it)
  needsPerson: boolean; // set on handover, cleared when staff reply or the owner resumes the bot
  botDay: string;
  botCount: number;
  lastBotAt: number;
  order?: OrderState & { at: number }; // open WhatsApp order (PLAN 74p)
  last?: LastOrder; // last placed order, for "same again"
}
export interface BotStore { enabled: boolean; chats: Record<string, Chat> }

async function read(): Promise<BotStore> {
  try {
    const j = JSON.parse(await readFile(DATA_FILE, "utf-8"));
    return { enabled: j.enabled !== false, chats: j.chats && typeof j.chats === "object" ? j.chats : {} };
  } catch {
    return { enabled: true, chats: {} };
  }
}

let queue: Promise<unknown> = Promise.resolve();
export function update<T>(fn: (s: BotStore) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const s = await read();
    const out = await fn(s);
    const ids = Object.keys(s.chats);
    if (ids.length > MAX_CHATS) {
      const last = (c: Chat) => c.msgs[c.msgs.length - 1]?.at || 0;
      ids.sort((a, b) => last(s.chats[a]) - last(s.chats[b]));
      for (const id of ids.slice(0, ids.length - MAX_CHATS)) delete s.chats[id];
    }
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE + ".tmp", JSON.stringify(s), "utf-8");
    await rename(DATA_FILE + ".tmp", DATA_FILE);
    return out;
  });
  queue = run.catch((e) => console.error("wa-bot store not saved:", e?.message || e));
  return run;
}

export const readBotStore = () => queue.then(read, read);

export function chatOf(s: BotStore, jid: string, name = ""): Chat {
  const c = (s.chats[jid] ||= { jid, name, msgs: [], pausedUntil: 0, needsPerson: false, botDay: "", botCount: 0, lastBotAt: 0 });
  if (name) c.name = name.slice(0, 60);
  return c;
}

export function addMsg(c: Chat, from: Who, text: string, at = Date.now()) {
  c.msgs.push({ at, from, text: text.slice(0, 1500) });
  if (c.msgs.length > MAX_MSGS) c.msgs.splice(0, c.msgs.length - MAX_MSGS);
}
