import type { MetadataRoute } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { INITIAL_PRODUCTS, Product } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dubaicigeretteshop.ae";

  // Merge the server catalog store so admin-added products appear and
  // admin-deleted products are dropped from the sitemap.
  let deleted = new Set<string>();
  let extraIds: string[] = [];
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "uploads", "_store", "catalog.json"),
      "utf-8"
    );
    const j = JSON.parse(raw) as {
      products?: Record<string, Product>;
      deleted?: string[];
    };
    if (Array.isArray(j.deleted)) deleted = new Set(j.deleted);
    if (j.products && typeof j.products === "object") {
      const baseIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
      extraIds = Object.keys(j.products).filter(
        (id) => !baseIds.has(id) && !deleted.has(id)
      );
    }
  } catch {}

  const allIds = [
    ...extraIds,
    ...INITIAL_PRODUCTS.filter((p) => !deleted.has(p.id)).map((p) => p.id),
  ];

  const productUrls: MetadataRoute.Sitemap = allIds.map((id) => ({
    url: `${baseUrl}/product/${id}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const categories = [
    "cigarettes",
    "iqos-terea",
    "vapes",
    "e-liquid",
    "nicotine-pouches",
    "hookah-shisha",
    "accessories",
  ];
  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/category/${c}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
