import { IMPORTED_PRODUCTS } from "./imported-products";
import { MORE_PRODUCTS } from "./imported-more";

export type ThemeId = "midnight-gold" | "future-glass" | "royal-sunset";

export type CategoryId =
  | "all"
  | "cigarettes"
  | "iqos-terea"
  | "vapes"
  | "e-liquid"
  | "accessories"
  | "nicotine-pouches"
  | "hookah-shisha";

export type BrandName =
  | "Marlboro"
  | "Dunhill"
  | "Davidoff"
  | "ESSE"
  | "Parliament"
  | "Winston"
  | "West"
  | "Vogue"
  | "IQOS TEREA"
  | "VAP DXB Exclusive"
  | "ELFBAR & HQD"
  | "VGOD & Nasty E-Liquid"
  | "VELO & White Fox"
  | "UWELL & Vaporesso"
  | "Villiger"
  | "American Spirit"
  | "Benson & Hedges"
  | "Captain Black"
  | "Chesterfield"
  | "Mond"
  | "Camel"
  | "Gold Leaf"
  | "L&M"
  | "Manchester"
  | "Platinum Seven"
  | "Lambda"
  | "Pablo"
  | "Killa"
  | "Rabbit"
  | "X Bar"
  | "Vozol"
  | "Geek Bar"
  | "Tugboat"
  | "ISGO & Ignite"
  | "Fummo"
  | "MYLE"
  | "JUUL"
  | "RELX"
  | "OXVA"
  | "VOOPOO"
  | "SMOK"
  | "Premium E-Liquid"
  | "Premium Pouches"
  | "Shisha & Hookah"
  | "Premium Accessories"
  | "Premium Cigars"
  | "Disposable Vapes"
  | "Al Fakher Shisha";

export type FlavorProfile =
  | "Classic Tobacco"
  | "Smooth Gold"
  | "Double Capsule"
  | "Menthol & Ice"
  | "Super Slim"
  | "Fruity & Lush Ice"
  | "Nicotine Pouch / Snus";

export interface Product {
  id: string;
  sku: string;
  title: string;
  arabicSubtitle?: string;
  brand: BrandName;
  category: Exclude<CategoryId, "all">;
  subCategory?: string; // e.g., "Disposable Vape", "Vape Kit", "Vape Mods", "Salt Nic"
  flavor: FlavorProfile;
  strength: "Light" | "Medium" | "Full Flavor" | "Ultra Light";
  format: string; // e.g., "10 Packs × 20 Sticks (200 Cigarettes)"
  tar: string;
  nicotine: string;
  origin: string;
  cartonPrice: number; // 1 Carton or Single Unit AED
  oldPrice?: number;
  fiveCartonPrice: number; // 5-Pack / 5-Carton Bundle AED
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  featured?: boolean;
  badge?: string;
  accentColor: string;
  boxSecondaryColor: string;
  description: string;
  customImageUrl?: string;
  seoAnswerCapsule?: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  filterType: "all" | "category" | "brand" | "flavor";
  filterValue: string;
  highlight?: boolean;
}

export interface SocialLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  pinterest: string;
  tiktok: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  brand: string;
  packTier: "1-carton" | "5-cartons";
  quantity: number;
  unitPrice: number;
}

export interface WhatsAppOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryArea: string;
  addressNote: string;
  paymentMethod: "Cash on Delivery" | "Card on Delivery" | "Apple Pay / Link";
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "New WhatsApp Lead" | "Confirmed" | "Out for Delivery" | "Delivered" | "Cancelled";
  source: "Express 1-Click" | "Multi-Item Cart" | "Hero Quick-Order";
}

export interface Lead {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryArea: string;
  lastOrderId: string;
  totalOrders: number;
  totalSpent: number;
  lastProductInterest: string;
  source: WhatsAppOrder["source"];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HeroImagePreset {
  id: string;
  label: string;
  subtitle: string;
  imageUrl: string;
  themeMatch: ThemeId;
}

export function formatWhatsAppNumberForLink(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 10) {
    // Convert UAE local 05XXXXXXXX -> 9715XXXXXXXX
    return `971${digits.slice(1)}`;
  }
  return digits || "971553020429";
}

export interface WhatsAppBotConfig {
  enabled: boolean;
  botName: string;
  welcomeMessage: string;
  autoReplyDelayMs: number;
  webhookVerifyToken: string;
  cloudApiAccessToken: string;
  cloudApiPhoneNumberId: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // e.g. "+971553020429"
  supportPhoneDisplay: string;
  activeTheme: ThemeId;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  expressDeliveryMinutes: string;
  announcementText: string;
  heroTitleOverride?: string;
  heroBackgroundImageUrl: string;
  heroOverlayOpacity: number; // 20 to 90
  showFivePacksRow: boolean;
  aeoAnswerCapsule: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoKeywords: string;
  faqs: FaqItem[];
  whatsappGreetingTemplate: string;
  whatsappFloatButtonLabel: string;
  socialLinks: SocialLinks;
  navMenuItems: NavMenuItem[];
  footerAboutText: string;
  storeAddressText: string;
  whatsappBot: WhatsAppBotConfig;
}

export const INITIAL_NAV_MENU: NavMenuItem[] = [
  { id: "nav-home", label: "HOME", filterType: "all", filterValue: "all" },
  { id: "nav-cigarettes", label: "ALL CIGARETTES", filterType: "category", filterValue: "cigarettes", highlight: true },
  { id: "nav-marlboro", label: "MARLBORO", filterType: "brand", filterValue: "Marlboro" },
  { id: "nav-dunhill", label: "DUNHILL", filterType: "brand", filterValue: "Dunhill" },
  { id: "nav-davidoff", label: "DAVIDOFF", filterType: "brand", filterValue: "Davidoff" },
  { id: "nav-esse", label: "ESSE", filterType: "brand", filterValue: "ESSE" },
  { id: "nav-winston", label: "WINSTON", filterType: "brand", filterValue: "Winston" },
  { id: "nav-camel", label: "CAMEL", filterType: "brand", filterValue: "Camel" },
  { id: "nav-manchester", label: "MANCHESTER", filterType: "brand", filterValue: "Manchester" },
  { id: "nav-iqos", label: "IQOS & TEREA", filterType: "category", filterValue: "iqos-terea" },
  { id: "nav-vapes", label: "VAPES", filterType: "category", filterValue: "vapes" },
  { id: "nav-eliquid", label: "E-LIQUID", filterType: "category", filterValue: "e-liquid" },
  { id: "nav-pouches", label: "NICOTINE POUCHES", filterType: "category", filterValue: "nicotine-pouches" },
  { id: "nav-hookah", label: "HOOKAH & SHISHA", filterType: "category", filterValue: "hookah-shisha" },
  { id: "nav-accessories", label: "ACCESSORIES", filterType: "category", filterValue: "accessories" },
];

export const HERO_IMAGE_PRESETS: HeroImagePreset[] = [
  {
    id: "vapdxb-burj-wood",
    label: "1. Burj Khalifa & Wooden Table (Final Choice Default)",
    subtitle: "Warm dark wood studio table + Burj Khalifa golden nocturnal skyline",
    imageUrl: "",
    themeMatch: "midnight-gold",
  },
  {
    id: "dubai-downtown-night",
    label: "2. Downtown Burj Khalifa Panorama Photo",
    subtitle: "High-resolution nocturnal Burj Khalifa & Downtown Boulevard skyline",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85",
    themeMatch: "midnight-gold",
  },
  {
    id: "dubai-marina-skyline",
    label: "3. Dubai Marina & JBR Waterfront Towers",
    subtitle: "Architectural twilight panorama across Dubai Marina yacht harbor",
    imageUrl:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=85",
    themeMatch: "future-glass",
  },
  {
    id: "burj-al-arab-sunset",
    label: "4. Burj Al Arab & Palm Jumeirah Golden Hour",
    subtitle: "Warm golden desert sunset over Jumeirah coastline",
    imageUrl:
      "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=85",
    themeMatch: "royal-sunset",
  },
];

export const DUBAI_AREAS = [
  "Downtown Dubai & Burj Khalifa District",
  "Dubai Marina & JBR",
  "Palm Jumeirah",
  "Business Bay & DIFC",
  "Jumeirah & Umm Suqeim",
  "JVC / JVT / Dubai Hills",
  "Deira & Bur Dubai",
  "Al Barsha & Tecom (Barsha Heights)",
  "Dubai Creek Harbour & Festival City",
  "International City & Dragon Mart",
  "Abu Dhabi / Sharjah Express Courier",
];

export const INITIAL_FAQS: FaqItem[] = [
  {
    question: "Where can I buy authentic duty-free cigarettes online in Dubai with fast delivery?",
    answer:
      "You can order 100% authentic, factory-sealed duty-free cigarette cartons (Marlboro, Dunhill, Davidoff, ESSE, Winston, Parliament, Vogue, West, and IQOS TEREA) from VAP DXB / Emirates Cigarette with 45 to 60-minute express rider delivery across Downtown Dubai, Burj Khalifa District, Dubai Marina, JBR, Palm Jumeirah, and Business Bay via 24/7 WhatsApp checkout (0553020429 / +971553020429).",
  },
  {
    question: "How much does a carton of Marlboro, Dunhill, or ESSE cigarettes cost in Dubai?",
    answer:
      "In Dubai, a 10-pack carton (200 sticks) of ESSE Super Slims ranges from AED 75 to AED 90, Winston Blue/Red is AED 135, Dunhill Switch/Blue is AED 150, Davidoff Gold is AED 155, and Marlboro Red/Gold/Vista Double Mix ranges from AED 190 to AED 200. VIP 5-carton bundles save an additional AED 45 to AED 75.",
  },
  {
    question: "How does WhatsApp cigarette ordering work and what payment methods are accepted?",
    answer:
      "Simply click 'Order on WhatsApp' on any cigarette carton or build a multi-item invoice in your Carton Tray. No account registration is required. Share your Dubai building name or live WhatsApp location pin, inspect the factory duty-free seal upon rider arrival, and pay via Cash on Delivery (COD), Card on Delivery, or Apple Pay.",
  },
  {
    question: "Is express delivery free in Dubai?",
    answer:
      "Yes, 45–60 minute Dubai express delivery is completely FREE on all orders of AED 250 or more (for example, any 2 cartons of Marlboro, Dunhill, or IQOS TEREA). Orders below AED 250 carry a flat AED 20 rider dispatch fee.",
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: "DUBAI CIGARETTE SHOP",
  whatsappNumber: "+971553020429",
  supportPhoneDisplay: "+971 55 302 0429",
  activeTheme: "midnight-gold",
  freeDeliveryThreshold: 250,
  standardDeliveryFee: 20,
  expressDeliveryMinutes: "45–60 Mins",
  announcementText:
    "24/7 DUBAI EXPRESS CONCIERGE • WHATSAPP: +971 55 302 0429 • FREE DELIVERY OVER AED 250",
  heroTitleOverride: "Cigarettes In Dubai – Marlboro, Dunhill, Winston & More",
  heroBackgroundImageUrl: "",
  heroOverlayOpacity: 55,
  showFivePacksRow: true,
  aeoAnswerCapsule:
    "Dubai Cigarette Shop (dubaicigeretteshop.ae) is Dubai's #1 24/7 online duty-free cigarette, heated tobacco & secondary vape store, delivering factory-sealed cartons of Marlboro (AED 190–200), Dunhill (AED 120–200), Davidoff (AED 145–165), ESSE Super Slims (AED 75–90), IQOS TEREA (AED 135), VELO Nicotine Pouches, and Vapes in 45–60 minutes across Downtown Dubai, Dubai Marina, Palm Jumeirah, and all UAE Emirates via instant WhatsApp ordering (+971 55 302 0429) with Cash or Card on Delivery.",
  seoMetaTitle:
    "Dubai Cigarette Shop | Marlboro, Dunhill, ESSE, Davidoff & IQOS Terea (+971 55 302 0429)",
  seoMetaDescription:
    "dubaicigeretteshop.ae — Dubai's #1 Online Cigarette Shop. Buy 100% authentic duty-free cigarette cartons (Marlboro, Dunhill, Davidoff, ESSE, Winston, Parliament, Vogue) plus IQOS Terea, VELO & Vapes. Instant WhatsApp order (+971 55 302 0429).",
  seoKeywords:
    "dubai cigarette shop, dubaicigeretteshop.ae, cigarettes in dubai, buy cigarettes online dubai, marlboro gold dubai price, dunhill switch dubai, esse change uae, iqos terea dubai delivery, +971553020429",
  faqs: INITIAL_FAQS,
  whatsappGreetingTemplate:
    "Hello *{storeName}* (+971 55 302 0429)! I would like to place an Express Order:",
  whatsappFloatButtonLabel: "1-Click WhatsApp Order",
  socialLinks: {
    facebook: "https://facebook.com/dubaicigeretteshop",
    twitter: "https://x.com/dubaicigshop",
    instagram: "https://instagram.com/dubaicigeretteshop",
    youtube: "https://youtube.com/@dubaicigeretteshop",
    pinterest: "https://pinterest.com/dubaicigeretteshop",
    tiktok: "https://tiktok.com/@dubaicigeretteshop",
  },
  navMenuItems: INITIAL_NAV_MENU,
  footerAboutText:
    "Dubai's #1 24/7 Online Duty-Free Cigarette Carton Store (dubaicigeretteshop.ae — Marlboro, Dunhill, Davidoff, ESSE, Winston, Parliament) plus Heated Tobacco, Nicotine Pouches & Vapes. 45–60 minute delivery across all Dubai & UAE districts.",
  storeAddressText:
    "Downtown Boulevard & Dragon Mart Hub, Dubai, United Arab Emirates",
  whatsappBot: {
    enabled: true,
    botName: "Dubai Cigarette Shop Automated WhatsApp Concierge",
    welcomeMessage:
      "Marhaba! Welcome to Dubai Cigarette Shop (dubaicigeretteshop.ae • +971 55 302 0429). I can help you order Duty-Free Cigarette Cartons (Marlboro, Dunhill, Davidoff, ESSE, Winston) or secondary items (IQOS Terea, Vapes, E-Liquids, VELO) in 30 seconds!",
    autoReplyDelayMs: 450,
    webhookVerifyToken: "dubai_cigarette_shop_verify_2026",
    cloudApiAccessToken: "",
    cloudApiPhoneNumberId: "",
  },
};

// Cigarettes are the main focus: all cigarette products first, everything else after.
// Admin edits are merged on top of this list from the server-side catalog store.
export const INITIAL_PRODUCTS: Product[] = [
  ...IMPORTED_PRODUCTS,
  ...MORE_PRODUCTS,
].sort((a, b) =>
  a.category === "cigarettes" && b.category !== "cigarettes"
    ? -1
    : a.category !== "cigarettes" && b.category === "cigarettes"
      ? 1
      : 0
);

export const INITIAL_ORDERS: WhatsAppOrder[] = [
  {
    id: "EC-8841",
    createdAt: "12 mins ago",
    customerName: "Tariq Al Maktoum",
    customerPhone: "+971 50 842 9910",
    deliveryArea: "Downtown Dubai & Burj Khalifa District",
    addressNote: "Boulevard Point Tower, Drop at Lobby Concierge",
    paymentMethod: "Card on Delivery",
    items: [
      {
        productId: "marlboro-gold-carton",
        title: "Marlboro Gold Original",
        brand: "Marlboro",
        packTier: "1-carton",
        quantity: 2,
        unitPrice: 200,
      },
      {
        productId: "parliament-night-blue",
        title: "Parliament Night Blue Recessed Filter",
        brand: "Parliament",
        packTier: "1-carton",
        quantity: 1,
        unitPrice: 225,
      },
    ],
    subtotal: 625,
    deliveryFee: 0,
    total: 625,
    status: "Out for Delivery",
    source: "Multi-Item Cart",
  },
  {
    id: "EC-8840",
    createdAt: "28 mins ago",
    customerName: "Alexander Vance",
    customerPhone: "+971 58 219 4002",
    deliveryArea: "Dubai Marina & JBR",
    addressNote: "Marina Gate 1, Valet Desk",
    paymentMethod: "Apple Pay / Link",
    items: [
      {
        productId: "marlboro-vista-double-mix",
        title: "Marlboro Vista Double Mix",
        brand: "Marlboro",
        packTier: "5-cartons",
        quantity: 1,
        unitPrice: 925,
      },
    ],
    subtotal: 925,
    deliveryFee: 0,
    total: 925,
    status: "Confirmed",
    source: "Express 1-Click",
  },
  {
    id: "EC-8839",
    createdAt: "1 hour ago",
    customerName: "Nadia Mansoor",
    customerPhone: "+971 52 901 3348",
    deliveryArea: "Palm Jumeirah",
    addressNote: "Frond G Villa 14",
    paymentMethod: "Cash on Delivery",
    items: [
      {
        productId: "esse-change-capsule",
        title: "ESSE Change Capsule Super Slim",
        brand: "ESSE",
        packTier: "1-carton",
        quantity: 3,
        unitPrice: 90,
      },
      {
        productId: "davidoff-white-slims",
        title: "Davidoff White Super Slims",
        brand: "Davidoff",
        packTier: "1-carton",
        quantity: 1,
        unitPrice: 165,
      },
    ],
    subtotal: 435,
    deliveryFee: 0,
    total: 435,
    status: "Delivered",
    source: "Hero Quick-Order",
  },
  {
    id: "EC-8838",
    createdAt: "2 hours ago",
    customerName: "Rashid Khalid",
    customerPhone: "+971 55 411 7720",
    deliveryArea: "Business Bay & DIFC",
    addressNote: "Index Tower Gate Village",
    paymentMethod: "Card on Delivery",
    items: [
      {
        productId: "iqos-terea-turquoise",
        title: "IQOS TEREA Turquoise Menthol (Kazakhstan/UAE)",
        brand: "IQOS TEREA",
        packTier: "1-carton",
        quantity: 2,
        unitPrice: 135,
      },
    ],
    subtotal: 270,
    deliveryFee: 0,
    total: 270,
    status: "Delivered",
    source: "Express 1-Click",
  },
];

/* ------------------------------------------------------------------ */
/* ADMIN USERS & LOGIN (local demo auth - SHA-256 hashed passwords)    */
/* ------------------------------------------------------------------ */

export type AdminRole = "admin" | "manager";

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  displayName: string;
  createdAt: number;
}

export const ADMIN_SEED = {
  DEFAULT_USERNAME: "admin",
  DEFAULT_PASSWORD: "admin123",
};

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`dcs-salt::${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
