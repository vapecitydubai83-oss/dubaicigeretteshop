import type { MetadataRoute } from "next";
import { INITIAL_PRODUCTS } from "@/lib/catalog-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dubaicigeretteshop.ae";

  const productUrls: MetadataRoute.Sitemap = INITIAL_PRODUCTS.map((p) => ({
    url: `${baseUrl}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/#dubai-cigarette-guide`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    ...productUrls,
  ];
}
