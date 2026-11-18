import type { Metadata } from "next";
import Link from "next/link";
import { deliveryFacts, H1, H2, Lead, SeoPage } from "@/components/seo-page";
import { brandGroups, CATEGORY_LABEL } from "@/lib/brands";
import { formatWhatsAppNumberForLink } from "@/lib/catalog-data";
import { readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic"; // contact details and counts come from live settings and catalog

const description =
  "Who runs Dubai Cigerette Shop, what we sell, how to contact us on WhatsApp, phone or email, our delivery areas, returns and 18+ policy.";

export const metadata: Metadata = {
  title: "About Us & Contact",
  description,
  alternates: { canonical: "/about" },
  openGraph: { type: "website", title: "About Dubai Cigerette Shop", description, url: "/about" },
};

export default async function AboutPage() {
  const { settings, products } = await readSeoStore();
  const wa = `https://wa.me/${formatWhatsAppNumberForLink(settings.whatsappNumber)}`;
  const brands = brandGroups(products);
  const counts = Object.entries(CATEGORY_LABEL)
    .map(([id, label]) => ({ id, label, n: products.filter((p) => p.category === id).length }))
    .filter((c) => c.n > 0);
  const jsonLd = [
    { "@type": "AboutPage", url: `${SITE_BASE_URL}/about`, name: "About Dubai Cigerette Shop", about: { "@id": `${SITE_BASE_URL}/#organization` } },
    { "@type": "ContactPage", url: `${SITE_BASE_URL}/about#contact`, name: "Contact Dubai Cigerette Shop" },
  ];

  return (
    <SeoPage crumbs={[{ name: "About and contact" }]} jsonLd={jsonLd}>
      <H1>About Dubai Cigerette Shop</H1>
      <Lead>
        Dubai Cigerette Shop (dubaicigeretteshop.ae) is an online tobacco shop in Dubai. We list {products.length} products from{" "}
        {brands.length} brands and take orders on WhatsApp, day and night. {deliveryFacts(settings)}
      </Lead>

      <H2>What we sell</H2>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {counts.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.id}`} className="flex items-center justify-between rounded-xl bg-white border border-zinc-200 px-4 py-2.5 font-bold text-[#0A2F42] hover:border-[#0A2F42]/50">
              {c.label}
              <span className="font-mono text-xs text-zinc-500">{c.n} products</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-zinc-700">
        Cigarettes are sold as factory-sealed cartons of 10 packs (200 sticks). See today&apos;s{" "}
        <Link href="/cigarette-prices-dubai" className="font-bold text-[#0A2F42] underline">cigarette prices in Dubai</Link> or read our{" "}
        <Link href="/blog" className="font-bold text-[#0A2F42] underline">buying guides</Link>.
      </p>

      <h2 id="contact" className="mt-10 text-xl sm:text-2xl font-extrabold text-[#0A2F42]">Contact us</h2>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-white border border-zinc-200 px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">WhatsApp and phone</dt>
          <dd className="mt-1 font-bold text-[#0A2F42]">
            <a href={wa} className="underline">{settings.supportPhoneDisplay}</a>
          </dd>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Email</dt>
          <dd className="mt-1 font-bold text-[#0A2F42]">
            <a href={`mailto:${settings.supportEmail}`} className="underline">{settings.supportEmail}</a>
          </dd>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Location</dt>
          <dd className="mt-1 text-zinc-700">{settings.storeAddressText}</dd>
        </div>
        <div className="rounded-xl bg-white border border-zinc-200 px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Order hours</dt>
          <dd className="mt-1 text-zinc-700">24 hours a day, 7 days a week</dd>
        </div>
      </dl>

      <H2>Delivery, returns and age policy</H2>
      <ul className="mt-4 list-disc pl-6 space-y-2 text-sm sm:text-base text-zinc-700">
        <li>
          Areas, times and fees are on the <Link href="/delivery" className="font-bold text-[#0A2F42] underline">delivery page</Link>.
        </li>
        <li>Unopened items can be returned within 7 days. Returns are free: our rider collects the item from you.</li>
        <li>You check the factory seal when the rider arrives, then pay by cash or card on delivery.</li>
        <li>We sell to adults aged 18 and over only.</li>
      </ul>
    </SeoPage>
  );
}
