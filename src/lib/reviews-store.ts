import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { Review } from "@/lib/reviews";

// Reviews live in the persistent uploads volume next to orders.json (never under a public URL:
// /uploads/_store is not served, like the other store files).
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "reviews.json");

export async function readReviews(): Promise<Review[]> {
  try {
    const j = JSON.parse(await readFile(DATA_FILE, "utf-8"));
    return Array.isArray(j.reviews) ? j.reviews : [];
  } catch {
    return [];
  }
}

export async function writeReviews(reviews: Review[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify({ reviews }), "utf-8");
  await rename(tmp, DATA_FILE);
}

export async function approvedReviews(productId: string): Promise<Review[]> {
  return (await readReviews())
    .filter((r) => r.status === "approved" && r.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const reviewSecret = () => process.env.ADMIN_API_KEY || "";
export const SITE = "https://dubaicigeretteshop.ae";
