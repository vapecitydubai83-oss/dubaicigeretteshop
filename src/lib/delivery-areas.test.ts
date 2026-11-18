// Run: node src/lib/delivery-areas.test.ts  (Node 24 runs .ts directly)
import assert from "node:assert/strict";
import { areaTime, DELIVERY_AREAS, SHARJAH_AJMAN_TIME } from "./delivery-areas.ts";

const slugs = DELIVERY_AREAS.map((a) => a.slug);
assert.equal(new Set(slugs).size, slugs.length, "duplicate slug");
for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);

// owner rule: no copied text from page to page; every sentence of every area text is used once
const seen = new Map<string, string>();
for (const a of DELIVERY_AREAS) {
  for (const text of [a.intro, a.address, a.question, a.answer]) {
    for (const sentence of text.split(/(?<=[.?!])\s+/)) {
      const key = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      if (key.split(" ").length < 4) continue;
      assert.ok(!seen.has(key), `"${sentence}" is on both ${seen.get(key)} and ${a.slug}`);
      seen.set(key, a.slug);
    }
  }
}

assert.equal(areaTime(DELIVERY_AREAS.find((a) => a.slug === "deira")!, "45–75 Mins"), "45–75 Mins");
assert.equal(areaTime(DELIVERY_AREAS.find((a) => a.slug === "sharjah")!, "45–75 Mins"), SHARJAH_AJMAN_TIME);
console.log(`ok: ${DELIVERY_AREAS.length} areas, ${seen.size} sentences, none repeated`);
