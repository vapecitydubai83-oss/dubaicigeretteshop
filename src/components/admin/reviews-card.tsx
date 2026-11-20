"use client";

import { useCallback, useEffect, useState } from "react";
import type { Review } from "@/lib/reviews";

// Admin/manager: approve or reject customer reviews. Only approved ones show on product pages.
export default function ReviewsCard({ adminApiKey }: { adminApiKey?: string | null }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!adminApiKey) return;
    try {
      const r = await fetch("/api/reviews", { headers: { "x-admin-key": adminApiKey }, cache: "no-store" });
      const j = await r.json();
      setReviews(Array.isArray(j.reviews) ? j.reviews : []);
    } catch {
      setMsg("Could not load reviews.");
    }
  }, [adminApiKey]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject" | "delete") => {
    if (!adminApiKey) return;
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminApiKey },
      body: JSON.stringify({ action, id }),
    });
    setMsg(r.ok ? "" : "Could not save. Try again.");
    load();
  };

  const pending = (reviews || []).filter((r) => r.status === "pending");
  const list = showAll ? reviews || [] : pending;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-zinc-900">Customer reviews ({pending.length} waiting)</h3>
          <p className="text-xs text-zinc-500">
            Only customers with a delivered order can review. A review shows on the product page after you approve it.
          </p>
        </div>
        <button type="button" onClick={() => setShowAll((v) => !v)} className="px-3 py-2 rounded-xl bg-zinc-100 text-xs font-bold">
          {showAll ? "Show waiting only" : "Show all reviews"}
        </button>
      </div>
      {msg && <p className="text-sm text-rose-700" role="alert">{msg}</p>}
      {reviews === null ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-zinc-500">{showAll ? "No reviews yet." : "No reviews waiting."}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {list.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  <span className="text-[#F4B143]" aria-label={`${r.rating} of 5 stars`}>{"★".repeat(r.rating)}</span>
                  <span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span> {r.productTitle}
                </p>
                {r.text && <p className="text-sm text-zinc-700 mt-1 whitespace-pre-line break-words">{r.text}</p>}
                <p className="text-xs text-zinc-500 mt-1">
                  {r.name} · order #{r.orderId} · {new Date(r.createdAt).toLocaleDateString("en-GB")} · {r.status}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status !== "approved" && (
                  <button type="button" onClick={() => act(r.id, "approve")} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button type="button" onClick={() => act(r.id, "reject")} className="px-3 py-2 rounded-xl bg-zinc-200 text-xs font-bold">
                    {r.status === "approved" ? "Hide" : "Reject"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
