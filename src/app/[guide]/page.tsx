import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartonPriceTable } from "@/components/carton-price-table";
import { deliveryFacts, H1, H2, Lead, SeoPage } from "@/components/seo-page";
import { brandGroups } from "@/lib/brands";
import { GUIDES, guideBySlug } from "@/lib/guides";
import { readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic"; // live catalog prices
export const dynamicParams = false; // only the guides below; anything else 404s
export const generateStaticParams = () => GUIDES.map((g) => ({ guide: g.slug }));

type Props = { params: Promise<{ guide: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).guide);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/${g.slug}` },
    openGraph: { type: "website", title: g.title, description: g.description, url: `/${g.slug}` },
  };
}

export default async function GuidePage({ params }: Props) {
  const g = guideBySlug((await params).guide);
  if (!g) notFound();
  const { products, settings } = await readSeoStore();
  const cigs = products.filter((p) => p.category === "cigarettes" && p.cartonPrice > 0 && p.inStock !== false);
  const list = g.pick(cigs);
  const faqs = list.length ? [...g.faqs(list, cigs), { q: "How fast is delivery?", a: deliveryFacts(settings) }] : [];
  const jsonLd = list.length
    ? [{
        "@type": "ItemList",
        name: g.title,
        numberOfItems: list.length,
        itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_BASE_URL}/product/${p.id}`, name: p.title })),
      }]
    : [];

  return (
    <SeoPage crumbs={[{ name: "Cigarettes", href: "/category/cigarettes" }, { name: g.title.split(":")[0] }]} faqs={faqs} jsonLd={jsonLd}>
      <H1>{g.title}</H1>
      <Lead>{list.length ? `${g.lead(list, cigs)} ${deliveryFacts(settings)}` : "None of these are in stock right now. Message us on WhatsApp and we will suggest the nearest alternative."}</Lead>
      {list.length > 0 && (
        <>
          <H2>Carton prices</H2>
          <CartonPriceTable brands={brandGroups(list)} caption={`${g.title.split(":")[0]}: carton prices`} />
        </>
      )}
      <H2>More guides</H2>
      <ul className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
        {[...GUIDES.filter((x) => x.slug !== g.slug).map((x) => ({ href: `/${x.slug}`, name: x.title.split(":")[0] })),
          { href: "/cigarette-prices-dubai", name: "Full cigarette price list" }, { href: "/delivery", name: "Delivery areas and times" }].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-block rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-[#0A2F42] hover:border-[#0A2F42]/50">{l.name}</Link>
          </li>
        ))}
      </ul>
    </SeoPage>
  );
}
