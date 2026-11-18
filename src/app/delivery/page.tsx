import type { Metadata } from "next";
import Link from "next/link";
import { deliveryFacts, H1, H2, Lead, SeoPage } from "@/components/seo-page";
import { CATEGORY_LABEL } from "@/lib/brands";
import { formatWhatsAppNumberForLink } from "@/lib/catalog-data";
import { areaTime, DELIVERY_AREAS, SHARJAH_AJMAN_TIME } from "@/lib/delivery-areas";
import { readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic"; // delivery time and fees come from live settings

const description =
  "Cigarette, IQOS TEREA and vape delivery in Dubai, Sharjah and Ajman, with courier to all Emirates. Areas covered, delivery times, fees and how to order on WhatsApp.";

export const metadata: Metadata = {
  title: "Cigarette Delivery in Dubai: Areas, Times & Fees",
  description,
  alternates: { canonical: "/delivery" },
  openGraph: { type: "website", title: "Cigarette Delivery in Dubai", description, url: "/delivery" },
};

export default async function DeliveryPage() {
  const { settings } = await readSeoStore();
  const wa = `https://wa.me/${formatWhatsAppNumberForLink(settings.whatsappNumber)}`;
  const faqs = settings.faqs.map((f) => ({ q: f.question, a: f.answer }));
  const jsonLd = [
    {
      "@type": "Service",
      name: "Cigarette delivery in Dubai",
      serviceType: "Tobacco and nicotine product delivery",
      provider: { "@id": `${SITE_BASE_URL}/#organization` },
      areaServed: ["Dubai", "Sharjah", "Ajman", "Abu Dhabi", "Al Ain", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map((name) => ({
        "@type": "AdministrativeArea",
        name,
      })),
      url: `${SITE_BASE_URL}/delivery`,
    },
  ];

  return (
    <SeoPage crumbs={[{ name: "Delivery" }]} faqs={faqs} jsonLd={jsonLd}>
      <H1>Cigarette Delivery in Dubai and the UAE</H1>
      <Lead>
        Dubai Cigerette Shop delivers cigarette cartons, IQOS TEREA, vapes and nicotine pouches to your door. {deliveryFacts(settings)}
      </Lead>

      <H2>Delivery times and fees</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#0A2F42] text-white text-left text-xs uppercase tracking-wide">
            <tr>
              <th scope="col" className="p-3">Where</th>
              <th scope="col" className="p-3">How</th>
              <th scope="col" className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-zinc-100">
              <td className="p-3 font-bold text-[#0A2F42]">Dubai</td>
              <td className="p-3">Express rider</td>
              <td className="p-3">{settings.expressDeliveryMinutes}</td>
            </tr>
            <tr className="border-t border-zinc-100">
              <td className="p-3 font-bold text-[#0A2F42]">Sharjah and Ajman</td>
              <td className="p-3">Express rider</td>
              <td className="p-3">{SHARJAH_AJMAN_TIME}</td>
            </tr>
            <tr className="border-t border-zinc-100">
              <td className="p-3 font-bold text-[#0A2F42]">Abu Dhabi, Al Ain, RAK, Fujairah, UAQ</td>
              <td className="p-3">Courier</td>
              <td className="p-3">Next day</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-zinc-700">
        Express delivery is free on orders of AED {settings.freeDeliveryThreshold} or more. Below that the rider fee is AED{" "}
        {settings.standardDeliveryFee}.
      </p>

      <H2>Areas we deliver to</H2>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-700">
        {DELIVERY_AREAS.map((a) => (
          <li key={a.slug}>
            <Link href={`/delivery/${a.slug}`} className="block rounded-xl bg-white border border-zinc-200 px-4 py-2.5 font-bold text-[#0A2F42] hover:border-[#0A2F42]/50">
              {a.name} <span className="font-normal text-zinc-500">· {areaTime(a, settings.expressDeliveryMinutes)}</span>
            </Link>
          </li>
        ))}
        <li className="rounded-xl bg-white border border-zinc-200 px-4 py-2.5">Abu Dhabi, Al Ain, RAK, Fujairah and UAQ · courier, next day</li>
      </ul>

      <H2>How to order</H2>
      <ol className="mt-4 list-decimal pl-6 space-y-2 text-sm sm:text-base text-zinc-700">
        <li>Pick your products in the shop and add them to the tray, or open any product and tap Order on WhatsApp.</li>
        <li>Send the order on WhatsApp with your building name or a location pin. No account is needed.</li>
        <li>The rider brings the sealed products. You check them, then pay by cash or card on delivery.</li>
        <li>
          Follow the order on the <Link href="/track" className="font-bold text-[#0A2F42] underline">tracking page</Link>.
        </li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-2">
        <a href={wa} className="inline-block rounded-xl bg-[#0A2F42] px-5 py-3 text-sm font-extrabold text-white">
          Order on WhatsApp {settings.supportPhoneDisplay}
        </a>
        <Link href="/cigarette-prices-dubai" className="inline-block rounded-xl bg-white border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#0A2F42]">
          See cigarette prices
        </Link>
      </div>

      <H2>What we deliver</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {Object.entries(CATEGORY_LABEL).map(([id, label]) => (
          <li key={id}>
            <Link href={`/category/${id}`} className="inline-block rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold text-[#0A2F42] hover:border-[#0A2F42]/50">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </SeoPage>
  );
}
