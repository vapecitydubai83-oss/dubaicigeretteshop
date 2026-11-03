import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import { INITIAL_SETTINGS } from "@/lib/catalog-data";
import { clip, productOgImages, readSeoStore, SITE_BASE_URL } from "@/lib/seo-meta";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings, products } = await readSeoStore();
  const title = settings.seoMetaTitle?.trim() || INITIAL_SETTINGS.seoMetaTitle;
  const description = clip(
    settings.seoMetaDescription || INITIAL_SETTINGS.seoMetaDescription,
    160
  );
  const images = productOgImages(
    products.find((p) => p.featured) ?? products[0]
  );
  return {
    metadataBase: new URL(SITE_BASE_URL),
    title: {
      default: title,
      template: "%s | Dubai Cigarette Shop",
    },
    description,
    keywords: (settings.seoKeywords || INITIAL_SETTINGS.seoKeywords)
      .split(",")
      .map((k) => k.trim()),
    alternates: {
      canonical: "/",
      languages: {
        "en-AE": "/",
      },
    },
    openGraph: {
      type: "website",
      locale: "en_AE",
      url: SITE_BASE_URL + "/",
      siteName: "DUBAI CIGARETTE SHOP",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    other: {
      "geo.region": "AE-DU",
      "geo.placename": "Dubai, United Arab Emirates",
      "geo.position": "25.1972;55.2744",
      ICBM: "25.1972, 55.2744",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${cormorant.variable} ${jakarta.variable} ${jetbrains.variable} font-sans antialiased selection:bg-[#D4AF37]/30 selection:text-[#D4AF37]`}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
