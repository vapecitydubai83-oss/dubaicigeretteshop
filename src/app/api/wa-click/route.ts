import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

// Counts WhatsApp taps per page and button, so the owner can see which pages bring chats.
// POST is public (a beacon from the page, rate-limited, nothing personal stored); GET needs the admin key.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "wa-clicks.json");
const KEEP_DAYS = 120;

type Day = Record<string, Record<string, number>>; // path -> label -> taps
interface Store { days: Record<string, Day> }

async function readStore(): Promise<Store> {
  try {
    const j = JSON.parse(await readFile(DATA_FILE, "utf-8"));
    return { days: j.days && typeof j.days === "object" ? j.days : {} };
  } catch {
    return { days: {} };
  }
}

// one Node process: chain the read-modify-write so two taps at once cannot lose one
let queue: Promise<unknown> = Promise.resolve();
function addTap(day: string, p: string, label: string) {
  queue = queue.then(async () => {
    const s = await readStore();
    const d = (s.days[day] ||= {});
    const row = (d[p] ||= {});
    row[label] = (row[label] || 0) + 1;
    const days = Object.keys(s.days).sort();
    for (const old of days.slice(0, Math.max(0, days.length - KEEP_DAYS))) delete s.days[old];
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE + ".tmp", JSON.stringify(s), "utf-8");
    await rename(DATA_FILE + ".tmp", DATA_FILE);
  }).catch((e) => console.error("wa-click not saved:", e?.message || e));
  return queue;
}

const buckets = new Map<string, { count: number; resetAt: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  const b = buckets.get(ip);
  if (b && b.resetAt > now && b.count >= 30) return true;
  buckets.set(ip, { count: (b && b.resetAt > now ? b.count : 0) + 1, resetAt: b && b.resetAt > now ? b.resetAt : now + 10 * 60 * 1000 });
  return false;
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const dubaiDay = (t = new Date()) => t.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
const cleanPath = (v: unknown) =>
  typeof v === "string" && /^\/[\w\-./%]{0,150}$/.test(v) ? v.replace(/\/+$/, "") || "/" : "";
const cleanLabel = (v: unknown) =>
  (typeof v === "string" ? v.replace(/[^\w\- &]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) : "") || "link";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return new NextResponse(null, { status: 429 });
  let body: { path?: unknown; label?: unknown };
  try {
    body = JSON.parse((await request.text()).slice(0, 1000));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const p = cleanPath(body.path);
  if (!p) return new NextResponse(null, { status: 400 });
  await addTap(dubaiDay(), p, cleanLabel(body.label));
  return new NextResponse(null, { status: 204 });
}

// GET ?days=28 -> taps per page (with buttons), most first, plus taps per day
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const n = Math.min(KEEP_DAYS, Math.max(1, Number(request.nextUrl.searchParams.get("days")) || 28));
  const since = dubaiDay(new Date(Date.now() - (n - 1) * 86400000));
  const s = await readStore();
  const pages: Record<string, { total: number; buttons: Record<string, number> }> = {};
  const perDay: Record<string, number> = {};
  for (const [day, d] of Object.entries(s.days)) {
    if (day < since) continue;
    for (const [p, row] of Object.entries(d)) {
      const pg = (pages[p] ||= { total: 0, buttons: {} });
      for (const [label, c] of Object.entries(row)) {
        pg.total += c;
        pg.buttons[label] = (pg.buttons[label] || 0) + c;
        perDay[day] = (perDay[day] || 0) + c;
      }
    }
  }
  const top = Object.entries(pages).sort((a, b) => b[1].total - a[1].total).map(([page, v]) => ({ page, ...v }));
  return NextResponse.json({ since, total: top.reduce((t, x) => t + x.total, 0), perDay, pages: top });
}
