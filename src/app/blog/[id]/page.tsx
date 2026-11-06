import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StoreFooter, StoreHeader } from "@/components/store-header";
import { WhatsAppCartDrawer } from "@/components/whatsapp-cart-drawer";
import { getPost, postDate } from "@/lib/blog";
import { SITE_BASE_URL } from "@/lib/seo-meta";

export const revalidate = 900;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(Number((await params).id));
  if (!post) return { title: "Guide not found" };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: { type: "article", title: post.title, description: post.description, url: `/blog/${post.id}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(Number((await params).id));
  if (!post) notFound();

  const url = `${SITE_BASE_URL}/blog/${post.id}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      author: { "@type": "Organization", name: "Dubai Cigarette Shop" },
      publisher: { "@type": "Organization", name: "Dubai Cigarette Shop", url: SITE_BASE_URL },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_BASE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
    ...(post.faq?.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <WhatsAppCartDrawer />
      <StoreHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-14">
        <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 mb-4">
          <Link href="/" className="hover:text-[#0A2F42]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-[#0A2F42]">Guides</Link>
        </nav>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[#B7791F]">
          {post.category}
          <span className="text-zinc-400 font-semibold normal-case tracking-normal"> · {post.read_minutes} min read · {postDate(post.published)}</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold text-[#0A2F42] tracking-tight leading-tight">{post.title}</h1>

        {post.tldr ? (
          <div className="mt-6 rounded-2xl bg-white border border-zinc-200 p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#0A2F42]">Quick answer</p>
            <p className="mt-2 text-sm sm:text-base text-zinc-700 leading-relaxed">{post.tldr}</p>
          </div>
        ) : null}

        {/* html is reduced to simple allowlisted tags by the growth service and again by sanitize() */}
        <div
          className="mt-8 text-[15px] sm:text-base text-zinc-700 leading-relaxed space-y-5 [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-[#0A2F42] [&_h2]:pt-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#0A2F42] [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mt-1.5 [&_a]:font-bold [&_a]:text-[#0A2F42] [&_a]:underline [&_strong]:text-zinc-900 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:bg-white [&_th]:p-2 [&_th]:border [&_th]:border-zinc-200 [&_td]:p-2 [&_td]:border [&_td]:border-zinc-200 [&_blockquote]:border-l-4 [&_blockquote]:border-[#F4B143] [&_blockquote]:pl-4"
          dangerouslySetInnerHTML={{ __html: post.html || "" }}
        />

        {post.faq?.length ? (
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A2F42]">Frequently asked questions</h2>
            <div className="mt-4 space-y-3">
              {post.faq.map((f, i) => (
                <details key={i} className="rounded-xl bg-white border border-zinc-200 p-4">
                  <summary className="cursor-pointer font-bold text-[#0A2F42]">{f.q}</summary>
                  <p className="mt-2 text-sm text-zinc-700 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 rounded-2xl bg-[#0A2F42] p-6 text-center">
          <p className="text-white font-extrabold text-lg">Order in minutes on WhatsApp</p>
          <p className="text-white/70 text-sm mt-1">Genuine stock, delivered across Dubai & Sharjah, courier to all Emirates.</p>
          <Link href="/" className="inline-block mt-4 px-5 py-3 rounded-xl bg-[#F4B143] text-[#0A2F42] text-sm font-extrabold">
            Browse the shop
          </Link>
        </div>
      </article>
      <StoreFooter />
    </div>
  );
}
