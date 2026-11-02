"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/lib/catalog-data";

export function ProductPackArt({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [product.customImageUrl]);

  const escapedBrand = (product.brand || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  // Extract short variant subtitle (e.g. "gold", "red", "silver blue", "touch")
  const variantLabel = product.title
    .replace(new RegExp(`^${escapedBrand}\\s*`, "i"), "")
    .replace(/original|classic|carton|uae edition|king size/gi, "")
    .trim()
    .toLowerCase();

  const showImg = Boolean(product.customImageUrl) && !imgFailed;

  if (compact) {
    return (
      <div className="relative h-24 w-20 rounded-lg bg-[#FDF9EE] border-2 border-[#F5B959] flex flex-col items-center justify-between p-1.5 overflow-hidden select-none shadow-sm">
        {showImg ? (
          <img
            src={product.customImageUrl}
            alt={product.title}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <span className="text-[6px] font-bold tracking-tighter text-[#0D2E3F]">
              DUBAI<span className="text-[#F3AB3C]">CIG</span>
            </span>
            <div className="text-center">
              <div className="font-display font-bold text-xs text-[#0B2A3D] leading-none">
                {product.brand}
              </div>
              <div
                className="text-[8px] font-semibold leading-tight truncate max-w-[64px]"
                style={{ color: product.accentColor }}
              >
                {variantLabel || "classic"}
              </div>
            </div>
            <div
              className="w-full h-6 rounded-sm border border-black/15 flex items-center justify-between px-1"
              style={{ backgroundColor: product.accentColor }}
            >
              <span className="text-[6px] font-display text-white font-bold truncate">
                {product.brand}
              </span>
              <span className="bg-white text-black text-[5px] font-bold px-0.5 leading-tight border border-black">
                Smoking kills
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3.6] rounded-md bg-[#F7BA56] p-2.5 select-none overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
      {/* Inner Cream Stage with Subtle Diamond Lattice Pattern */}
      <div
        className="relative w-full h-full bg-[#FCF9F0] border border-[#E8D7B4] flex flex-col items-center justify-between pt-3 pb-2 px-3 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(212, 175, 55, 0.06) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(212, 175, 55, 0.06) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(212, 175, 55, 0.06) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(212, 175, 55, 0.06) 75%)
          `,
          backgroundSize: "34px 34px",
        }}
      >
        {showImg ? (
          <img
            src={product.customImageUrl}
            alt={product.title}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            {/* Bottom Amber Pedestal Strip (matches VAP DXB card bottom) */}
            <div className="absolute bottom-0 inset-x-0 h-8 bg-[#F4B143]" />

            {/* Top Mini Dubai Cigarette Shop Emblem */}
            <div className="relative z-10 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0A2F42] text-[#F4B143] text-[7px] font-black">
                DC
              </span>
              <span className="text-[9px] font-extrabold tracking-tight text-[#0A2F42]">
                DUBAI<span className="text-[#F4B143]">CIGARETTE</span>
              </span>
            </div>

            {/* Center Condensed Serif Brand + Variant Title */}
            <div className="relative z-10 text-center -mt-1">
              <div className="font-display text-3xl sm:text-[2.1rem] font-bold tracking-tight text-[#0B2A3D] leading-none">
                {product.brand}
              </div>
              <div
                className="text-xs sm:text-sm font-semibold tracking-wide mt-0.5"
                style={{ color: product.accentColor }}
              >
                {variantLabel || "original"}
              </div>
            </div>

            {/* Stacked Horizontal Cigarette Carton sleeves (Authentic VAP DXB visual) */}
            <div className="relative z-10 w-[92%] mt-auto flex flex-col items-center transition-transform duration-500 group-hover:scale-[1.03]">
              {/* Top Carton Sleeve */}
              <div className="w-full h-8 bg-white border border-zinc-300 shadow-sm flex items-center justify-between px-2.5 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 w-3"
                  style={{ backgroundColor: product.accentColor }}
                />
                <span
                  className="pl-2 font-display font-bold text-sm tracking-tight truncate"
                  style={{ color: product.accentColor }}
                >
                  {product.brand}
                </span>
                <div className="border border-black bg-white px-1.5 py-0.5 text-[7px] font-bold text-black leading-none text-center shrink-0">
                  Smoking
                  <br />
                  kills
                </div>
              </div>

              {/* Middle Carton Sleeve */}
              <div
                className="w-[98%] h-6 border-x border-zinc-300 flex items-center justify-center px-2 shadow-sm"
                style={{
                  background: `linear-gradient(90deg, #FFFFFF 0%, ${product.boxSecondaryColor} 50%, #FFFFFF 100%)`,
                }}
              >
                <span className="font-display font-bold text-xs tracking-wide text-zinc-700">
                  {product.brand}{" "}
                  <span className="text-[9px] font-sans uppercase opacity-75">
                    10×20
                  </span>
                </span>
              </div>

              {/* Bottom Base Carton Sleeve with Health Warning Box */}
              <div
                className="w-full h-9 border border-zinc-400/80 shadow-md flex items-center justify-between px-2 relative overflow-hidden"
                style={{ backgroundColor: product.accentColor }}
              >
                <div className="bg-white/95 px-1 py-0.5 text-[6px] font-mono text-black leading-none border border-black/20">
                  ||||| ||||
                </div>

                <span className="font-display font-bold text-base text-white drop-shadow-sm tracking-tight truncate px-1">
                  {product.brand}
                </span>

                <div className="bg-white border-2 border-black px-1.5 py-0.5 text-[7px] font-extrabold text-black leading-tight text-center shrink-0">
                  Smokers die
                  <br />
                  younger
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
