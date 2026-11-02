import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { Product } from "@/lib/catalog-data";

// Product edits made in the admin panel are stored here, inside the uploads
// volume, so they survive rebuilds and reach every visitor.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "catalog.json");

interface CatalogStore {
  // Full product objects keyed by id — covers both edits of base-catalog
  // products and brand-new products added in the admin panel.
  products: Record<string, Product>;
  // Base-catalog product ids removed in the admin panel.
  deleted: string[];
}

const EMPTY: CatalogStore = { products: {}, deleted: [] };

async function readStore(): Promise<CatalogStore> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const j = JSON.parse(raw);
    return {
      products: j.products && typeof j.products === "object" ? j.products : {},
      deleted: Array.isArray(j.deleted) ? j.deleted : [],
    };
  } catch {
    return { products: {}, deleted: [] };
  }
}

async function writeStore(store: CatalogStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(store), "utf-8");
  await rename(tmp, DATA_FILE);
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  return Boolean(expected) && request.headers.get("x-admin-key") === expected;
}

export async function GET() {
  return NextResponse.json(await readStore());
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action?: string;
    product?: Product;
    id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const store = await readStore();

  if (body.action === "upsert" && body.product?.id) {
    const p = body.product;
    store.products[p.id] = p;
    store.deleted = store.deleted.filter((id) => id !== p.id);
  } else if (body.action === "delete" && body.id) {
    delete store.products[body.id];
    if (!store.deleted.includes(body.id)) store.deleted.push(body.id);
  } else if (body.action === "reset") {
    store.products = {};
    store.deleted = [];
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    await writeStore(store);
  } catch (err) {
    console.error("Catalog store write failed:", err);
    return NextResponse.json(
      { error: "Failed to save catalog data" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
