"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, MessageCircle, Zap } from "lucide-react";
import { useStore } from "@/context/store-context";
import {
  BrandName,
  CategoryId,
  DUBAI_AREAS,
  formatWhatsAppNumberForLink,
  Product,
} from "@/lib/catalog-data";
import { DubaiSkylineArt } from "@/components/dubai-skyline-art";
import { ProductCard } from "@/components/product-card";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";
import { AgeGateModal } from "@/components/age-gate-modal";
import { SeoAeoGeoSection } from "@/components/seo-aeo-geo-section";
import { StoreFooter, StoreHeader } from "@/components/store-header";

const HERO_PACKS = [
  {
    brand: "Marlboro",
    sub: "VISTA DOUBLE ICE",
    bg: "linear-gradient(160deg, #1E1B4B 0%, #090D16 65%, #06B6D4 100%)",
    textColor: "#38BDF8",
    slim: false,
    capsules: ["#A855F7", "#06B6D4"],
    warning: "Smoking seriously harms you and others around you",
  },
  {
    brand: "Dunhill",
    sub: "FINE CUT SWISS BLEND",
    bg: "linear-gradient(160deg, #FAF8F5 0%, #E7E2D8 100%)",
    textColor: "#854D0E",
    slim: false,
    stamp: true,
    warning:
      "Smoke contains benzene, nitrosamines, formaldehyde and hydrogen cyanide",
  },
  {
    brand: "West",
    sub: "RED FULL FLAVOR",
    bg: "linear-gradient(160deg, #7F1D1D 0%, #450A0A 100%)",
    textColor: "#FFFFFF",
    slim: false,
    stamp: true,
    warning:
      "Smoke contains benzene, nitrosamines, formaldehyde and hydrogen cyanide",
  },
  {
    brand: "Vogue",
    sub: "BLEUE SUPER SLIM",
    bg: "linear-gradient(160deg, #F8FAFC 0%, #E0F2FE 100%)",
    textColor: "#0284C7",
    slim: true,
    warning: "Smoking seriously harms you and others around you",
  },
  {
    brand: "Davidoff",
    sub: "WHITE SLIMS",
    bg: "linear-gradient(160deg, #F8FAFC 0%, #CBD5E1 100%)",
    textColor: "#475569",
    slim: false,
    warning: "Smoking seriously harms you and others around you",
  },
];

export default function DubaiCigaretteStorefront() {
  const {
    products,
    settings,
    activeTheme,
    triggerSingleClickWhatsApp,
  } = useStore();

  // Search & Navigation Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedBrand, setSelectedBrand] = useState<"All" | BrandName>("All");

  // Apply deep-link filters (?category=, ?brand=, ?q=) arriving from other pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const brand = params.get("brand");
    const q = params.get("q");
    if (cat) setSelectedCategory(cat as CategoryId);
    if (brand) setSelectedBrand(brand as "All" | BrandName);
    if (q) setSearchQuery(q);
  }, []);

  // Quick Order Bar state
  const [quickProductId, setQuickProductId] = useState<string>(
    products[0]?.id || "marlboro-gold-carton"
  );
  const [quickPackTier, setQuickPackTier] = useState<"1-carton" | "5-cartons">(
    "1-carton"
  );
  const [quickArea, setQuickArea] = useState<string>(DUBAI_AREAS[0]);

  // Filter products when searching or filtering by category/brand
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory)
        return false;
      if (selectedBrand !== "All" && p.brand !== selectedBrand) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.flavor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  // Group into the exact VAP DXB Brand Series sections (Cigarettes First, Secondary Products After)
  const brandSections: {
    brand: BrandName;
    heading: string;
    items: Product[];
  }[] = useMemo(() => {
    const definitions: { brand: BrandName; heading: string }[] = [
      // PRIMARY FOCUS: CIGARETTE SERIES
      { brand: "Marlboro", heading: "Marlboro Cigarettes Series" },
      { brand: "Dunhill", heading: "Dunhill Cigarettes Range" },
      { brand: "Davidoff", heading: "Davidoff Cigarettes Selection" },
      { brand: "ESSE", heading: "ESSE Cigarettes Edition" },
      { brand: "Winston", heading: "Winston Cigarettes Assortment" },
      { brand: "Parliament", heading: "Parliament & Luxury Series" },
      { brand: "Vogue", heading: "Vogue Super Slims Edition" },
      { brand: "West", heading: "West German Blend Series" },
      { brand: "Camel", heading: "Camel Cigarettes Collection" },
      { brand: "Manchester", heading: "Manchester Cigarettes Series" },
      { brand: "Chesterfield", heading: "Chesterfield Cigarettes Range" },
      { brand: "L&M", heading: "L&M Cigarettes Selection" },
      { brand: "American Spirit", heading: "American Spirit Natural Cigarettes" },
      { brand: "Benson & Hedges", heading: "Benson & Hedges Cigarettes" },
      { brand: "Gold Leaf", heading: "Gold Leaf Cigarettes Series" },
      { brand: "Platinum Seven", heading: "Platinum Seven Cigarettes" },
      { brand: "Mond", heading: "Mond Cigarettes" },
      { brand: "Villiger", heading: "Villiger Premium Cigars" },
      { brand: "Captain Black", heading: "Captain Black Little Cigars" },
    ];

    // Any brand in the live catalog that isn't listed above still gets a section
    const knownBrands = new Set(definitions.map((d) => d.brand));
    const extras = [...new Set(products.map((p) => p.brand))]
      .filter((b) => !knownBrands.has(b))
      .map((b) => ({ brand: b, heading: `${b} Collection` }));

    return [...definitions, ...extras]
      .map((def) => ({
        ...def,
        items: filteredProducts.filter(
          (p) =>
            p.brand === def.brand ||
            (searchQuery.trim() !== "" &&
              p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) &&
              p.brand === def.brand)
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [filteredProducts, products, searchQuery]);

  // Unfiltered home shows a short list per category (client OK 2026-11-06): the whole
  // catalog (~366 cards) made the page 3 MB+ and buried the category pages.
  const showShortHome =
    searchQuery.trim() === "" && selectedBrand === "All" && selectedCategory === "all";
  const categorySections = useMemo(() => {
    const cats: { id: Exclude<CategoryId, "all">; heading: string }[] = [
      { id: "cigarettes", heading: "Cigarettes" },
      { id: "iqos-terea", heading: "IQOS & TEREA" },
      { id: "vapes", heading: "Vapes & Disposables" },
      { id: "e-liquid", heading: "E-Liquids" },
      { id: "nicotine-pouches", heading: "Nicotine Pouches" },
      { id: "hookah-shisha", heading: "Hookah & Shisha" },
      { id: "accessories", heading: "Accessories & Lighters" },
    ];
    return cats
      .map((c) => {
        // brand lists in the brand-series order, then take one per brand in turn
        const byBrand = brandSections
          .map((sec) => sec.items.filter((p) => p.category === c.id))
          .filter((list) => list.length > 0);
        const total = byBrand.reduce((n, list) => n + list.length, 0);
        const picks: Product[] = [];
        for (let i = 0; picks.length < 8 && byBrand.some((list) => list[i]); i++) {
          byBrand.forEach((list) => {
            if (list[i] && picks.length < 8) picks.push(list[i]);
          });
        }
        return { ...c, total, items: picks };
      })
      .filter((c) => c.items.length > 0);
  }, [brandSections]);

  // Brand quick-filter pills — computed from the live catalog, cigarette majors first
  const pillBrands: ("All" | BrandName)[] = useMemo(() => {
    const order = [
      "Marlboro", "Dunhill", "Davidoff", "ESSE", "Winston", "Parliament",
      "Vogue", "West", "Camel", "Manchester", "Chesterfield", "L&M",
      "American Spirit", "Benson & Hedges", "Gold Leaf", "Platinum Seven",
      "Mond", "Villiger", "Captain Black",
    ];
    const present = new Set(products.map((p) => p.brand));
    const ordered = order.filter((b) =>
      present.has(b as BrandName)
    ) as BrandName[];
    const extras = [...present].filter((b) => !order.includes(b));
    return ["All", ...ordered, ...extras];
  }, [products]);

  const handleQuickOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target =
      products.find((p) => p.id === quickProductId) || products[0];
    if (target) {
      triggerSingleClickWhatsApp(
        target,
        quickPackTier,
        quickArea,
        "Hero Quick-Order"
      );
    }
  };

  // Hero background style based on the Admin-controlled theme ("midnight-gold" = 1. Burj & Wood Table default)
  const heroBgClass =
    activeTheme === "midnight-gold"
      ? "bg-gradient-to-b from-[#1A0E07] via-[#2C1608] to-[#0F0804]"
      : activeTheme === "future-glass"
      ? "bg-gradient-to-b from-[#081C29] via-[#0B2A3D] to-[#06131C]"
      : "bg-gradient-to-b from-[#2B1206] via-[#451D09] to-[#170903]";

  const pageShellClass =
    activeTheme === "future-glass"
      ? "bg-[#EFF3F8] text-slate-900"
      : activeTheme === "royal-sunset"
      ? "bg-[#FBF7F0] text-stone-900"
      : "bg-[#F8F9FA] text-zinc-900";

  return (
    <div
      className={`min-h-[100dvh] font-sans transition-colors duration-500 ${pageShellClass}`}
    >
      <AgeGateModal />
      <WhatsAppCartDrawer />

      {/* SHARED HEADER + WORKING MENU BAR + SOCIAL LINKS */}
      <StoreHeader
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* =====================================================================
          HERO BANNER: ULTRA-COMPACT ON MOBILE SO PRODUCTS SHOW IN FIRST SCREEN!
         ===================================================================== */}
      <section className="max-w-[1280px] mx-auto px-2.5 sm:px-4 pt-2 sm:pt-4 pb-1">
        <div
          className={`relative rounded-xl overflow-hidden shadow-md border border-amber-900/30 ${heroBgClass} min-h-[135px] sm:min-h-[325px] flex flex-col justify-between`}
        >
          {/* Optional Custom Hero Background Image set via Admin Panel */}
          {settings.heroBackgroundImageUrl && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{
                  backgroundImage: `url(${settings.heroBackgroundImageUrl})`,
                }}
              />
              <div
                className="absolute inset-0 bg-black transition-opacity"
                style={{
                  opacity: (settings.heroOverlayOpacity ?? 55) / 100,
                }}
              />
            </>
          )}

          {/* Subtle Warm Wood Vertical Planks + Burj Khalifa / Dubai Skyline Silhouette */}
          {!settings.heroBackgroundImageUrl && (
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 90px)",
              }}
            />
          )}
          <DubaiSkylineArt theme={activeTheme} />

          {/* Top Dubai Landmark Badge */}
          <div className="relative z-20 pt-2.5 sm:pt-4 px-3 sm:px-6 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-black/65 backdrop-blur-md border border-[#F4B143]/40 text-[#F4B143] text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>
                Burj Khalifa &amp; Dubai • {settings.expressDeliveryMinutes}
              </span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[11px] font-mono">
              100% Original Factory-Sealed Cartons
            </span>
          </div>

          {/* 5 Standing Cigarette Packs Row + Overlaid Headline */}
          <div className="relative z-10 px-3 sm:px-12 pt-1.5 sm:pt-4 pb-3 sm:pb-8 flex items-end justify-around gap-2 sm:gap-6 max-w-5xl mx-auto w-full min-h-[95px] sm:min-h-[225px]">
            {(settings.showFivePacksRow ?? true) &&
              HERO_PACKS.map((pack, idx) => (
                <div
                  key={pack.brand}
                  onClick={() =>
                    setSelectedBrand(pack.brand as "All" | BrandName)
                  }
                  className={`cursor-pointer group relative flex flex-col justify-between rounded-sm border border-white/25 shadow-[0_18px_30px_rgba(0,0,0,0.85)] transition-transform duration-500 hover:-translate-y-1.5 ${
                    pack.slim
                      ? "w-12 sm:w-20 h-24 sm:h-56"
                      : "w-16 sm:w-36 h-20 sm:h-52"
                  } ${idx > 2 ? "hidden sm:flex" : "flex"}`}
                  style={{ background: pack.bg }}
                  title={`Filter by ${pack.brand}`}
                >
                  {pack.stamp && (
                    <div className="mx-auto w-5 sm:w-6 h-5 sm:h-7 bg-emerald-100 border border-amber-500 rounded-b-sm flex items-center justify-center text-[5px] sm:text-[6px] font-mono text-emerald-900 font-bold shadow">
                      UAE
                    </div>
                  )}

                  <div className="px-1.5 pt-1.5 sm:pt-3 text-center">
                    <div
                      className="font-display font-bold text-xs sm:text-xl leading-none tracking-tight"
                      style={{ color: pack.textColor }}
                    >
                      {pack.brand}
                    </div>
                    <div className="text-[6px] sm:text-[8px] font-mono uppercase tracking-widest opacity-75 mt-0.5 text-current truncate">
                      {pack.sub}
                    </div>
                  </div>

                  <div className="m-1 sm:m-1.5 p-1 sm:p-1.5 bg-[#F5F2EB] border-2 border-black text-black text-center">
                    <p className="text-[6px] sm:text-[8px] font-bold leading-tight line-clamp-2 sm:line-clamp-none">
                      {pack.warning}
                    </p>
                  </div>
                </div>
              ))}

            {/* Center Overlaid Bold White Headline matching VAP DXB Screenshot */}
            <div className="pointer-events-none absolute inset-x-2 sm:inset-x-4 top-1/2 -translate-y-1/2 z-20 text-center">
              <h1 className="font-sans text-base sm:text-3xl md:text-[2.4rem] font-extrabold text-white tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] bg-black/50 backdrop-blur-[2px] inline-block px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg border border-white/15">
                {settings.heroTitleOverride ||
                  "Cigarettes In Dubai – Marlboro, Dunhill, Winston & More"}
              </h1>
            </div>
          </div>

          {/* Glossy Wooden Table Surface Reflection Strip at Bottom */}
          <div className="relative z-10 h-7 sm:h-9 bg-gradient-to-t from-black/85 via-[#2A1508]/70 to-transparent border-t border-amber-500/20 flex items-center justify-between px-3 sm:px-6 text-[10px] sm:text-[11px] font-mono text-amber-200/85">
            <span className="truncate">
              ★ Tap any product below for 1-Click WhatsApp Order
            </span>
            <span className="hidden md:inline text-[#25D366]">
              Click any pack above to filter brand ↓
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          MAIN PRODUCT CATALOG (Immediately Visible on Mobile First Screen!)
         ===================================================================== */}
      <main
        id="cigarettes-dubai"
        className="max-w-[1280px] mx-auto px-2.5 sm:px-4 py-2 sm:py-5"
      >
        <div className="rounded-2xl bg-[#F3F4F6] border border-zinc-300/90 p-3 sm:p-7 md:p-9 shadow-sm">
          {/* Compact Section Header + Brand Filter Pills */}
          <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-7">
            <h2 className="text-base sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
              Premium Cigarettes Collections You’ll Love
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 hidden sm:block">
              We highlight trending and popular cigarettes items to help you
              decide faster. You can explore:
            </p>

            {/* Quick Brand Jump Pills (Horizontal Scroll on Mobile) */}
            <div className="mt-2 sm:mt-4 flex items-center sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {pillBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 transition-colors ${
                    selectedBrand === b
                      ? "bg-[#0A2F42] text-white"
                      : "bg-white border border-zinc-300 text-zinc-700 hover:border-[#F4B143]"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Series Sections (2-Columns on Mobile so products fit immediately, 4-Columns on Desktop) */}
          <div className="space-y-8 sm:space-y-12">
            {showShortHome ? (
              categorySections.map((section) => (
                <div key={section.id} className="space-y-3 sm:space-y-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base sm:text-2xl font-extrabold text-zinc-900">
                      <Link href={`/category/${section.id}`} className="hover:underline">
                        {section.heading}
                      </Link>
                    </h3>
                    <Link
                      href={`/category/${section.id}`}
                      className="shrink-0 inline-flex items-center text-xs sm:text-sm font-bold text-[#0A2F42] hover:text-[#B07A12]"
                    >
                      See all {section.total}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
                    {section.items.map((product) => (
                      <ProductCard key={product.id} product={product} isLightTheme={true} />
                    ))}
                  </div>
                </div>
              ))
            ) : brandSections.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-zinc-200">
                <p className="text-base font-bold text-zinc-700">
                  No products match your current filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedBrand("All");
                    setSearchQuery("");
                  }}
                  className="mt-3 px-4 py-2 rounded bg-[#F4B143] text-black text-xs font-bold"
                >
                  Show All Cigarette Series
                </button>
              </div>
            ) : (
              brandSections.map((section) => (
                <div key={section.brand} className="space-y-3 sm:space-y-5">
                  <div className="text-center">
                    <h3 className="text-base sm:text-2xl font-extrabold text-zinc-900">
                      {section.heading}
                    </h3>
                  </div>

                  {/* grid-cols-2 on mobile so 2 products sit side-by-side in the first screen! */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
                    {section.items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isLightTheme={true}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 1-Click Quick Order Bar inside Catalog Footer */}
          <form
            onSubmit={handleQuickOrderSubmit}
            className="mt-8 bg-[#0A2F42] text-white rounded-xl p-3.5 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3 border border-[#F4B143]/40"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4B143] text-black flex items-center justify-center font-bold shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#F4B143] block">
                  FAST REPEAT ORDER
                </span>
                <span className="text-xs sm:text-sm font-bold">
                  1-Click WhatsApp Carton Selector:
                </span>
              </div>
            </div>

            <select
              value={quickProductId}
              onChange={(e) => setQuickProductId(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 rounded bg-white text-zinc-900 text-xs font-semibold focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — د.إ{p.cartonPrice}.00 (1 Carton)
                </option>
              ))}
            </select>

            <select
              value={quickPackTier}
              onChange={(e) =>
                setQuickPackTier(e.target.value as "1-carton" | "5-cartons")
              }
              className="px-3 py-2 rounded bg-white text-zinc-900 text-xs font-semibold focus:outline-none"
            >
              <option value="1-carton">1 Carton (10 Packs)</option>
              <option value="5-cartons">5 Cartons VIP Bulk</option>
            </select>

            <select
              value={quickArea}
              onChange={(e) => setQuickArea(e.target.value)}
              className="px-3 py-2 rounded bg-white text-zinc-900 text-xs font-semibold focus:outline-none max-w-[210px]"
            >
              {DUBAI_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow transition-transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Order on WhatsApp</span>
            </button>
          </form>
        </div>

        {/* CIGARETTE SHOP DUBAI TRUST BANNER (Matches Screenshot 2 Card Style, Focused on Cigarettes!) */}
        <div className="mt-6 rounded-xl bg-white border border-zinc-300 p-6 sm:p-8 text-center shadow-sm space-y-3">
          <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900">
            Cigarette Shop Dubai – Your Trusted Online Cigarette Store In UAE
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            Looking for a reliable cigarette shop in Dubai where you can order
            authentic factory-sealed cartons quickly and safely? You are in the right
            place. As a trusted online cigarette store in Dubai (with secondary
            IQOS Terea, Nicotine Pouches, Vapes &amp; E-Liquids), we deliver
            factory-sealed cartons across the UAE in{" "}
            {settings.expressDeliveryMinutes}.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-bold text-zinc-800">
            <span>• Fast cigarette delivery Dubai</span>
            <span>• 100% Authentic factory-sealed cartons</span>
            <span>• Simple 1-Click WhatsApp ordering</span>
          </div>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#cigarettes-dubai"
              onClick={() => {
                setSelectedCategory("cigarettes");
                setSelectedBrand("All");
              }}
              className="px-6 py-2.5 rounded bg-[#0A2F42] hover:bg-[#0f435d] text-white text-xs font-extrabold uppercase tracking-wider"
            >
              BUY CIGARETTES NOW
            </a>
            <a
              href={`https://wa.me/${formatWhatsAppNumberForLink(
                settings.whatsappNumber
              )}?text=${encodeURIComponent(
                `Hello ${settings.storeName} (${settings.supportPhoneDisplay})! I would like to order cigarette cartons in Dubai.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded bg-[#F4B143] hover:bg-[#e5a235] text-black text-xs font-extrabold uppercase tracking-wider"
            >
              WHATSAPP NOW ({settings.supportPhoneDisplay})
            </a>
          </div>
        </div>
      </main>

      {/* SEO, AEO & GEO INTELLIGENCE HUB */}
      <SeoAeoGeoSection isLightTheme={true} />

      {/* SHARED FOOTER + STICKY MOBILE WHATSAPP BAR */}
      <StoreFooter />
    </div>
  );
}
