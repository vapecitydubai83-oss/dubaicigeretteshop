import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { INITIAL_ORDERS, Lead, WhatsAppOrder } from "@/lib/catalog-data";

// Orders and leads live in the persistent uploads volume so orders placed
// by customers on any device show up in the admin panel.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const MAX_ORDERS = 500;

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
  return Boolean(expected) && request.headers.get("x-admin-key") === expected;
}

function mergeLead(leads: Lead[], order: WhatsAppOrder): Lead[] {
  const digits = (order.customerPhone || "").replace(/\D/g, "");
  const hasRealPhone = digits.length >= 9;
  const productInterest = (order.items || [])
    .map((i) => `${i.title} (${i.brand})`)
    .join(", ");

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
  // Admin gets the full list; public callers can only look up a single order
  // by id for /track (with phone masked).
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

  // Customer order creation is public; all other mutations require the admin key.
  if (body.action === "create" && body.order?.id && Array.isArray(body.order.items)) {
    const order: WhatsAppOrder = {
      ...body.order,
      createdAt: new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
    };
    const withoutDup = store.orders.filter((o) => o.id !== order.id);
    store.orders = [order, ...withoutDup].slice(0, MAX_ORDERS);
    store.leads = mergeLead(store.leads, order);
    await writeStore(store);
    return NextResponse.json({ success: true });
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
