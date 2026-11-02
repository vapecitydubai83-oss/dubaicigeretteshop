"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { useStore } from "@/context/store-context";
import { CategoryId } from "@/lib/catalog-data";
import { ProductCard } from "@/components/product-card";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";

const CATEGORY_META: Record<string, { title: string; blurb: string }> = {
  cigarettes: {
    title: "Duty-Free Cigarettes",
    blurb:
      "Factory-sealed 10-pack master cartons — Marlboro, Dunhill, Davidoff, ESSE, Winston, Parliament, Vogue, West and more, delivered in 45–60 minutes across Dubai.",
  },
  "iqos-terea": {
    title: "IQOS & TEREA",
    blurb:
      "IQOS ILUMA devices and genuine TEREA sticks — Japan, Kazakhstan, Italy and UAE editions in stock.",
  },
  vapes: {
    title: "Vapes & Disposables",
    blurb:
      "Disposable vapes, pod kits and mods — Elf Bar, Vozol, Tugboat, HQD, Fummo, OXVA, Vaporesso, VOOPOO and more.",
  },
  "e-liquid": {
    title: "E-Liquids",
    blurb:
      "Freebase and salt-nic e-liquids — Nasty, Ruthless, Pod Salt, Sam's Vape, Tokyo and Dr Vapes ranges.",
  },
  "nicotine-pouches": {
    title: "Nicotine Pouches",
    blurb:
      "Tobacco-free nicotine pouches — VELO, White Fox, Killa and Pablo in every strength.",
  },
  "hookah-shisha": {
    title: "Hookah & Shisha",
    blurb:
      "Al Fakher shisha molasses, hookah devices and charcoal — 50g, 250g and 1kg sizes.",
  },
  accessories: {
    title: "Accessories & Lighters",
    blurb:
      "Vape batteries, chargers, lighters, coils and spare parts — genuine UAE stock.",
  },
};

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const categoryId = (params?.id || "") as Exclude<CategoryId, "all">;
  const meta = CATEGORY_META[categoryId];

  const { products } = useStore();

  const items = useMemo(() => {
    if (!meta) return [];
    return products.filter((p) => p.category === categoryId);
  }, [products, categoryId, meta]);

  const brandSections = useMemo(() => {
    const byBrand = new Map<string, typeof items>();
    for (const p of items) {
      const arr = byBrand.get(p.brand) || [];
      arr.push(p);
      byBrand.set(p.brand, arr);
    }
    return [...byBrand.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([brand, list]) => ({ brand, list }));
  }, [items]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#F5F2EA]">
        <StoreHeader />
        <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold text-[#0A2F42]">
            Category not found
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            This category does not exist. Browse the full catalog instead.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-[#0A2F42] text-white text-sm font-extrabold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <WhatsAppCartDrawer />
      <StoreHeader selectedCategory={categoryId} />

      <section className="max-w-[1280px] mx-auto px-3 sm:px-6 pt-4 pb-10">
        <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 mb-3">
          <Link href="/" className="hover:text-[#0A2F42]">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0A2F42]">{meta.title}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2F42] tracking-tight">
              {meta.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
              {meta.blurb}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Duty-Free Sealed
            </span>
            <span className="inline-flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-[#F4B143]" />
              45–60 Mins Dubai
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#0A2F42] text-[#F4B143] font-mono">
              {items.length} items
            </span>
          </div>
        </div>

        {brandSections.map((sec) => (
          <div key={sec.brand} className="mb-8">
            <h2 className="text-sm sm:text-base font-extrabold text-[#0A2F42] border-b-2 border-[#F4B143] inline-block pb-1 mb-3">
              {sec.brand}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {sec.list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-24 text-center text-zinc-400 text-sm font-semibold">
            No products in this category yet.
          </div>
        )}
      </section>

      <StoreFooter />
    </div>
  );
}
