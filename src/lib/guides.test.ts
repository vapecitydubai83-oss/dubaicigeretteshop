// node src/lib/guides.test.ts : guide pages pick the right cartons and every price they print comes from the catalog.
import assert from "node:assert/strict";
import { GUIDES, guideBySlug, isMenthol, isSlim } from "./guides.ts";
import type { Product } from "./catalog-data";

const mk = (id: string, title: string, brand: string, price: number, flavor = "Classic Tobacco", five = 0) =>
  ({ id, title, brand, cartonPrice: price, fiveCartonPrice: five, flavor, category: "cigarettes", inStock: true }) as unknown as Product;
const C = [
  mk("mg", "Marlboro Gold Cigarettes", "Marlboro", 200, "Smooth Gold", 950),
  mk("em", "ESSE Menthol Cigarettes", "ESSE", 85),
  mk("ds", "Dunhill Switch Blue Cigarettes", "Dunhill", 120),
  mk("dw", "Davidoff White Slims Cigarettes", "Davidoff", 165),
  mk("mx", "Manchester Blue", "Manchester", 70, "Classic Tobacco", 350),
];

assert.ok(isSlim(C[1]) && isSlim(C[3]) && !isSlim(C[0]));
assert.ok(isMenthol(C[1]) && isMenthol(C[2]) && !isMenthol(C[0]) && !isMenthol(C[3]));
assert.equal(guideBySlug("nope"), undefined);

const prices = new Set(C.flatMap((p) => [p.cartonPrice, p.fiveCartonPrice]).map(String));
for (const g of GUIDES) {
  const list = g.pick(C);
  assert.ok(list.length > 0, g.slug);
  const text = [g.title, g.description, g.lead(list, C), ...g.faqs(list, C).flatMap((f) => [f.q, f.a])].join(" ");
  for (const n of text.match(/AED (\d+)/g) || []) assert.ok(prices.has(n.slice(4)), `${g.slug}: ${n} not in the catalog`);
  assert.doesNotMatch(text, /genuine|authentic|best price|lowest in dubai/i, g.slug);
}
assert.deepEqual(guideBySlug("cheap-cigarettes-dubai")!.pick(C).map((p) => p.id).slice(0, 2), ["mx", "em"]);
// the 5-carton answer only quotes a real saving (Manchester 350 = 5 x 70 is no saving, Marlboro 950 < 1000 is)
assert.match(guideBySlug("cheap-cigarettes-dubai")!.faqs(guideBySlug("cheap-cigarettes-dubai")!.pick(C), C)[1].a, /Marlboro Gold.*AED 950/);
console.log("guides: all checks passed");
