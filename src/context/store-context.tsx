"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ADMIN_SEED,
  AdminUser,
  formatWhatsAppNumberForLink,
  hashPassword,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  Lead,
  OrderItem,
  Product,
  StoreSettings,
  ThemeId,
  WhatsAppOrder,
} from "@/lib/catalog-data";

export interface CartEntry {
  key: string; // `${productId}__${packTier}`
  product: Product;
  packTier: "1-carton" | "5-cartons";
  quantity: number;
  unitPrice: number;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  area: string;
}

interface StoreContextValue {
  products: Product[];
  catalogServerLinked: boolean;
  adminApiKey: string;
  orders: WhatsAppOrder[];
  leads: Lead[];
  customerProfile: CustomerProfile;
  saveCustomerProfile: (profile: Partial<CustomerProfile>) => void;
  settings: StoreSettings;
  cart: CartEntry[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeTheme: ThemeId;
  setActiveTheme: (theme: ThemeId) => void;
  addToCart: (product: Product, packTier: "1-carton" | "5-cartons", qty?: number) => void;
  updateCartQty: (key: string, delta: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  triggerSingleClickWhatsApp: (
    product: Product,
    packTier: "1-carton" | "5-cartons",
    deliveryArea?: string,
    source?: WhatsAppOrder["source"]
  ) => WhatsAppOrder;
  submitCartToWhatsApp: (payload: {
    customerName: string;
    customerPhone: string;
    deliveryArea: string;
    addressNote: string;
    paymentMethod: WhatsAppOrder["paymentMethod"];
  }) => WhatsAppOrder | null;
  // Admin mutations
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductStock: (id: string) => void;
  updateOrderStatus: (orderId: string, status: WhatsAppOrder["status"]) => void;
  createManualOrder: (payload: {
    customerName: string;
    customerPhone: string;
    deliveryArea: string;
    addressNote: string;
    paymentMethod: WhatsAppOrder["paymentMethod"];
    product: Product;
    packTier: "1-carton" | "5-cartons";
    quantity: number;
  }) => WhatsAppOrder;
  deleteOrder: (orderId: string) => void;
  deleteLead: (leadId: string) => void;
  updateSettings: (next: Partial<StoreSettings>) => void;
  resetDemoData: () => void;
  // Admin auth & user management
  adminUsers: AdminUser[];
  currentUser: AdminUser | null;
  adminLogin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  adminLogout: () => void;
  changePassword: (userId: string, currentPw: string, newPw: string) => Promise<{ ok: boolean; error?: string }>;
  upsertAdminUser: (user: Omit<AdminUser, "passwordHash"> & { password?: string }) => Promise<{ ok: boolean; error?: string }>;
  deleteAdminUser: (userId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: "ec_dubai_products_v7",
  ORDERS: "ec_dubai_orders_v7",
  SETTINGS: "ec_dubai_settings_v7",
  CART: "ec_dubai_cart_v7",
  LEADS: "ec_dubai_leads_v7",
  PROFILE: "ec_dubai_customer_profile_v7",
  USERS: "ec_dubai_admin_users_v1",
  SESSION: "ec_dubai_admin_session_v1",
  ADMINKEY: "ec_dubai_admin_key_v1",
};

// Applies the server-side catalog store over the built-in product list:
// deleted ids removed, edited products swapped in, new products prepended.
function applyCatalogStore(store: {
  products?: Record<string, Product>;
  deleted?: string[];
}): Product[] {
  const overrides = store.products || {};
  const deleted = new Set(store.deleted || []);
  const merged = INITIAL_PRODUCTS.filter((p) => !deleted.has(p.id)).map(
    (p) => overrides[p.id] ?? p
  );
  const baseIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
  const added = Object.values(overrides).filter((p) => !baseIds.has(p.id));
  return [...added.reverse(), ...merged];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<WhatsAppOrder[]>(INITIAL_ORDERS);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
    name: "",
    phone: "",
    area: "",
  });
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [adminApiKey, setAdminApiKey] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) setSettings({ ...INITIAL_SETTINGS, ...JSON.parse(savedSettings) });

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedLeads = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (savedLeads) setLeads(JSON.parse(savedLeads));

      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) setCustomerProfile(JSON.parse(savedProfile));

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        const parsed: AdminUser[] = JSON.parse(savedUsers);
        setAdminUsers(parsed);
        const session = sessionStorage.getItem(STORAGE_KEYS.SESSION);
        if (session) {
          const sess = JSON.parse(session) as { userId: string };
          const u = parsed.find((x) => x.id === sess.userId);
          if (u) setCurrentUser(u);
        }
      } else {
        hashPassword(ADMIN_SEED.DEFAULT_PASSWORD).then((h) => {
          setAdminUsers([
            {
              id: "u-admin",
              username: ADMIN_SEED.DEFAULT_USERNAME,
              passwordHash: h,
              role: "admin",
              displayName: "Store Owner",
              createdAt: Date.now(),
            },
          ]);
        });
      }

      const savedKey = localStorage.getItem(STORAGE_KEYS.ADMINKEY);
      if (savedKey) setAdminApiKey(savedKey);
    } catch {
      // Ignore storage errors in private browsing
    }
    setHydrated(true);

    // Pull the shared catalog state + settings (admin edits made for all visitors).
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((store) => {
        if (store && typeof store === "object") {
          setProducts(applyCatalogStore(store));
          if (store.settings && typeof store.settings === "object") {
            setSettings((prev) => ({ ...prev, ...store.settings }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // When an admin key is present, pull the shared orders + leads from the server.
  useEffect(() => {
    if (!adminApiKey) return;
    fetch("/api/orders", { headers: { "x-admin-key": adminApiKey } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders && Array.isArray(data.orders)) setOrders(data.orders);
        if (data?.leads && Array.isArray(data.leads)) setLeads(data.leads);
      })
      .catch(() => {});
  }, [adminApiKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}
  }, [products, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (typeof document !== "undefined" && settings.seoMetaTitle) {
        document.title = settings.seoMetaTitle;
      }
    } catch {}
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    } catch {}
  }, [leads, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(customerProfile));
    } catch {}
  }, [customerProfile, hydrated]);

  useEffect(() => {
    if (!hydrated || adminUsers.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(adminUsers));
    } catch {}
  }, [adminUsers, hydrated]);

  const setActiveTheme = (theme: ThemeId) => {
    setSettings((prev) => ({ ...prev, activeTheme: theme }));
    syncCatalog({ action: "settings", settings: { activeTheme: theme } });
  };

  const addToCart = (
    product: Product,
    packTier: "1-carton" | "5-cartons",
    qty: number = 1
  ) => {
    const key = `${product.id}__${packTier}`;
    const unitPrice =
      packTier === "5-cartons" ? product.fiveCartonPrice : product.cartonPrice;

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { key, product, packTier, quantity: qty, unitPrice }];
    });
  };

  const updateCartQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setCart([]);

  const saveCustomerProfile = (profile: Partial<CustomerProfile>) => {
    setCustomerProfile((prev) => ({ ...prev, ...profile }));
  };

  /**
   * Lead Capture Engine: every order — Express 1-Click, Multi-Item Cart,
   * Hero Quick-Order, or Admin Manual — creates/updates a marketing lead.
   * If the customer shares a real phone, we merge repeat orders into ONE lead
   * record (by normalized phone). 1-Click guests still get logged so the
   * admin can follow up inside the live WhatsApp chat.
   */
  const recordLead = (order: WhatsAppOrder) => {
    const digits = (order.customerPhone || "").replace(/\D/g, "");
    const hasRealPhone = digits.length >= 9;
    const productInterest = order.items
      .map((i) => `${i.title} (${i.brand})`)
      .join(", ");

    setLeads((prev) => {
      const existingIdx = hasRealPhone
        ? prev.findIndex((l) => {
            const lDigits = (l.customerPhone || "").replace(/\D/g, "");
            return lDigits.length >= 9 && lDigits.slice(-9) === digits.slice(-9);
          })
        : -1;

      if (existingIdx >= 0) {
        return prev.map((l, idx) =>
          idx === existingIdx
            ? {
                ...l,
                customerName:
                  order.customerName &&
                  order.customerName !== "WhatsApp Express Guest"
                    ? order.customerName
                    : l.customerName,
                deliveryArea: order.deliveryArea || l.deliveryArea,
                lastOrderId: order.id,
                totalOrders: l.totalOrders + 1,
                totalSpent: l.totalSpent + order.total,
                lastProductInterest: productInterest,
                source: order.source,
              }
            : l
        );
      }

      const newLead: Lead = {
        id: `LE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: "Just now",
        customerName: order.customerName || "WhatsApp Guest",
        customerPhone: hasRealPhone ? order.customerPhone : "Chat on WhatsApp",
        deliveryArea: order.deliveryArea,
        lastOrderId: order.id,
        totalOrders: 1,
        totalSpent: order.total,
        lastProductInterest: productInterest,
        source: order.source,
      };
      return [newLead, ...prev];
    });
  };

  const triggerSingleClickWhatsApp = (
    product: Product,
    packTier: "1-carton" | "5-cartons",
    deliveryArea: string = "Downtown Dubai & Burj Khalifa District",
    source: WhatsAppOrder["source"] = "Express 1-Click"
  ): WhatsAppOrder => {
    const unitPrice =
      packTier === "5-cartons" ? product.fiveCartonPrice : product.cartonPrice;
    const deliveryFee =
      unitPrice >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee;
    const total = unitPrice + deliveryFee;
    const orderId = `EC-${Math.floor(8842 + Math.random() * 1100)}`;

    const newOrder: WhatsAppOrder = {
      id: orderId,
      createdAt: "Just now",
      customerName: customerProfile.name || "WhatsApp Express Guest",
      customerPhone: customerProfile.phone || "Via WhatsApp Concierge",
      deliveryArea: customerProfile.area || deliveryArea,
      addressNote: "Direct 1-Click WhatsApp Checkout",
      paymentMethod: "Cash on Delivery",
      items: [
        {
          productId: product.id,
          title: product.title,
          brand: product.brand,
          packTier,
          quantity: 1,
          unitPrice,
        },
      ],
      subtotal: unitPrice,
      deliveryFee,
      total,
      status: "New WhatsApp Lead",
      source,
    };

    setOrders((prev) => [newOrder, ...prev]);
    recordLead(newOrder);
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", order: newOrder }),
    }).catch(() => {});

    const packLabel =
      packTier === "5-cartons"
        ? "5 Cartons VIP Bundle (50 Packs / 1,000 Sticks)"
        : "1 Carton Sealed (10 Packs / 200 Sticks)";

    const greeting = (
      settings.whatsappGreetingTemplate ||
      "Hello *{storeName}* Concierge! I would like to place an Express Order:"
    ).replace("{storeName}", settings.storeName);

    const message = [
      greeting,
      `Order Reference: *#${orderId}*`,
      ``,
      `• *Product:* ${product.title} (${product.brand})`,
      `• *SKU:* ${product.sku}`,
      `• *Pack Option:* ${packLabel}`,
      `• *Item Price:* AED ${unitPrice}`,
      `• *Delivery:* ${deliveryFee === 0 ? "FREE Express Delivery" : `AED ${deliveryFee}`}`,
      `• *Total Payable:* *AED ${total}*`,
      ``,
      `• *Preferred Area:* ${deliveryArea}`,
      `• *Payment:* Cash / Card on Delivery`,
      ``,
      `Please confirm dispatch ETA (${settings.expressDeliveryMinutes}).`,
    ].join("\n");

    const waUrl = `https://wa.me/${formatWhatsAppNumberForLink(
      settings.whatsappNumber
    )}?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    return newOrder;
  };

  const submitCartToWhatsApp = (payload: {
    customerName: string;
    customerPhone: string;
    deliveryArea: string;
    addressNote: string;
    paymentMethod: WhatsAppOrder["paymentMethod"];
  }): WhatsAppOrder | null => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce(
      (sum, entry) => sum + entry.unitPrice * entry.quantity,
      0
    );
    const deliveryFee =
      subtotal >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee;
    const total = subtotal + deliveryFee;
    const orderId = `EC-${Math.floor(8842 + Math.random() * 1100)}`;

    const orderItems: OrderItem[] = cart.map((entry) => ({
      productId: entry.product.id,
      title: entry.product.title,
      brand: entry.product.brand,
      packTier: entry.packTier,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
    }));

    const newOrder: WhatsAppOrder = {
      id: orderId,
      createdAt: "Just now",
      customerName: payload.customerName || "Dubai VIP Client",
      customerPhone: payload.customerPhone || "Via WhatsApp",
      deliveryArea: payload.deliveryArea,
      addressNote: payload.addressNote || "Share live location pin on WhatsApp",
      paymentMethod: payload.paymentMethod,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      status: "New WhatsApp Lead",
      source: "Multi-Item Cart",
    };

    setOrders((prev) => [newOrder, ...prev]);
    recordLead(newOrder);
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", order: newOrder }),
    }).catch(() => {});

    // Remember the customer so their next order (even 1-Click) is pre-filled
    if (payload.customerName || payload.customerPhone || payload.deliveryArea) {
      saveCustomerProfile({
        name: payload.customerName,
        phone: payload.customerPhone,
        area: payload.deliveryArea,
      });
    }

    const itemLines = cart
      .map(
        (entry, idx) =>
          `${idx + 1}. *${entry.product.title}* (${
            entry.packTier === "5-cartons" ? "5 Cartons Bulk" : "1 Carton"
          }) × ${entry.quantity} — *AED ${entry.unitPrice * entry.quantity}*`
      )
      .join("\n");

    const message = [
      `Hello *${settings.storeName}* Dubai Concierge!`,
      `New Order Invoice: *#${orderId}*`,
      `────────────────────`,
      itemLines,
      `────────────────────`,
      `• *Subtotal:* AED ${subtotal}`,
      `• *Dubai Express Delivery:* ${
        deliveryFee === 0 ? "FREE (VIP Eligible)" : `AED ${deliveryFee}`
      }`,
      `• *Grand Total:* *AED ${total}*`,
      ``,
      `*Customer & Dispatch Details:*`,
      `• *Name:* ${newOrder.customerName}`,
      `• *Phone:* ${newOrder.customerPhone}`,
      `• *Dubai Zone:* ${newOrder.deliveryArea}`,
      `• *Building / Note:* ${newOrder.addressNote}`,
      `• *Payment Mode:* ${newOrder.paymentMethod}`,
      ``,
      `I am ready to share my live WhatsApp location pin for ${settings.expressDeliveryMinutes} delivery.`,
    ].join("\n");

    const waUrl = `https://wa.me/${formatWhatsAppNumberForLink(
      settings.whatsappNumber
    )}?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    clearCart();
    setIsCartOpen(false);
    return newOrder;
  };

  // Push a catalog change to the server store so every visitor sees it.
  // No-op without an admin API key (changes then stay local to this browser).
  const syncCatalog = (payload: {
    action: "upsert" | "delete" | "settings" | "reset";
    product?: Product;
    id?: string;
    settings?: Partial<StoreSettings>;
  }) => {
    if (!adminApiKey) return;
    fetch("/api/catalog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminApiKey,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  const upsertProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [product, ...prev];
    });
    syncCatalog({ action: "upsert", product });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    syncCatalog({ action: "delete", id });
  };

  const toggleProductStock = (id: string) => {
    const target = products.find((p) => p.id === id);
    const updated = target ? { ...target, inStock: !target.inStock } : null;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p))
    );
    if (updated) syncCatalog({ action: "upsert", product: updated });
  };

  const syncOrder = (payload: Record<string, unknown>) => {
    if (!adminApiKey) return;
    fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminApiKey,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  const updateOrderStatus = (orderId: string, status: WhatsAppOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    syncOrder({ action: "status", id: orderId, status });
  };

  const createManualOrder = (payload: {
    customerName: string;
    customerPhone: string;
    deliveryArea: string;
    addressNote: string;
    paymentMethod: WhatsAppOrder["paymentMethod"];
    product: Product;
    packTier: "1-carton" | "5-cartons";
    quantity: number;
  }): WhatsAppOrder => {
    const unitPrice =
      payload.packTier === "5-cartons"
        ? payload.product.fiveCartonPrice
        : payload.product.cartonPrice;
    const subtotal = unitPrice * payload.quantity;
    const deliveryFee =
      subtotal >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee;
    const total = subtotal + deliveryFee;
    const orderId = `EC-${Math.floor(8842 + Math.random() * 1100)}`;

    const newOrder: WhatsAppOrder = {
      id: orderId,
      createdAt: "Just now",
      customerName: payload.customerName || "Phone / Walk-in Client",
      customerPhone: payload.customerPhone || "+971 50 000 0000",
      deliveryArea: payload.deliveryArea,
      addressNote: payload.addressNote || "Manual Admin Dispatch",
      paymentMethod: payload.paymentMethod,
      items: [
        {
          productId: payload.product.id,
          title: payload.product.title,
          brand: payload.product.brand,
          packTier: payload.packTier,
          quantity: payload.quantity,
          unitPrice,
        },
      ],
      subtotal,
      deliveryFee,
      total,
      status: "Confirmed",
      source: "Express 1-Click",
    };

    setOrders((prev) => [newOrder, ...prev]);
    recordLead(newOrder);
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", order: newOrder }),
    }).catch(() => {});
    return newOrder;
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    syncOrder({ action: "deleteOrder", id: orderId });
  };

  const deleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    syncOrder({ action: "deleteLead", id: leadId });
  };

  const updateSettings = (next: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
    syncCatalog({ action: "settings", settings: next });
  };

  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setLeads([]);
    setCustomerProfile({ name: "", phone: "", area: "" });
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    syncCatalog({ action: "reset" });
    syncOrder({ action: "reset" });
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CART);
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    } catch {}
  };

  // ------- Admin auth & user management -------
  const adminLogin = async (username: string, password: string) => {
    // Server login first: success returns the shared write key so catalog
    // changes reach every visitor, not just this browser.
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.key) {
          setAdminApiKey(data.key);
          try {
            localStorage.setItem(STORAGE_KEYS.ADMINKEY, data.key);
          } catch {}
        }
        let u = adminUsers.find(
          (x) => x.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (!u) {
          u = {
            id: `u-${username.trim().toLowerCase()}`,
            username: username.trim(),
            passwordHash: await hashPassword(password),
            role: "admin",
            displayName: username.trim(),
            createdAt: Date.now(),
          };
          const created = u;
          setAdminUsers((prev) => [...prev, created]);
        }
        setCurrentUser(u);
        try {
          sessionStorage.setItem(
            STORAGE_KEYS.SESSION,
            JSON.stringify({ userId: u.id })
          );
        } catch {}
        return { ok: true };
      }
      // If the server admin endpoint is configured and rejected the login
      // (401 / 429), do NOT fall back to the local default account.
      if (res.status === 401 || res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        return {
          ok: false,
          error:
            errData?.error || "Incorrect username or password. Please try again.",
        };
      }
    } catch {}

    const u = adminUsers.find(
      (x) => x.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!u) return { ok: false, error: "No account found with that username." };
    const h = await hashPassword(password);
    if (h !== u.passwordHash)
      return { ok: false, error: "Incorrect password. Please try again." };
    setCurrentUser(u);
    try {
      sessionStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({ userId: u.id })
      );
    } catch {}
    return { ok: true };
  };

  const adminLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {}
  };

  const changePassword = async (userId: string, currentPw: string, newPw: string) => {
    const u = adminUsers.find((x) => x.id === userId);
    if (!u) return { ok: false, error: "User not found." };
    const cur = await hashPassword(currentPw);
    if (cur !== u.passwordHash)
      return { ok: false, error: "Current password is incorrect." };
    if (newPw.trim().length < 6)
      return { ok: false, error: "New password must be at least 6 characters." };
    const next = await hashPassword(newPw);
    setAdminUsers((prev) =>
      prev.map((x) => (x.id === userId ? { ...x, passwordHash: next } : x))
    );
    return { ok: true };
  };

  const upsertAdminUser = async (
    user: Omit<AdminUser, "passwordHash"> & { password?: string }
  ) => {
    const username = user.username.trim().toLowerCase();
    if (!username)
      return { ok: false, error: "Username is required." };
    const clash = adminUsers.find(
      (x) => x.username.toLowerCase() === username && x.id !== user.id
    );
    if (clash) return { ok: false, error: "That username is already taken." };
    const existing = adminUsers.find((x) => x.id === user.id);
    if (!existing && (!user.password || user.password.length < 6))
      return { ok: false, error: "Password must be at least 6 characters." };
    const passwordHash = user.password
      ? await hashPassword(user.password)
      : existing!.passwordHash;
    setAdminUsers((prev) => {
      const next: AdminUser = {
        id: user.id,
        username,
        passwordHash,
        role: user.role,
        displayName: user.displayName.trim() || username,
        createdAt: user.createdAt || Date.now(),
      };
      return existing
        ? prev.map((x) => (x.id === user.id ? next : x))
        : [...prev, next];
    });
    return { ok: true };
  };

  const deleteAdminUser = (userId: string) => {
    setAdminUsers((prev) => {
      const target = prev.find((x) => x.id === userId);
      const adminsLeft = prev.filter(
        (x) => x.role === "admin" && x.id !== userId
      ).length;
      // never allow deleting the last admin or the logged-in user
      if (target?.role === "admin" && adminsLeft === 0) return prev;
      if (currentUser?.id === userId) return prev;
      return prev.filter((x) => x.id !== userId);
    });
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        catalogServerLinked: Boolean(adminApiKey),
        adminApiKey,
        orders,
        leads,
        customerProfile,
        saveCustomerProfile,
        settings,
        cart,
        isCartOpen,
        setIsCartOpen,
        activeTheme: settings.activeTheme,
        setActiveTheme,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        triggerSingleClickWhatsApp,
        submitCartToWhatsApp,
        upsertProduct,
        deleteProduct,
        toggleProductStock,
        updateOrderStatus,
        createManualOrder,
        deleteOrder,
        deleteLead,
        updateSettings,
        resetDemoData,
        adminUsers,
        currentUser,
        adminLogin,
        adminLogout,
        changePassword,
        upsertAdminUser,
        deleteAdminUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}
