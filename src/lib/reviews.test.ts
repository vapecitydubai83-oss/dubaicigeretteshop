// run: node src/lib/reviews.test.ts
import assert from "node:assert/strict";
import { cleanSubmission, orderIdFromToken, publicName, reviewToken } from "./reviews.ts";

const t = reviewToken("k1", "EC-9001");
assert.equal(orderIdFromToken("k1", t), "EC-9001");
assert.equal(orderIdFromToken("k2", t), null); // other secret
assert.equal(orderIdFromToken("k1", t.replace("EC-9001", "EC-9002")), null); // other order
assert.equal(orderIdFromToken("k1", "EC-9001"), null);
assert.equal(orderIdFromToken("", t), null);

assert.equal(publicName("ahmed khan"), "Ahmed K.");
assert.equal(publicName("  sara "), "Sara");
assert.equal(publicName("<b>"), "B");
assert.equal(publicName(""), "Verified buyer");

const prods = [{ productId: "a", title: "Marlboro Red" }, { productId: "b", title: "ESSE" }];
assert.equal(cleanSubmission([], prods).error, "Please rate at least one product.");
const r = cleanSubmission(
  [
    { productId: "a", rating: 5, text: " great\u0000 " },
    { productId: "a", rating: 1 }, // duplicate
    { productId: "x", rating: 5 }, // not in order
    { productId: "b", rating: 9 }, // bad rating
  ],
  prods
);
assert.deepEqual(r.rows, [{ productId: "a", productTitle: "Marlboro Red", rating: 5, text: "great" }]);
console.log("ok: reviews");
