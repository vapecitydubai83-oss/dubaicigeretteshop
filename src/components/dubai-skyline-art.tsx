"use client";

import React from "react";
import { ThemeId } from "@/lib/catalog-data";

export function DubaiSkylineArt({ theme }: { theme: ThemeId }) {
  const isLight = theme === "future-glass";
  const isSunset = theme === "royal-sunset";

  const strokePrimary = isLight
    ? "#0B132B"
    : isSunset
    ? "#EAB308"
    : "#D4AF37";

  const strokeSecondary = isLight
    ? "#2563EB"
    : isSunset
    ? "#F97316"
    : "#F3E5AB";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Ambient Radial Orbs */}
      {theme === "midnight-gold" && (
        <>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[920px] h-[540px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,rgba(212,175,55,0.04)_45%,transparent_75%)]" />
          <div className="absolute bottom-0 right-10 w-[560px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(37,211,102,0.10)_0%,transparent_70%)]" />
        </>
      )}

      {theme === "future-glass" && (
        <>
          <div className="absolute -top-24 right-1/4 w-[820px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.11)_0%,rgba(14,165,233,0.05)_45%,transparent_75%)]" />
          <div className="absolute bottom-0 left-10 w-[620px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.10)_0%,transparent_70%)]" />
        </>
      )}

      {theme === "royal-sunset" && (
        <>
          <div className="absolute -top-28 left-1/3 w-[980px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.22)_0%,rgba(202,138,4,0.08)_48%,transparent_75%)]" />
          <div className="absolute bottom-0 right-1/4 w-[640px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)]" />
        </>
      )}

      {/* Architectural SVG Panorama: Burj Khalifa + Museum of the Future + Burj Al Arab */}
      <svg
        viewBox="0 0 1440 720"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full object-cover object-bottom transition-opacity duration-700 ${
          isLight ? "opacity-25" : "opacity-35"
        }`}
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="spireGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeSecondary} stopOpacity="0.95" />
            <stop offset="60%" stopColor={strokePrimary} stopOpacity="0.45" />
            <stop offset="100%" stopColor={strokePrimary} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="towerFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokePrimary} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokePrimary} stopOpacity="0.0" />
          </linearGradient>
          <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={strokeSecondary} stopOpacity="0.9" />
            <stop offset="100%" stopColor={strokePrimary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle Perspectives Grid */}
        <path
          d="M0 660 H1440 M0 690 H1440 M180 640 L60 720 M380 640 L300 720 M580 640 L540 720 M860 640 L900 720 M1060 640 L1140 720 M1260 640 L1380 720"
          stroke={strokePrimary}
          strokeOpacity="0.16"
          strokeWidth="1"
        />

        {/* LEFT LANDMARK: Burj Al Arab Iconic Sail Silhouette */}
        <g transform="translate(150, 290)">
          {/* Mast */}
          <line
            x1="70"
            y1="10"
            x2="70"
            y2="370"
            stroke="url(#spireGrad)"
            strokeWidth="2.5"
          />
          {/* Helipad Cantilever */}
          <ellipse
            cx="52"
            cy="95"
            rx="24"
            ry="4"
            fill={strokePrimary}
            fillOpacity="0.45"
          />
          {/* Bellowing Sail Curve */}
          <path
            d="M70 35 C155 110 165 245 125 370 L70 370 Z"
            fill="url(#towerFill)"
            stroke={strokePrimary}
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
          {/* Horizontal Structural Trusses */}
          <path
            d="M70 130 Q120 135 138 150 M70 190 Q125 195 145 210 M70 250 Q125 255 142 270 M70 310 Q118 312 134 325"
            stroke={strokePrimary}
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        </g>

        {/* Surrounding DIFC / Downtown High-Rises */}
        <g stroke={strokePrimary} strokeOpacity="0.22" fill="url(#towerFill)">
          <rect x="420" y="420" width="38" height="240" />
          <rect x="470" y="370" width="44" height="290" />
          <polygon points="530,330 572,300 572,660 530,660" />
          {/* Emirates Towers Twin Triangles */}
          <polygon points="600,260 634,295 634,660 600,660" />
          <polygon points="650,295 680,325 680,660 650,660" />
          <rect x="970" y="360" width="46" height="300" />
          <rect x="1030" y="410" width="40" height="250" />
        </g>

        {/* CENTERPIECE: THE BURJ KHALIFA (Stepped Setback Needle) */}
        <g transform="translate(755, 18)">
          {/* Pinnacle Beacon Light */}
          <circle cx="80" cy="14" r="24" fill="url(#beaconGlow)" />
          <circle cx="80" cy="14" r="3.5" fill={strokeSecondary} />

          {/* Main Needle Spire */}
          <line
            x1="80"
            y1="14"
            x2="80"
            y2="642"
            stroke="url(#spireGrad)"
            strokeWidth="2.5"
          />

          {/* Stepped Architectural Tiers of Burj Khalifa */}
          <path
            d="
              M80 14
              L83 95 L87 95
              L87 165 L93 165
              L93 235 L100 235
              L100 305 L109 305
              L109 380 L119 380
              L119 455 L131 455
              L131 535 L145 535
              L145 642
              L15 642
              L15 535 L29 535
              L29 455 L41 455
              L41 380 L51 380
              L51 305 L60 305
              L60 235 L67 235
              L67 165 L73 165
              L73 95 L77 95
              Z
            "
            fill="url(#towerFill)"
            stroke="url(#spireGrad)"
            strokeWidth="1.4"
          />

          {/* Vertical Fluted Glass Ribs */}
          <path
            d="M67 165 V642 M93 165 V642 M51 305 V642 M109 305 V642 M29 455 V642 M131 455 V642"
            stroke={strokePrimary}
            strokeOpacity="0.28"
            strokeWidth="0.9"
          />

          {/* Horizontal Observation Deck Rings (At The Top Level 124/148) */}
          <line
            x1="60"
            y1="235"
            x2="100"
            y2="235"
            stroke={strokeSecondary}
            strokeWidth="2"
          />
          <line
            x1="51"
            y1="305"
            x2="109"
            y2="305"
            stroke={strokeSecondary}
            strokeOpacity="0.8"
            strokeWidth="1.5"
          />
          <line
            x1="41"
            y1="380"
            x2="119"
            y2="380"
            stroke={strokePrimary}
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
        </g>

        {/* RIGHT LANDMARK: MUSEUM OF THE FUTURE (Torus Orbital Ring) */}
        <g transform="translate(1135, 435)">
          <ellipse
            cx="105"
            cy="115"
            rx="92"
            ry="64"
            fill="url(#towerFill)"
            stroke={strokePrimary}
            strokeOpacity="0.55"
            strokeWidth="2"
          />
          <ellipse
            cx="105"
            cy="115"
            rx="46"
            ry="28"
            fill={isLight ? "#F4F5F7" : "#070709"}
            fillOpacity="0.85"
            stroke={strokeSecondary}
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          {/* Calligraphic Arc Lines */}
          <path
            d="M28 95 Q105 45 182 95 M24 130 Q105 175 186 130"
            stroke={strokePrimary}
            strokeOpacity="0.32"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
        </g>
      </svg>
    </div>
  );
}
