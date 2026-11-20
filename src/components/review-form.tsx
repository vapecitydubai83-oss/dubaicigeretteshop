"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type P = { productId: string; title: string };

export default function ReviewForm({ token, products, defaultName }: { token: string; products: P[]; defaultName: string }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [name, setName] = useState(/guest|whatsapp/i.test(defaultName) ? "" : defaultName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          token,
          name,
          items: products.map((p) => ({ productId: p.productId, rating: ratings[p.productId] || 0, text: texts[p.productId] || "" })),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setSent(true);
      else setError(j.error || "Something went wrong. Please try again.");
    } catch {
      setError("No connection. Please try again.");
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <p className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-sm text-emerald-900" role="status">
        Thank you! Your review was received. It appears on the website after a quick check by our team.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      {products.map((p) => (
        <fieldset key={p.productId} className="rounded-xl bg-white border border-zinc-200 p-4 space-y-3">
          <legend className="sr-only">{p.title}</legend>
          <p className="font-bold text-sm">{p.title}</p>
          <div className="flex gap-1" role="radiogroup" aria-label={`Rating for ${p.title}`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={ratings[p.productId] === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRatings((s) => ({ ...s, [p.productId]: n }))}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 ${n <= (ratings[p.productId] || 0) ? "fill-[#F4B143] text-[#F4B143]" : "text-zinc-300"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={texts[p.productId] || ""}
            onChange={(e) => setTexts((s) => ({ ...s, [p.productId]: e.target.value }))}
            maxLength={600}
            rows={3}
            placeholder="What did you like? (optional)"
            aria-label={`Review text for ${p.title}`}
            className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm"
          />
        </fieldset>
      ))}
      <label className="block text-sm">
        <span className="font-bold">Your name</span> <span className="text-zinc-500">(shown as first name + initial)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 text-sm"
        />
      </label>
      {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={busy || !Object.values(ratings).some(Boolean)}
        className="w-full py-3 rounded-xl bg-[#0A2F42] text-white font-extrabold disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
