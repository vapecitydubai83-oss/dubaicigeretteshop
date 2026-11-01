"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MessageCircle,
  Search,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatWhatsAppNumberForLink } from "@/lib/catalog-data";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";

const STEPS = [
  "New WhatsApp Lead",
  "Confirmed",
  "Out for Delivery",
  "Delivered",
] as const;

export default function TrackOrderPage() {
  const { orders, settings } = useStore();
  const [queryId, setQueryId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.id || "EC-8841"
  );

  const matchedOrder = useMemo(() => {
    const clean = queryId.trim().replace(/^#/, "").toUpperCase();
    if (clean) {
      return orders.find(
        (o) =>
          o.id.toUpperCase() === clean ||
          o.customerPhone.includes(clean) ||
          o.customerName.toLowerCase().includes(clean.toLowerCase())
      );
    }
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
  }, [orders, queryId, selectedOrderId]);

  const activeStepIndex = matchedOrder
    ? STEPS.indexOf(
        matchedOrder.status === "Cancelled"
          ? "New WhatsApp Lead"
          : matchedOrder.status
      )
    : 0;

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-zinc-900 font-sans">
      <WhatsAppCartDrawer />
      <StoreHeader />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-1 rounded bg-[#0A2F42] text-[#F4B143] text-xs font-mono uppercase tracking-wider font-bold">
                LIVE DUBAI RIDER TRACKING
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1.5">
                Track Your WhatsApp Cigarette Order
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                Enter your Order ID (e.g. #EC-8841) or select from recent orders
                below.
              </p>
            </div>

            <Link
              href="/admin"
              className="text-xs font-mono text-[#0A2F42] underline font-bold"
            >
              Admin: Update Order Status →
            </Link>
          </div>

          {/* Search Input + Quick Recent Order Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Type Order ID (e.g. EC-8841) or Customer Name..."
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0A2F42]"
              />
            </div>

            <div className="sm:col-span-5">
              <select
                value={selectedOrderId}
                onChange={(e) => {
                  setQueryId("");
                  setSelectedOrderId(e.target.value);
                }}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm font-bold text-[#0A2F42]"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.customerName} ({o.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matched Order Live Progress Card */}
          {matchedOrder ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#FDF9EE] border-2 border-[#F4B143] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-[#0A2F42]">
                      #{matchedOrder.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0A2F42] text-white text-xs font-bold">
                      {matchedOrder.status}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-800 mt-1">
                    Client: {matchedOrder.customerName} •{" "}
                    {matchedOrder.deliveryArea}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">
                    Total Payable ({matchedOrder.paymentMethod})
                  </span>
                  <span className="font-mono text-2xl font-black text-[#0A2F42]">
                    د.إ{matchedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 4-Step Visual Progress Tracker */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? "bg-[#0A2F42] text-white border-[#0A2F42] shadow-md"
                          : isCompleted
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                          : "bg-white/70 text-zinc-400 border-zinc-200"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-bold bg-black/10">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="text-xs font-extrabold">{step}</div>
                    </div>
                  );
                })}
              </div>

              {/* Items & Direct Rider WhatsApp Contact */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-zinc-700">Ordered Items:</div>
                  {matchedOrder.items.map((item, i) => (
                    <div key={i} className="font-mono text-zinc-900">
                      • {item.title} ({item.packTier}) × {item.quantity} — د.إ
                      {item.unitPrice * item.quantity}
                    </div>
                  ))}
                </div>

                <a
                  href={`https://wa.me/${formatWhatsAppNumberForLink(
                    settings.whatsappNumber
                  )}?text=${encodeURIComponent(
                    `Hello ${settings.storeName}! Checking live rider ETA for my Order #${matchedOrder.id} (${matchedOrder.deliveryArea}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs inline-flex items-center gap-2 shadow"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp Dispatch (+971 55 302 0429)</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-2">
              <p className="font-bold text-sm">
                No order found matching &quot;{queryId}&quot;
              </p>
              <p className="text-xs text-zinc-500">
                Try selecting one of the active orders in the dropdown above.
              </p>
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
