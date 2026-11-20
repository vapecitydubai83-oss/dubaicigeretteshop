import { createHmac, timingSafeEqual } from "crypto";

// Reviews from verified buyers only (owner 2026-11-20): a review link is signed per order and only
// works once the order is marked Delivered. Every review waits for staff approval before it shows.
// Pure helpers (no files, no env) so they can be tested with plain `node src/lib/reviews.test.ts`.

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  name: string; // shown as "Ahmed K."
  rating: number; // 1..5
  text: string;
  createdAt: string; // ISO
  status: "pending" | "approved" | "rejected";
}

const sig = (secret: string, orderId: string) =>
  createHmac("sha256", secret).update(`review:${orderId}`).digest("hex").slice(0, 24);

export function reviewToken(secret: string, orderId: string): string {
  return `${orderId}.${sig(secret, orderId)}`;
}

/** The order id inside a valid token, else null. */
export function orderIdFromToken(secret: string, token: string): string | null {
  const m = /^([A-Za-z0-9-]{1,40})\.([0-9a-f]{24})$/.exec(token || "");
  if (!m || !secret) return null;
  const a = Buffer.from(m[2]);
  const b = Buffer.from(sig(secret, m[1]));
  return a.length === b.length && timingSafeEqual(a, b) ? m[1] : null;
}

/** "ahmed khan" -> "Ahmed K."; nothing usable -> "Verified buyer". */
export function publicName(raw: string): string {
  const words = String(raw || "").replace(/[^\p{L}\p{N} '-]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "Verified buyer";
  const first = words[0].slice(0, 20);
  const cap = first.charAt(0).toUpperCase() + first.slice(1);
  return words[1] ? `${cap} ${words[1].charAt(0).toUpperCase()}.` : cap;
}

/** Checks a customer's submission against the order's products. Returns the clean rows or an error. */
export function cleanSubmission(
  items: unknown,
  orderProducts: { productId: string; title: string }[]
): { rows: { productId: string; productTitle: string; rating: number; text: string }[]; error?: string } {
  if (!Array.isArray(items) || items.length === 0) return { rows: [], error: "Please rate at least one product." };
  const seen = new Set<string>();
  const rows: { productId: string; productTitle: string; rating: number; text: string }[] = [];
  for (const it of items.slice(0, 30)) {
    const productId = String((it as { productId?: unknown })?.productId || "");
    const p = orderProducts.find((x) => x.productId === productId);
    const rating = Number((it as { rating?: unknown })?.rating);
    if (!p || seen.has(productId)) continue; // only products of this order, once each
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue; // unrated = skipped
    seen.add(productId);
    const text = String((it as { text?: unknown })?.text || "")
      .replace(/[\x00-\x09\x0b-\x1f\x7f]/g, "")
      .trim()
      .slice(0, 600);
    rows.push({ productId, productTitle: p.title.slice(0, 140), rating, text });
  }
  return rows.length ? { rows } : { rows: [], error: "Please rate at least one product." };
}
