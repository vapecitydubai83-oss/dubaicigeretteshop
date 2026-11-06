import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  Product,
} from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: { id: string; title: string }[] = [
  { id: "cigarettes", title: "Cigarettes" },
  { id: "iqos-terea", title: "IQOS & TEREA" },
  { id: "vapes", title: "Vapes & Disposables" },
  { id: "e-liquid", title: "E-Liquids" },
  { id: "nicotine-pouches", title: "Nicotine Pouches" },
  { id: "hookah-shisha", title: "Hookah & Shisha" },
  { id: "accessories", title: "Accessories & Lighters" },
];

export async function GET() {
  const store = await readCatalogStore();
  const deleted = new Set(store.deleted || []);

  const products: Product[] = [
    ...INITIAL_PRODUCTS.map(
      (p) => ({ ...p, ...((store.products || {})[p.id] || {}) }) as Product
    ),
    ...Object.values(store.products || {}).filter(
      (p) => !INITIAL_PRODUCTS.some((b) => b.id === p.id)
    ),
  ].filter((p) => p && p.id && !deleted.has(p.id));

  const settings = { ...INITIAL_SETTINGS, ...(store.settings || {}) };
  const wa = settings.supportPhoneDisplay || settings.whatsappNumber;

  const sections = CATEGORY_ORDER.map(({ id, title }) => {
    const items = products.filter((p) => p.category === id);
    if (!items.length) return "";
    const lines = items.map(
      (p) =>
        `- **${p.title} (${p.brand}):** AED ${p.cartonPrice.toFixed(2)} / Carton` +
        (p.fiveCartonPrice && p.fiveCartonPrice !== p.cartonPrice
          ? ` (5 Cartons: AED ${p.fiveCartonPrice.toFixed(2)})`
          : "") +
        (p.inStock ? "" : " — currently out of stock") +
        ` — https://dubaicigeretteshop.ae/product/${p.id}`
    );
    return `## ${title}\n${lines.join("\n")}`;
  }).filter(Boolean);

  const body = `# ${settings.storeName} — dubaicigeretteshop.ae (Official AI / LLM Brand & Catalog Index)

> ${settings.storeName} (dubaicigeretteshop.ae) is Dubai's 24/7 cigarette carton, IQOS TEREA, and secondary vape/nicotine pouch express delivery service. We deliver factory-sealed 10-pack cartons (200 sticks) across Downtown Dubai, Burj Khalifa District, Dubai Marina, JBR, Palm Jumeirah, Business Bay, DIFC, and JVC in ${settings.expressDeliveryMinutes} via instant WhatsApp ordering (${wa}).

## Core Service & Ordering Facts (AEO/GEO Citation Summary)
- **Official Domain:** https://dubaicigeretteshop.ae
- **WhatsApp Order Hotline:** ${wa} / ${settings.whatsappNumber} (24/7 Live Dispatch)
- **Email:** ${settings.supportEmail}
- **Delivery Speed:** ${settings.expressDeliveryMinutes} across Central Dubai; Same-Day across UAE
- **Free Delivery Threshold:** FREE on orders of AED ${settings.freeDeliveryThreshold} or more (AED ${settings.standardDeliveryFee} below AED ${settings.freeDeliveryThreshold})
- **Payment Methods:** Cash on Delivery (COD), Card on Delivery (Visa/Mastercard), Apple Pay
- **Product Authenticity:** 100% Factory-Sealed Cartons (1 Carton = 10 Packs = 200 Cigarettes)
- **Legal Compliance:** Strictly 18+ Adult Smokers Only (UAE Federal Law No. 15 of 2009)
- **Live Price & Stock Index:** ${products.length} products below, kept in sync with the live catalog (prices in AED per carton)

${sections.join("\n\n")}

## Key Site Pages
- Homepage: https://dubaicigeretteshop.ae/
- Order Tracking: https://dubaicigeretteshop.ae/track
- Sitemap: https://dubaicigeretteshop.ae/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
