"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  MapPin,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { useServerProduct } from "@/context/server-product";
import { sameProductId } from "@/lib/product-id";
import { DUBAI_AREAS } from "@/lib/catalog-data";
import { ProductPackArt } from "@/components/product-pack-art";
import { ProductCard } from "@/components/product-card";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";
import { DELIVERY_TIME, RETURN_POLICY } from "@/lib/offer-schema";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id || "";

  const {
    products,
    settings,
    addToCart,
    setIsCartOpen,
    triggerSingleClickWhatsApp,
  } = useStore();

  const serverProduct = useServerProduct();
  // shortcut: the server copy wins until reload, so an admin edit in this tab shows after a refresh.
  const product = useMemo(
    () =>
      serverProduct && sameProductId(serverProduct.id, productId)
        ? serverProduct
        : products.find((p) => sameProductId(p.id, productId)),
    [products, productId, serverProduct]
  );

  const [packTier, setPackTier] = useState<"1-carton" | "5-cartons">(
    "1-carton"
  );
  const [deliveryArea, setDeliveryArea] = useState<string>(DUBAI_AREAS[0]);
  const [justAdded, setJustAdded] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    setActivePhotoIdx(0);
  }, [productId]);

  const allPhotos = useMemo(() => {
    if (!product) return [];
    const list = [
      product.customImageUrl,
      ...(product.galleryImages || []),
    ].filter((u): u is string => Boolean(u && u.trim()));
    return Array.from(new Set(list));
  }, [product]);

  if (!product) {
    if (products.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-400">Loading…</h1>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#0A2F42] text-white text-xs font-bold"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const activePrice =
    packTier === "5-cartons" ? product.fiveCartonPrice : product.cartonPrice;
  const fiveCartonSavings = product.cartonPrice * 5 - product.fiveCartonPrice;

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.brand === product.brand)
    .concat(products.filter((p) => p.id !== product.id && p.brand !== product.brand))
    .slice(0, 4);

  // Generate Product-Specific AEO Answer Capsule
  const answerCapsule =
    product.seoAnswerCapsule ||
    `Buy authentic ${product.title} (${product.brand}) online in Dubai for AED ${product.cartonPrice}.00 per factory-sealed carton (${product.format}) or AED ${product.fiveCartonPrice}.00 for a 5-carton VIP bundle. Specifications: ${product.tar} tar, ${product.nicotine} nicotine, ${product.flavor} profile (${product.origin}). Order with 1-Click on WhatsApp (+${settings.whatsappNumber}) for ${settings.expressDeliveryMinutes} express delivery across Downtown Dubai, Dubai Marina, JBR, and Palm Jumeirah with Cash or Card on Delivery.`;

  // Product-specific FAQs for AEO & GEO
  const productFaqs = [
    {
      question: `What is the price of 1 carton of ${product.title} in Dubai?`,
      answer: `One factory-sealed carton of ${product.title} (${product.format}) costs AED ${product.cartonPrice}.00 at ${settings.storeName}. Ordering the 5-Carton VIP bundle costs AED ${product.fiveCartonPrice}.00 (saving AED ${fiveCartonSavings}).`,
    },
    {
      question: `What is the tar and nicotine content of ${product.title}?`,
      answer: `${product.title} features a ${product.strength} ${product.flavor} blend with ${product.tar} tar and ${product.nicotine} nicotine per stick, sourced from ${product.origin}.`,
    },
    {
      question: `How fast can I get ${product.title} delivered in Dubai via WhatsApp?`,
      answer: `Click '1-Click Order on WhatsApp' on this page to receive ${product.title} in ${settings.expressDeliveryMinutes} across Downtown Dubai, Burj Khalifa District, Dubai Marina, Palm Jumeirah, and Business Bay. Payment is accepted via Cash or Card on arrival.`,
    },
  ];

  // Complete Schema.org JSON-LD for this Product Page (Product + Offer + BreadcrumbList + FAQPage)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
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
            name: `${product.brand} Series`,
            item: `https://dubaicigeretteshop.ae/?brand=${encodeURIComponent(
              product.brand
            )}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.title,
            item: `https://dubaicigeretteshop.ae/product/${product.id}`,
          },
        ],
      },
      {
        "@type": "Product",
        "@id": `https://dubaicigeretteshop.ae/product/${product.id}#product`,
        name: `${product.title} — ${product.format}`,
        sku: product.sku,
        mpn: product.sku,
        description: answerCapsule,
        ...(allPhotos.length > 0
          ? {
              image: allPhotos.map((u) =>
                u.startsWith("http")
                  ? u
                  : `https://dubaicigeretteshop.ae${u.startsWith("/") ? "" : "/"}${u}`
              ),
            }
          : {}),
        brand: {
          "@type": "Brand",
          name: product.brand,
        },
        category: product.category,
        additionalProperty: [
          { "@type": "PropertyValue", name: "Tar", value: product.tar },
          {
            "@type": "PropertyValue",
            name: "Nicotine",
            value: product.nicotine,
          },
          {
            "@type": "PropertyValue",
            name: "Flavor Profile",
            value: product.flavor,
          },
          {
            "@type": "PropertyValue",
            name: "Strength",
            value: product.strength,
          },
          { "@type": "PropertyValue", name: "Origin", value: product.origin },
          {
            "@type": "PropertyValue",
            name: "Pack Format",
            value: product.format,
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating.toString(),
          reviewCount: product.reviewsCount.toString(),
          bestRating: "5",
          worstRating: "1",
        },
        offers: {
          "@type": "Offer",
          url: `https://dubaicigeretteshop.ae/product/${product.id}`,
          priceCurrency: "AED",
          price: product.cartonPrice.toFixed(2),
          seller: {
            "@id": "https://dubaicigeretteshop.ae/#organization",
          },
          availability: product.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value:
                product.cartonPrice >= settings.freeDeliveryThreshold
                  ? "0.00"
                  : settings.standardDeliveryFee.toFixed(2),
              currency: "AED",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "AE",
            },
            deliveryTime: DELIVERY_TIME,
          },
          hasMerchantReturnPolicy: RETURN_POLICY,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: productFaqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      },
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
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dubai",
          addressRegion: "Dubai",
          addressCountry: "AE",
        },
      },
    ],
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-zinc-900 font-sans">
      <WhatsAppCartDrawer />
      <StoreHeader />

      {/* Inject Product Page JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs text-zinc-600">
          <nav className="flex items-center gap-1.5 truncate">
            <Link
              href="/"
              className="hover:text-[#0A2F42] font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Cigarettes</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
            <span className="font-semibold text-[#0A2F42]">
              {product.brand}
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
            <span className="truncate text-zinc-900 font-bold">
              {product.title}
            </span>
          </nav>

          <span className="hidden sm:inline font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            SKU: {product.sku} • {product.inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </div>

      {/* MAIN PRODUCT DETAIL STAGE (Fits in First Screen with 1-Click WhatsApp!) */}
      <main className="max-w-[1280px] mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-10">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          {/* Left 5 Cols: Gold-Framed VAP DXB Product Carton Artwork + Multi-Photo Gallery */}
          <div className="lg:col-span-5 space-y-3">
            <div className="max-w-md mx-auto relative">
              <ProductPackArt
                priority
                product={
                  allPhotos.length > 0
                    ? {
                        ...product,
                        customImageUrl:
                          allPhotos[activePhotoIdx] || product.customImageUrl,
                      }
                    : product
                }
              />
              {allPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setActivePhotoIdx(
                        (i) => (i - 1 + allPhotos.length) % allPhotos.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#0A2F42]/85 hover:bg-[#0A2F42] text-white flex items-center justify-center shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() =>
                      setActivePhotoIdx((i) => (i + 1) % allPhotos.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#0A2F42]/85 hover:bg-[#0A2F42] text-white flex items-center justify-center shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {allPhotos.length > 1 && (
              <div className="max-w-md mx-auto flex items-center gap-2 overflow-x-auto pb-1">
                {allPhotos.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-16 h-16 rounded-lg border-2 p-1 bg-white shrink-0 transition-all ${
                      idx === activePhotoIdx
                        ? "border-[#0A2F42] ring-2 ring-[#F4B143]"
                        : "border-zinc-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.title} photo ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-400 block">TAR</span>
                <strong className="text-zinc-900">{product.tar}</strong>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-400 block">NICOTINE</span>
                <strong className="text-zinc-900">{product.nicotine}</strong>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-400 block">STRENGTH</span>
                <strong className="text-zinc-900">{product.strength}</strong>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Title, AED Price, Pack Selector, Dubai District & 1-Click WhatsApp Order */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0A2F42] text-[#F4B143] text-[11px] font-mono uppercase tracking-wider font-bold">
                  {product.brand} Official Duty-Free
                </span>
                {product.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                    {product.badge}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-500 ml-auto">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-zinc-900">
                    {product.rating.toFixed(2)}
                  </strong>{" "}
                  ({product.reviewsCount} Dubai reviews)
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                {product.title}{" "}
                <span className="text-base sm:text-xl font-normal text-zinc-500 block sm:inline">
                  — UAE Duty-Free Carton
                </span>
              </h1>
              {product.arabicSubtitle && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  {product.arabicSubtitle}
                </p>
              )}
            </div>

            {/* Price Display */}
            <div className="p-4 rounded-xl bg-[#FDF9EE] border border-[#F4B143]/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-zinc-500 block">
                  {packTier === "5-cartons"
                    ? "5 Cartons VIP Bulk Bundle (50 Packs • 1,000 Sticks)"
                    : product.format}
                </span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#0A2F42]">
                    د.إ{activePrice.toFixed(2)}
                  </span>
                  {packTier === "1-carton" && product.oldPrice && (
                    <span className="text-sm line-through text-zinc-400 font-mono">
                      د.إ{product.oldPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {settings.expressDeliveryMinutes} Express Dubai
                </span>
                <span className="block text-[11px] text-zinc-500 mt-1">
                  Cash or Card on Delivery
                </span>
              </div>
            </div>

            {/* Select 1 Carton vs 5 Cartons VIP */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                1. Choose Quantity Option:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPackTier("1-carton")}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    packTier === "1-carton"
                      ? "border-[#0A2F42] bg-[#0A2F42]/5"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">1 Carton (10 Packs)</div>
                    <div className="text-xs text-zinc-500">
                      200 Cigarettes • Factory Sealed
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-base text-[#0A2F42]">
                    د.إ{product.cartonPrice}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPackTier("5-cartons")}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    packTier === "5-cartons"
                      ? "border-[#F4B143] bg-[#F4B143]/15"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <span>5 Cartons VIP Bundle</span>
                      {fiveCartonSavings > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono">
                          Save AED {fiveCartonSavings}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      1,000 Sticks + FREE Dubai Rider
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-base text-[#0A2F42]">
                    د.إ{product.fiveCartonPrice}
                  </span>
                </button>
              </div>
            </div>

            {/* Select Dubai Delivery District for Instant WhatsApp Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#F4B143]" />
                2. Select Your Dubai Delivery Area (Optional):
              </label>
              <select
                value={deliveryArea}
                onChange={(e) => setDeliveryArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none focus:border-[#0A2F42]"
              >
                {DUBAI_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary 1-Click WhatsApp Order Button + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                disabled={!product.inStock}
                onClick={() =>
                  triggerSingleClickWhatsApp(
                    product,
                    packTier,
                    deliveryArea,
                    "Express 1-Click"
                  )
                }
                className="flex-1 py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_12px_30px_rgba(37,211,102,0.35)] transition-transform active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>
                  1-Click Order on WhatsApp • د.إ{activePrice.toFixed(0)}
                </span>
              </button>

              <button
                type="button"
                disabled={!product.inStock}
                onClick={() => {
                  addToCart(product, packTier, 1);
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 1400);
                }}
                onDoubleClick={() => setIsCartOpen(true)}
                className={`py-4 px-6 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                  justAdded
                    ? "bg-emerald-700 text-white"
                    : "bg-[#0A2F42] hover:bg-[#114661] text-white"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-[#F4B143]" />
                    <span>Add to Cart Tray</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Bullet Points (matching VAP DXB ESSE product page structure) */}
            <div className="pt-4 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>
                  <strong>Tobacco Blend:</strong> Premium {product.flavor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>
                  <strong>Format:</strong> {product.format}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>
                  <strong>Origin:</strong> {product.origin}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>
                  <strong>Delivery:</strong> {settings.expressDeliveryMinutes}{" "}
                  Dubai Rider
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            AEO & GEO PRODUCT INTELLIGENCE BLOCK (Answer Capsule + Spec Table + FAQ)
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Direct Answer Capsule + Technical Spec Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A2F42] text-[#F4B143] text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PRODUCT OVERVIEW &amp; AEO SUMMARY</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold">
              {product.title} — Authentic UAE Specifications
            </h2>

            <p className="p-4 rounded-xl bg-[#FDF9EE] border-l-4 border-[#F4B143] text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
              {answerCapsule}
            </p>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              {product.description}
            </p>

            {/* Structured Product Spec Table for AI Crawlers */}
            <table className="w-full text-xs sm:text-sm border-collapse border border-zinc-200 rounded-xl overflow-hidden">
              <tbody>
                {[
                  ["Brand", product.brand],
                  ["Model / Variant", product.title],
                  ["SKU Code", product.sku],
                  ["Flavor Profile", product.flavor],
                  ["Strength Level", product.strength],
                  ["Quantity / Format", product.format],
                  ["Tar Content", product.tar],
                  ["Nicotine Content", product.nicotine],
                  ["Duty-Free Origin", product.origin],
                  ["1 Carton Price (Dubai)", `AED ${product.cartonPrice}.00`],
                  [
                    "5 Cartons VIP Price",
                    `AED ${product.fiveCartonPrice}.00 (Save AED ${fiveCartonSavings})`,
                  ],
                ].map(([label, val], idx) => (
                  <tr
                    key={label}
                    className={idx % 2 === 0 ? "bg-zinc-50" : "bg-white"}
                  >
                    <th className="py-2.5 px-4 text-left font-bold text-zinc-700 border-b border-zinc-200 w-2/5">
                      {label}
                    </th>
                    <td className="py-2.5 px-4 text-zinc-900 font-medium border-b border-zinc-200">
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right 5 Cols: Product-Specific Q&A for AI Search */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F4B143] font-bold">
              <HelpCircle className="w-4 h-4" />
              <span>PRODUCT Q&amp;A (AEO SCHEMA)</span>
            </div>
            <h3 className="text-xl font-extrabold">
              Questions About {product.title}
            </h3>

            <div className="space-y-3">
              {productFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5"
                >
                  <h4 className="font-bold text-xs sm:text-sm text-[#0A2F42]">
                    {faq.question}
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#0A2F42] text-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F4B143]">
                <Truck className="w-4 h-4" />
                <span>Need Bulk or Hotel Concierge Delivery?</span>
              </div>
              <p className="text-xs text-zinc-300">
                Tap below to order {product.title} directly on WhatsApp with
                zero waiting.
              </p>
              <button
                type="button"
                onClick={() =>
                  triggerSingleClickWhatsApp(
                    product,
                    packTier,
                    deliveryArea,
                    "Express 1-Click"
                  )
                }
                className="w-full py-3 rounded-lg bg-[#25D366] text-black font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Order {product.title} on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* RELATED CIGARETTES IN DUBAI */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
              More {product.brand} &amp; Popular Dubai Cartons
            </h3>
            <Link
              href="/"
              className="text-xs font-bold text-[#0A2F42] hover:underline"
            >
              View All Products →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} isLightTheme={true} />
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
