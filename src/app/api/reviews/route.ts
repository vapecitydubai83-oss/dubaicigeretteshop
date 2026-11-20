import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import type { WhatsAppOrder } from "@/lib/catalog-data";
import { cleanSubmission, orderIdFromToken, publicName, type Review } from "@/lib/reviews";
import { readReviews, reviewSecret, writeReviews } from "@/lib/reviews-store";

// GET (admin key): every review, newest first.
// POST {action:"submit", token, name, items:[{productId, rating, text}]}: public, verified buyers only
//   (signed link + order marked Delivered + one submission per order); saved as "pending".
// POST {action:"approve"|"reject"|"delete", id} (admin key): moderation.

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function findOrder(id: string): Promise<WhatsAppOrder | undefined> {
  try {
    const j = JSON.parse(await readFile(path.join(process.cwd(), "public", "uploads", "_store", "orders.json"), "utf-8"));
    return (Array.isArray(j.orders) ? (j.orders as WhatsAppOrder[]) : []).find((o) => o.id === id);
  } catch {
    return undefined;
  }
}

// Per-IP limit on submissions: 10 per 10 minutes (the signed link is the real gate).
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reviews = (await readReviews()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");

  if (action === "submit") {
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const b = buckets.get(ip);
    if (b && b.resetAt > now && b.count >= 10) {
      return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
    }
    buckets.set(ip, { count: (b && b.resetAt > now ? b.count : 0) + 1, resetAt: now + 10 * 60 * 1000 });

    const orderId = orderIdFromToken(reviewSecret(), String(body?.token || ""));
    const order = orderId ? await findOrder(orderId) : undefined;
    if (!order) return NextResponse.json({ error: "This review link is not valid." }, { status: 404 });
    if (order.status !== "Delivered") {
      return NextResponse.json({ error: "You can review this order once it has been delivered." }, { status: 409 });
    }
    const all = await readReviews();
    if (all.some((r) => r.orderId === order.id)) {
      return NextResponse.json({ error: "Thank you, this order has already been reviewed." }, { status: 409 });
    }
    const { rows, error } = cleanSubmission(
      body?.items,
      order.items.map((i) => ({ productId: i.productId, title: i.title }))
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    const name = publicName(String(body?.name || order.customerName || ""));
    const createdAt = new Date().toISOString();
    const added: Review[] = rows.map((r) => ({
      id: `RV-${randomBytes(6).toString("hex")}`,
      orderId: order.id,
      ...r,
      name,
      createdAt,
      status: "pending",
    }));
    await writeReviews([...added, ...all].slice(0, 5000));
    return NextResponse.json({ ok: true, count: added.length });
  }

  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = String(body?.id || "");
  const all = await readReviews();
  if (!all.some((r) => r.id === id)) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (action === "approve" || action === "reject") {
    const status = action === "approve" ? "approved" : "rejected";
    await writeReviews(all.map((r) => (r.id === id ? { ...r, status } : r)));
  } else if (action === "delete") {
    await writeReviews(all.filter((r) => r.id !== id));
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
