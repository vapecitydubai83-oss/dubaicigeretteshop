import Link from "next/link";
import { aed, type BrandGroup } from "@/lib/brands";

/** The live carton price list, the same on /cigarette-prices-dubai and every /delivery/<area> page. */
export function CartonPriceTable({ brands, caption }: { brands: BrandGroup[]; caption: string }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#0A2F42] text-white text-left text-xs uppercase tracking-wide">
          <tr>
            <th scope="col" className="p-3">Brand</th>
            <th scope="col" className="p-3">Cigarette</th>
            <th scope="col" className="p-3">Strength</th>
            <th scope="col" className="p-3 whitespace-nowrap">1 carton</th>
            <th scope="col" className="p-3 whitespace-nowrap">5 cartons</th>
            <th scope="col" className="p-3">Stock</th>
          </tr>
        </thead>
        <tbody>
          {brands.flatMap((b) =>
            b.products.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100">
                <td className="p-3">
                  <Link href={`/brand/${b.slug}`} className="text-zinc-700 underline">{b.name}</Link>
                </td>
                <td className="p-3">
                  <Link href={`/product/${p.id}`} className="font-bold text-[#0A2F42] underline">{p.title}</Link>
                </td>
                <td className="p-3 text-zinc-600">{p.strength}</td>
                <td className="p-3 font-bold whitespace-nowrap">{aed(p.cartonPrice)}</td>
                <td className="p-3 whitespace-nowrap">{aed(p.fiveCartonPrice)}</td>
                <td className="p-3">{p.inStock ? "In stock" : "Out of stock"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
