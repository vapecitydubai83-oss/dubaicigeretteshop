import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartonPriceTable } from "@/components/carton-price-table";
import { H1, H2, Lead, SeoPage, type Faq } from "@/components/seo-page";
import { brandGroups, priceRange } from "@/lib/brands";
import { formatWhatsAppNumberForLink } from "@/lib/catalog-data";
import { areaBySlug, areaTime, DELIVERY_AREAS } from "@/lib/delivery-areas";
import { clip, readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic"; // delivery time, fees and prices come from live settings and catalog

type Props = { params: Promise<{ area: string }> };

const mins = (t: string) => t.replace(/\s*mins?$/i, " minutes");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = areaBySlug((await params).area);
  if (!area) return { title: "Area not found" };
  const { settings } = await readSeoStore();
  const title = clip(`Cigarette Delivery ${area.name}`, 55);
  const description = clip(
    `Cigarettes, IQOS TEREA and vapes delivered to ${area.places.slice(0, 3).join(", ")} in ${mins(areaTime(area, settings.expressDeliveryMinutes))}. Live carton prices, order on WhatsApp.`,
    158
  );
  const url = `/delivery/${area.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { type: "website", title, description, url } };
}

export default async function AreaPage({ params }: Props) {
  const area = areaBySlug((await params).area);
  if (!area) notFound();
  const { products, settings } = await readSeoStore();
  const time = mins(areaTime(area, settings.expressDeliveryMinutes));
  const cigs = products.filter((p) => p.category === "cigarettes" && p.cartonPrice > 0);
  const brands = brandGroups(cigs).sort((a, b) => a.name.localeCompare(b.name));
  const prices = cigs.map((p) => p.cartonPrice);
  const wa = `https://wa.me/${formatWhatsAppNumberForLink(settings.whatsappNumber)}`;
  const fee = `Delivery is free on orders of AED ${settings.freeDeliveryThreshold} or more; below that the rider fee is AED ${settings.standardDeliveryFee}.`;

  const faqs: Faq[] = [
    { q: `How long does cigarette delivery to ${area.name} take?`, a: `Express riders reach ${area.name} in about ${time} after the order is confirmed on WhatsApp.` },
    { q: area.question, a: area.answer },
    { q: `How much does delivery to ${area.name} cost?`, a: fee },
  ];
  const jsonLd = [
    {
      "@type": "Service",
      name: `Cigarette delivery in ${area.name}`,
      serviceType: "Tobacco and nicotine product delivery",
      provider: { "@id": `${SITE_BASE_URL}/#organization` },
      areaServed: area.places.map((name) => ({ "@type": "Place", name, containedInPlace: { "@type": "AdministrativeArea", name: area.emirate } })),
      url: `${SITE_BASE_URL}/delivery/${area.slug}`,
    },
  ];
  const others = DELIVERY_AREAS.filter((a) => a.slug !== area.slug);

  return (
    <SeoPage crumbs={[{ name: "Delivery", href: "/delivery" }, { name: area.name }]} faqs={faqs} jsonLd={jsonLd}>
      <H1>Cigarette Delivery in {area.name}</H1>
      <Lead>{area.intro}</Lead>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold uppercase text-zinc-500">Delivery time</div>
          <div className="mt-1 text-lg font-extrabold text-[#0A2F42]">{time}</div>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold uppercase text-zinc-500">Free delivery from</div>
          <div className="mt-1 text-lg font-extrabold text-[#0A2F42]">AED {settings.freeDeliveryThreshold}</div>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
          <div className="text-xs font-bold uppercase text-zinc-500">Carton prices</div>
          <div className="mt-1 text-lg font-extrabold text-[#0A2F42]">{prices.length ? priceRange(Math.min(...prices), Math.max(...prices)) : "—"}</div>
        </div>
      </div>

      <H2>Where we deliver in {area.name}</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {area.places.map((p) => (
          <li key={p} className="rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold text-[#0A2F42]">{p}</li>
        ))}
      </ul>

      <H2>Your address</H2>
      <p className="mt-4 text-sm sm:text-base text-zinc-700 leading-relaxed max-w-3xl">{area.address}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <a href={wa} className="inline-block rounded-xl bg-[#0A2F42] px-5 py-3 text-sm font-extrabold text-white">
          Order on WhatsApp {settings.supportPhoneDisplay}
        </a>
        <Link href="/delivery" className="inline-block rounded-xl bg-white border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#0A2F42]">
          All delivery areas
        </Link>
      </div>

      <H2>Carton prices</H2>
      <p className="mt-2 text-sm text-zinc-600">The same live prices as every other area. {fee}</p>
      <CartonPriceTable brands={brands} caption={`Cigarette carton prices for delivery in ${area.name}`} />

      <H2>Other delivery areas</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {others.map((a) => (
          <li key={a.slug}>
            <Link href={`/delivery/${a.slug}`} className="inline-block rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold text-[#0A2F42] hover:border-[#0A2F42]/50">
              {a.name}
            </Link>
          </li>
        ))}
      </ul>
    </SeoPage>
  );
}
