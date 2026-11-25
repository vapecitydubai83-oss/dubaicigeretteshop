import type { MetadataRoute } from "next";
import { readFile, stat } from "fs/promises";
import path from "path";
import { INITIAL_PRODUCTS, Product } from "@/lib/catalog-data";
import { listPosts, postPath } from "@/lib/blog";
import { brandGroups } from "@/lib/brands";
import { readSeoStore } from "@/lib/seo-meta";
import { DELIVERY_AREAS } from "@/lib/delivery-areas";
import { GUIDES } from "@/lib/guides";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dubaicigeretteshop.ae";

  // Merge the server catalog store so admin-added products appear and
  // admin-deleted products are dropped from the sitemap.
  // Real dates only (Google ignores a lastmod that is always "now"): a product's last admin save, and for pages
  // that list prices (home, categories, brands, delivery) the last catalog change. No known date = no lastmod.
  let deleted = new Set<string>();
  let extraIds: string[] = [];
  const saved: Record<string, Date> = {};
  let catalogDate: Date | undefined;
  try {
    const file = path.join(process.cwd(), "public", "uploads", "_store", "catalog.json");
    catalogDate = (await stat(file)).mtime;
    const raw = await readFile(file, "utf-8");
    const j = JSON.parse(raw) as {
      products?: Record<string, Product>;
      deleted?: string[];
    };
    if (Array.isArray(j.deleted)) deleted = new Set(j.deleted);
    if (j.products && typeof j.products === "object") {
      for (const p of Object.values(j.products)) if (p?.updatedAt && !isNaN(Date.parse(p.updatedAt))) saved[p.id] = new Date(p.updatedAt);
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
    lastModified: saved[id],
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
    lastModified: catalogDate,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const posts = await listPosts();
  const newestPost = posts.map((p) => new Date(p.published)).filter((d) => !isNaN(+d)).sort((a, b) => +b - +a)[0];

  return [
    {
      url: baseUrl,
      lastModified: catalogDate,
      changeFrequency: "always",
      priority: 1.0,
    },
    ...categoryUrls,
    ...["/cigarette-prices-dubai", ...GUIDES.map((g) => `/${g.slug}`), "/delivery", "/about", ...DELIVERY_AREAS.map((a) => `/delivery/${a.slug}`)].map((p) => ({
      url: baseUrl + p,
      lastModified: p === "/about" ? undefined : catalogDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...brandGroups((await readSeoStore()).products).map((b) => ({
      url: `${baseUrl}/brand/${b.slug}`,
      lastModified: catalogDate,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
    { url: `${baseUrl}/blog`, lastModified: newestPost, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({
      url: baseUrl + postPath(p),
      lastModified: new Date(p.published),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...productUrls,
  ];
}
