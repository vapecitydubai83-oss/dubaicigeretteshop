"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck2,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Table2,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { DUBAI_AREAS, formatWhatsAppNumberForLink } from "@/lib/catalog-data";

export function SeoAeoGeoSection({
  isLightTheme = true,
}: {
  isLightTheme?: boolean;
}) {
  const { products, settings, triggerSingleClickWhatsApp } = useStore();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Build Rich JSON-LD Schema.org @graph for Google Search, Google AI Overviews, ChatGPT Shopping, Perplexity & Claude
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "Store", "LocalBusiness"],
        "@id": "https://dubaicigeretteshop.ae/#organization",
        name: settings.storeName,
        url: "https://dubaicigeretteshop.ae",
        telephone: `+${settings.whatsappNumber}`,
        email: settings.supportEmail,
        priceRange: "AED 75 - AED 225",
        currenciesAccepted: "AED",
        paymentAccepted: "Cash on Delivery, Card on Delivery, Apple Pay",
        openingHours: "Mo-Su 00:00-23:59",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Sheikh Mohammed bin Rashid Blvd, Downtown Dubai",
          addressLocality: "Dubai",
          addressRegion: "Dubai",
          addressCountry: "AE",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 25.1972,
          longitude: 55.2744,
        },
        areaServed: DUBAI_AREAS.map((area) => ({
          "@type": "City",
          name: area,
        })),
        contactPoint: {
          "@type": "ContactPoint",
          telephone: `+${settings.whatsappNumber}`,
          email: settings.supportEmail,
          contactType: "customer service",
          availableLanguage: ["English", "Arabic", "Russian"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://dubaicigeretteshop.ae/#website",
        url: "https://dubaicigeretteshop.ae",
        name: settings.seoMetaTitle,
        description: settings.seoMetaDescription,
        publisher: {
          "@id": "https://dubaicigeretteshop.ae/#organization",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://dubaicigeretteshop.ae/#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://dubaicigeretteshop.ae/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Cigarettes in Dubai",
            item: "https://dubaicigeretteshop.ae/#cigarettes-dubai",
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Duty-Free Cigarette Cartons & Heated Tobacco in Dubai",
        numberOfItems: products.length,
        itemListElement: products.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Product",
            sku: p.sku,
            mpn: p.sku,
            name: `${p.title} (${p.format})`,
            description: p.description,
            brand: {
              "@type": "Brand",
              name: p.brand,
            },
            category: p.category,
            additionalProperty: [
              {
                "@type": "PropertyValue",
                name: "Tar Content",
                value: p.tar,
              },
              {
                "@type": "PropertyValue",
                name: "Nicotine Content",
                value: p.nicotine,
              },
              {
                "@type": "PropertyValue",
                name: "Origin",
                value: p.origin,
              },
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: p.rating.toString(),
              reviewCount: p.reviewsCount.toString(),
              bestRating: "5",
              worstRating: "1",
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "AED",
              price: p.cartonPrice.toFixed(2),
              availability: p.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: {
                "@id": "https://dubaicigeretteshop.ae/#organization",
              },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: p.cartonPrice >= settings.freeDeliveryThreshold ? "0.00" : settings.standardDeliveryFee.toFixed(2),
                  currency: "AED",
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  addressCountry: "AE",
                },
              },
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "AE",
                returnPolicyCategory:
                  "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn",
              },
            },
          },
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: (settings.faqs || []).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      },
    ],
  };

  return (
    <section
      id="dubai-cigarette-guide"
      aria-label="Dubai Cigarette Buying Guide, Price Comparison Matrix & FAQ"
      className="max-w-[1280px] mx-auto px-4 py-8 space-y-10"
    >
      {/* Inject JSON-LD Structured Data for Google & AI Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaGraph).replace(/</g, "\\u003c"),
        }}
      />

      {/* ===================================================================
          1. AEO ANSWER CAPSULE & GEO CITATION AUTHORITY BLOCK
             (Designed for ChatGPT, Perplexity, Google AI Overviews & Claude)
         =================================================================== */}
      <article
        className={`rounded-2xl border p-6 sm:p-8 shadow-sm ${
          isLightTheme
            ? "bg-white border-zinc-200 text-zinc-900"
            : "bg-[#11131A] border-white/10 text-zinc-100"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-current/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2F42] text-[#F4B143] text-xs font-mono uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Dubai Duty-Free Tobacco Authority Guide (2026)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono opacity-70">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Updated Daily • Live AED Stock
            </span>
            <span className="inline-flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-[#F4B143]" />
              UAE ESMA &amp; Duty-Free Verified
            </span>
          </div>
        </div>

        {/* Direct 50-Word Answer Capsule (AEO Best Practice) */}
        <div className="mt-5">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Where to Buy Authentic Cigarettes Online in Dubai with 45-Minute Express Delivery?
          </h2>
          <p
            className={`mt-2.5 text-sm sm:text-base leading-relaxed font-medium p-4 rounded-xl border-l-4 border-[#F4B143] ${
              isLightTheme
                ? "bg-[#FDF9EE] text-zinc-800"
                : "bg-white/[0.03] text-zinc-200"
            }`}
          >
            {settings.aeoAnswerCapsule}
          </p>
        </div>

        {/* Key GEO Statistics & E-E-A-T Citation Signals */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-xl border ${
              isLightTheme
                ? "bg-zinc-50 border-zinc-200"
                : "bg-black/40 border-white/10"
            }`}
          >
            <div className="text-xs font-mono uppercase text-[#F4B143] font-bold">
              01 • Carton Format
            </div>
            <div className="text-lg font-extrabold mt-1">
              10 Packs / 200 Sticks
            </div>
            <p className="text-xs opacity-70 mt-1">
              Factory-sealed master cartons with official Swiss, German, or Korean duty-free foil locks.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isLightTheme
                ? "bg-zinc-50 border-zinc-200"
                : "bg-black/40 border-white/10"
            }`}
          >
            <div className="text-xs font-mono uppercase text-[#25D366] font-bold">
              02 • Dispatch Speed
            </div>
            <div className="text-lg font-extrabold mt-1">
              {settings.expressDeliveryMinutes} Rider ETA
            </div>
            <p className="text-xs opacity-70 mt-1">
              Direct temperature-controlled bike &amp; car fleet stationed in Downtown Dubai &amp; Marina.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isLightTheme
                ? "bg-zinc-50 border-zinc-200"
                : "bg-black/40 border-white/10"
            }`}
          >
            <div className="text-xs font-mono uppercase text-[#F4B143] font-bold">
              03 • Price Transparency
            </div>
            <div className="text-lg font-extrabold mt-1">
              AED 75 – AED 225
            </div>
            <p className="text-xs opacity-70 mt-1">
              Up to 28% savings vs. single retail convenience packs, plus VIP 5-carton bulk discounts.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isLightTheme
                ? "bg-zinc-50 border-zinc-200"
                : "bg-black/40 border-white/10"
            }`}
          >
            <div className="text-xs font-mono uppercase text-emerald-500 font-bold">
              04 • Zero-Friction Payment
            </div>
            <div className="text-lg font-extrabold mt-1">
              Inspect Then Pay
            </div>
            <p className="text-xs opacity-70 mt-1">
              Verify hologram seals on arrival before paying via Cash, Visa/Mastercard, or Apple Pay.
            </p>
          </div>
        </div>
      </article>

      {/* ===================================================================
          2. SEMANTIC HTML PRICE & SPEC COMPARISON MATRIX TABLE
             (High Citation Weight for "X vs Y" & "Cigarette Prices in Dubai" Queries)
         =================================================================== */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 shadow-sm overflow-hidden ${
          isLightTheme
            ? "bg-white border-zinc-200 text-zinc-900"
            : "bg-[#11131A] border-white/10 text-zinc-100"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#F4B143] font-bold">
              <Table2 className="w-4 h-4" />
              2026 DUBAI CIGARETTE CARTON PRICE &amp; TELEMETRY INDEX
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold mt-1">
              Compare Cigarette Carton Prices, Tar &amp; Nicotine Specs in Dubai (AED)
            </h3>
          </div>
          <span className="text-xs font-mono opacity-65">
            1 Carton = 10 Packs (200 Cigarettes) • Free Delivery Over AED{" "}
            {settings.freeDeliveryThreshold}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr
                className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                  isLightTheme
                    ? "bg-[#0A2F42] text-white border-zinc-300"
                    : "bg-white/10 text-[#F4B143] border-white/15"
                }`}
              >
                <th className="py-3 px-4 rounded-tl-lg">Product &amp; Brand</th>
                <th className="py-3 px-3">Flavor / Format</th>
                <th className="py-3 px-3">Tar / Nicotine</th>
                <th className="py-3 px-3">Origin</th>
                <th className="py-3 px-3">1 Carton (10Pk)</th>
                <th className="py-3 px-3">5 Cartons VIP</th>
                <th className="py-3 px-4 rounded-tr-lg text-right">
                  Express WhatsApp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={
                    isLightTheme ? "hover:bg-amber-50/50" : "hover:bg-white/5"
                  }
                >
                  <td className="py-3 px-4 font-bold">
                    <div>{p.title}</div>
                    <span className="text-[11px] font-mono opacity-60">
                      SKU: {p.sku}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium">{p.flavor}</span>
                    <div className="text-[11px] opacity-65">{p.strength}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">
                    {p.tar} / {p.nicotine}
                  </td>
                  <td className="py-3 px-3 text-xs">{p.origin}</td>
                  <td className="py-3 px-3 font-mono font-extrabold text-[#0A2F42] dark:text-[#F4B143]">
                    د.إ{p.cartonPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    د.إ{p.fiveCartonPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => triggerSingleClickWhatsApp(p, "1-carton")}
                      className="px-3 py-1.5 rounded bg-[#25D366] hover:bg-[#1fb855] text-black font-bold text-xs inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 fill-current" />
                      <span>Order</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================
          3. CONVERSATIONAL FAQ ACCORDION + DUBAI LOCAL SEO COVERAGE ZONES
         =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Structured FAQ for AI Answer Engines */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-6 sm:p-8 shadow-sm ${
            isLightTheme
              ? "bg-white border-zinc-200 text-zinc-900"
              : "bg-[#11131A] border-white/10 text-zinc-100"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F4B143] font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>FREQUENTLY ASKED QUESTIONS (AEO VERIFIED)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold mt-1 mb-5">
            Dubai Cigarette Delivery, Authenticity &amp; Pricing FAQs
          </h3>

          <div className="space-y-3">
            {(settings.faqs || []).map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-colors ${
                    isLightTheme
                      ? "border-zinc-200 bg-zinc-50/70"
                      : "border-white/10 bg-black/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 font-bold text-sm sm:text-base"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-[#F4B143]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm leading-relaxed opacity-85 border-t border-current/10 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Local SEO Dubai Service Districts & Trust Signals */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between ${
            isLightTheme
              ? "bg-[#0A2F42] text-white border-[#0A2F42]"
              : "bg-[#0D1520] text-white border-white/10"
          }`}
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4B143]/20 text-[#F4B143] text-xs font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>LOCAL GEO COVERAGE ACROSS DUBAI &amp; UAE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              45–75 Min Express Zones + UAE-Wide Courier
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Express riders (45–75 min) deliver sealed cartons to towers, hotels
              and villas across Dubai, Sharjah & Ajman. Abu Dhabi, Al Ain, RAK,
              Fujairah & UAQ ship next-day by courier:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {DUBAI_AREAS.map((area) => (
                <li
                  key={area}
                  className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span className="truncate">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#F4B143]" />
                <span>
                  24/7 WhatsApp: {settings.supportPhoneDisplay || "055 302 0429"}
                </span>
              </span>
              {settings.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="flex items-center gap-2 hover:text-[#F4B143] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#F4B143]" />
                  <span>{settings.supportEmail}</span>
                </a>
              )}
            </div>
            <a
              href={`https://wa.me/${formatWhatsAppNumberForLink(
                settings.whatsappNumber
              )}?text=${encodeURIComponent(
                `Hello ${settings.storeName}! Please share today's duty-free cigarette carton menu for my Dubai location.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs inline-flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Chat with Dubai Concierge</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
