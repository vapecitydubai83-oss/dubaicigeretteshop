"use client";

import { useCallback, useEffect, useState } from "react";
import type { Chat } from "@/lib/wa-bot-store";

type Info = { enabled?: boolean; ready?: boolean; now?: number; chats?: Chat[]; error?: string };

const time = (t: number) =>
  new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const WHO = { customer: "Customer", bot: "Bot", staff: "Shop" } as const;

// WhatsApp auto-reply: on/off, the latest chats with their messages, and pause/resume per chat. Owner and manager.
export default function WhatsAppBotCard({ adminApiKey }: { adminApiKey?: string | null }) {
  const [info, setInfo] = useState<Info>({});
  const [open, setOpen] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!adminApiKey) return;
    try {
      const r = await fetch("/api/admin/whatsapp-bot", { headers: { "x-admin-key": adminApiKey }, cache: "no-store" });
      setInfo(await r.json());
    } catch {
      setInfo((i) => ({ ...i, error: "No answer from the server" }));
    }
  }, [adminApiKey]);

  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (action: string, jid = "") => {
    if (!adminApiKey) return;
    setBusy(true);
    await fetch("/api/admin/whatsapp-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminApiKey },
      body: JSON.stringify({ action, jid }),
    }).catch(() => null);
    setBusy(false);
    load();
  };

  const now = info.now || Date.now();
  const chats = info.chats || [];
  const btn = "px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h3 className="text-lg font-extrabold text-zinc-900">WhatsApp auto-reply</h3>
          <p className="text-xs text-zinc-500">
            Answers prices, stock and delivery on the shop WhatsApp from the live catalog. Orders, location pins and
            &quot;talk to a person&quot; are sent to the shop, and the bot goes quiet in that chat for 60 minutes. When
            staff reply from the phone, the bot also goes quiet for 60 minutes.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || info.enabled === undefined}
          onClick={() => act(info.enabled ? "off" : "on")}
          className={`${btn} ${info.enabled ? "bg-[#25D366] text-black" : "bg-zinc-200 text-zinc-700"}`}
        >
          {info.enabled ? "Auto-reply ON" : "Auto-reply OFF"}
        </button>
      </div>

      {info.ready === false && (
        <p className="text-sm text-amber-800">Not active yet: the WhatsApp gateway still has to be set up on the server.</p>
      )}
      {info.error && <p className="text-xs text-red-700">{info.error}</p>}
      {!chats.length && <p className="text-sm text-zinc-600">No WhatsApp chats yet.</p>}

      <ul className="divide-y divide-zinc-100">
        {chats.map((c) => {
          const last = c.msgs[c.msgs.length - 1];
          const paused = c.pausedUntil > now;
          const phone = c.jid.endsWith("@s.whatsapp.net") ? c.jid.split("@")[0] : "";
          return (
            <li key={c.jid} className="py-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button type="button" className="font-bold text-zinc-900 text-left" onClick={() => setOpen(open === c.jid ? "" : c.jid)}>
                  {c.name || "No name"} {phone && <span className="font-normal text-zinc-500">+{phone}</span>}
                </button>
                {c.needsPerson && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Needs a person</span>}
                {paused && !c.needsPerson && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200 text-zinc-700">Bot quiet until {time(c.pausedUntil)}</span>}
                <span className="ml-auto text-xs text-zinc-500">{last && time(last.at)}</span>
              </div>
              {last && <p className="text-xs text-zinc-600 truncate">{WHO[last.from]}: {last.text}</p>}
              <div className="flex flex-wrap gap-2">
                {phone && <a className={`${btn} bg-white border border-zinc-300 text-zinc-800`} href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer">Open chat</a>}
                {paused
                  ? <button type="button" className={`${btn} bg-zinc-900 text-white`} disabled={busy} onClick={() => act("resume", c.jid)}>Let the bot answer again</button>
                  : <button type="button" className={`${btn} bg-white border border-zinc-300 text-zinc-800`} disabled={busy} onClick={() => act("pause", c.jid)}>Stop the bot here (24 h)</button>}
                <button type="button" className={`${btn} text-zinc-600`} onClick={() => setOpen(open === c.jid ? "" : c.jid)}>{open === c.jid ? "Hide messages" : "Show messages"}</button>
              </div>
              {open === c.jid && (
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 space-y-2 max-h-96 overflow-y-auto">
                  {c.msgs.map((m, i) => (
                    <div key={i} className={`text-xs ${m.from === "customer" ? "" : "pl-6"}`}>
                      <span className="font-bold text-zinc-700">{WHO[m.from]}</span> <span className="text-zinc-400">{time(m.at)}</span>
                      <p className="whitespace-pre-wrap text-zinc-800">{m.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
