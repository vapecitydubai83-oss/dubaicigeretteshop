import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Per-IP brute-force limiter: max 8 failed attempts per 10-minute window.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  const user = process.env.ADMIN_USERNAME || "";
  const pass = process.env.ADMIN_PASSWORD || "";
  const key = process.env.ADMIN_API_KEY || "";
  if (!user || !pass || !key) {
    return NextResponse.json(
      { error: "Server admin login is not configured" },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILS) {
    return NextResponse.json(
      { error: "Too many failed login attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uOk = typeof body.username === "string" && safeEqual(body.username, user);
  const pOk = typeof body.password === "string" && safeEqual(body.password, pass);

  if (uOk && pOk) {
    attempts.delete(ip);
    return NextResponse.json({ ok: true, key });
  }

  const prev = entry && entry.resetAt > now ? entry.count : 0;
  attempts.set(ip, { count: prev + 1, resetAt: now + WINDOW_MS });
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
