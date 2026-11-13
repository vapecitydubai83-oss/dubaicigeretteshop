import type { Product } from "@/lib/catalog-data";

// Catalog "brands" that are buckets, not a brand people search for: no brand page.
const BUCKETS = new Set(["Premium E-Liquid", "Disposable Vapes", "Premium Cigars", "Premium Accessories"]);

export const brandSlug = (brand: string) =>
  brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Does this catalog brand have a /brand/<slug> page? */
export const hasBrandPage = (brand: string) => !!brand && !BUCKETS.has(brand) && !!brandSlug(brand);

export interface BrandGroup {
  name: string;
  slug: string;
  products: Product[];
  min: number;
  max: number;
  category: Product["category"]; // the category most of its products are in
}

/** Real brands in the live catalog, biggest first. */
export function brandGroups(products: Product[]): BrandGroup[] {
  const by = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.brand || BUCKETS.has(p.brand)) continue;
    by.set(p.brand, [...(by.get(p.brand) ?? []), p]);
  }
  return [...by.entries()]
    .map(([name, list]) => {
      const count = new Map<string, number>();
      for (const p of list) count.set(p.category, (count.get(p.category) ?? 0) + 1);
      const prices = list.map((p) => p.cartonPrice).filter((n) => n > 0);
      return {
        name,
        slug: brandSlug(name),
        products: [...list].sort((a, b) => a.cartonPrice - b.cartonPrice),
        min: Math.min(...prices),
        max: Math.max(...prices),
        category: [...count.entries()].sort((a, b) => b[1] - a[1])[0][0] as Product["category"],
      };
    })
    .filter((g) => g.slug && Number.isFinite(g.min))
    .sort((a, b) => b.products.length - a.products.length);
}

export const CATEGORY_LABEL: Record<string, string> = {
  cigarettes: "Cigarettes",
  "iqos-terea": "IQOS & TEREA",
  vapes: "Vapes & Disposables",
  "e-liquid": "E-Liquids",
  "nicotine-pouches": "Nicotine Pouches",
  "hookah-shisha": "Hookah & Shisha",
  accessories: "Accessories & Lighters",
};

export const aed = (n: number) => `AED ${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** "AED 150" or "AED 120 to AED 200". */
export const priceRange = (min: number, max: number) => (min === max ? aed(min) : `${aed(min)} to ${aed(max)}`);
