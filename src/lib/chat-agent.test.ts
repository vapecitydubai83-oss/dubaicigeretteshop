// node src/lib/chat-agent.test.ts : the AI-led chat may talk freely, but only checked actions change the order.
import assert from "node:assert/strict";
import { agentReplyOk, applyAgent, parseAgent, type AgentAction } from "./chat-agent.ts";
import type { BotProduct, OrderState } from "./wa-bot.ts";

const P: BotProduct[] = [
  { id: "mg", title: "Marlboro Gold Cigarettes", brand: "Marlboro", category: "cigarettes", cartonPrice: 200, fiveCartonPrice: 950, inStock: true },
  { id: "mr", title: "Marlboro Red Cigarettes", brand: "Marlboro", category: "cigarettes", cartonPrice: 190, inStock: true },
  { id: "db", title: "Dunhill Blue", brand: "Dunhill", category: "cigarettes", cartonPrice: 150, inStock: false },
];
const S = { storeName: "Dubai Cigerette Shop", expressDeliveryMinutes: "45–75 min", freeDeliveryThreshold: 300, standardDeliveryFee: 20 };
const facts = "- [mg] Marlboro Gold Cigarettes: AED 200 a carton, 5 for AED 950\n- [mr] Marlboro Red Cigarettes: AED 190 a carton";
const go = (st: OrderState | null, actions: AgentAction[], reply: string, web = false, said = "") =>
  applyAgent(st, actions, reply, P, S, web, facts + " " + said);

// "2 gold n 1 red pls" -> cart, then the next question comes from the AI; no summary yet
let r: any = go(null, [{ do: "qty", id: "mg", qty: 2 }, { do: "qty", id: "mr", qty: 1 }], "Sure! 2 Gold and 1 Red. Where should we deliver?", false, "2 gold n 1 red pls");
assert.ok(r);
assert.equal(r!.state?.step, "area");
assert.equal(r!.state?.cart.length, 2);
assert.doesNotMatch(r!.reply, /Your order/);

// address + name in one message -> the code adds the summary, AI text stays on top
r = go(r!.state, [{ do: "area", value: "Marina Gate 2, Dubai Marina" }, { do: "name", value: "Ravi" }], "Thanks Ravi!", false, "marina gate 2 dubai marina, name ravi");
assert.equal(r!.state?.step, "confirm");
assert.match(r!.reply, /^Thanks Ravi!\n\n🧾 \*Your order\*/);
assert.match(r!.reply, /\*Total: AED 590\*/);

// "yes" -> placed by the code, with the order
const placed = go(r!.state, [{ do: "place" }], "Great, placing it now!");
assert.equal(placed!.intent, "order");
assert.equal(placed!.order?.total, 590);
assert.match(placed!.reply, /\{ORDER\}/);
assert.equal(placed!.state, null);

// "make it 3 gold" while the summary is up: cart changes, no order, new summary
const more = go(r!.state, [{ do: "qty", id: "mg", qty: 3 }, { do: "place" }], "Done, 3 Gold now.", false, "make it 3 gold");
assert.equal(more!.order, undefined);
assert.match(more!.reply, /3 × Marlboro Gold Cigarettes: AED 600/);

// place before any summary was shown: no order
assert.equal(go({ step: "name", cart: r!.state!.cart, area: "jlt" }, [{ do: "place" }], "Placing it!")?.order, undefined);

// website chat needs a phone number before the summary
r = go(null, [{ do: "qty", id: "mr", qty: 1 }, { do: "area", value: "JLT cluster D" }, { do: "name", value: "Ali" }], "Got it Ali. What's your WhatsApp number?", true);
assert.equal(r!.state?.step, "phone");
r = go(r!.state, [{ do: "phone", value: "050 123 4567" }], "Thanks!", true, "050 123 4567");
assert.equal(r!.state?.phone, "971501234567");
assert.equal(r!.state?.step, "confirm");

// checks: invented price, made-up "placed", foreign link, unknown or sold-out product, silly quantity
assert.equal(typeof go(null, [], "Marlboro Gold is AED 180 today!"), "string");
assert.equal(typeof go(null, [], "Your order is placed!"), "string");
assert.equal(typeof go(null, [], "See https://example.com"), "string");
assert.equal(typeof go(null, [{ do: "qty", id: "nope", qty: 1 }], "Added!"), "string");
assert.equal(typeof go(null, [{ do: "qty", id: "db", qty: 1 }], "Added!"), "string");
assert.equal(typeof go(null, [{ do: "qty", id: "mg", qty: 500 }], "Added!"), "string");
assert.equal(agentReplyOk("Gold is AED 200 a carton.", facts), true);
assert.equal(agentReplyOk("Our prices are standard for genuine licensed products.", facts), false);
assert.equal(typeof go(null, [], "Great, your order is on its way!"), "string");
assert.match(String(go(r!.state, [], "Sure, removing the Gold.")), /no qty action/); // said it, did not do it
assert.equal(typeof go(r!.state, [{ do: "area", value: "JLT cluster D" }], "Updated your address."), "object");
assert.equal(go(null, [{ do: "agent" }], "Sure, a team member will message you.")?.handover, true);
assert.equal(go({ step: "area", cart: [] }, [{ do: "cancel" }], "No problem, cancelled.")?.state, null);

// model output: JSON inside text is read, junk is not
assert.deepEqual(parseAgent('ok {"reply":"Hi!","actions":[{"do":"qty","id":"mg","qty":1},5]}'), { reply: "Hi!", actions: [{ do: "qty", id: "mg", qty: 1 }] });
assert.equal(parseAgent("sorry I cannot"), null);
console.log("chat-agent: all checks passed");
