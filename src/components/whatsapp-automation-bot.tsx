"use client";

import React, { useState } from "react";
import {
  Bot,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Send,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import {
  DUBAI_AREAS,
  formatWhatsAppNumberForLink,
  Product,
} from "@/lib/catalog-data";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  productSuggestion?: Product;
}

export function WhatsAppAutomationBot() {
  const { products, settings, triggerSingleClickWhatsApp, addToCart } =
    useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product>(
    products[0]
  );
  const [selectedPackTier, setSelectedPackTier] = useState<
    "1-carton" | "5-cartons"
  >("1-carton");
  const [selectedArea, setSelectedArea] = useState<string>(DUBAI_AREAS[0]);
  const [showOrderWizard, setShowOrderWizard] = useState(false);

  const botConfig = settings.whatsappBot || {
    enabled: true,
    botName: "Dubai Cigarette Shop Automated WhatsApp Concierge",
    welcomeMessage:
      "Marhaba! Welcome to Dubai Cigarette Shop (+971 55 302 0429). I can help you order Cigarette Cartons or secondary Vape/Terea items in 30 seconds!",
    autoReplyDelayMs: 450,
    webhookVerifyToken: "vapdxb_uae_verify_2026",
    cloudApiAccessToken: "",
    cloudApiPhoneNumberId: "",
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: botConfig.welcomeMessage,
      timestamp: "Just now",
    },
  ]);

  if (!botConfig.enabled) return null;

  const generateSmartReply = (query: string): { text: string; product?: Product } => {
    const q = query.toLowerCase();

    // Check if customer mentions a specific brand or product
    const matchedProduct = products.find(
      (p) =>
        q.includes(p.title.toLowerCase()) ||
        q.includes(p.brand.toLowerCase()) ||
        (q.includes("marlboro") && p.brand === "Marlboro") ||
        (q.includes("dunhill") && p.brand === "Dunhill") ||
        (q.includes("davidoff") && p.brand === "Davidoff") ||
        (q.includes("esse") && p.brand === "ESSE") ||
        (q.includes("winston") && p.brand === "Winston") ||
        (q.includes("parliament") && p.brand === "Parliament") ||
        (q.includes("terea") && p.brand === "IQOS TEREA") ||
        (q.includes("velo") && p.category === "nicotine-pouches") ||
        (q.includes("vape") && p.category === "vapes") ||
        (q.includes("liquid") && p.category === "e-liquid")
    );

    if (matchedProduct) {
      return {
        text: `Yes! *${matchedProduct.title}* is IN STOCK (${matchedProduct.stockCount} available).\n• 1 Carton: AED ${matchedProduct.cartonPrice}\n• 5 Cartons VIP: AED ${matchedProduct.fiveCartonPrice}\n• Spec: ${matchedProduct.tar} Tar / ${matchedProduct.nicotine} Nicotine (${matchedProduct.origin}).\n\nTap the green button below to dispatch it to your Dubai location in ${settings.expressDeliveryMinutes}!`,
        product: matchedProduct,
      };
    }

    if (q.includes("delivery") || q.includes("time") || q.includes("fast") || q.includes("area")) {
      return {
        text: `We deliver in *${settings.expressDeliveryMinutes}* across Downtown Dubai, Burj Khalifa, Dubai Marina, JBR, Palm Jumeirah, Business Bay, DIFC & JVC! Delivery is *FREE* on orders over AED ${settings.freeDeliveryThreshold} (or AED ${settings.standardDeliveryFee} below).`,
      };
    }

    if (q.includes("price") || q.includes("how much") || q.includes("cost") || q.includes("menu")) {
      return {
        text: `Here is our 2026 Dubai Carton Price Summary:\n• ESSE Super Slims: AED 75 – 90\n• Winston / IQOS Terea: AED 135\n• Dunhill Switch / Blue: AED 150\n• Davidoff Gold: AED 155\n• Marlboro Gold / Red / Vista: AED 190 – 200\n• Parliament Night Blue: AED 225\n• Secondary Vapes & E-Liquids: AED 45 – 115`,
      };
    }

    if (q.includes("pay") || q.includes("cash") || q.includes("card")) {
      return {
        text: `No online prepayment needed! You can inspect the factory seal when our rider arrives and pay via *Cash on Delivery*, *Card on Delivery (Visa/Mastercard)*, or *Apple Pay*.`,
      };
    }

    return {
      text: `I can help you place an instant order or check stock! Type any brand (like *Marlboro Gold*, *Dunhill Switch*, *ESSE Change*, *IQOS Terea*, *VGOD*) or click *"Build Automated Order"* below to send your order to ${settings.supportPhoneDisplay}.`,
    };
  };

  const handleSendUserMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    setTimeout(() => {
      const reply = generateSmartReply(trimmed);
      if (reply.product) {
        setSelectedProduct(reply.product);
      }
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: reply.text,
        timestamp: "Now",
        productSuggestion: reply.product,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, botConfig.autoReplyDelayMs || 400);
  };

  const handleCompleteAutomatedOrder = () => {
    if (!selectedProduct) return;
    const order = triggerSingleClickWhatsApp(
      selectedProduct,
      selectedPackTier,
      selectedArea,
      "Express 1-Click"
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-order-${Date.now()}`,
        sender: "bot",
        text: `Order *#${order.id}* for *${selectedProduct.title}* (${selectedPackTier}) to *${selectedArea}* (Total: AED ${order.total}) has been generated and opened in WhatsApp (${settings.supportPhoneDisplay})!`,
        timestamp: "Now",
      },
    ]);
    setShowOrderWizard(false);
  };

  return (
    <>
      {/* FLOATING AUTOMATED WHATSAPP CONCIERGE LAUNCHER */}
      <div className="fixed bottom-[4.5rem] sm:bottom-20 right-3 sm:right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="group flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full bg-[#0A2F42] hover:bg-[#0d3d56] text-white border-2 border-[#25D366] shadow-[0_12px_35px_rgba(0,0,0,0.4)] transition-all active:scale-95"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-black">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0A2F42] animate-ping" />
          </span>
          <div className="text-left">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-[#25D366] leading-none">
              24/7 AI WHATSAPP BOT
            </span>
            <span className="text-xs font-extrabold leading-tight">
              Chat &amp; Auto-Order
            </span>
          </div>
        </button>
      </div>

      {/* INTERACTIVE WHATSAPP AUTOMATION CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 right-3 sm:right-5 z-50 w-[94vw] max-w-[390px] rounded-2xl overflow-hidden bg-[#ECE5DD] border-2 border-[#075E54] shadow-[0_25px_70px_rgba(0,0,0,0.65)] flex flex-col max-h-[82dvh]">
          {/* Official WhatsApp Dark Teal Header */}
          <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-full bg-[#25D366] text-black flex items-center justify-center font-black shrink-0">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-[#075E54]" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm truncate">
                  {botConfig.botName}
                </div>
                <div className="text-[10px] text-emerald-200 font-mono truncate">
                  Online • {settings.supportPhoneDisplay}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white"
              aria-label="Close Bot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick-Action Automation Pills */}
          <div className="bg-[#0A2F42] text-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setShowOrderWizard((v) => !v)}
              className="px-2.5 py-1 rounded-full bg-[#F4B143] text-black shrink-0 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Build Automated Order</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendUserMessage("Cigarette Carton Prices")}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0"
            >
              Carton Prices
            </button>
            <button
              type="button"
              onClick={() => handleSendUserMessage("Marlboro Gold stock")}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0"
            >
              Marlboro Gold
            </button>
            <button
              type="button"
              onClick={() => handleSendUserMessage("Delivery time & areas")}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0"
            >
              45m Delivery
            </button>
          </div>

          {/* Chat Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs text-zinc-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm whitespace-pre-line leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#DCF8C6] text-zinc-900 rounded-br-none"
                      : "bg-white text-zinc-900 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[9px] font-mono opacity-55 mb-0.5">
                    {msg.sender === "bot" ? (
                      <>
                        <Bot className="w-2.5 h-2.5 text-[#075E54]" />
                        <span>Automated Concierge</span>
                      </>
                    ) : (
                      <>
                        <User className="w-2.5 h-2.5" />
                        <span>You</span>
                      </>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>
                  <div>{msg.text}</div>

                  {/* If Bot matched a product, show 1-Click Order Card inside chat! */}
                  {msg.productSuggestion && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#0A2F42]">
                          {msg.productSuggestion.title}
                        </span>
                        <span className="font-mono font-extrabold text-xs text-emerald-700">
                          AED {msg.productSuggestion.cartonPrice}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.productSuggestion) {
                              triggerSingleClickWhatsApp(
                                msg.productSuggestion,
                                "1-carton",
                                selectedArea
                              );
                            }
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#25D366] text-black font-extrabold text-[11px] flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3 fill-current" />
                          <span>1-Click WhatsApp Buy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.productSuggestion) {
                              addToCart(msg.productSuggestion, "1-carton", 1);
                            }
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-[#0A2F42] text-white font-bold text-[11px]"
                        >
                          + Cart
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Guided 3-Step Order Wizard inside Chat */}
            {showOrderWizard && (
              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#075E54] shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#075E54] flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Guided 30-Sec WhatsApp Order
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOrderWizard(false)}
                    className="text-[10px] text-zinc-400"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">
                    1. Select Cigarette Carton or Secondary Item:
                  </label>
                  <select
                    value={selectedProduct?.id || ""}
                    onChange={(e) => {
                      const found = products.find(
                        (p) => p.id === e.target.value
                      );
                      if (found) setSelectedProduct(found);
                    }}
                    className="w-full p-2 rounded-lg bg-zinc-50 border border-zinc-300 text-xs font-semibold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — AED {p.cartonPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">
                    2. Choose Quantity:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPackTier("1-carton")}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border ${
                        selectedPackTier === "1-carton"
                          ? "bg-[#0A2F42] text-white border-[#0A2F42]"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      1 Carton (AED {selectedProduct?.cartonPrice})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPackTier("5-cartons")}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border ${
                        selectedPackTier === "5-cartons"
                          ? "bg-[#F4B143] text-black border-[#F4B143]"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      5 VIP (AED {selectedProduct?.fiveCartonPrice})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">
                    <MapPin className="w-3 h-3 inline mr-0.5 text-[#075E54]" />
                    3. Dubai Area:
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-50 border border-zinc-300 text-xs font-semibold"
                  >
                    {DUBAI_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteAutomatedOrder}
                  className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm &amp; Open WhatsApp ({settings.supportPhoneDisplay})
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Input Bar + Direct Live Human Handover */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendUserMessage(inputText);
            }}
            className="bg-[#F0F0F0] p-2.5 flex items-center gap-2 border-t border-zinc-300"
          >
            <input
              type="text"
              placeholder="Ask about Marlboro, Dunhill, prices, delivery..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-full bg-white border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-[#075E54]"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#128C7E] text-white flex items-center justify-center shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
            <a
              href={`https://wa.me/${formatWhatsAppNumberForLink(
                settings.whatsappNumber
              )}?text=${encodeURIComponent(
                `Hello ${settings.storeName} (${settings.supportPhoneDisplay})! I would like to speak with a live concierge.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-full bg-[#25D366] text-black font-extrabold text-[10px] shrink-0"
              title="Open Real WhatsApp App"
            >
              Live WA
            </a>
          </form>
        </div>
      )}
    </>
  );
}
