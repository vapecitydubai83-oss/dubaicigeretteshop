// Run: node src/lib/wa-bot.test.ts   (Node 22.6+ strips the types itself)
import assert from "node:assert/strict";
import { botReply, findArea, matchProducts, type BotProduct } from "./wa-bot.ts";

const P: BotProduct[] = [
  { id: "marlboro-gold", title: "Marlboro Gold", brand: "Marlboro", category: "cigarettes", format: "Carton", cartonPrice: 190, fiveCartonPrice: 925, inStock: true },
  { id: "marlboro-red", title: "Marlboro Red", brand: "Marlboro", category: "cigarettes", format: "Carton", cartonPrice: 195, fiveCartonPrice: 950, inStock: true },
  { id: "dunhill-blue", title: "Dunhill Blue", brand: "Dunhill", category: "cigarettes", format: "Carton", cartonPrice: 150, inStock: false },
  { id: "velo-mint", title: "VELO Freezing Mint", brand: "VELO", category: "nicotine-pouches", format: "Can", cartonPrice: 35, inStock: true },
];
const S = { storeName: "Dubai Cigerette Shop", expressDeliveryMinutes: "45–75 min", freeDeliveryThreshold: 300, standardDeliveryFee: 20 };

// exact product: its own prices and link, nothing else
let r = botReply("price of marlboro gold?", "TEXT", P, S, false);
assert.equal(r.intent, "product");
assert.deepEqual(r.productIds, ["marlboro-gold"]);
assert.match(r.reply, /1 carton: AED 190/);
assert.match(r.reply, /5 cartons: AED 925/);
assert.doesNotMatch(r.reply, /Marlboro Red/);

// brand only: in-stock list, cheapest first
r = botReply("Marlboro", "TEXT", P, S, false);
assert.equal(r.intent, "brand");
assert.ok(r.reply.indexOf("Marlboro Gold") < r.reply.indexOf("Marlboro Red"));

// out-of-stock brand hands over to a person
r = botReply("dunhill", "TEXT", P, S, false);
assert.equal(r.handover, true);

// product + area = order request, handover
r = botReply("1 marlboro red to dubai marina please", "TEXT", P, S, true);
assert.equal(r.intent, "order");
assert.equal(r.handover, true);
assert.match(r.reply, /Marlboro Red.*Dubai Marina/);

// location pin, person, media, thanks, welcome, brand list from real prices
assert.equal(botReply("", "LOCATION", P, S, true).handover, true);
assert.equal(botReply("can I talk to a person", "TEXT", P, S, true).intent, "human");
assert.equal(botReply("", "AUDIO", P, S, true).intent, "media");
assert.equal(botReply("ok thanks", "TEXT", P, S, true).intent, "thanks");
assert.equal(botReply("ok marlboro", "TEXT", P, S, true).intent, "brand");
r = botReply("hi", "TEXT", P, S, false);
assert.equal(r.intent, "welcome");
assert.match(r.reply, /18\+/);
r = botReply("price list", "TEXT", P, S, false);
assert.match(r.reply, /Marlboro\*: AED 190–195 a carton/);
assert.doesNotMatch(r.reply, /Dunhill/); // out of stock: not offered
assert.match(botReply("how long is delivery", "TEXT", P, S, false).reply, /Free delivery from AED 300, otherwise AED 20/);

// a distinctive brand word finds a multi-word brand; a greeting later in the chat still gets the welcome
assert.equal(matchProducts("terea", [...P, { id: "terea-amber", title: "TEREA Amber", brand: "IQOS TEREA", category: "iqos-terea", cartonPrice: 200 }]).brand, "IQOS TEREA");
assert.equal(botReply("Salam", "TEXT", P, S, true).intent, "welcome");

// matching helpers
assert.equal(findArea("deliver to Al Nahda pls"), "al nahda");
assert.equal(findArea("hello"), "");
assert.deepEqual(matchProducts("freezing mint velo", P).items.map((p) => p.id), ["velo-mint"]);
assert.deepEqual(matchProducts("random words", P).items, []);
console.log("wa-bot: all checks passed");
