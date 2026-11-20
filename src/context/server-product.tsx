"use client";

import { createContext, useContext } from "react";
import type { Product } from "@/lib/catalog-data";
import type { Review } from "@/lib/reviews";

// The product as saved on the server (base data + admin edits), so the first
// render (and the HTML search engines read) shows the saved specs, not the built-in ones.
const ServerProductContext = createContext<Product | null>(null);
// approved reviews of this product (verified buyers), read on the server so search engines see them
const ServerReviewsContext = createContext<Review[]>([]);

export function ServerProductProvider({
  product,
  reviews = [],
  children,
}: {
  product: Product | null;
  reviews?: Review[];
  children: React.ReactNode;
}) {
  return (
    <ServerProductContext.Provider value={product}>
      <ServerReviewsContext.Provider value={reviews}>{children}</ServerReviewsContext.Provider>
    </ServerProductContext.Provider>
  );
}

export const useServerProduct = () => useContext(ServerProductContext);
export const useServerReviews = () => useContext(ServerReviewsContext);
