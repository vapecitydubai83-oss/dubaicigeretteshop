"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { DUBAI_AREAS, WhatsAppOrder } from "@/lib/catalog-data";

export function WhatsAppCartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQty,
    removeFromCart,
    settings,
    submitCartToWhatsApp,
    customerProfile,
  } = useStore();

  const [customerName, setCustomerName] = useState(customerProfile.name);
  const [customerPhone, setCustomerPhone] = useState(customerProfile.phone);
  const [deliveryArea, setDeliveryArea] = useState(
    customerProfile.area || DUBAI_AREAS[0]
  );

  // Sync saved customer profile once localStorage hydrates
  useEffect(() => {
    if (customerProfile.name && !customerName) setCustomerName(customerProfile.name);
    if (customerProfile.phone && !customerPhone) setCustomerPhone(customerProfile.phone);
    if (customerProfile.area) setDeliveryArea(customerProfile.area);
  }, [customerProfile.name, customerProfile.phone, customerProfile.area]);
  const [addressNote, setAddressNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<WhatsAppOrder["paymentMethod"]>("Cash on Delivery");
  const [lastOrder, setLastOrder] = useState<WhatsAppOrder | null>(null);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const deliveryFee =
    subtotal >= settings.freeDeliveryThreshold || subtotal === 0
      ? 0
      : settings.standardDeliveryFee;
  const total = subtotal + deliveryFee;
  const amountToFreeDelivery = Math.max(
    0,
    settings.freeDeliveryThreshold - subtotal
  );
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / settings.freeDeliveryThreshold) * 100)
  );

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const order = submitCartToWhatsApp({
      customerName,
      customerPhone,
      deliveryArea,
      addressNote,
      paymentMethod,
    });
    if (order) {
      setLastOrder(order);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xl animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={() => {
          setLastOrder(null);
          setIsCartOpen(false);
        }}
      />

      <div className="relative z-10 w-full max-w-lg bg-[#0A0A0E] text-[#F8F6F0] border-l border-white/10 h-[100dvh] flex flex-col justify-between shadow-[0_0_90px_rgba(0,0,0,0.9)]">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Dubai WhatsApp Cart
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                {settings.expressDeliveryMinutes} Express Dispatch • Duty-Free Sealed
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setLastOrder(null);
              setIsCartOpen(false);
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close Cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        <div className="px-6 py-3 bg-[#121218] border-b border-white/10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
              {amountToFreeDelivery === 0 ? (
                <strong className="text-emerald-400">
                  Unlocked FREE 45-Min Dubai Express Delivery!
                </strong>
              ) : (
                <span>
                  Add{" "}
                  <strong className="text-[#D4AF37] font-mono">
                    AED {amountToFreeDelivery}
                  </strong>{" "}
                  more for FREE Dubai Express Delivery
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] text-[#D4AF37]">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {lastOrder ? (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                Order Logged • #{lastOrder.id}
              </div>
              <h3 className="font-display text-3xl font-semibold">
                Redirected to WhatsApp Concierge
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Your itemized carton order{" "}
                <strong className="text-white">#{lastOrder.id}</strong> (AED{" "}
                {lastOrder.total}) has been formatted for WhatsApp and logged in
                the Admin Dispatch Board.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLastOrder(null);
                  setIsCartOpen(false);
                }}
                className="px-6 py-3 rounded-full bg-[#D4AF37] text-black text-xs font-semibold uppercase tracking-wider"
              >
                Continue Browsing
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-display text-2xl text-zinc-200">
                Your Carton Tray is Empty
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Select Marlboro, Dunhill, Davidoff, ESSE, or IQOS Terea cartons
                to build a multi-item WhatsApp invoice, or use{" "}
                <span className="text-[#25D366]">1-Click WhatsApp Buy</span> on
                any card.
              </p>
            </div>
          ) : (
            <>
              {/* Itemized List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">
                          {item.product.brand}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                          {item.packTier === "5-cartons"
                            ? "5 Cartons Bundle"
                            : "1 Carton (10Pk)"}
                        </span>
                      </div>
                      <h4 className="font-display text-lg font-medium truncate mt-0.5">
                        {item.product.title}
                      </h4>
                      <div className="text-xs font-mono text-zinc-400">
                        AED {item.unitPrice} × {item.quantity} ={" "}
                        <strong className="text-white">
                          AED {item.unitPrice * item.quantity}
                        </strong>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, -1)}
                        className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, 1)}
                        className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Express Dubai Delivery Mini-Form */}
              <form
                id="wa-checkout-form"
                onSubmit={handleCheckout}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dubai Concierge Dispatch Info</span>
                </div>
                <p className="text-[10px] text-zinc-500 -mt-1">
                  Your name &amp; WhatsApp number are saved on this device for
                  1-tap reorders and VIP offers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Sheikh / Mr. Tariq"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Mobile / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+971 50 XXX XXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1 text-[#D4AF37]" />
                    Delivery Zone — Express (45–75 min) or Courier (next-day)
                  </label>
                  <select
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {DUBAI_AREAS.map((area) => (
                      <option key={area} value={area} className="bg-[#0A0A0E]">
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Tower / Villa / Hotel Concierge Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Address Downtown Lobby, or I'll send WhatsApp Pin"
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                    Payment on Delivery
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        "Cash on Delivery",
                        "Card on Delivery",
                        "Apple Pay / Link",
                      ] as const
                    ).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setPaymentMethod(mode)}
                        className={`py-2 px-2 rounded-xl text-[10px] font-mono border transition-all ${
                          paymentMethod === mode
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB] font-semibold"
                            : "bg-black/40 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && !lastOrder && (
          <div className="p-6 border-t border-white/10 bg-[#0D0D12] space-y-4">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Cartons Subtotal</span>
                <span>AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Dubai Rider Express</span>
                <span className={deliveryFee === 0 ? "text-emerald-400" : ""}>
                  {deliveryFee === 0 ? "FREE" : `AED ${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                <span>Total Payable</span>
                <span className="text-[#D4AF37]">AED {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="wa-checkout-form"
              className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-black font-semibold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 shadow-[0_12px_35px_rgba(37,211,102,0.3)] transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Send Invoice to WhatsApp • AED {total.toFixed(0)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
