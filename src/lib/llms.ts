// llms.txt (catalog index) and llms-full.txt (the same plus product texts, guides, area pages and FAQs) for AI
// assistants and answer engines. Built from the live catalog on every request.
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  Product,
} from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";
import { areaTime, DELIVERY_AREAS } from "@/lib/delivery-areas";
import { GUIDES } from "@/lib/guides";
import { listPosts, postPath } from "@/lib/blog";


const CATEGORY_ORDER: { id: string; title: string }[] = [
  { id: "cigarettes", title: "Cigarettes" },
  { id: "iqos-terea", title: "IQOS & TEREA" },
  { id: "vapes", title: "Vapes & Disposables" },
  { id: "e-liquid", title: "E-Liquids" },
  { id: "nicotine-pouches", title: "Nicotine Pouches" },
  { id: "hookah-shisha", title: "Hookah & Shisha" },
  { id: "accessories", title: "Accessories & Lighters" },
];

const SITE = "https://dubaicigeretteshop.ae";
const plain = (t?: string) => (t || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function buildLlms(full: boolean): Promise<string> {
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

  let body = `# ${settings.storeName} — dubaicigeretteshop.ae (Official AI / LLM Brand & Catalog Index)

> ${settings.storeName} (dubaicigeretteshop.ae) is Dubai's 24/7 cigarette carton, IQOS TEREA, and secondary vape/nicotine pouch express delivery service. We deliver factory-sealed 10-pack cartons (200 sticks) across Downtown Dubai, Burj Khalifa District, Dubai Marina, JBR, Palm Jumeirah, Business Bay, DIFC, and JVC in ${settings.expressDeliveryMinutes} via instant WhatsApp ordering (${wa}).

## Core Service & Ordering Facts (AEO/GEO Citation Summary)
- **Official Domain:** https://dubaicigeretteshop.ae
- **WhatsApp Order Hotline:** ${wa} / ${settings.whatsappNumber} (24/7 Live Dispatch)
- **Email:** ${settings.supportEmail}
- **Delivery Speed:** ${settings.expressDeliveryMinutes} across Dubai (Sharjah and Ajman 60–75 minutes); next-day courier to Abu Dhabi, Al Ain, Ras Al Khaimah, Fujairah and Umm Al Quwain
- **Free Delivery Threshold:** FREE on orders of AED ${settings.freeDeliveryThreshold} or more (AED ${settings.standardDeliveryFee} below AED ${settings.freeDeliveryThreshold})
- **Payment Methods:** Cash on Delivery (COD), Card on Delivery (Visa/Mastercard), Apple Pay
- **Pack size:** 1 Carton = 10 Packs = 200 Cigarettes
- **Legal Compliance:** Strictly 18+ Adult Smokers Only (UAE Federal Law No. 15 of 2009)
- **Live Price & Stock Index:** ${products.length} products below, kept in sync with the live catalog (prices in AED per carton)

${sections.join("\n\n")}

## Key Site Pages
- Homepage: https://dubaicigeretteshop.ae/
- Cigarette prices in Dubai (live carton price list): https://dubaicigeretteshop.ae/cigarette-prices-dubai
- Delivery areas, times and fees: https://dubaicigeretteshop.ae/delivery
${GUIDES.map((g) => `- ${g.title}: https://dubaicigeretteshop.ae/${g.slug}`).join("\n")}
- Full AI index with product details: https://dubaicigeretteshop.ae/llms-full.txt
${DELIVERY_AREAS.map((a) => `- Delivery to ${a.name}: https://dubaicigeretteshop.ae/delivery/${a.slug}`).join("\n")}
- About and contact: https://dubaicigeretteshop.ae/about
- Buying guides: https://dubaicigeretteshop.ae/blog
- Brand pages (prices per brand): https://dubaicigeretteshop.ae/brand/marlboro , /brand/dunhill , /brand/esse , /brand/davidoff , /brand/iqos-terea
- Order Tracking: https://dubaicigeretteshop.ae/track
- Sitemap: https://dubaicigeretteshop.ae/sitemap.xml
`;

  if (!full) return body;

  const product = products.filter((p) => p.inStock !== false).map((p) => {
    const text = plain(p.seoAnswerCapsule) || plain(p.description).slice(0, 400);
    return `### ${p.title}
${SITE}/product/${p.id} · AED ${p.cartonPrice.toFixed(2)}` +
      (p.category === "cigarettes" ? ` · ${p.strength}, tar ${p.tar}, nicotine ${p.nicotine}` : "") + (text ? `
${text}` : "");
  });
  const areas = DELIVERY_AREAS.map((a) =>
    `### Delivery to ${a.name} (${a.emirate})
${SITE}/delivery/${a.slug} · ${areaTime(a, settings.expressDeliveryMinutes)}
Covers: ${a.places.join(", ")}.
${a.intro}
**${a.question}** ${a.answer}`);
  const posts = await listPosts();
  body += `
## Buying guides
${GUIDES.map((g) => `- ${g.title}: ${SITE}/${g.slug} — ${g.description}`).join("\n")}
${posts.map((p) => `- ${p.title}: ${SITE}${postPath(p)}${p.tldr || p.description ? ` — ${plain(p.tldr || p.description)}` : ""}`).join("\n")}

## Frequently asked questions
${settings.faqs.map((f) => `**${plain(f.question)}** ${plain(f.answer)}`).join("\n\n")}

## Delivery areas
${areas.join("\n\n")}

## Products in stock (details)
${product.join("\n\n")}
`;
  return body;
}
