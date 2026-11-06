import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";
import { listPosts, postDate } from "@/lib/blog";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Dubai Buying Guides & News",
  description:
    "Buying guides for cigarettes, IQOS & TEREA, vapes, nicotine pouches and shisha in Dubai: brands, UAE rules, delivery and how to choose.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await listPosts();
  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <WhatsAppCartDrawer />
      <StoreHeader />
      <section className="max-w-[1280px] mx-auto px-3 sm:px-6 pt-4 pb-14">
        <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 mb-3">
          <Link href="/" className="hover:text-[#0A2F42]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0A2F42]">Guides</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2F42] tracking-tight">Guides & News</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
          Plain answers about the products we stock and buying them in the UAE.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-zinc-500">
            New guides are on the way. <Link href="/" className="font-bold text-[#0A2F42] underline">Browse the shop</Link>
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.id}`}
                className="group block rounded-2xl bg-white border border-zinc-200 p-5 hover:border-[#0A2F42]/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#B7791F]">
                  {p.category}
                  <span className="text-zinc-400 font-semibold normal-case tracking-normal">· {p.read_minutes} min read</span>
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-[#0A2F42] leading-snug group-hover:underline">{p.title}</h2>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed line-clamp-3">{p.excerpt || p.description}</p>
                <p className="mt-3 text-[11px] text-zinc-400">{postDate(p.published)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <StoreFooter />
    </div>
  );
}
