import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { deliveryFacts, H1, H2, Lead, SeoPage, type Faq } from "@/components/seo-page";
import { aed, brandGroups, CATEGORY_LABEL, priceRange } from "@/lib/brands";
import { clip, productOgImages, readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic"; // prices and stock come from the live admin catalog

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const { products, settings } = await readSeoStore();
  const groups = brandGroups(products);
  const brand = groups.find((g) => g.slug === slug);
  return { brand, groups, settings };
}

// "Marlboro Cigarettes", "IQOS TEREA", "VELO & White Fox Nicotine Pouches"
const fullName = (name: string, category: string) =>
  category === "cigarettes" ? `${name} Cigarettes` : category === "nicotine-pouches" ? `${name} Nicotine Pouches` : name;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, settings } = await load((await params).slug);
  if (!brand) return { title: "Brand not found" };
  const name = fullName(brand.name, brand.category);
  const title = clip(`${name} Dubai: Prices from ${aed(brand.min)}`, 48);
  const description = clip(
    `${brand.products.length} ${name} products in Dubai from ${priceRange(brand.min, brand.max)}. Delivered in ${settings.expressDeliveryMinutes.toLowerCase()} across Dubai and Sharjah. Order on WhatsApp.`,
    158
  );
  const images = productOgImages(brand.products.find((p) => p.customImageUrl || p.galleryImages?.length));
  return {
    title,
    description,
    alternates: { canonical: `/brand/${brand.slug}` },
    openGraph: { type: "website", title, description, url: `/brand/${brand.slug}`, images },
  };
}

export default async function BrandPage({ params }: Props) {
  const { brand, groups, settings } = await load((await params).slug);
  if (!brand) notFound();

  const name = fullName(brand.name, brand.category);
  const isCig = brand.category === "cigarettes";
  const unit = isCig ? "carton" : "item";
  const plural = name !== brand.name; // "Marlboro Cigarettes cost", "IQOS TEREA costs"
  const list = brand.products;
  const inStock = list.filter((p) => p.inStock);
  const cheapest = list[0];
  const dearest = list[list.length - 1];
  const delivery = deliveryFacts(settings);
  const related = groups.filter((g) => g.category === brand.category && g.slug !== brand.slug).slice(0, 12);

  const faqs: Faq[] = [
    {
      q: `How much ${plural ? "are" : "is"} ${name} in Dubai?`,
      a:
        list.length === 1
          ? `${cheapest.title} costs ${aed(cheapest.cartonPrice)} per ${unit} at Dubai Cigerette Shop.`
          : `${name} ${plural ? "cost" : "costs"} ${priceRange(brand.min, brand.max)} per ${unit} at Dubai Cigerette Shop. The lowest priced is ${cheapest.title} at ${aed(cheapest.cartonPrice)} and the highest is ${dearest.title} at ${aed(dearest.cartonPrice)}.`,
    },
    {
      q: `Which ${name} products can I order in Dubai?`,
      a: `${list.length} ${list.length === 1 ? "product is" : "products are"} listed: ${list.map((p) => p.title).join(", ")}. ${inStock.length} of ${list.length} ${inStock.length === 1 ? "is" : "are"} in stock right now.`,
    },
    { q: `How fast is ${brand.name} delivered in Dubai?`, a: delivery },
    ...settings.faqs.filter((f) => /whatsapp order|payment/i.test(f.question)).slice(0, 1).map((f) => ({ q: f.question, a: f.answer })),
  ];

  const url = `${SITE_BASE_URL}/brand/${brand.slug}`;
  const jsonLd = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: `${name} in Dubai`,
      isPartOf: { "@id": `${SITE_BASE_URL}/#website` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: list.length,
        itemListElement: list.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_BASE_URL}/product/${p.id}`,
          name: p.title,
        })),
      },
    },
  ];

  return (
    <SeoPage
      crumbs={[
        { name: CATEGORY_LABEL[brand.category] ?? "Shop", href: `/category/${brand.category}` },
        { name: brand.name },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
    >
      <H1>{name} in Dubai: Prices and Delivery</H1>
      <Lead>
        Dubai Cigerette Shop lists {list.length} {name} {list.length === 1 ? "product" : "products"}, priced{" "}
        {list.length === 1 ? `at ${aed(brand.min)}` : `from ${priceRange(brand.min, brand.max)}`} per {unit}. {delivery}
      </Lead>

      <H2>{brand.name} price list</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#0A2F42] text-white text-left text-xs uppercase tracking-wide">
            <tr>
              <th scope="col" className="p-3">Product</th>
              <th scope="col" className="p-3">Pack</th>
              {isCig && <th scope="col" className="p-3">Strength</th>}
              <th scope="col" className="p-3 whitespace-nowrap">Price ({unit})</th>
              {isCig && <th scope="col" className="p-3 whitespace-nowrap">5 cartons</th>}
              <th scope="col" className="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100">
                <td className="p-3">
                  <Link href={`/product/${p.id}`} className="font-bold text-[#0A2F42] underline">{p.title}</Link>
                </td>
                <td className="p-3 text-zinc-600">{p.format}</td>
                {isCig && <td className="p-3 text-zinc-600">{p.strength}</td>}
                <td className="p-3 font-bold whitespace-nowrap">{aed(p.cartonPrice)}</td>
                {isCig && <td className="p-3 whitespace-nowrap">{aed(p.fiveCartonPrice)}</td>}
                <td className="p-3">{p.inStock ? "In stock" : "Out of stock"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Order {brand.name}</H2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {related.length > 0 && (
        <>
          <H2>More {CATEGORY_LABEL[brand.category]?.toLowerCase()} brands</H2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/brand/${g.slug}`}
                  className="inline-block rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold text-[#0A2F42] hover:border-[#0A2F42]/50"
                >
                  {g.name} · from {aed(g.min)}
                </Link>
              </li>
            ))}
            {isCig && (
              <li>
                <Link href="/cigarette-prices-dubai" className="inline-block rounded-full bg-[#0A2F42] px-3 py-1.5 text-xs font-bold text-white">
                  All cigarette prices
                </Link>
              </li>
            )}
          </ul>
        </>
      )}
    </SeoPage>
  );
}
