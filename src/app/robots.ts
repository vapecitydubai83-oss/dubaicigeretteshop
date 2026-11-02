import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all standard search engines + real-time AI Search Answer Engines (AEO/GEO)
        userAgent: [
          "*",
          "Googlebot",
          "Bingbot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "GPTBot",
          "PerplexityBot",
          "Claude-SearchBot",
          "Google-Extended",
        ],
        allow: "/",
        disallow: ["/admin", "/api/", "/uploads/_store"],
      },
      {
        // Block pure dataset scrapers that provide no search visibility
        userAgent: ["CCBot"],
        disallow: "/",
      },
    ],
    sitemap: "https://dubaicigeretteshop.ae/sitemap.xml",
  };
}
