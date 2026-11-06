"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, Plus, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/catalog-data";
import { useStore } from "@/context/store-context";
import { ProductPackArt } from "@/components/product-pack-art";

export function ProductCard({
  product,
  isLightTheme = true,
}: {
  product: Product;
  isLightTheme?: boolean;
}) {
  const { addToCart, triggerSingleClickWhatsApp } = useStore();
  const [packTier, setPackTier] = useState<"1-carton" | "5-cartons">("1-carton");
  const [justAdded, setJustAdded] = useState(false);

  const activePrice =
    packTier === "5-cartons" ? product.fiveCartonPrice : product.cartonPrice;

  const handleAdd = () => {
    addToCart(product, packTier, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div
      className={`group rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isLightTheme
          ? "bg-white border-zinc-200/90 hover:border-[#F4B143] hover:shadow-lg text-zinc-900"
          : "bg-[#12131A] border-white/10 hover:border-[#F4B143]/60 hover:shadow-2xl text-white"
      }`}
    >
      {/* Clickable Top Gold-Framed VAP DXB Style Carton Image -> Product Detail Page */}
      <Link href={`/product/${product.id}`} className="block p-2 sm:p-2.5 pb-0 relative">
        <ProductPackArt product={product} />
      </Link>

      {/* Card Body: Clean VAP DXB Centered Info + Instant WhatsApp Action */}
      <div className="p-2.5 sm:p-4 pt-2 sm:pt-2.5 flex-1 flex flex-col justify-between text-center">
        <div>
          <span
            className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-medium block ${
              isLightTheme ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            {product.subCategory
              ? product.subCategory
              : product.category === "cigarettes"
              ? "Cigarettes"
              : product.category === "iqos-terea"
              ? "Heated Tobacco"
              : product.category === "e-liquid"
              ? "E-Liquid"
              : product.category === "nicotine-pouches"
              ? "Nicotine Pouches"
              : product.category === "accessories"
              ? "Accessories"
              : product.category === "hookah-shisha"
              ? "Hookah & Shisha"
              : "Vape Devices"}
          </span>

          <Link
            href={`/product/${product.id}`}
            className="mt-0.5 font-sans text-sm sm:text-base font-bold leading-snug line-clamp-1 hover:text-[#F4B143] transition-colors block"
          >
            {product.title}
          </Link>

          <p
            className={`text-[10px] sm:text-[11px] mt-0.5 font-mono ${
              isLightTheme ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            Tar: {product.tar} • Nic: {product.nicotine}
          </p>

          {/* Pack Tier Pill Toggle (1 Carton vs 5 Cartons Bulk) */}
          <div
            className={`mt-2 inline-flex p-0.5 rounded-lg text-[10px] font-mono border ${
              isLightTheme
                ? "bg-zinc-100 border-zinc-200"
                : "bg-black/50 border-white/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setPackTier("1-carton")}
              className={`px-2 py-1 rounded-md transition-colors ${
                packTier === "1-carton"
                  ? "bg-[#0A2F42] text-white font-semibold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              1 Carton
            </button>
            <button
              type="button"
              onClick={() => setPackTier("5-cartons")}
              className={`px-1.5 sm:px-2 py-1 rounded-md transition-colors ${
                packTier === "5-cartons"
                  ? "bg-[#F4B143] text-black font-semibold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <span className="sm:hidden">5 Cartons</span>
              <span className="hidden sm:inline">5 Cartons VIP</span>
            </button>
          </div>

          {/* Authentic UAE Dirham Price (د.إ200.00) — wraps on narrow mobile cards */}
          <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5">
            {packTier === "1-carton" && product.oldPrice && (
              <span className="text-[10px] sm:text-[11px] line-through opacity-45 font-mono whitespace-nowrap">
                د.إ{product.oldPrice.toFixed(2)}
              </span>
            )}
            <span
              className={`text-sm sm:text-lg font-extrabold font-mono whitespace-nowrap ${
                isLightTheme ? "text-[#0A2F42]" : "text-[#F4B143]"
              }`}
            >
              د.إ{activePrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bottom Action Row: Add to Cart + Direct 1-Click WhatsApp Order (never clips on mobile) */}
        <div className="mt-3 pt-2.5 border-t border-current/10 flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            disabled={!product.inStock}
            onClick={handleAdd}
            className={`px-2 sm:px-2.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-all shrink-0 ${
              justAdded
                ? "bg-emerald-600 text-white"
                : isLightTheme
                ? "bg-[#0A2F42] hover:bg-[#11435c] text-white"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Add to Cart"
          >
            {justAdded ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <Plus className="w-3 h-3 -ml-1" />
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => triggerSingleClickWhatsApp(product, packTier)}
            className="flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-lg bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-[10px] sm:text-xs inline-flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="sm:hidden whitespace-nowrap">WhatsApp</span>
            <span className="hidden sm:inline truncate">1-Click WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
