import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { readBotStore, update } from "@/lib/wa-bot-store";

// Admin/manager panel: WhatsApp auto-reply on/off, recent chats, pause/resume the bot per chat.
function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = await readBotStore();
  const last = (c: (typeof s.chats)[string]) => c.msgs[c.msgs.length - 1]?.at || 0;
  const chats = Object.values(s.chats).sort((a, b) => last(b) - last(a)).slice(0, 50);
  return NextResponse.json({ enabled: s.enabled, ready: !!process.env.WA_BOT_SECRET, now: Date.now(), chats });
}

// POST {action: "on" | "off"} or {action: "pause" | "resume", jid}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");
  const jid = String(body?.jid || "");
  if (action === "on" || action === "off") {
    await update((s) => { s.enabled = action === "on"; });
    return NextResponse.json({ ok: true });
  }
  if (action === "pause" || action === "resume") {
    const found = await update((s) => {
      const c = s.chats[jid];
      if (!c) return false;
      c.pausedUntil = action === "pause" ? Date.now() + 24 * 3600 * 1000 : 0;
      if (action === "resume") c.needsPerson = false;
      return true;
    });
    return found ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
