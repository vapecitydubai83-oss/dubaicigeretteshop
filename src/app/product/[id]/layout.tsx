import type { Metadata } from "next";
import { clip, productOgImages, readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { products } = await readSeoStore();
  const p = products.find((x) => x.id === id);
  if (!p) {
    return { title: "Product", robots: { index: false, follow: true } };
  }
  const title = clip(
    `${p.title} – AED ${p.cartonPrice} | Dubai Cigarette Shop`,
    64
  );
  const description = clip(
    p.seoAnswerCapsule ||
      p.description ||
      `${p.title} – AED ${p.cartonPrice}, delivered in 45–75 min across Dubai & Sharjah — courier to all Emirates. Order instantly on WhatsApp.`,
    160
  );
  const images = productOgImages(p);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/product/${p.id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_BASE_URL}/product/${p.id}`,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
