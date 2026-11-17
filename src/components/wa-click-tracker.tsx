"use client";

import { useEffect } from "react";

// Tells /api/wa-click which page (and which button) opened WhatsApp. Never blocks or delays the tap.
export function trackWa(label: string) {
  try {
    const body = JSON.stringify({ path: window.location.pathname, label });
    if (!navigator.sendBeacon?.("/api/wa-click", new Blob([body], { type: "application/json" }))) {
      fetch("/api/wa-click", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch {}
}

// One listener for every wa.me link on the site (header, product, footer, bot...), so no button needs its own code.
export default function WaClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
      if (!a) return;
      trackWa(a.dataset.wa || a.getAttribute("aria-label") || (a.textContent || "").trim() || "link");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
