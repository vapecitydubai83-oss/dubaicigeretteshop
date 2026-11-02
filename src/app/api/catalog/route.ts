import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import type { Product, StoreSettings } from "@/lib/catalog-data";
import { readCatalogStore, writeCatalogStore } from "@/lib/catalog-store";

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const ba = Buffer.from(provided);
  const bb = Buffer.from(expected);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function GET(request: NextRequest) {
  const store = await readCatalogStore();
  // Never expose cloudApiAccessToken or webhookVerifyToken to unauthenticated callers.
  if (!authorized(request) && store.settings?.whatsappBot) {
    return NextResponse.json({
      ...store,
      settings: {
        ...store.settings,
        whatsappBot: {
          ...store.settings.whatsappBot,
          cloudApiAccessToken: "",
          webhookVerifyToken: "",
        },
      },
    });
  }
  return NextResponse.json(store);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action?: string;
    product?: Product;
    id?: string;
    settings?: Partial<StoreSettings>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const store = await readCatalogStore();

  if (body.action === "upsert" && body.product?.id) {
    const p = body.product;
    store.products[p.id] = p;
    store.deleted = store.deleted.filter((id) => id !== p.id);
  } else if (body.action === "delete" && body.id) {
    delete store.products[body.id];
    if (!store.deleted.includes(body.id)) store.deleted.push(body.id);
  } else if (body.action === "settings" && body.settings && typeof body.settings === "object") {
    store.settings = { ...(store.settings || {}), ...body.settings };
  } else if (body.action === "reset") {
    store.products = {};
    store.deleted = [];
    delete store.settings;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    await writeCatalogStore(store);
  } catch (err) {
    console.error("Catalog store write failed:", err);
    return NextResponse.json(
      { error: "Failed to save catalog data" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
