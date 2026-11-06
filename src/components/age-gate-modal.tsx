"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

const AGE_KEY = "ec_dubai_age_verified_v1";

export function AgeGateModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const verified = localStorage.getItem(AGE_KEY);
      if (!verified) {
        setShow(true);
      }
    } catch {
      setShow(false);
    }
  }, []);

  const handleConfirm = () => {
    try {
      localStorage.setItem(AGE_KEY, "true");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
      {/* Double-Bezel Outer Shell */}
      <div className="w-full max-w-md p-2 rounded-[2.25rem] bg-white/5 border border-[#D4AF37]/30 shadow-[0_32px_90px_rgba(0,0,0,0.85)]">
        {/* Inner Core */}
        <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] bg-[#0B0B0F] p-7 sm:p-9 text-center border border-white/10">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.22em] text-[#D4AF37] mb-3">
            <Sparkles className="w-3 h-3" /> UAE Federal Compliance • 18+ Only
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Dubai Cigarette Shop Concierge
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Welcome to Dubai&apos;s premier tobacco &amp; carton concierge.
            In accordance with UAE Federal Law No. 15 of 2009 regarding Tobacco Control,
            you must be at least <strong className="text-white">18 years of age</strong> to
            browse or order via WhatsApp.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#e3be42] text-black font-semibold text-xs uppercase tracking-[0.16em] transition-all duration-500 ease-luxury active:scale-[0.98]"
            >
              I am 18+ • Enter Store
            </button>
            <a
              href="https://www.google.ae"
              className="py-3.5 px-5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
            >
              Exit
            </a>
          </div>

          <p className="mt-5 text-[11px] font-mono text-zinc-500">
            Ministry of Health Warning: Smoking is a main cause of lung diseases &amp; cardiovascular conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
