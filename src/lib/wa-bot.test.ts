// Run: node src/lib/wa-bot.test.ts   (Node 22.6+ strips the types itself)
import assert from "node:assert/strict";
import { botReply, findArea, lineTotal, matchProducts, PIN, replyOk, type BotProduct, type BotResult } from "./wa-bot.ts";

const P: BotProduct[] = [
  { id: "marlboro-gold", title: "Marlboro Gold", brand: "Marlboro", category: "cigarettes", format: "Carton", cartonPrice: 190, fiveCartonPrice: 925, inStock: true },
  { id: "marlboro-red", title: "Marlboro Red", brand: "Marlboro", category: "cigarettes", format: "Carton", cartonPrice: 195, fiveCartonPrice: 950, inStock: true },
  { id: "dunhill-blue", title: "Dunhill Blue", brand: "Dunhill", category: "cigarettes", format: "Carton", cartonPrice: 150, inStock: false },
  { id: "velo-mint", title: "VELO Freezing Mint", brand: "VELO", category: "nicotine-pouches", format: "Can", cartonPrice: 35, inStock: true },
];
const S = { storeName: "Dubai Cigerette Shop", expressDeliveryMinutes: "45–75 min", freeDeliveryThreshold: 300, standardDeliveryFee: 20 };
const say = (r: BotResult, text: string, type = "TEXT") => botReply(text, type, P, S, true, r.state);

// exact product: its own prices, then asks how many
let r = botReply("price of marlboro gold?", "TEXT", P, S, false);
assert.equal(r.intent, "product");
assert.deepEqual(r.productIds, ["marlboro-gold"]);
assert.match(r.reply, /AED 190 a carton, 5 cartons AED 925/);
assert.equal(r.state?.step, "qty");
assert.doesNotMatch(r.reply, /Marlboro Red/);

// brand only: numbered in-stock list, cheapest first
r = botReply("Marlboro", "TEXT", P, S, false);
assert.equal(r.intent, "brand");
assert.match(r.reply, /\*1\* Marlboro Gold: AED 190/);
assert.deepEqual(r.state?.options, ["marlboro-gold", "marlboro-red"]);

// out-of-stock brand hands over to a person
assert.equal(botReply("dunhill", "TEXT", P, S, false).handover, true);

// full order by numbers: hi -> 1 (brand) -> 2 (product) -> 6 (qty) -> 1 more -> ... -> 0 -> area -> name -> YES
r = botReply("hi", "TEXT", P, S, false);
assert.equal(r.intent, "welcome");
assert.match(r.reply, /18\+/);
assert.match(r.reply, /\*1\* Marlboro: AED 190–195 a carton/);
assert.doesNotMatch(r.reply, /Dunhill/); // out of stock: not offered
r = say(r, "1");
assert.equal(r.state?.step, "product");
r = say(r, "2");
assert.equal(r.state?.pick, "marlboro-red");
r = say(r, "6 cartons");
assert.equal(r.state?.step, "more");
assert.match(r.reply, /6 cartons of \*Marlboro Red\*: AED 1145/); // 950 + 195
r = say(r, "9");
assert.match(r.reply, /Reply \*1\* to add another/); // wrong number: keeps the step
r = say(r, "1");
assert.equal(r.state?.step, "brand");
r = say(say(say(r, "1"), "1"), "1");
assert.equal(r.state?.cart.length, 2);
r = say(r, "0");
assert.equal(r.state?.step, "area");
r = say(r, "JLT cluster D");
assert.equal(r.state?.area, "JLT cluster D");
r = say(r, "Ali");
assert.equal(r.state?.step, "confirm");
assert.match(r.reply, /• 6 × Marlboro Red: AED 1145 \(5-carton price\)/);
assert.match(r.reply, /• 1 × Marlboro Gold: AED 190/);
assert.match(r.reply, /Delivery to JLT Cluster D: free/);
assert.match(r.reply, /Total: AED 1335/);
const conf = say(r, "yes");
assert.equal(conf.intent, "order");
assert.equal(conf.state, null);
assert.equal(conf.order?.total, 1335);
assert.equal(conf.order?.name, "Ali");
assert.match(conf.reply, /#\{ORDER\}/);

// small order pays the delivery fee; courier Emirates get the fee from the team
r = botReply("1 marlboro gold to deira", "TEXT", P, S, false);
assert.equal(r.state?.step, "more");
r = say(say(r, "done"), "Sara");
assert.match(r.reply, /Delivery to Deira: AED 20/);
assert.match(r.reply, /Total: AED 210/);
r = botReply("1 velo freezing mint", "TEXT", P, S, false);
assert.match(r.reply, /1 pack of \*VELO Freezing Mint\*: AED 35/);
r = say(say(say(r, "0"), "Abu Dhabi"), "Omar");
assert.match(r.reply, /courier fee confirmed by our team/);

// location pin fills the address; cancel clears; same again repeats the last order
r = say(botReply("2 marlboro gold", "TEXT", P, S, false), "0");
r = say(r, "", "LOCATION");
assert.equal(r.state?.area, PIN);
assert.equal(r.state?.step, "name");
assert.equal(say(r, "cancel").state, null);
r = botReply("same again please", "TEXT", P, S, true, null, conf.order!);
assert.equal(r.state?.step, "confirm");
assert.match(r.reply, /Total: AED 1335/);

// a product name in the area step is taken as a product
r = say(botReply("2 marlboro gold", "TEXT", P, S, false), "0");
assert.equal(say(r, "marlboro red").state?.pick, "marlboro-red");

// not understood inside an order: says so and flags it for the AI layer
r = say(say(botReply("2 marlboro gold", "TEXT", P, S, false), "1"), "qwerty zzz");
assert.equal(r.understood, false);
assert.equal(r.state?.step, "brand");

// person, media, thanks, delivery, menu
assert.equal(botReply("can I talk to a person", "TEXT", P, S, true).intent, "human");
assert.equal(botReply("", "AUDIO", P, S, true).intent, "media");
assert.equal(botReply("ok thanks", "TEXT", P, S, true).intent, "thanks");
assert.equal(botReply("ok marlboro", "TEXT", P, S, true).intent, "brand");
assert.equal(botReply("menu", "TEXT", P, S, true).state?.step, "brand");
assert.match(botReply("how long is delivery", "TEXT", P, S, false).reply, /Free delivery from AED 300, otherwise AED 20/);
assert.equal(botReply("qwerty zzz", "TEXT", P, S, true).understood, false);

// a distinctive brand word finds a multi-word brand; a greeting later in the chat still gets the welcome
assert.equal(matchProducts("terea", [...P, { id: "terea-amber", title: "TEREA Amber", brand: "IQOS TEREA", category: "iqos-terea", cartonPrice: 200 }]).brand, "IQOS TEREA");
assert.equal(botReply("Salam", "TEXT", P, S, true).intent, "welcome");

// helpers
assert.equal(lineTotal({ productId: "x", title: "x", brand: "x", qty: 11, carton: 10, five: 45, unit: "carton" }), 100);
assert.equal(lineTotal({ productId: "x", title: "x", brand: "x", qty: 5, carton: 10, five: 0, unit: "pack" }), 50);
assert.equal(findArea("deliver to Al Nahda pls"), "al nahda");
assert.equal(findArea("hello"), "");
assert.equal(findArea("Al Nahda Sharjah"), "al nahda sharjah");
assert.equal(botReply("bhai 2 dibba marlboro gold bhej do", "TEXT", P, S, false).state?.step, "more");
assert.equal(say(botReply("marlboro gold", "TEXT", P, S, false), "bas itna hi").state?.step, "qty"); // not a greeting
assert.deepEqual(matchProducts("freezing mint velo", P).items.map((p) => p.id), ["velo-mint"]);
assert.deepEqual(matchProducts("random words", P).items, []);
console.log("wa-bot: all checks passed");

// the AI gate: wording may change, facts may not
{
  const draft = "Cigarette prices today. Reply with a number to order:\n*1* Marlboro: AED 190–195 a carton\n\nReply *menu* any time.";
  assert.equal(replyOk(draft, "Hey! 😊 Here are today's prices, just reply with a number:\n*1* Marlboro: AED 190–195 a carton\n\nReply *menu* any time."), true);
  assert.equal(replyOk(draft, "Hey!\n*1* Marlboro: AED 180–195 a carton\nReply *menu* any time."), false); // price changed
  assert.equal(replyOk(draft, "Hey!\n*1* Marlboro: AED 190–195 a carton\nReply *menu*. 10% off today!"), false); // invented number
  assert.equal(replyOk(draft, "Hey!\n*1* Marlboro: AED 190–195 a carton\nReply menu any time."), false); // command word lost
  assert.equal(replyOk("Order *#{ORDER}* placed.", "Thanks a lot! Your order *#{ORDER}* is placed."), true);
  assert.equal(replyOk("Order *#{ORDER}* placed.", "Thanks a lot! Order placed, see www.x.com"), false);
  assert.equal(replyOk("Added.\nReply *1* to add another product, or *0* to finish.", "Added! 😊"), false); // command dropped
  assert.equal(replyOk("🧾 *Your order*\nName: Imran\nReply *YES*", "🧾 *Your order*\nName: Imram\nReply *YES*"), false); // name changed
  assert.equal(replyOk("*Dunhill* in stock. Reply with a number:\n*1* Dunhill Blue: AED 145 a carton", "اختر رقم 😊\n*1* Dunhill Blue: AED 145 a carton"), true); // translated
}
console.log("wa-bot: AI gate checks passed");

// website chat: no pin, asks for the WhatsApp number (UAE local form made international), sends people to Live WA
{
  const web = (r: BotResult | null, text: string) => botReply(text, "TEXT", P, S, !!r, r?.state ?? null, null, "web");
  let w = web(null, "2 marlboro gold");
  w = web(w, "0");
  assert.match(w.reply, /area and building/);
  w = web(web(w, "Marina Gate 2"), "Ali");
  assert.equal(w.state?.step, "phone");
  assert.match(web(w, "12").reply, /valid mobile number/);
  w = web(w, "050 123 4567");
  assert.equal(w.state?.step, "confirm");
  assert.match(w.reply, /Phone: \+971501234567/);
  const done = web(w, "yes");
  assert.equal(done.order?.phone, "971501234567");
  assert.match(done.reply, /confirm it on WhatsApp/);
  assert.match(web(null, "talk to a person").reply, /Live WA/);
}
// a question about ordering gets a yes + the menu; a quantity typed with a brand is kept until the pick
assert.match(botReply("can i order here?", "TEXT", P, S, true).reply, /Yes, you can order right here/);
r = botReply("2 marlboro", "TEXT", P, S, false);
assert.equal(r.state?.want, 2);
r = say(r, "2");
assert.equal(r.state?.step, "more");
assert.equal(r.state?.cart[0].qty, 2);
// not understood mid-order: the question is asked again, not "sorry"
r = say(botReply("marlboro", "TEXT", P, S, false), "hmm not sure");
assert.match(r.reply, /Which one would you like/);
assert.equal(r.understood, false);
console.log("wa-bot: website chat checks passed");
