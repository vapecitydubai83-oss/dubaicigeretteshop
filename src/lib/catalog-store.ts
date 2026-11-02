import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { Product, StoreSettings } from "@/lib/catalog-data";

const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "catalog.json");

export interface CatalogStore {
  products: Record<string, Product>;
  deleted: string[];
  settings?: Partial<StoreSettings>;
}

export async function readCatalogStore(): Promise<CatalogStore> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const j = JSON.parse(raw);
    return {
      products: j.products && typeof j.products === "object" ? j.products : {},
      deleted: Array.isArray(j.deleted) ? j.deleted : [],
      settings: j.settings && typeof j.settings === "object" ? j.settings : undefined,
    };
  } catch {
    return { products: {}, deleted: [] };
  }
}

export async function writeCatalogStore(store: CatalogStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(store), "utf-8");
  await rename(tmp, DATA_FILE);
}
