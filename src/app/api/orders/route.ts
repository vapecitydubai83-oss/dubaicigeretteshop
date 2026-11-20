import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { formatWhatsAppNumberForLink, INITIAL_ORDERS, Lead, OrderItem, WhatsAppOrder } from "@/lib/catalog-data";
import { reviewToken } from "@/lib/reviews";
import { reviewSecret, SITE } from "@/lib/reviews-store";

// Orders and leads live in the persistent uploads volume so orders placed
// by customers on any device show up in the admin panel.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const MAX_ORDERS = 500;

// New-order alert to the shop's own WhatsApp, sent through the WhatsApp gateway (WA-AKG:
// POST /api/messages/{session}/{jid}/send). Off until all three env vars are set:
//   WA_NOTIFY_URL (gateway base URL), WA_NOTIFY_KEY (tenant API key), WA_NOTIFY_SESSION (linked sender session).
// WA_NOTIFY_TO = receiving number(s), comma-separated, digits with country code.
// An alert that fails must never fail the customer's order, so errors are only logged.
// Customer-typed text: one line, no WhatsApp formatting, so it cannot fake extra lines of the alert.
const flat = (s: string) => s.replace(/[\x00-\x1f\x7f\u2028\u2029]+/g, " ").replace(/[*_~`]/g, "");
// Global cap, independent of the (spoofable) client IP: at most 30 alerts per 10 minutes.
const alertTimes: number[] = [];
let capNoticeSent = false;

function notifyShop(order: WhatsAppOrder) {
  const { WA_NOTIFY_URL: url, WA_NOTIFY_KEY: key, WA_NOTIFY_SESSION: session, WA_NOTIFY_TO: to } = process.env;
  if (!url || !key || !session || !to) return;
  const now = Date.now();
  while (alertTimes.length && alertTimes[0] < now - 10 * 60 * 1000) alertTimes.shift();
  const capped = alertTimes.length >= 30;
  if (capped && capNoticeSent) return console.error("Order alert skipped (rate cap):", order.id);
  capNoticeSent = capped;
  alertTimes.push(now);
  // Over the cap the shop still hears once that orders are arriving, so a flood cannot hide them silently.
  const text = capped
    ? `⚠️ *Many orders in the last 10 minutes* (possible spam). Alerts are paused until it slows down — check the admin panel for new orders.`
    : [
    `🛒 *New order #${flat(order.id)}* (${order.source})`,
    ...order.items.map(
      (i) => `• ${i.quantity} × ${flat(i.title)}${i.flavor ? ` — ${flat(i.flavor)}` : ""} (${i.packTier === "5-cartons" ? "5-bundle price" : "single price"}) — AED ${i.unitPrice * i.quantity}`
    ),
    `Total: *AED ${order.total}* (delivery AED ${order.deliveryFee}) — prices as sent by the customer's browser, check before confirming`,
    `Customer: ${flat(order.customerName)} · ${flat(order.customerPhone)}`,
    `Area: ${flat(order.deliveryArea)}`,
    `Note: ${flat(order.addressNote)}`,
    `Payment: ${order.paymentMethod}`,
  ].join("\n");
  for (const n of to.split(",").map((x) => x.replace(/\D/g, "")).filter((x) => x.length >= 9)) {
    fetch(`${url.replace(/\/$/, "")}/api/messages/${encodeURIComponent(session)}/${encodeURIComponent(`${n}@s.whatsapp.net`)}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ message: { text } }),
      signal: AbortSignal.timeout(8000),
    })
      .then((r) => { if (!r.ok) console.error("Order alert not sent:", r.status); })
      .catch((e) => console.error("Order alert failed:", e?.message || e));
  }
}

const reviewUrl = (orderId: string) => `${SITE}/review/${reviewToken(reviewSecret(), orderId)}`;

// Owner 2026-11-20: after delivery the customer gets a WhatsApp asking for a review (verified buyers only).
// Sent from the shop's own linked session; skipped when the gateway or a real customer number is missing.
function askForReview(order: WhatsAppOrder) {
  const { WA_NOTIFY_URL: url, WA_NOTIFY_KEY: key, WA_NOTIFY_SESSION: session } = process.env;
  const digits = (order.customerPhone || "").replace(/\D/g, "");
  if (!url || !key || !session || digits.length < 9 || !reviewSecret()) return;
  const n = formatWhatsAppNumberForLink(order.customerPhone);
  const first = flat(order.customerName).split(" ")[0];
  const text = `Hi${first && !/guest/i.test(first) ? ` ${first}` : ""}, thank you for your order #${flat(order.id)} from Dubai Cigerette Shop. ` +
    `How was it? Please rate it here (takes 20 seconds): ${reviewUrl(order.id)}`;
  fetch(`${url.replace(/\/$/, "")}/api/messages/${encodeURIComponent(session)}/${encodeURIComponent(`${n}@s.whatsapp.net`)}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify({ message: { text } }),
    signal: AbortSignal.timeout(8000),
  })
    .then((r) => { if (!r.ok) console.error("Review request not sent:", r.status); })
    .catch((e) => console.error("Review request failed:", e?.message || e));
}

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
    // staff get each delivered order's review link (to send by hand while the shop WhatsApp is not linked)
    return NextResponse.json({
      ...store,
      orders: store.orders.map((o) => (o.status === "Delivered" && reviewSecret() ? { ...o, reviewUrl: reviewUrl(o.id) } : o)),
    });
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
      ...(cleanStr(it.flavor, 60) ? { flavor: cleanStr(it.flavor, 60) } : {}),
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
    notifyShop(order);
    return NextResponse.json({ success: true, id: order.id });
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.action === "status" && body.id && body.status) {
    const before = store.orders.find((o) => o.id === body.id);
    store.orders = store.orders.map((o) =>
      o.id === body.id ? { ...o, status: body.status! } : o
    );
    if (before && before.status !== "Delivered" && body.status === "Delivered") askForReview(before);
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
