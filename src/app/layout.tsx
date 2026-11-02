import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import { INITIAL_SETTINGS } from "@/lib/catalog-data";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://dubaicigeretteshop.ae"),
  title: {
    default: INITIAL_SETTINGS.seoMetaTitle,
    template: "%s | Dubai Cigarette Shop",
  },
  description: INITIAL_SETTINGS.seoMetaDescription,
  keywords: INITIAL_SETTINGS.seoKeywords.split(",").map((k) => k.trim()),
  alternates: {
    canonical: "https://dubaicigeretteshop.ae/",
    languages: {
      "en-AE": "https://dubaicigeretteshop.ae/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://dubaicigeretteshop.ae/",
    siteName: "DUBAI CIGARETTE SHOP",
    title: INITIAL_SETTINGS.seoMetaTitle,
    description: INITIAL_SETTINGS.seoMetaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: INITIAL_SETTINGS.seoMetaTitle,
    description: INITIAL_SETTINGS.seoMetaDescription,
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
