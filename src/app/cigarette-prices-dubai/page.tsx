import type { Metadata } from "next";
import Link from "next/link";
import { CartonPriceTable } from "@/components/carton-price-table";
import { deliveryFacts, H1, H2, Lead, SeoPage, type Faq } from "@/components/seo-page";
import { aed, brandGroups, priceRange } from "@/lib/brands";
import { readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic"; // always the live catalog prices

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear();
  const description =
    "Carton prices for every cigarette brand we stock in Dubai: Marlboro, Dunhill, Davidoff, ESSE, Winston, Parliament and more, updated from the live catalog.";
  return {
    title: `Cigarette Prices in Dubai ${year}: Full Carton List`,
    description,
    alternates: { canonical: "/cigarette-prices-dubai" },
    openGraph: { type: "website", title: `Cigarette Prices in Dubai ${year}`, description, url: "/cigarette-prices-dubai" },
  };
}

export default async function PricesPage() {
  const { products, settings } = await readSeoStore();
  const cigs = products.filter((p) => p.category === "cigarettes" && p.cartonPrice > 0);
  const brands = brandGroups(cigs).sort((a, b) => a.name.localeCompare(b.name));
  const sorted = [...cigs].sort((a, b) => a.cartonPrice - b.cartonPrice);
  const cheapest = sorted[0];
  const dearest = sorted[sorted.length - 1];
  const brand = (n: string) => brands.find((b) => b.name === n);

  const faqs: Faq[] = cheapest
    ? [
        {
          q: "How much is a carton of cigarettes in Dubai?",
          a: `At Dubai Cigerette Shop a carton costs ${priceRange(cheapest.cartonPrice, dearest.cartonPrice)}, depending on the brand. The lowest priced carton is ${cheapest.title} at ${aed(cheapest.cartonPrice)} and the highest is ${dearest.title} at ${aed(dearest.cartonPrice)}.`,
        },
        {
          q: "What is the cheapest cigarette carton in Dubai?",
          a: `The lowest priced cartons in our catalog today are ${sorted.slice(0, 3).map((p) => `${p.title} (${aed(p.cartonPrice)})`).join(", ")}.`,
        },
        ...["Marlboro", "Dunhill", "ESSE"].filter(brand).map((n) => ({
          q: `How much is a carton of ${n} in Dubai?`,
          a: `${n} cartons cost ${priceRange(brand(n)!.min, brand(n)!.max)} at Dubai Cigerette Shop, across ${brand(n)!.products.length} variants.`,
        })),
        { q: "Which cigarette brands are sold in Dubai?", a: `We stock ${brands.length} cigarette brands: ${brands.map((b) => b.name).join(", ")}.` },
        { q: "How is a carton delivered in Dubai?", a: deliveryFacts(settings) },
      ]
    : [];

  const jsonLd = [
    {
      "@type": "ItemList",
      name: "Cigarette carton prices in Dubai",
      numberOfItems: cigs.length,
      itemListElement: brands.flatMap((b) => b.products).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_BASE_URL}/product/${p.id}`,
        name: `${p.title}: ${aed(p.cartonPrice)}`,
      })),
    },
  ];

  return (
    <SeoPage crumbs={[{ name: "Cigarettes", href: "/category/cigarettes" }, { name: "Cigarette prices in Dubai" }]} faqs={faqs} jsonLd={jsonLd}>
      <H1>Cigarette Prices in Dubai</H1>
      <Lead>
        {cheapest
          ? `A carton of cigarettes (10 packs, 200 sticks) costs ${priceRange(cheapest.cartonPrice, dearest.cartonPrice)} at Dubai Cigerette Shop. This list covers ${cigs.length} cartons from ${brands.length} brands and is read from our live catalog, so the prices are the ones you pay today, ${today()}.`
          : "No cigarette cartons are listed right now."}
      </Lead>

      <H2>Price by brand</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link href={`/brand/${b.slug}`} className="inline-block rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold text-[#0A2F42] hover:border-[#0A2F42]/50">
              {b.name} · {priceRange(b.min, b.max)}
            </Link>
          </li>
        ))}
      </ul>

      <H2>Full carton price list</H2>
      <CartonPriceTable brands={brands} caption={`Cigarette carton prices in Dubai by brand, ${today()}`} />
      <p className="mt-3 text-xs text-zinc-500">
        Prices are this shop&apos;s delivery prices in UAE dirhams. Airport duty free and supermarket prices differ.
      </p>
    </SeoPage>
  );
}
