"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, User, X } from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatWhatsAppNumberForLink } from "@/lib/catalog-data";

// Website chat box (PLAN 74q). Every message goes to /api/chat, which runs the same order bot and AI wording
// as the shop's WhatsApp; the order itself (cart, prices) is kept on the server, never in this browser.
interface ChatMessage { id: string; sender: "bot" | "user"; text: string }

const SID_KEY = "dcs-chat-sid";
const readSid = () => { try { return sessionStorage.getItem(SID_KEY) || ""; } catch { return ""; } };
const saveSid = (s: string) => { try { sessionStorage.setItem(SID_KEY, s); } catch { /* private mode: chat still works this page */ } };

// *bold* and links, as React nodes (never as HTML, so a reply can not inject markup)
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*\n]+\*|https?:\/\/[^\s)]+)/g).map((part, i) => {
        if (/^\*[^*\n]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
        if (/^https?:\/\//.test(part)) {
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#075E54] underline break-all">{part.replace(/^https?:\/\//, "")}</a>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

const QUICK = [
  { label: "Order now", text: "menu" },
  { label: "Carton prices", text: "price list" },
  { label: "Marlboro Gold", text: "marlboro gold" },
  { label: "Delivery time", text: "how long is delivery" },
];

export function WhatsAppAutomationBot() {
  const { settings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    sender: "bot",
    text: "Hi there! 👋 I'm the shop assistant (adults 18+ only). Tell me what you'd like, for example *Marlboro Gold*, or tap *Order now* and I'll guide you step by step.",
  }]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, busy]);

  const botConfig = settings.whatsappBot || { enabled: true, botName: "Dubai Cigerette Shop Assistant" };
  if (!botConfig.enabled) return null;

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text || busy) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, sender: "user", text }]);
    setInputText("");
    setBusy(true);
    let reply = "Sorry, I can't connect right now. Please tap *Live WA* below to chat with our team on WhatsApp.";
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid: readSid(), text }),
      });
      const j = await r.json();
      if (j.sid) saveSid(j.sid);
      if (typeof j.reply === "string" && j.reply) reply = j.reply;
    } catch { /* keep the fallback reply */ }
    setMessages((m) => [...m, { id: `b-${Date.now()}`, sender: "bot", text: reply }]);
    setBusy(false);
  };

  return (
    <>
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
            <span className="block text-[9px] font-mono uppercase tracking-wider text-[#25D366] leading-none">24/7 AI SHOP ASSISTANT</span>
            <span className="text-xs font-extrabold leading-tight">Chat &amp; Order</span>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-4 right-3 sm:right-5 z-50 w-[94vw] max-w-[390px] rounded-2xl overflow-hidden bg-[#ECE5DD] border-2 border-[#075E54] shadow-[0_25px_70px_rgba(0,0,0,0.65)] flex flex-col max-h-[82dvh]">
          <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-full bg-[#25D366] text-black flex items-center justify-center font-black shrink-0">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-[#075E54]" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm truncate">{botConfig.botName}</div>
                <div className="text-[10px] text-emerald-200 font-mono truncate">Online • {settings.supportPhoneDisplay}</div>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#0A2F42] text-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-bold">
            {QUICK.map((q, i) => (
              <button
                key={q.label}
                type="button"
                disabled={busy}
                onClick={() => send(q.text)}
                className={`px-2.5 py-1 rounded-full shrink-0 ${i === 0 ? "bg-[#F4B143] text-black" : "bg-white/10 hover:bg-white/20"}`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs text-zinc-900" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm whitespace-pre-line leading-relaxed ${msg.sender === "user" ? "bg-[#DCF8C6] rounded-br-none" : "bg-white rounded-bl-none"}`}>
                  <div className="flex items-center gap-1 text-[9px] font-mono opacity-55 mb-0.5">
                    {msg.sender === "bot" ? <><Bot className="w-2.5 h-2.5 text-[#075E54]" /><span>Shop assistant</span></> : <><User className="w-2.5 h-2.5" /><span>You</span></>}
                  </div>
                  <div><Rich text={msg.text} /></div>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-none bg-white px-3.5 py-2.5 shadow-sm text-zinc-500 text-xs">typing…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(inputText); }} className="bg-[#F0F0F0] p-2.5 flex items-center gap-2 border-t border-zinc-300">
            <input
              type="text"
              placeholder="Type a message…"
              aria-label="Message"
              maxLength={500}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-full bg-white border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-[#075E54]"
            />
            <button type="submit" disabled={busy} className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white flex items-center justify-center shrink-0" aria-label="Send message">
              <Send className="w-4 h-4" />
            </button>
            <a
              href={`https://wa.me/${formatWhatsAppNumberForLink(settings.whatsappNumber)}?text=${encodeURIComponent(`Hello ${settings.storeName}! I would like to speak with your team.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-full bg-[#25D366] text-black font-extrabold text-[10px] shrink-0"
              title="Chat with our team on WhatsApp"
            >
              Live WA
            </a>
          </form>
        </div>
      )}
    </>
  );
}
