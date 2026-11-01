"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Facebook,
  Instagram,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import {
  BrandName,
  CategoryId,
  formatWhatsAppNumberForLink,
  INITIAL_NAV_MENU,
  NavMenuItem,
} from "@/lib/catalog-data";
import { WhatsAppAutomationBot } from "@/components/whatsapp-automation-bot";

/**
 * Custom Bespoke Luxury Vector Emblem for dubaicigeretteshop.ae
 * Features an octagonal gold-bezel crest with the Burj Khalifa spire & twin golden tobacco leaves.
 */
export function DubaiCigaretteLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 select-none group">
      {/* Custom SVG Burj + Tobacco Crest */}
      <div
        className={`relative shrink-0 rounded-xl p-[2px] bg-gradient-to-tr from-[#B8860B] via-[#F4B143] to-[#FDE68A] shadow-md transition-transform duration-500 group-hover:scale-105 ${
          compact ? "w-8 h-8" : "w-9 h-9 sm:w-11 sm:h-11"
        }`}
      >
        <div className="w-full h-full rounded-[10px] bg-[#061823] flex items-center justify-center overflow-hidden relative">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 sm:w-8 sm:h-8"
          >
            {/* Subtle Radial Gold Glow */}
            <circle cx="20" cy="18" r="14" fill="#F4B143" fillOpacity="0.12" />
            {/* Burj Khalifa Stepped Center Spire */}
            <path
              d="M20 3 L21.2 12 L22.5 12 L22.5 19 L24 19 L24 26 L26 26 L26 34 L14 34 L14 26 L16 26 L16 19 L17.5 19 L17.5 12 L18.8 12 Z"
              fill="url(#burjGoldGrad)"
            />
            {/* Twin Golden Tobacco / Palm Leaves Flanking Spire */}
            <path
              d="M13 33 C8 29 7 22 11 17 C11.5 22 13 26 15 31 Z"
              fill="#F4B143"
              fillOpacity="0.85"
            />
            <path
              d="M27 33 C32 29 33 22 29 17 C28.5 22 27 26 25 31 Z"
              fill="#F4B143"
              fillOpacity="0.85"
            />
            {/* Base Horizon Bar */}
            <rect
              x="9"
              y="34"
              width="22"
              height="2"
              rx="1"
              fill="#FDE68A"
            />
            <defs>
              <linearGradient
                id="burjGoldGrad"
                x1="20"
                y1="3"
                x2="20"
                y2="34"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="50%" stopColor="#F4B143" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Domain-Matched Brand Wordmark (Full name always visible — never truncated) */}
      <div className="leading-none">
        <div className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="font-display text-[13px] sm:text-2xl font-black tracking-tight text-[#061823]">
            DUBAI
          </span>
          <span className="font-sans text-[11px] sm:text-xl font-black tracking-tight text-[#D9901A]">
            CIGARETTE
          </span>
          <span className="inline-block px-1 sm:px-1.5 py-0.5 rounded bg-[#0A2F42] text-[#F4B143] text-[7px] sm:text-[9px] font-mono font-bold uppercase tracking-wider">
            SHOP.AE
          </span>
        </div>
        <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-500 block mt-0.5 whitespace-nowrap">
          dubaicigeretteshop.ae
        </span>
      </div>
    </div>
  );
}

const ALL_BRANDS: ("All" | BrandName)[] = [
  "All",
  "Marlboro",
  "Dunhill",
  "Davidoff",
  "ESSE",
  "Winston",
  "Parliament",
  "Vogue",
  "West",
  "IQOS TEREA",
  "Camel",
  "Manchester",
  "Chesterfield",
  "L&M",
  "American Spirit",
  "Benson & Hedges",
  "Gold Leaf",
  "Platinum Seven",
  "Mond",
  "Villiger",
  "Captain Black",
];

const BROWSE_MEGA_CATEGORIES: {
  id: string;
  label: string;
  badge?: string;
  filterType: NavMenuItem["filterType"];
  filterValue: string;
  featuredInfo: { title: string; subtitle: string; priceTag: string; origin: string };
  subItems: { label: string; priceHint: string; filterType: NavMenuItem["filterType"]; filterValue: string; searchHint?: string }[];
}[] = [
  {
    id: "cigarettes",
    label: "Duty-Free Cigarettes",
    badge: "MAIN FOCUS",
    filterType: "category",
    filterValue: "cigarettes",
    featuredInfo: {
      title: "10-Pack Master Cartons (200 Sticks)",
      subtitle: "Factory-sealed Swiss, German & Korean duty-free cartons delivered in 45 mins.",
      priceTag: "From AED 50.00 / Carton",
      origin: "100% Sealed Original",
    },
    subItems: [],
  },
  {
    id: "premium-international",
    label: "Premium International",
    badge: "IMPORTED",
    filterType: "brand",
    filterValue: "Camel",
    featuredInfo: {
      title: "Camel, American Spirit & Benson & Hedges",
      subtitle: "Rare international blends - JTI Camel, Santa Fe American Spirit, UK Benson & Hedges.",
      priceTag: "From AED 130.00",
      origin: "Imported Duty-Free",
    },
    subItems: [],
  },
  {
    id: "value-brands",
    label: "Value & Budget Series",
    badge: "BEST VALUE",
    filterType: "brand",
    filterValue: "Manchester",
    featuredInfo: {
      title: "Manchester, L&M, Gold Leaf & Mond",
      subtitle: "Best-value sealed cartons in Dubai - Manchester, L&M, Gold Leaf, West, Platinum Seven & Mond.",
      priceTag: "From AED 50.00 / Carton",
      origin: "Duty-Free Value Picks",
    },
    subItems: [],
  },
  {
    id: "cigars",
    label: "Cigars & Little Cigars",
    filterType: "brand",
    filterValue: "Villiger",
    featuredInfo: {
      title: "Villiger Sumatra & Captain Black Crema",
      subtitle: "Swiss Villiger Premium No. 3 & No. 7 Sumatra boxes plus Captain Black Dark Crema little cigars.",
      priceTag: "From AED 200.00",
      origin: "Switzerland / USA",
    },
    subItems: [],
  },
  {
    id: "iqos-terea",
    label: "IQOS & TEREA",
    badge: "HEATED",
    filterType: "category",
    filterValue: "iqos-terea",
    featuredInfo: { title: "IQOS ILUMA Devices & TEREA Sticks", subtitle: "Blade-free induction devices plus Japan, Switzerland & Indonesia TEREA cartons.", priceTag: "From AED 120.00", origin: "PMI Official" },
    subItems: [],
  },
  {
    id: "vapes",
    label: "Vape & Disposables",
    filterType: "category",
    filterValue: "vapes",
    featuredInfo: { title: "Disposables, Pods & Mods", subtitle: "ELFBAR, HQD, Vozol, Tugboat disposables + MYLE, JUUL, RELX, OXVA pod systems.", priceTag: "From AED 40.00", origin: "UAE ESMA Verified" },
    subItems: [],
  },
  {
    id: "e-liquid",
    label: "E-Liquids",
    filterType: "category",
    filterValue: "e-liquid",
    featuredInfo: { title: "SaltNic, Freebase & Shortfills", subtitle: "VGOD, Tokyo, Sam's Vape & Nasty premium e-juices in 30ml & 60ml bottles.", priceTag: "From AED 40.00", origin: "USA / UK Original" },
    subItems: [],
  },
  {
    id: "nicotine-pouches",
    label: "Nicotine Pouches",
    filterType: "category",
    filterValue: "nicotine-pouches",
    featuredInfo: { title: "All-White Tobacco-Free Pouches", subtitle: "VELO, White Fox, Pablo & Killa extra-strong snus rolls.", priceTag: "AED 45-120", origin: "Sweden / EU" },
    subItems: [],
  },
  {
    id: "accessories",
    label: "Accessories & Lighters",
    filterType: "category",
    filterValue: "accessories",
    featuredInfo: { title: "Pods, Coils & Premium Lighters", subtitle: "Replacement pods, mesh coils and Zippo-style lighters.", priceTag: "From AED 25.00", origin: "Official Spare Parts" },
    subItems: [],
  },
];

interface StoreHeaderProps {
  selectedCategory?: CategoryId;
  onSelectCategory?: (cat: CategoryId) => void;
  selectedBrand?: "All" | BrandName;
  onSelectBrand?: (brand: "All" | BrandName) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function StoreHeader({
  selectedCategory = "all",
  onSelectCategory,
  selectedBrand = "All",
  onSelectBrand,
  searchQuery = "",
  onSearchChange,
}: StoreHeaderProps) {
  const { cart, settings, setIsCartOpen } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const [browseMenuOpen, setBrowseMenuOpen] = useState(false);
  const [hoveredMegaId, setHoveredMegaId] = useState<string>("cigarettes");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const navItems: NavMenuItem[] =
    settings.navMenuItems && settings.navMenuItems.length > 0
      ? settings.navMenuItems
      : INITIAL_NAV_MENU;

  const socials = settings.socialLinks || {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    pinterest: "",
    tiktok: "",
  };

  const activeMegaCategory =
    BROWSE_MEGA_CATEGORIES.find((c) => c.id === hoveredMegaId) ||
    BROWSE_MEGA_CATEGORIES[0];

  // Navigate & filter whether user is on Home page or Product Detail page
  const applyFilter = (type: NavMenuItem["filterType"], value: string) => {
    setBrowseMenuOpen(false);
    setMobileDrawerOpen(false);

    if (pathname !== "/") {
      const params = new URLSearchParams();
      if (type === "category") params.set("category", value);
      if (type === "brand") params.set("brand", value);
      router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }

    if (type === "all") {
      onSelectCategory?.("all");
      onSelectBrand?.("All");
      onSearchChange?.("");
    } else if (type === "category") {
      onSelectCategory?.(value as CategoryId);
      onSelectBrand?.("All");
    } else if (type === "brand") {
      onSelectCategory?.("all");
      onSelectBrand?.(value as "All" | BrandName);
    }

    const catalogEl = document.getElementById("cigarettes-dubai");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (pathname === "/" && onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileSearchOpen(false);
    if (pathname !== "/") {
      router.push(`/?q=${encodeURIComponent(localSearch)}`);
    } else {
      const catalogEl = document.getElementById("cigarettes-dubai");
      if (catalogEl) catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* =====================================================================
          0. ULTRA-SLIM DUBAI CONCIERGE TOP BAR (dubaicigeretteshop.ae)
         ===================================================================== */}
      <div className="bg-[#061823] text-white px-3 sm:px-6 py-1 text-[10px] sm:text-[11px] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366] ring-2 ring-[#25D366]/30 shrink-0" />
            <span className="font-mono tracking-wide text-[#F4B143] truncate">
              {settings.announcementText}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 font-mono">
            <span className="hidden md:inline-flex items-center gap-1 text-zinc-300">
              <Truck className="w-3 h-3 text-[#F4B143]" />
              <span>dubaicigeretteshop.ae</span>
            </span>
            <Link
              href="/track"
              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#F4B143] hover:text-black text-white font-semibold transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/admin"
              className="px-2.5 py-0.5 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-black font-bold inline-flex items-center gap-1 transition-colors"
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. ULTRA-COMPACT HEADER (Single Row on Mobile! Zero Wasted Vertical Space)
         ===================================================================== */}
      <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-zinc-200/80 shadow-[0_4px_20px_rgba(10,47,66,0.06)]">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-5">
          {/* Left: Custom Burj/Tobacco Crest Logo (Mobile menu opens via "Categories" pill in the breadcrumb bar below — no duplicate button here) */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Link
              href="/"
              onClick={() => applyFilter("all", "all")}
              className="min-w-0"
            >
              <DubaiCigaretteLogo />
            </Link>
          </div>

          {/* Center Search Bar: Desktop Inline Pill (Hidden on mobile unless Search icon tapped) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-1 max-w-xl p-1 rounded-full bg-zinc-100/90 border border-zinc-200/90 focus-within:border-[#0A2F42] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,177,67,0.2)] transition-all items-center"
          >
            <input
              type="text"
              placeholder="Search Marlboro Gold, Dunhill Switch, ESSE, Terea..."
              value={pathname === "/" ? searchQuery : localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="flex-1 pl-4 pr-2 py-1 text-xs sm:text-sm bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />

            <div className="border-l border-zinc-200/90 pl-1">
              <select
                value={selectedBrand}
                onChange={(e) => applyFilter("brand", e.target.value)}
                className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-600 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Brands</option>
                {ALL_BRANDS.filter((b) => b !== "All").map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#0A2F42] hover:bg-[#104560] text-[#F4B143] flex items-center justify-center shrink-0"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Right Actions: Mobile Search Toggle + Desktop 24/7 Support + Compact Cart Pill */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Compact Search Icon Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="lg:hidden w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-[#0A2F42] flex items-center justify-center"
              aria-label="Toggle Search"
            >
              {mobileSearchOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>

            <a
              href={`https://wa.me/${formatWhatsAppNumberForLink(
                settings.whatsappNumber
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-zinc-50 transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-black transition-colors">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-900 leading-none">
                  24/7 WHATSAPP
                </div>
                <div className="text-xs font-mono font-bold text-[#0A2F42]">
                  {settings.supportPhoneDisplay || "+971 55 302 0429"}
                </div>
              </div>
            </a>

            {/* Compact Cart Pill (Single line with Logo on Mobile!) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="p-0.5 rounded-full bg-zinc-100 border border-zinc-200 hover:border-[#F4B143] transition-all active:scale-95"
            >
              <div className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-white">
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 text-[#0A2F42]" />
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#F4B143] text-black text-[9px] font-extrabold flex items-center justify-center">
                    {totalCartItems}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-extrabold text-[#0A2F42] pl-0.5">
                  د.إ{totalCartAmount.toFixed(0)}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Search Input (Only opens when user taps the magnifying glass on mobile) */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-3 pb-2.5 bg-white border-t border-zinc-100">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-1.5 p-1 pl-3.5 rounded-full bg-zinc-100 border border-zinc-300"
            >
              <input
                type="text"
                autoFocus
                placeholder="Search Marlboro, Dunhill, ESSE, Terea..."
                value={pathname === "/" ? searchQuery : localSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="flex-1 py-1 text-xs bg-transparent text-zinc-900 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-full bg-[#0A2F42] text-[#F4B143] text-[11px] font-bold"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* ===================================================================
            TIER 2A (MOBILE ONLY): SLIM BREADCRUMB BAR (Replaces Duplicate Mobile Menu Bar!)
            Since the catalog already has Brand Pills below the Hero, mobile gets a
            clean, zero-clutter Breadcrumb + Category Trigger bar here.
           =================================================================== */}
        <div className="lg:hidden bg-gradient-to-r from-[#0A2F42] via-[#0E3B52] to-[#0A2F42] text-white px-3 py-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <nav
            aria-label="Mobile Breadcrumb"
            className="flex items-center gap-1 truncate font-medium"
          >
            <button
              type="button"
              onClick={() => applyFilter("all", "all")}
              className="text-[#F4B143] font-bold hover:underline shrink-0"
            >
              Home
            </button>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <button
              type="button"
              onClick={() => applyFilter("category", "cigarettes")}
              className="text-zinc-200 truncate"
            >
              {selectedCategory === "all"
                ? "Cigarettes Dubai"
                : selectedCategory.replace("-", " ")}
            </button>
            {selectedBrand !== "All" && (
              <>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="px-2 py-0.5 rounded-full bg-[#F4B143] text-black text-[10px] font-extrabold shrink-0">
                  {selectedBrand}
                </span>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-[#F4B143] text-black font-extrabold text-[10px] inline-flex items-center gap-1 shrink-0 ml-2"
          >
            <span>Categories</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* ===================================================================
            TIER 2B (DESKTOP ONLY): ARCHITECTURAL GOLD MENU BAR + 3-PANEL MEGA MENU
           =================================================================== */}
        <div className="hidden lg:block relative bg-gradient-to-r from-[#EFA835] via-[#F5B94E] to-[#EFA835] border-t border-[#d69122] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <div className="max-w-[1280px] mx-auto px-6 h-11 flex items-center justify-between gap-3">
            {/* LEFT: Machined Dark Navy BROWSE CATEGORIES Trigger + 3-Panel Mega-Menu */}
            <div className="relative flex items-center h-full">
              <button
                type="button"
                onClick={() => setBrowseMenuOpen((o) => !o)}
                onMouseEnter={() => setBrowseMenuOpen(true)}
                className="h-8 px-4 rounded-full bg-[#0A2F42] hover:bg-[#07212F] text-white text-[11px] font-extrabold uppercase tracking-[0.12em] flex items-center gap-2.5 shadow-sm transition-all"
              >
                <Menu className="w-3.5 h-3.5 text-[#F4B143]" />
                <span>BROWSE CATEGORIES</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#F4B143] transition-transform duration-300 ${
                    browseMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {browseMenuOpen && (
                <div
                  onMouseLeave={() => setBrowseMenuOpen(false)}
                  className="absolute left-0 top-full pt-1.5 z-50"
                >
                  <div className="w-[760px] rounded-2xl bg-white border border-zinc-200/90 shadow-[0_28px_70px_rgba(10,47,66,0.28)] overflow-hidden grid grid-cols-12 text-xs text-zinc-800">
                    {/* Col 1: Main Store Categories */}
                    <div className="col-span-4 bg-zinc-50/90 border-r border-zinc-200/80 p-2 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => applyFilter("all", "all")}
                        className="w-full px-3.5 py-2.5 rounded-xl text-left hover:bg-[#0A2F42] hover:text-white flex items-center justify-between font-extrabold text-[#0A2F42] transition-colors"
                      >
                        <span>All Dubai Collections</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {BROWSE_MEGA_CATEGORIES.map((cat) => {
                        const isHovered = hoveredMegaId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onMouseEnter={() => setHoveredMegaId(cat.id)}
                            onClick={() =>
                              applyFilter(cat.filterType, cat.filterValue)
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                              isHovered
                                ? "bg-[#0A2F42] text-white font-bold shadow-sm"
                                : "hover:bg-zinc-200/60 text-zinc-700 font-semibold"
                            }`}
                          >
                            <span className="truncate">{cat.label}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {cat.badge && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                    isHovered
                                      ? "bg-[#F4B143] text-black"
                                      : "bg-amber-100 text-amber-900"
                                  }`}
                                >
                                  {cat.badge}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Col 2: Sub-Brands & Price Guide */}
                    <div className="col-span-5 p-4 flex flex-col justify-between bg-white">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 mb-2 px-2">
                          {activeMegaCategory.label} Assortment
                        </div>
                        <div className="space-y-1">
                          {activeMegaCategory.subItems.map((sub, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                applyFilter(sub.filterType, sub.filterValue);
                                if (sub.searchHint && onSearchChange) {
                                  onSearchChange(sub.searchHint);
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#FDF9EE] hover:text-[#0A2F42] font-semibold flex items-center justify-between group transition-colors"
                            >
                              <span className="truncate pr-2">{sub.label}</span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 group-hover:bg-[#F4B143] group-hover:text-black transition-colors">
                                {sub.priceHint}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between px-2 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          100% Duty-Free Sealed
                        </span>
                        <span className="font-mono text-[#0A2F42] font-bold">
                          {settings.expressDeliveryMinutes} Dubai
                        </span>
                      </div>
                    </div>

                    {/* Col 3: Spotlight Preview Card — hidden while the catalog is empty */}
                    {activeMegaCategory.subItems.length > 0 && (
                    <div className="col-span-3 bg-[#0A2F42] text-white p-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4B143]/20 text-[#F4B143] text-[9px] font-mono uppercase tracking-wider">
                          <Sparkles className="w-2.5 h-2.5" />
                          {activeMegaCategory.featuredInfo.origin}
                        </span>
                        <h4 className="font-display text-lg font-bold leading-snug text-white">
                          {activeMegaCategory.featuredInfo.title}
                        </h4>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {activeMegaCategory.featuredInfo.subtitle}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/15 space-y-2.5">
                        <div className="font-mono text-xs font-extrabold text-[#F4B143]">
                          {activeMegaCategory.featuredInfo.priceTag}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            applyFilter(
                              activeMegaCategory.filterType,
                              activeMegaCategory.filterValue
                            )
                          }
                          className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-[11px] flex items-center justify-center gap-1"
                        >
                          <span>Explore Now</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER: Clean Desktop Pill Navigation */}
            <nav className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
              {navItems.map((item) => {
                const isActive =
                  (item.filterType === "all" &&
                    selectedCategory === "all" &&
                    selectedBrand === "All") ||
                  (item.filterType === "category" &&
                    selectedCategory === item.filterValue) ||
                  (item.filterType === "brand" &&
                    selectedBrand === item.filterValue);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      applyFilter(item.filterType, item.filterValue)
                    }
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em] whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                      isActive
                        ? "bg-[#0A2F42] text-[#F4B143] shadow-sm"
                        : item.highlight
                        ? "bg-white/90 text-[#0A2F42] hover:bg-[#0A2F42] hover:text-white"
                        : "text-[#061823] hover:bg-black/10"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Secondary Products Quick Dropdown */}
              <div className="relative group hidden xl:block">
                <button
                  type="button"
                  onClick={() => applyFilter("category", "vapes")}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em] whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedCategory === "vapes" ||
                    selectedCategory === "e-liquid" ||
                    selectedCategory === "nicotine-pouches"
                      ? "bg-[#0A2F42] text-[#F4B143]"
                      : "text-[#061823] hover:bg-black/10"
                  }`}
                >
                  <span>VAPES &amp; MORE</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute right-0 top-full pt-1.5 z-50 w-52">
                  <div className="rounded-2xl bg-white border border-zinc-200 shadow-xl p-1.5 text-xs font-bold text-zinc-800 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => applyFilter("category", "nicotine-pouches")}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#FDF9EE] flex items-center justify-between"
                    >
                      <span>VELO &amp; Nicotine Pouches</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFilter("category", "vapes")}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#FDF9EE] flex items-center justify-between"
                    >
                      <span>Disposable Vapes &amp; Kits</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFilter("category", "e-liquid")}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#FDF9EE] flex items-center justify-between"
                    >
                      <span>VGOD E-Liquids</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFilter("category", "hookah-shisha")}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#FDF9EE] flex items-center justify-between"
                    >
                      <span>Al Fakher Shisha</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            {/* RIGHT: Social Media Capsule + Instant WhatsApp Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/10 text-[#061823]">
                {socials.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full hover:bg-[#0A2F42] hover:text-white flex items-center justify-center transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-3 h-3" />
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full hover:bg-[#0A2F42] hover:text-white flex items-center justify-center transition-colors"
                    title="X / Twitter"
                  >
                    <Twitter className="w-3 h-3" />
                  </a>
                )}
                {socials.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full hover:bg-[#0A2F42] hover:text-white flex items-center justify-center transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-3 h-3" />
                  </a>
                )}
                {socials.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full hover:bg-[#0A2F42] hover:text-white flex items-center justify-center transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-3 h-3" />
                  </a>
                )}
                {socials.pinterest && (
                  <a
                    href={socials.pinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full hover:bg-[#0A2F42] hover:text-white flex items-center justify-center font-serif font-bold text-[11px] transition-colors"
                    title="Pinterest"
                  >
                    P
                  </a>
                )}
              </div>

              <a
                href={`https://wa.me/${formatWhatsAppNumberForLink(
                  settings.whatsappNumber
                )}?text=${encodeURIComponent(
                  `Hello ${settings.storeName} (${settings.supportPhoneDisplay})! I would like to place an express cigarette order in Dubai.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 pl-3 pr-1 rounded-full bg-[#0A2F42] hover:bg-black text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Order Now</span>
                <span className="w-5 h-5 rounded-full bg-[#25D366] text-black flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 fill-current" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER MENU */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between p-5 overflow-y-auto shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <DubaiCigaretteLogo compact />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2">
                  Cigarette Brands &amp; Navigation
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      applyFilter(item.filterType, item.filterValue)
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold text-zinc-800 hover:bg-[#F4B143]/20 flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <span>→</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-200">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2">
                  All Store Categories
                </div>
                {BROWSE_MEGA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      applyFilter(cat.filterType, cat.filterValue)
                    }
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center justify-between"
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      View
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 space-y-2.5">
              <a
                href={`https://wa.me/${formatWhatsAppNumberForLink(
                  settings.whatsappNumber
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] text-black font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>
                  WhatsApp ({settings.supportPhoneDisplay || "+971 55 302 0429"})
                </span>
              </a>

              <Link
                href="/track"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 text-zinc-800 font-bold text-xs flex items-center justify-center gap-2"
              >
                <span>Track Order (/track)</span>
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A2F42] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-[#F4B143]" />
                <span>Open Admin Panel</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StoreFooter() {
  const { settings, setIsCartOpen, cart } = useStore();
  const socials = settings.socialLinks || {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    pinterest: "",
    tiktok: "",
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <WhatsAppAutomationBot />
      <footer className="bg-[#0A2F42] text-white mt-12 pt-10 pb-24 sm:pb-12 px-4 border-t-4 border-[#F4B143]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
          {/* Col 1: Brand & About */}
          <div className="md:col-span-5 space-y-3">
            <div className="text-2xl font-black tracking-tight">
              DUBAI<span className="text-[#F4B143]"> CIGARETTE</span> SHOP
            </div>
            <div className="text-[11px] font-mono text-[#F4B143]">
              Official Domain: https://dubaicigeretteshop.ae
            </div>
            <p className="text-zinc-300 leading-relaxed max-w-md">
              {settings.footerAboutText ||
                "Dubai's #1 24/7 Online Duty-Free Cigarette Carton Store (dubaicigeretteshop.ae — Marlboro, Dunhill, Davidoff, ESSE, Winston, Parliament) plus Heated Tobacco, Nicotine Pouches & Vapes."}
            </p>
            <div className="flex items-center gap-2 text-zinc-300 pt-1">
              <MapPin className="w-4 h-4 text-[#F4B143] shrink-0" />
              <span>
                {settings.storeAddressText ||
                  "Downtown Boulevard & Dragon Mart Hub, Dubai, UAE"}
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links & AI Index */}
          <div className="md:col-span-4 space-y-2">
            <div className="font-mono uppercase tracking-wider text-[#F4B143] font-bold">
              Quick Links &amp; AI Search Index
            </div>
            <ul className="space-y-1.5 text-zinc-300">
              <li>
                <Link href="/" className="hover:text-[#F4B143]">
                  All Dubai Cigarette Cartons (dubaicigeretteshop.ae)
                </Link>
              </li>
              <li>
                <Link
                  href="/#dubai-cigarette-guide"
                  className="hover:text-[#F4B143]"
                >
                  2026 Dubai Cigarette Price Matrix &amp; FAQ
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#F4B143] font-bold">
                  Track Your Order (/track)
                </Link>
              </li>
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  className="hover:text-[#F4B143] underline"
                >
                  AI / LLM Catalog Index (/llms.txt)
                </a>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-[#25D366] font-bold hover:underline"
                >
                  Website Admin Control Panel (/admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: 24/7 WhatsApp & Social Media Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-mono uppercase tracking-wider text-[#F4B143] font-bold">
              24/7 WhatsApp &amp; Socials
            </div>
            <a
              href={`https://wa.me/${formatWhatsAppNumberForLink(
                settings.whatsappNumber
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-black font-extrabold"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{settings.supportPhoneDisplay || "+971 55 302 0429"}</span>
            </a>

            <div className="flex items-center gap-2 pt-2">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F4B143] hover:text-black flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F4B143] hover:text-black flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F4B143] hover:text-black flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F4B143] hover:text-black flex items-center justify-center transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {socials.pinterest && (
                <a
                  href={socials.pinterest}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F4B143] hover:text-black flex items-center justify-center font-serif font-bold text-sm transition-colors"
                >
                  P
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE BOTTOM 1-CLICK WHATSAPP BAR + DESKTOP FLOATING BUTTON */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:bottom-5 sm:right-5 sm:left-auto bg-[#071E2B]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-white/15 sm:border-none p-2 sm:p-0 flex items-center justify-between sm:justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-full bg-[#0A2F42] text-white border border-[#F4B143]/50 text-xs font-bold flex items-center gap-2 shadow-lg"
        >
          <ShoppingCart className="w-4 h-4 text-[#F4B143]" />
          <span>Cart ({totalCartItems})</span>
        </button>

        <a
          href={`https://wa.me/${formatWhatsAppNumberForLink(
            settings.whatsappNumber
          )}?text=${encodeURIComponent(
            `Hello ${settings.storeName}! I want to place a 1-Click WhatsApp cigarette order in Dubai.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-full bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>
            {settings.whatsappFloatButtonLabel || "1-Click WhatsApp Order"} •{" "}
            {settings.supportPhoneDisplay || "+971 55 302 0429"}
          </span>
        </a>
      </div>
    </>
  );
}
