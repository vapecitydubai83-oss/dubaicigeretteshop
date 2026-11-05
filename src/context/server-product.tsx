"use client";

import { createContext, useContext } from "react";
import type { Product } from "@/lib/catalog-data";

// The product as saved on the server (base data + admin edits), so the first
// render (and the HTML search engines read) shows the saved specs, not the built-in ones.
const ServerProductContext = createContext<Product | null>(null);

export function ServerProductProvider({
  product,
  children,
}: {
  product: Product | null;
  children: React.ReactNode;
}) {
  return (
    <ServerProductContext.Provider value={product}>
      {children}
    </ServerProductContext.Provider>
  );
}

export const useServerProduct = () => useContext(ServerProductContext);
