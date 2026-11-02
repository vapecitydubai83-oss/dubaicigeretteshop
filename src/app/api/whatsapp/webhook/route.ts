import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, Product } from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  if (!secret) return true; // signature check enabled once WHATSAPP_APP_SECRET is set
  if (!header || !header.startsWith("sha256=")) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function getLiveCatalog() {
  const store = await readCatalogStore();
  const overrides = store.products || {};
  const deleted = new Set(store.deleted || []);
  const merged = INITIAL_PRODUCTS.filter((p) => !deleted.has(p.id)).map(
    (p) => overrides[p.id] ?? p
  );
  const baseIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
  const added: Product[] = Object.values(overrides).filter((p) => !baseIds.has(p.id));
  const settings = { ...INITIAL_SETTINGS, ...(store.settings || {}) };
  return { products: [...added.reverse(), ...merged], settings };
}

/**
 * Official WhatsApp Business Cloud API & Kapso/Twilio Webhook Endpoint
 * - GET /api/whatsapp/webhook : Verifies webhook subscription (hub.verify_token)
 * - POST /api/whatsapp/webhook : Receives incoming customer WhatsApp messages,
 *   matches cigarette cartons or secondary products, and returns automated reply payload.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN ||
    INITIAL_SETTINGS.whatsappBot.webhookVerifyToken;

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    service: "Dubai Cigarette Shop WhatsApp Automation Webhook",
    whatsappHotline: INITIAL_SETTINGS.supportPhoneDisplay,
    webhookUrl: "/api/whatsapp/webhook",
    instructions:
      "Configure Meta WhatsApp Business Cloud API or Kapso/Twilio webhook to POST incoming messages here.",
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const body = JSON.parse(rawBody);

    // Extract message text from either Meta WhatsApp Cloud API format or simple JSON format
    const metaMessage =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
    const senderPhone =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
      body?.from ||
      "+971500000000";
    const incomingText = (metaMessage || body?.text || "").toString().trim();

    const q = incomingText.toLowerCase();
    const { products: liveProducts, settings: liveSettings } = await getLiveCatalog();

    // Match product in live catalog (including admin edits)
    const matchedProduct = liveProducts.find(
      (p) =>
        q.includes(p.title.toLowerCase()) ||
        q.includes(p.brand.toLowerCase())
    );

    let replyMessage = "";
    if (matchedProduct) {
      replyMessage = [
        `Marhaba from *${liveSettings.storeName}* (${liveSettings.supportPhoneDisplay})!`,
        `✅ *${matchedProduct.title}* is ${matchedProduct.inStock ? "IN STOCK" : "currently out of stock"} for 45–60 min Dubai delivery.`,
        `• 1 Carton: AED ${matchedProduct.cartonPrice}.00`,
        `• 5 Cartons VIP: AED ${matchedProduct.fiveCartonPrice}.00`,
        `• Specs: ${matchedProduct.tar} Tar / ${matchedProduct.nicotine} Nicotine`,
        ``,
        `Reply with your *Dubai Area / Location Pin* to confirm instant rider dispatch!`,
      ].join("\n");
    } else {
      replyMessage = [
        `Marhaba! Welcome to *${liveSettings.storeName}* (${liveSettings.supportPhoneDisplay}) — Dubai's #1 24/7 Online Cigarette Shop.`,
        ``,
        `Reply with a brand name to check live carton price & order:`,
        `1️⃣ *Marlboro* (Gold, Red, Vista Double Mix, Ice — AED 190–200)`,
        `2️⃣ *Dunhill* (Evoke Gold, Switch, Blue, White — AED 120–200)`,
        `3️⃣ *Davidoff* (Gold, White Slims — AED 155–165)`,
        `4️⃣ *ESSE Super Slims* (Change, Black, Gold — AED 75–90)`,
        `5️⃣ *Parliament / Winston / Vogue / West* (AED 125–225)`,
        `6️⃣ *Secondary Items:* IQOS Terea, VELO Pouches, Vapes & E-Liquids`,
      ].join("\n");
    }

    return NextResponse.json({
      success: true,
      to: senderPhone,
      automatedReply: replyMessage,
      matchedSku: matchedProduct?.sku || null,
      hotline: INITIAL_SETTINGS.supportPhoneDisplay,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 }
    );
  }
}
