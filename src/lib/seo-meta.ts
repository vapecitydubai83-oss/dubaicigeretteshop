import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  type Product,
  type StoreSettings,
} from "@/lib/catalog-data";
import { readCatalogStore } from "@/lib/catalog-store";

export const SITE_BASE_URL = "https://dubaicigeretteshop.ae";

export interface SeoStore {
  products: Product[];
  settings: StoreSettings;
}

/**
 * Server-side merged catalog for metadata generation: INITIAL_PRODUCTS overlaid
 * with admin edits / admin-added products from public/uploads/_store/catalog.json,
 * minus deleted ids — and INITIAL_SETTINGS overlaid with live settings (the SEO
 * agent's weekly rewrites reach the rendered tags through this).
 */
export async function readSeoStore(): Promise<SeoStore> {
  const store = await readCatalogStore();
  const deleted = new Set(store.deleted ?? []);
  const merged = new Map<string, Product>();
  for (const p of INITIAL_PRODUCTS) {
    if (!deleted.has(p.id)) merged.set(p.id, p);
  }
  for (const [id, p] of Object.entries(store.products ?? {})) {
    if (!deleted.has(id) && p && typeof p === "object") {
      merged.set(id, { ...(merged.get(id) ?? {}), ...p } as Product);
    }
  }
  const settings = { ...INITIAL_SETTINGS, ...(store.settings ?? {}) };
  return { products: [...merged.values()], settings };
}

/** Trim to max chars on a word boundary (audit limit for descriptions). */
export function clip(text: string, max = 160): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ") || max - 1) + "…";
}

/** Absolute og:image URL from the product's photo (custom > gallery). */
export function productOgImages(
  p?: Product | null
): { url: string; width?: number; height?: number }[] {
  const u = p?.customImageUrl || p?.galleryImages?.[0];
  if (!u || !u.trim()) return [];
  const url = u.startsWith("http")
    ? u
    : `${SITE_BASE_URL}${u.startsWith("/") ? u : `/${u}`}`;
  return [{ url, width: 1200, height: 630 }];
}
