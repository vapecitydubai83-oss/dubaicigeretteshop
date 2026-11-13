import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";
import { SITE_BASE_URL } from "@/lib/seo-meta";

export interface Faq {
  q: string;
  a: string;
}

/** Shell for the server-rendered guide pages (brand, prices, delivery, about): store chrome, breadcrumb,
 *  and the matching BreadcrumbList / FAQPage structured data built from the same props that are shown. */
export function SeoPage({
  crumbs,
  faqs = [],
  jsonLd = [],
  children,
}: {
  crumbs: { name: string; href?: string }[];
  faqs?: Faq[];
  jsonLd?: object[];
  children: React.ReactNode;
}) {
  const graph = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "Home", href: "/" }, ...crumbs].map((c, i, all) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        ...(c.href && i < all.length - 1 ? { item: SITE_BASE_URL + (c.href === "/" ? "" : c.href) } : {}),
      })),
    },
    ...(faqs.length
      ? [{
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }]
      : []),
    ...jsonLd,
  ];
  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <WhatsAppCartDrawer />
      <StoreHeader />
      <script
        type="application/ld+json"
        // text comes from the admin catalog and settings: escape "<" so nothing can close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c"),
        }}
      />
      <main className="max-w-[1100px] mx-auto px-3 sm:px-6 pt-4 pb-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-500 mb-4">
          <Link href="/" className="hover:text-[#0A2F42]">Home</Link>
          {crumbs.map((c, i) => (
            <span key={c.name} className="inline-flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" />
              {c.href && i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-[#0A2F42]">{c.name}</Link>
              ) : (
                <span className="text-[#0A2F42]">{c.name}</span>
              )}
            </span>
          ))}
        </nav>
        {children}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A2F42]">Frequently asked questions</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="rounded-xl bg-white border border-zinc-200 p-4">
                  <summary className="cursor-pointer font-bold text-[#0A2F42]">{f.q}</summary>
                  <p className="mt-2 text-sm text-zinc-700 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <p className="mt-10 text-[11px] text-zinc-500">
          Tobacco and nicotine products are sold to adults aged 18 and over only.
        </p>
      </main>
      <StoreFooter />
    </div>
  );
}

export const H1 = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0A2F42] tracking-tight leading-tight">{children}</h1>
);

export const Lead = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 text-sm sm:text-base text-zinc-700 leading-relaxed max-w-3xl">{children}</p>
);

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 text-xl sm:text-2xl font-extrabold text-[#0A2F42]">{children}</h2>
);

/** The same "how to order" and delivery facts on every guide page, read from live settings. */
export function deliveryFacts(s: { expressDeliveryMinutes: string; freeDeliveryThreshold: number; standardDeliveryFee: number }) {
  const mins = s.expressDeliveryMinutes.replace(/\s*mins?$/i, " minutes");
  return `Orders are placed on WhatsApp and delivered in ${mins} across Dubai, Sharjah and Ajman, with next-day courier to Abu Dhabi and the other Emirates. Express delivery is free on orders of AED ${s.freeDeliveryThreshold} or more and AED ${s.standardDeliveryFee} below that.`;
}
