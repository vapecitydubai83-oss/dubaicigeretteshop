import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { INITIAL_ORDERS, Lead, OrderItem, WhatsAppOrder } from "@/lib/catalog-data";

// Orders and leads live in the persistent uploads volume so orders placed
// by customers on any device show up in the admin panel.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const MAX_ORDERS = 500;

// Per-IP rate limit on public order creation: max 15 orders per 10 minutes.
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const CREATE_MAX = 15;
const createBuckets = new Map<string, { count: number; resetAt: number }>();

interface OrderStore {
  orders: WhatsAppOrder[];
  leads: Lead[];
}

async function readStore(): Promise<OrderStore> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const j = JSON.parse(raw);
    return {
      orders: Array.isArray(j.orders) ? j.orders : INITIAL_ORDERS,
      leads: Array.isArray(j.leads) ? j.leads : [],
    };
  } catch {
    return { orders: [...INITIAL_ORDERS], leads: [] };
  }
}

async function writeStore(store: OrderStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(store), "utf-8");
  await rename(tmp, DATA_FILE);
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const ba = Buffer.from(provided);
  const bb = Buffer.from(expected);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function cleanStr(val: unknown, maxLen = 160): string {
  return typeof val === "string" ? val.trim().slice(0, maxLen) : "";
}

function mergeLead(leads: Lead[], order: WhatsAppOrder): Lead[] {
  const digits = (order.customerPhone || "").replace(/\D/g, "");
  const hasRealPhone = digits.length >= 9;
  const productInterest = (order.items || [])
    .map((i) => `${i.title} (${i.brand})`)
    .join(", ")
    .slice(0, 300);

  const existingIdx = hasRealPhone
    ? leads.findIndex((l) => {
        const lDigits = (l.customerPhone || "").replace(/\D/g, "");
        return lDigits.length >= 9 && lDigits.slice(-9) === digits.slice(-9);
      })
    : -1;

  if (existingIdx >= 0) {
    return leads.map((l, idx) =>
      idx === existingIdx
        ? {
            ...l,
            customerName:
              order.customerName &&
              order.customerName !== "WhatsApp Express Guest"
                ? order.customerName
                : l.customerName,
            deliveryArea: order.deliveryArea || l.deliveryArea,
            lastOrderId: order.id,
            totalOrders: l.totalOrders + 1,
            totalSpent: l.totalSpent + (order.total || 0),
            lastProductInterest: productInterest,
            source: order.source,
          }
        : l
    );
  }

  const newLead: Lead = {
    id: `LE-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: order.createdAt || new Date().toISOString(),
    customerName: order.customerName || "WhatsApp Guest",
    customerPhone: hasRealPhone ? order.customerPhone : "Chat on WhatsApp",
    deliveryArea: order.deliveryArea || "",
    lastOrderId: order.id,
    totalOrders: 1,
    totalSpent: order.total || 0,
    lastProductInterest: productInterest,
    source: order.source || "Express 1-Click",
  };
  return [newLead, ...leads].slice(0, MAX_ORDERS);
}

export async function GET(request: NextRequest) {
  const store = await readStore();
  if (authorized(request)) {
    return NextResponse.json(store);
  }
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") || "").trim().replace(/^#/, "").toUpperCase();
  if (!id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const found = store.orders.find((o) => o.id.toUpperCase() === id);
  if (!found) {
    return NextResponse.json({ order: null }, { status: 404 });
  }
  const digits = (found.customerPhone || "").replace(/\D/g, "");
  return NextResponse.json({
    order: {
      ...found,
      customerPhone: digits.length >= 4 ? `••• ${digits.slice(-4)}` : found.customerPhone,
    },
  });
}

export async function POST(request: NextRequest) {
  let body: {
    action?: string;
    order?: WhatsAppOrder;
    id?: string;
    status?: WhatsAppOrder["status"];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const store = await readStore();

  // Customer order creation is public (rate-limited & sanitized); all other mutations require the admin key.
  if (body.action === "create" && body.order?.id && Array.isArray(body.order.items)) {
    if (!authorized(request)) {
      const ip =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      const now = Date.now();
      const b = createBuckets.get(ip);
      if (b && b.resetAt > now && b.count >= CREATE_MAX) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      createBuckets.set(ip, {
        count: (b && b.resetAt > now ? b.count : 0) + 1,
        resetAt: now + CREATE_WINDOW_MS,
      });
    }

    const raw = body.order;
    const items: OrderItem[] = raw.items.slice(0, 30).map((it) => ({
      productId: cleanStr(it.productId, 80),
      title: cleanStr(it.title, 140),
      brand: cleanStr(it.brand, 60),
      packTier: it.packTier === "5-cartons" ? "5-cartons" : "1-carton",
      quantity: Math.max(1, Math.min(100, Number(it.quantity) || 1)),
      unitPrice: Math.max(0, Math.min(100000, Number(it.unitPrice) || 0)),
    }));
    if (items.length === 0) {
      return NextResponse.json({ error: "Empty items" }, { status: 400 });
    }

    // Never allow public create to overwrite an existing order ID.
    let orderId = cleanStr(raw.id, 24).toUpperCase() || `EC-${Math.floor(8842 + Math.random() * 1100)}`;
    if (store.orders.some((o) => o.id.toUpperCase() === orderId)) {
      orderId = `EC-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-3)}`;
    }

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const deliveryFee = Math.max(0, Math.min(500, Number(raw.deliveryFee) || 0));

    const order: WhatsAppOrder = {
      id: orderId,
      createdAt: new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
      customerName: cleanStr(raw.customerName, 80) || "WhatsApp Express Guest",
      customerPhone: cleanStr(raw.customerPhone, 40) || "Via WhatsApp Concierge",
      deliveryArea: cleanStr(raw.deliveryArea, 100) || "Downtown Dubai",
      addressNote: cleanStr(raw.addressNote, 240) || "Direct WhatsApp Checkout",
      paymentMethod:
        raw.paymentMethod === "Card on Delivery" ||
        raw.paymentMethod === "Apple Pay / Link"
          ? raw.paymentMethod
          : "Cash on Delivery",
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status: authorized(request) && raw.status ? raw.status : "New WhatsApp Lead",
      source:
        raw.source === "Multi-Item Cart" || raw.source === "Hero Quick-Order"
          ? raw.source
          : "Express 1-Click",
    };

    store.orders = [order, ...store.orders].slice(0, MAX_ORDERS);
    store.leads = mergeLead(store.leads, order);
    await writeStore(store);
    return NextResponse.json({ success: true, id: order.id });
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.action === "status" && body.id && body.status) {
    store.orders = store.orders.map((o) =>
      o.id === body.id ? { ...o, status: body.status! } : o
    );
  } else if (body.action === "deleteOrder" && body.id) {
    store.orders = store.orders.filter((o) => o.id !== body.id);
  } else if (body.action === "deleteLead" && body.id) {
    store.leads = store.leads.filter((l) => l.id !== body.id);
  } else if (body.action === "reset") {
    store.orders = [...INITIAL_ORDERS];
    store.leads = [];
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await writeStore(store);
  return NextResponse.json({ success: true });
}
