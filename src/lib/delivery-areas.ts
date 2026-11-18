// Delivery-area pages (/delivery/<slug>). Every text is written for that area only: no sentence is shared
// between areas (checked by delivery-areas.test.ts). Times are the shop's real ones: Dubai = the live
// "express delivery" setting, Sharjah and Ajman = SHARJAH_AJMAN_TIME (the same figure the /delivery table shows).
export const SHARJAH_AJMAN_TIME = "60–75 Mins";

export interface DeliveryArea {
  slug: string;
  name: string;
  emirate: "Dubai" | "Sharjah" | "Ajman";
  places: string[]; // neighbourhoods and communities the page covers
  intro: string;
  address: string; // what to send so the rider finds you
  question: string; // one area-specific FAQ
  answer: string;
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  {
    slug: "dubai-marina-jbr",
    name: "Dubai Marina & JBR",
    emirate: "Dubai",
    places: ["Dubai Marina", "JBR (Jumeirah Beach Residence)", "Bluewaters", "JLT (Jumeirah Lake Towers)", "Dubai Harbour"],
    intro:
      "Most homes around the Marina are high-rise flats, so our riders hand cartons over at the tower lobby or come up to your floor when the building allows it. JBR, Bluewaters and the JLT clusters across Sheikh Zayed Road are on the same route.",
    address:
      "Send the tower name and flat number. In JLT also send the cluster letter (for example Cluster D), because many towers there have similar names.",
    question: "Can the rider come up to my flat in a Marina tower?",
    answer:
      "Yes, if your building security lets delivery riders in. Where it does not, the rider waits at the lobby desk and calls you on WhatsApp when they arrive.",
  },
  {
    slug: "downtown-dubai-business-bay",
    name: "Downtown Dubai, Business Bay & DIFC",
    emirate: "Dubai",
    places: ["Downtown Dubai", "Burj Khalifa district", "Business Bay", "DIFC", "City Walk"],
    intro:
      "We bring orders to flats, offices and hotel lobbies around the Burj Khalifa, along the Business Bay canal and inside DIFC. Office orders during working hours are common here; the rider brings them to your reception.",
    address:
      "Give the building name and the street side (Sheikh Zayed Road side or Al Khail side in Business Bay), or drop a location pin. For an office, add the company name for reception.",
    question: "Can I get cigarettes delivered to my office in DIFC or Business Bay?",
    answer:
      "Yes. Send the office building, floor and company name. The rider leaves the order at reception only after an adult has received it and paid.",
  },
  {
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    emirate: "Dubai",
    places: ["Palm Jumeirah fronds (villas)", "Shoreline Apartments", "Palm trunk towers", "Palm West Beach", "Hotels on the Crescent"],
    intro:
      "The Palm has three kinds of addresses: villas on the fronds, apartment blocks on the trunk, and hotels on the outer Crescent. Our riders cover all three, with gate security in some communities adding a few minutes.",
    address:
      "For a villa send the frond letter and villa number (for example Frond G, villa 12). For the trunk send the building name, such as the Shoreline building number. For a hotel give the hotel name and your room number.",
    question: "Do you deliver to hotels on Palm Jumeirah?",
    answer:
      "Yes, to the hotel lobby. Tell us the hotel and room number; the rider calls you to come down, since many hotels do not let riders go to the rooms.",
  },
  {
    slug: "jumeirah-umm-suqeim",
    name: "Jumeirah & Umm Suqeim",
    emirate: "Dubai",
    places: ["Jumeirah 1, 2 and 3", "Umm Suqeim 1, 2 and 3", "Al Wasl", "Al Safa", "La Mer"],
    intro:
      "This stretch along the Jumeirah Beach Road is mostly villas and low-rise homes. Villa numbers can be hard to see at night, so a location pin works best here.",
    address:
      "Drop a WhatsApp location pin on your gate and add the villa number and the street number. A nearby landmark, like a mosque or school, also helps.",
    question: "I live in a villa in Umm Suqeim. What should I send for the address?",
    answer:
      "A live or dropped location pin on your gate is the fastest way. Add the villa number so the rider can match it when they get to your street.",
  },
  {
    slug: "jvc-jvt-dubai-hills",
    name: "JVC, JVT & Dubai Hills",
    emirate: "Dubai",
    places: ["Jumeirah Village Circle (JVC)", "Jumeirah Village Triangle (JVT)", "Dubai Hills Estate", "Al Barari", "Motor City", "Sports City"],
    intro:
      "JVC is laid out in circles of districts, and the same building name can appear more than once, so the district number matters. We also deliver to the villa and apartment communities of Dubai Hills, Motor City and Sports City.",
    address:
      "In JVC or JVT send the district number together with the building name (for example District 12). In Dubai Hills send the community name and the building or villa number.",
    question: "Why do you ask for my JVC district number?",
    answer:
      "Several JVC buildings carry similar names in different districts. With the district number the rider goes straight to the right one instead of calling you to find it.",
  },
  {
    slug: "deira",
    name: "Deira",
    emirate: "Dubai",
    places: ["Al Rigga", "Al Muraqqabat", "Port Saeed", "Al Qusais", "Al Garhoud", "Hor Al Anz"],
    intro:
      "Deira is the older side of the Creek, with busy streets, many shops and residential buildings close together. Parking near the door is often hard, so the rider may call you to come down to the street.",
    address:
      "Send the building name and the street, or the nearest metro station (for example Al Rigga or Union). A pin is the surest way between the narrow streets.",
    question: "Do you deliver late at night in Deira?",
    answer:
      "Orders are taken 24 hours a day on WhatsApp. Late at night the team tells you the expected arrival time when they confirm the order.",
  },
  {
    slug: "bur-dubai-karama",
    name: "Bur Dubai, Karama & Oud Metha",
    emirate: "Dubai",
    places: ["Bur Dubai", "Al Karama", "Oud Metha", "Al Mankhool", "Al Jaddaf", "Al Satwa"],
    intro:
      "On the Bur Dubai side of the Creek we cover the old Meena Bazaar streets, the Karama blocks and Oud Metha near Healthcare City. These are dense neighbourhoods of mid-rise buildings with shops on the ground floor.",
    address:
      "Karama buildings are numbered by block, so send the block and building number. In Bur Dubai the building name with a nearby landmark (for example BurJuman or the Bur Dubai bus station) works well.",
    question: "Can I pay cash on delivery in Karama?",
    answer:
      "Yes. You check the sealed products first, then pay the rider by cash or card. Keep the exact amount ready for cash if you can.",
  },
  {
    slug: "al-barsha-tecom",
    name: "Al Barsha & Barsha Heights (Tecom)",
    emirate: "Dubai",
    places: ["Al Barsha 1, 2 and 3", "Barsha Heights (Tecom)", "Al Sufouh", "Dubai Internet City", "Dubai Media City", "Knowledge Park"],
    intro:
      "Al Barsha mixes apartment buildings near Mall of the Emirates with villa streets further south. Barsha Heights, Internet City and Media City add offices and many residential towers.",
    address:
      "Send the building name and the nearest landmark, such as Mall of the Emirates or its metro station. For a villa in Al Barsha 2 or 3, drop a pin.",
    question: "Is Barsha Heights the same as Tecom for delivery?",
    answer:
      "Yes, it is the same area; many people still call it Tecom. Send the tower name and we take care of the rest.",
  },
  {
    slug: "creek-harbour-festival-city",
    name: "Dubai Creek Harbour & Festival City",
    emirate: "Dubai",
    places: ["Dubai Creek Harbour", "Dubai Festival City", "Ras Al Khor", "Nad Al Hamar"],
    intro:
      "On the east bank of the Creek, Dubai Creek Harbour is a newer area of residential towers, and Festival City combines homes, hotels and the mall. Both are reached from the Ras Al Khor road side.",
    address:
      "Send the tower name and the building number or phase. In Festival City say whether it is a villa in Al Badia, an apartment, or a hotel.",
    question: "Do you deliver to the new towers in Dubai Creek Harbour?",
    answer:
      "Yes. Some new buildings are not yet on every map, so a location pin together with the tower name avoids a wrong turn.",
  },
  {
    slug: "international-city",
    name: "International City & Dragon Mart",
    emirate: "Dubai",
    places: ["International City (country clusters)", "Dragon Mart area", "Warsan", "Silicon Oasis", "Al Warqa"],
    intro:
      "International City is built in country-themed clusters (China, England, France, Russia and more), with similar-looking buildings in each. We also cover Silicon Oasis and Al Warqa on the same side of the city.",
    address:
      "Send the cluster name and the building number, for example England cluster, building X-04. Without the cluster the rider cannot tell the buildings apart.",
    question: "What address do I give in International City?",
    answer:
      "The cluster name plus the building code printed on the wall. A pin is a good extra, because street names are rarely used here.",
  },
  {
    slug: "sharjah",
    name: "Sharjah",
    emirate: "Sharjah",
    places: ["Al Nahda (Sharjah)", "Al Taawun", "Al Khan", "Al Majaz", "Al Qasimia", "Muwaileh"],
    intro:
      "Sharjah gets the same express riders as Dubai, with a longer delivery time because of the drive and the traffic at the Dubai–Sharjah border. Al Nahda, Al Taawun, Al Majaz and Al Khan are where most of our Sharjah orders go.",
    address:
      "Send the building name and area, or a location pin. Al Nahda sits on both sides of the Dubai–Sharjah border, so tell us which side you are on.",
    question: "How long does delivery to Sharjah take?",
    answer:
      "Express delivery to Sharjah takes about 60 to 75 minutes. At rush hour the border traffic can add time; the team tells you when they confirm.",
  },
  {
    slug: "ajman",
    name: "Ajman",
    emirate: "Ajman",
    places: ["Al Nuaimiya", "Al Rashidiya", "Al Jurf", "Ajman Corniche", "Al Rawda", "Emirates City"],
    intro:
      "Ajman is reached through Sharjah, so riders come by the coast road or Sheikh Mohammed Bin Zayed Road. We deliver to the towers near the Corniche, the Al Nuaimiya and Al Rashidiya blocks, and the newer Emirates City buildings.",
    address:
      "Send the tower or building name and a pin. In Al Nuaimiya and Al Rashidiya many towers are numbered, so add the tower number.",
    question: "Is delivery to Ajman free?",
    answer:
      "It follows the same rule as Dubai and Sharjah: express delivery is free above the order value shown on this page, and a small rider fee applies below it.",
  },
];

export const areaBySlug = (slug: string) => DELIVERY_AREAS.find((a) => a.slug === slug);
export const areaTime = (a: DeliveryArea, dubaiTime: string) => (a.emirate === "Dubai" ? dubaiTime : SHARJAH_AJMAN_TIME);
