import type { Metadata } from "next";
import { clip, productOgImages, readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic";

const CATEGORY_SEO: Record<string, { title: string; desc: string }> = {
  cigarettes: {
    title: "Cigarettes in Dubai | Dubai Cigarette Shop",
    desc: "Marlboro, Dunhill, Davidoff, ESSE, Winston & more — factory-sealed master cartons delivered in 45–75 min across Dubai & Sharjah — courier to all Emirates. Order on WhatsApp.",
  },
  "iqos-terea": {
    title: "IQOS & TEREA Dubai – Prices & Delivery | Dubai Cigarette Shop",
    desc: "Genuine IQOS ILUMA devices and TEREA sticks — Japan, Kazakhstan, Italy and UAE editions, delivered across Dubai & Sharjah in 45–75 min, courier to all Emirates.",
  },
  vapes: {
    title: "Disposable Vapes Dubai – Prices & Delivery | Dubai Cigarette Shop",
    desc: "Elf Bar, Vozol, Tugboat, HQD, Fummo, OXVA and more — genuine disposable vapes and pod kits delivered across Dubai & Sharjah in 45–75 min, courier to all Emirates.",
  },
  "e-liquid": {
    title: "E-Liquids in Dubai | Dubai Cigarette Shop",
    desc: "Freebase and salt-nic e-liquids — Nasty, Ruthless, Pod Salt, Tokyo, Dr Vapes and more, delivered across Dubai & Sharjah in 45–75 min, courier to all Emirates.",
  },
  "nicotine-pouches": {
    title: "Nicotine Pouches Dubai – VELO & More | Dubai Cigarette Shop",
    desc: "Tobacco-free nicotine pouches — VELO, White Fox, Killa and Pablo in every strength, delivered across Dubai & Sharjah in 45–75 min, courier to all Emirates.",
  },
  "hookah-shisha": {
    title: "Hookah & Shisha Dubai | Dubai Cigarette Shop",
    desc: "Al Fakher shisha molasses, hookah devices and charcoal — 50g, 250g and 1kg sizes delivered across Dubai & Sharjah in 45–75 min, courier to all Emirates.",
  },
  accessories: {
    title: "Vape Accessories & Lighters Dubai | Dubai Cigarette Shop",
    desc: "Vape batteries, chargers, lighters, coils and spare parts — genuine UAE stock delivered across Dubai & Sharjah in 45–75 min, courier to all Emirates.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const seo = CATEGORY_SEO[id];
  if (!seo) {
    return { title: "Category", robots: { index: false, follow: true } };
  }
  const title = clip(seo.title, 64);
  const description = clip(seo.desc, 160);
  const { products } = await readSeoStore();
  const images = productOgImages(products.find((p) => p.category === id));
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/category/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_BASE_URL}/category/${id}`,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seo = CATEGORY_SEO[id];
  if (!seo) return children;
  const { products } = await readSeoStore();
  const items = products.filter((p) => p.category === id);
  const url = `${SITE_BASE_URL}/category/${id}`;
  const name = seo.title.split(" | ")[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name,
        description: seo.desc,
        isPartOf: { "@id": `${SITE_BASE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.slice(0, 60).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_BASE_URL}/product/${p.id}`,
            name: p.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        // product titles come from the admin catalog: escape "<" so no tag can close the script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {children}
    </>
  );
}
