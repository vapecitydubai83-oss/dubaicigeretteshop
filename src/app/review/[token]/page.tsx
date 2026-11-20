import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import type { WhatsAppOrder } from "@/lib/catalog-data";
import { orderIdFromToken } from "@/lib/reviews";
import { readReviews, reviewSecret } from "@/lib/reviews-store";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import ReviewForm from "@/components/review-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rate your order", robots: { index: false, follow: false } };

async function findOrder(id: string): Promise<WhatsAppOrder | undefined> {
  try {
    const j = JSON.parse(await readFile(path.join(process.cwd(), "public", "uploads", "_store", "orders.json"), "utf-8"));
    return (Array.isArray(j.orders) ? (j.orders as WhatsAppOrder[]) : []).find((o) => o.id === id);
  } catch {
    return undefined;
  }
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const orderId = orderIdFromToken(reviewSecret(), decodeURIComponent(token));
  const order = orderId ? await findOrder(orderId) : undefined;
  const done = order ? (await readReviews()).some((r) => r.orderId === order.id) : false;

  let note = "";
  if (!order) note = "This review link is not valid. Please use the link we sent you on WhatsApp.";
  else if (order.status !== "Delivered") note = "You can rate this order once it has been delivered.";
  else if (done) note = "Thank you, this order has already been reviewed.";

  // one row per product, even if it was ordered twice (single and bundle)
  const products = order
    ? [...new Map(order.items.map((i) => [i.productId, { productId: i.productId, title: i.title }])).values()]
    : [];

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-zinc-900 font-sans">
      <StoreHeader />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-[#0A2F42]">Rate your order</h1>
        {order && <p className="text-sm text-zinc-600 mt-1">Order #{order.id}</p>}
        {note ? (
          <p className="mt-6 rounded-xl bg-white border border-zinc-200 p-5 text-sm text-zinc-700">{note}</p>
        ) : (
          <ReviewForm token={decodeURIComponent(token)} products={products} defaultName={order!.customerName} />
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
