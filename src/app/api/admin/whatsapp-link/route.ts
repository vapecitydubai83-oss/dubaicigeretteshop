import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Admin/manager panel: link the shop's WhatsApp to the WhatsApp gateway (WA-AKG), see its status, reconnect.
// Uses the same gateway settings as the order alerts (WA_NOTIFY_URL / WA_NOTIFY_KEY / WA_NOTIFY_SESSION);
// the gateway key never leaves the server. Every call needs the admin key (owner and manager both get it at login).
function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function gateway() {
  const { WA_NOTIFY_URL: url, WA_NOTIFY_KEY: key, WA_NOTIFY_SESSION: session } = process.env;
  if (!url || !key || !session) return null;
  const base = `${url.replace(/\/$/, "")}/api/sessions/${encodeURIComponent(session)}`;
  const call = async (p: string, init?: RequestInit) => {
    const r = await fetch(base + p, {
      ...init,
      headers: { "Content-Type": "application/json", "x-api-key": key },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
  };
  return call;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const call = gateway();
  if (!call) return NextResponse.json({ configured: false });
  try {
    const s = await call("");
    const status = String(s.body?.data?.status || (s.ok ? "UNKNOWN" : "UNREACHABLE"));
    let qr = "";
    if (status === "SCAN_QR") {
      const q = await call("/qr");
      const img = q.body?.base64 || q.body?.data?.base64 || "";
      qr = typeof img === "string" && img.startsWith("data:image/png;base64,") ? img : "";
    }
    return NextResponse.json({ configured: true, status, qr, updatedAt: s.body?.data?.updatedAt || null });
  } catch {
    return NextResponse.json({ configured: true, status: "UNREACHABLE", qr: "" });
  }
}

// POST {action: "start" | "restart" | "logout" | "pair", phone?} (pair = 8-digit code typed on the phone instead of a QR scan)
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const call = gateway();
  if (!call) return NextResponse.json({ error: "WhatsApp gateway is not configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");
  if (!["start", "restart", "logout", "pair"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const phone = String(body?.phone || "").replace(/\D/g, "");
  if (action === "pair" && (phone.length < 9 || phone.length > 15)) {
    return NextResponse.json({ error: "Enter the shop number with country code, e.g. 971553020429" }, { status: 400 });
  }
  try {
    if (action === "pair") {
      const st = await call("");
      if (st.body?.data?.status !== "SCAN_QR") await call("/start", { method: "POST", body: "{}" });
    }
    const r = await call(`/${action}`, { method: "POST", body: JSON.stringify(action === "pair" ? { phoneNumber: phone } : {}) });
    if (!r.ok) return NextResponse.json({ error: r.body?.message || `Gateway error ${r.status}` }, { status: 502 });
    const code = r.body?.data?.pairingCode;
    return NextResponse.json({ ok: true, pairingCode: typeof code === "string" ? code : undefined });
  } catch {
    return NextResponse.json({ error: "WhatsApp gateway did not answer" }, { status: 502 });
  }
}
