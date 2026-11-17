"use client";

import { useCallback, useEffect, useState } from "react";

type Info = { configured?: boolean; status?: string; qr?: string; error?: string };

const LABEL: Record<string, { text: string; tone: string }> = {
  CONNECTED: { text: "Connected", tone: "bg-emerald-100 text-emerald-800" },
  SCAN_QR: { text: "Waiting for the phone to scan", tone: "bg-amber-100 text-amber-800" },
  CONNECTING: { text: "Connecting…", tone: "bg-amber-100 text-amber-800" },
  STOPPED: { text: "Not connected", tone: "bg-zinc-200 text-zinc-700" },
  LOGGED_OUT: { text: "Logged out", tone: "bg-red-100 text-red-800" },
  DISCONNECTED: { text: "Disconnected", tone: "bg-red-100 text-red-800" },
  UNREACHABLE: { text: "Gateway not answering", tone: "bg-red-100 text-red-800" },
};

// Link the shop's WhatsApp (for instant replies + order alerts), see the status, reconnect. Owner and manager.
export default function WhatsAppLinkCard({ adminApiKey }: { adminApiKey?: string | null }) {
  const [info, setInfo] = useState<Info>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    if (!adminApiKey) return;
    try {
      const r = await fetch("/api/admin/whatsapp-link", { headers: { "x-admin-key": adminApiKey }, cache: "no-store" });
      setInfo(await r.json());
    } catch {
      setInfo({ configured: true, status: "UNREACHABLE" });
    }
  }, [adminApiKey]);

  const status = info.status || "";
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), status === "CONNECTED" ? 30000 : 5000);
    return () => clearInterval(t);
  }, [load, status]);
  useEffect(() => {
    if (status === "CONNECTED") setCode("");
  }, [status]);

  const act = async (action: string) => {
    if (!adminApiKey) return;
    if (action === "logout" && !window.confirm("Disconnect the shop WhatsApp from the website? Instant replies and order alerts stop until you link it again.")) return;
    setBusy(action);
    setMsg("");
    try {
      const r = await fetch("/api/admin/whatsapp-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminApiKey },
        body: JSON.stringify({ action, phone }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsg(j.error || "Something went wrong");
      else if (j.pairingCode) setCode(j.pairingCode);
      else setMsg(action === "logout" ? "Disconnected." : "Started. The QR code appears in a few seconds.");
    } catch {
      setMsg("No answer from the server");
    }
    setBusy("");
    setTimeout(load, 2500);
  };

  const label = LABEL[status] || { text: status || "Checking…", tone: "bg-zinc-200 text-zinc-700" };
  const btn = "px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h3 className="text-lg font-extrabold text-zinc-900">Shop WhatsApp connection</h3>
          <p className="text-xs text-zinc-500">Links WhatsApp on the shop phone to the website, for instant replies and new-order alerts.</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${label.tone}`} role="status">{label.text}</span>
      </div>

      {info.configured === false ? (
        <p className="text-sm text-zinc-600">The WhatsApp gateway is not set up on the server yet. Ask your website manager.</p>
      ) : (
        <>
          {status === "SCAN_QR" && info.qr && !code && (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={info.qr} alt="WhatsApp link QR code" width={220} height={220} className="border border-zinc-200 rounded-xl" />
              <ol className="text-sm text-zinc-700 list-decimal pl-5 space-y-1">
                <li>Open WhatsApp on the <b>shop phone</b>.</li>
                <li>Settings (or ⋮ menu) → <b>Linked devices</b> → <b>Link a device</b>.</li>
                <li>Point the phone at this code. It renews itself every few seconds.</li>
              </ol>
            </div>
          )}

          {code && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-zinc-800">
              On the shop phone: WhatsApp → Linked devices → Link a device → <b>Link with phone number instead</b>, then type:
              <div className="mt-2 text-2xl font-mono font-extrabold tracking-widest">{code}</div>
            </div>
          )}

          {status === "CONNECTED" && (
            <p className="text-sm text-emerald-800">The shop WhatsApp is linked. If messages stop arriving, press Reconnect.</p>
          )}

          <div className="flex flex-wrap gap-2">
            {status !== "CONNECTED" && status !== "SCAN_QR" && (
              <button type="button" className={`${btn} bg-[#25D366] text-white`} disabled={!!busy} onClick={() => act("start")}>
                {busy === "start" ? "Starting…" : "Connect (show QR code)"}
              </button>
            )}
            <button type="button" className={`${btn} bg-zinc-900 text-white`} disabled={!!busy} onClick={() => act("restart")}>
              {busy === "restart" ? "Reconnecting…" : "Reconnect"}
            </button>
            {status === "CONNECTED" && (
              <button type="button" className={`${btn} bg-red-50 text-red-700 border border-red-200`} disabled={!!busy} onClick={() => act("logout")}>
                Disconnect
              </button>
            )}
          </div>

          {status !== "CONNECTED" && (
            <div className="flex flex-wrap items-end gap-2 text-xs">
              <label className="flex flex-col gap-1 font-bold text-zinc-700">
                No camera? Get a code for the shop number
                <input
                  className="border border-zinc-300 rounded-xl px-3 py-2 font-normal"
                  inputMode="tel"
                  placeholder="971553020429"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <button type="button" className={`${btn} bg-white border border-zinc-300 text-zinc-800`} disabled={!!busy} onClick={() => act("pair")}>
                {busy === "pair" ? "Getting code…" : "Get pairing code"}
              </button>
            </div>
          )}

          {msg && <p className="text-xs text-zinc-600">{msg}</p>}
        </>
      )}
    </div>
  );
}
