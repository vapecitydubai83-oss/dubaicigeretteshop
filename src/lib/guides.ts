// Answer-first buying guides for searches the shop shows up for but ranks low on (Search Console, PLAN 74t).
// Every product, price and count comes from the live catalog; the text never names a price itself.
import type { Product } from "@/lib/catalog-data";
import { aed, brandGroups, priceRange } from "./brands.ts";

export interface Guide {
  slug: string;
  title: string; // <title> and H1
  description: string; // meta description
  pick: (cigs: Product[]) => Product[]; // which cartons the page lists, in order
  lead: (list: Product[], all: Product[]) => string;
  faqs: (list: Product[], all: Product[]) => { q: string; a: string }[];
}

const byPrice = (a: Product, b: Product) => a.cartonPrice - b.cartonPrice;
const names = (list: Product[], n: number) => list.slice(0, n).map((p) => `${p.title} (${aed(p.cartonPrice)})`).join(", ");
const range = (list: Product[]) => priceRange(list[0].cartonPrice, list[list.length - 1].cartonPrice);

export const isSlim = (p: Product) => p.flavor === "Super Slim" || /\b(super ?slims?|slims?|nano|compact)\b/i.test(p.title) || ["ESSE", "Vogue", "Mond"].includes(p.brand);
export const isMenthol = (p: Product) => p.flavor === "Menthol & Ice" || /menthol|menthe|\bice\b|\bmint\b|switch|change|fusion/i.test(p.title);

export const GUIDES: Guide[] = [
  {
    slug: "slim-cigarettes-dubai",
    title: "Slim Cigarettes in Dubai: Super Slims, Slims and Prices",
    description: "Slim and super slim cigarette cartons we deliver in Dubai: ESSE, Vogue, Davidoff Slims, Mond and more, with live carton prices.",
    pick: (c) => c.filter(isSlim).sort(byPrice),
    lead: (l) => `We stock ${l.length} slim and super slim cigarette cartons, priced ${range(l)} a carton of 10 packs. ESSE, Vogue and Mond make only slim sticks; Davidoff, Marlboro and others have slim lines too.`,
    faqs: (l) => [
      { q: "Which slim cigarettes can I buy in Dubai?", a: `Our slim and super slim cartons include ${names(l, 6)}.` },
      { q: "What is the lowest priced slim cigarette carton?", a: `In our catalog today it is ${l[0].title} at ${aed(l[0].cartonPrice)} a carton.` },
      { q: "What is the difference between slims and super slims?", a: "Super slims are the thinnest sticks (like ESSE and Vogue); slims are a little thicker. Both are thinner than a regular cigarette." },
    ],
  },
  {
    slug: "menthol-cigarettes-dubai",
    title: "Menthol Cigarettes in Dubai: Capsule and Menthol Cartons",
    description: "Menthol and capsule cigarette cartons delivered in Dubai: ESSE Menthol, Dunhill Switch, Marlboro Double Ice and more, with live carton prices.",
    pick: (c) => c.filter(isMenthol).sort(byPrice),
    lead: (l) => `We stock ${l.length} menthol and capsule cigarette cartons, priced ${range(l)} a carton. Capsule packs (like Dunhill Switch or ESSE Change) start as regular tobacco and turn menthol when you click the filter.`,
    faqs: (l) => [
      { q: "Which menthol cigarettes are available in Dubai?", a: `Our menthol and capsule cartons include ${names(l, 6)}.` },
      { q: "How much is a carton of ESSE Menthol?", a: (() => { const e = l.find((p) => /esse/i.test(p.title) && /menthol/i.test(p.title)); return e ? `${e.title} costs ${aed(e.cartonPrice)} a carton at Dubai Cigerette Shop.` : "ESSE Menthol is not in stock right now; ask us on WhatsApp for the nearest alternative."; })() },
      { q: "What is a capsule (click) cigarette?", a: "A capsule cigarette has a small flavour bead in the filter. Squeeze it and the smoke turns menthol or fruity; leave it and it tastes like a normal cigarette." },
    ],
  },
  {
    slug: "cheap-cigarettes-dubai",
    title: "Cheap Cigarettes in Dubai: Lowest Priced Cartons",
    description: "The lowest priced cigarette cartons in our Dubai catalog today, from the live price list, with fast WhatsApp delivery.",
    pick: (c) => [...c].sort(byPrice).slice(0, 15),
    lead: (l, all) => `The ${l.length} lowest priced cigarette cartons in our catalog today cost ${range(l)} each (10 packs, 200 sticks). Our full list has ${all.length} cartons; buying 5 cartons of the same product lowers the price per carton on most of them.`,
    faqs: (l) => [
      { q: "What are the cheapest cigarettes in Dubai?", a: `The lowest priced cartons in our catalog today are ${names(l, 5)}.` },
      { q: "Is it cheaper to buy 5 cartons?", a: (() => { const p = l.find((x) => x.fiveCartonPrice > 0 && x.fiveCartonPrice < x.cartonPrice * 5); return p ? `On most products, yes. For example ${p.title} is ${aed(p.cartonPrice)} for 1 carton and ${aed(p.fiveCartonPrice)} for 5.` : "The 5-carton price is shown on every product page."; })() },
    ],
  },
  {
    slug: "cigarette-brands-uae",
    title: "Cigarette Brands in the UAE: Every Brand We Stock",
    description: "All cigarette brands we sell and deliver in Dubai and the UAE, with the number of variants and the carton price range for each.",
    pick: (c) => [...c].sort((a, b) => a.brand.localeCompare(b.brand) || byPrice(a, b)),
    lead: (l) => { const b = brandGroups(l); return `We stock ${b.length} cigarette brands (${l.length} cartons in total), from ${b.slice(0, 5).map((g) => g.name).join(", ")} to smaller names. Each brand below links to its own page with every variant and price.`; },
    faqs: (l) => { const b = brandGroups(l); return [
      { q: "Which cigarette brands are sold in the UAE?", a: `At Dubai Cigerette Shop: ${b.map((g) => g.name).join(", ")}.` },
      { q: "Which brand has the most choices?", a: `${b[0].name}, with ${b[0].products.length} variants from ${priceRange(b[0].min, b[0].max)} a carton.` },
    ]; },
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
