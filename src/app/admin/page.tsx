"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Menu as MenuIcon,
  MessageCircle,
  Palette,
  PhoneCall,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  Users,
  Download,
  LayoutDashboard,
  Lock,
  LogOut,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import {
  BrandName,
  DUBAI_AREAS,
  formatWhatsAppNumberForLink,
  HERO_IMAGE_PRESETS,
  INITIAL_NAV_MENU,
  NavMenuItem,
  Product,
  ThemeId,
  WhatsAppOrder,
} from "@/lib/catalog-data";

type AdminTab =
  | "dashboard"
  | "whatsapp-social"
  | "hero-theme"
  | "products"
  | "menu-bar"
  | "seo-aeo-geo"
  | "orders"
  | "leads"
  | "users-security";

export default function AdminDashboardPage() {
  const {
    products,
    catalogServerLinked,
    adminApiKey,
    orders,
    leads,
    settings,
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
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Login gate state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  // Users & Security tab state
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [nuUsername, setNuUsername] = useState("");
  const [nuName, setNuName] = useState("");
  const [nuPassword, setNuPassword] = useState("");
  const [nuRole, setNuRole] = useState<"admin" | "manager">("manager");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const editFormRef = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    if (editingProduct) {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editingProduct]);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // Order Tracking & Manual Order Creator state
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "ALL" | WhatsAppOrder["status"]
  >("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("+971 50 ");
  const [manualArea, setManualArea] = useState(DUBAI_AREAS[0]);
  const [manualAddressNote, setManualAddressNote] = useState("");
  const [manualPayment] =
    useState<WhatsAppOrder["paymentMethod"]>("Cash on Delivery");
  const [manualProductId, setManualProductId] = useState(
    products[0]?.id || "marlboro-gold-carton"
  );
  const [manualPackTier, setManualPackTier] = useState<
    "1-carton" | "5-cartons"
  >("1-carton");
  const [manualQty, setManualQty] = useState(1);

  // New Menu Item form state
  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newMenuType, setNewMenuType] =
    useState<NavMenuItem["filterType"]>("brand");
  const [newMenuValue, setNewMenuValue] = useState("Marlboro");

  // New FAQ form state
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  const showToast = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 3000);
  };

  // Upload image helper: saves to /public/uploads via /api/upload (or falls back to client compressed DataURL)
  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: adminApiKey ? { "x-admin-key": adminApiKey } : undefined,
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) return data.url;
      }
    } catch {}

    // Fallback: client-side canvas resize/compression so localStorage never overflows
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 900;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload Hero Image from computer
  const handleHeroFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Uploading Hero photo...");
    const uploadedUrl = await uploadImageFile(file);
    updateSettings({ heroBackgroundImageUrl: uploadedUrl });
    showToast("Hero Image uploaded & live on Storefront!");
    e.target.value = "";
  };

  // Upload one or more Product Images from computer (shared by file input + drag-drop)
  const applyProductImages = async (files: FileList | File[]) => {
    const list = Array.from(files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (list.length === 0 || !editingProduct) return;
    showToast(
      list.length === 1
        ? "Uploading Product photo..."
        : `Uploading ${list.length} Product photos...`
    );
    const urls: string[] = [];
    for (const file of list) {
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) urls.push(uploadedUrl);
    }
    if (urls.length === 0) return;
    setEditingProduct((prev) => {
      if (!prev) return null;
      const existingCover = (prev.customImageUrl || "").trim();
      const existingGallery = prev.galleryImages || [];
      if (!existingCover) {
        const [first, ...rest] = urls;
        return {
          ...prev,
          customImageUrl: first,
          galleryImages: [...existingGallery, ...rest],
        };
      }
      return {
        ...prev,
        galleryImages: [...existingGallery, ...urls],
      };
    });
    showToast(
      `${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded! Click 'Save Product' below.`
    );
  };

  const handleProductImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      await applyProductImages(e.target.files);
    }
    e.target.value = "";
  };

  const handleCreateNewProduct = () => {
    const uniqueNum = Math.floor(100 + Math.random() * 899);
    setEditingProduct({
      id: `custom-product-${Date.now()}`,
      sku: `EC-NEW-${uniqueNum}`,
      title: "",
      arabicSubtitle: "كرتون سجائر فاخر",
      brand: "Marlboro",
      category: "cigarettes",
      subCategory: "Duty-Free Carton",
      flavor: "Smooth Gold",
      strength: "Medium",
      format: "1 Carton (10 Packs • 200 Sticks)",
      tar: "6.0 mg",
      nicotine: "0.5 mg",
      origin: "Switzerland Duty-Free",
      cartonPrice: 190,
      oldPrice: 220,
      fiveCartonPrice: 900,
      rating: 4.95,
      reviewsCount: 50,
      inStock: true,
      stockCount: 50,
      featured: true,
      badge: "New Arrival Dubai",
      accentColor: "#D4AF37",
      boxSecondaryColor: "#14141B",
      description:
        "Factory-sealed 10-pack carton available for 45-minute Dubai WhatsApp Express delivery.",
      customImageUrl: "",
      seoAnswerCapsule: "",
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const cleanTitle = editingProduct.title.trim() || "New Dubai Cigarette Carton";
    const slugId = editingProduct.id.startsWith("custom-product-")
      ? `${cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}-${editingProduct.sku.toLowerCase()}`
      : editingProduct.id;

    upsertProduct({
      ...editingProduct,
      id: slugId,
      title: cleanTitle,
    });
    setEditingProduct(null);
    showToast(`Product "${cleanTitle}" saved & published to live website!`);
  };

  const navItems =
    settings.navMenuItems && settings.navMenuItems.length > 0
      ? settings.navMenuItems
      : INITIAL_NAV_MENU;

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuLabel.trim()) return;
    const nextItem: NavMenuItem = {
      id: `nav-${Date.now()}`,
      label: newMenuLabel.trim().toUpperCase(),
      filterType: newMenuType,
      filterValue: newMenuType === "all" ? "all" : newMenuValue,
    };
    updateSettings({ navMenuItems: [...navItems, nextItem] });
    setNewMenuLabel("");
    showToast(`Added "${nextItem.label}" to Menu Bar!`);
  };

  const handleRemoveMenuItem = (id: string) => {
    updateSettings({
      navMenuItems: navItems.filter((item) => item.id !== id),
    });
    showToast("Removed item from Menu Bar.");
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const updated = [
      ...(settings.faqs || []),
      { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() },
    ];
    updateSettings({ faqs: updated });
    setNewFaqQuestion("");
    setNewFaqAnswer("");
    showToast("FAQ added to Website & Google/AI Schema!");
  };

  const handleDeleteFaq = (idx: number) => {
    const updated = (settings.faqs || []).filter((_, i) => i !== idx);
    updateSettings({ faqs: updated });
    showToast("FAQ removed.");
  };

  const socials = settings.socialLinks || {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    pinterest: "",
    tiktok: "",
  };

  // ---------- Separate Admin Login Gate ----------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError(null);
    const res = await adminLogin(loginUsername, loginPassword);
    setLoginBusy(false);
    if (!res.ok) setLoginError(res.error || "Login failed.");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#061B28] p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[#F4B143]/10 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md bg-[#0A2F42] border border-[#F4B143]/30 rounded-3xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F4B143] to-[#C6842A] flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-8 h-8 text-[#061B28]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F4B143]">
              DUBAI CIGARETTE SHOP.AE
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Admin Login
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Secure access — staff accounts only
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. admin"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B143]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B143]"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginBusy || !loginUsername.trim() || !loginPassword}
              className="w-full py-3.5 rounded-xl bg-[#F4B143] hover:bg-[#ffc95e] disabled:opacity-50 text-[#061B28] font-extrabold text-sm shadow-lg transition-colors"
            >
              {loginBusy ? "Checking..." : "Login to Admin Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F4F6F9] text-zinc-900 flex flex-col lg:flex-row font-sans">
      {/* =====================================================================
          LEFT / TOP SIMPLE SIDEBAR FOR NON-TECHNICAL ADMIN
         ===================================================================== */}
      <aside className="w-full lg:w-72 bg-[#0A2F42] text-white p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-xl">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#F4B143] text-black font-black text-lg flex items-center justify-center">
                VD
              </div>
              <div>
                <h1 className="font-extrabold text-base leading-none">
                  EASY ADMIN PANEL
                </h1>
                <span className="text-[11px] text-[#F4B143] block mt-0.5">
                  No coding required
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="lg:hidden px-3 py-1.5 rounded-lg bg-[#25D366] text-black text-xs font-extrabold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> View Site
            </Link>
          </div>

          {/* 6 Easy Step-by-Step Menu Buttons */}
          <nav className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {(
              [
                {
                  id: "dashboard",
                  label: "0. Dashboard & Stats",
                  icon: LayoutDashboard,
                },
                {
                  id: "whatsapp-social",
                  label: "1. WhatsApp & Social Links",
                  icon: PhoneCall,
                },
                {
                  id: "hero-theme",
                  label: "2. Hero Banner & Theme",
                  icon: ImageIcon,
                },
                {
                  id: "products",
                  label: `3. Edit Products (${products.length})`,
                  icon: Box,
                },
                {
                  id: "menu-bar",
                  label: "4. Edit Menu Bar",
                  icon: MenuIcon,
                },
                {
                  id: "seo-aeo-geo",
                  label: "5. Website Text & SEO/AI",
                  icon: Globe,
                },
                {
                  id: "orders",
                  label: `6. WhatsApp Orders (${orders.length})`,
                  icon: MessageCircle,
                },
                {
                  id: "leads",
                  label: `7. Customer Leads (${leads.length})`,
                  icon: Users,
                },
                // "Users & Security" is visible to ADMIN role only
                ...(currentUser?.role === "admin"
                  ? [
                      {
                        id: "users-security",
                        label: "8. Users & Security",
                        icon: ShieldCheck,
                      },
                    ]
                  : []),
              ] as { id: AdminTab; label: string; icon: typeof Users }[]
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-3 shrink-0 transition-all text-left ${
                    isActive
                      ? "bg-[#F4B143] text-black shadow-md"
                      : "text-zinc-200 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom View Website & Factory Reset */}
        <div className="hidden lg:flex flex-col gap-2.5 pt-6 border-t border-white/15">
          {/* Signed-in user badge */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10">
            <div className="w-8 h-8 rounded-full bg-[#F4B143] text-[#061B28] text-xs font-black flex items-center justify-center shrink-0">
              {(currentUser?.displayName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">
                {currentUser?.displayName}
              </div>
              <div className="text-[10px] text-[#F4B143] uppercase font-bold">
                {currentUser?.role === "admin" ? "Owner / Admin" : "Manager"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={adminLogout}
            className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-rose-600 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout ({currentUser?.username})</span>
          </button>
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black text-xs font-extrabold flex items-center justify-between transition-colors shadow"
          >
            <span>Open Live Website</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              showToast("All website settings reset to original defaults!");
            }}
            className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-rose-600 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN EASY ADMIN WORKSPACE
         ===================================================================== */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 max-w-5xl">
        {/* Green Confirmation Toast */}
        {savedBanner && (
          <div className="sticky top-3 z-50 p-4 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center gap-2.5 shadow-xl">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{savedBanner}</span>
          </div>
        )}

        {/* Top Bar */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A2F42] bg-[#F4B143]/30 px-2.5 py-1 rounded">
              LIVE WEBSITE EDITOR (AUTO-SAVES INSTANTLY)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1.5">
              {activeTab === "dashboard" && "0. Dashboard & Business Stats"}
              {activeTab === "whatsapp-social" &&
                "1. WhatsApp Settings & Social Media Links"}
              {activeTab === "hero-theme" &&
                "2. Hero Banner Image & Theme Changer"}
              {activeTab === "products" &&
                "3. Add or Edit Products & Prices"}
              {activeTab === "menu-bar" && "4. Customize Top Menu Bar"}
              {activeTab === "seo-aeo-geo" &&
                "5. Website Text, SEO, AEO & GEO Settings"}
              {activeTab === "orders" && "6. Customer WhatsApp Orders"}
              {activeTab === "leads" && "7. Customer Leads & Future Marketing"}
              {activeTab === "users-security" &&
                "8. Staff Users, Passwords & Security"}
            </h2>
          </div>

          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#0A2F42] hover:bg-[#104661] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm"
          >
            <span>See Changes on Website</span>
            <ExternalLink className="w-4 h-4 text-[#F4B143]" />
          </Link>
        </div>

        {/* ===================================================================
            TAB 0: DASHBOARD & BUSINESS STATS
           =================================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            {(() => {
              const delivered = orders.filter((o) => o.status === "Delivered");
              const revenue = delivered.reduce((s, o) => s + o.total, 0);
              const pipeline = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
              const lowStock = products.filter((p) => p.stockCount <= 5);
              const today = new Date().toDateString();
              const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
              const topProducts = Object.entries(
                orders.flatMap((o) => o.items).reduce<Record<string, number>>((acc, i) => {
                  acc[i.productId] = (acc[i.productId] || 0) + i.quantity;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).slice(0, 5);

              const statCards = [
                { label: "Total Orders", value: orders.length, sub: `${todayOrders.length} today`, color: "bg-[#0A2F42] text-white" },
                { label: "Revenue (Delivered)", value: `AED ${revenue.toLocaleString()}`, sub: `${delivered.length} delivered`, color: "bg-emerald-600 text-white" },
                { label: "In Pipeline", value: pipeline.length, sub: "need action", color: "bg-amber-500 text-white" },
                { label: "Products", value: products.length, sub: `${lowStock.length} low stock`, color: "bg-[#F4B143] text-black" },
                { label: "Customer Leads", value: leads.length, sub: "auto-collected", color: "bg-violet-600 text-white" },
              ];
              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {statCards.map((c) => (
                      <div key={c.label} className={`rounded-2xl p-4 shadow-sm ${c.color}`}>
                        <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{c.label}</div>
                        <div className="text-2xl sm:text-3xl font-black mt-1">{c.value}</div>
                        <div className="text-[11px] font-semibold opacity-75 mt-0.5">{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Orders by status */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-500">Orders by Status</h3>
                      {(["New WhatsApp Lead", "Confirmed", "Out for Delivery", "Delivered", "Cancelled"] as const).map((st) => {
                        const n = orders.filter((o) => o.status === st).length;
                        return (
                          <div key={st} className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-zinc-700">{st}</span>
                            <span className="font-extrabold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full text-xs">{n}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top selling products */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-500">Top Products (by units sold)</h3>
                      {topProducts.length === 0 && (
                        <p className="text-xs text-zinc-400">No orders yet — top products appear here once customers order.</p>
                      )}
                      {topProducts.map(([pid, qty]) => {
                        const p = products.find((x) => x.id === pid);
                        return (
                          <div key={pid} className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-zinc-700 truncate">{p?.title || pid}</span>
                            <span className="font-extrabold text-[#0A2F42] bg-[#F4B143]/30 px-2.5 py-0.5 rounded-full text-xs">{qty} sold</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Low stock warning */}
                  {lowStock.length > 0 && (
                    <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5 space-y-2">
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-rose-600">Low Stock — Restock Needed</h3>
                      <div className="flex flex-wrap gap-2">
                        {lowStock.map((p) => (
                          <span key={p.id} className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                            {p.title} ({p.stockCount} left)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ===================================================================
            TAB 1: WHATSAPP SETTINGS & SOCIAL MEDIA LINKS
           =================================================================== */}
        {activeTab === "whatsapp-social" && (
          <div className="space-y-6">
            {/* WhatsApp Configuration Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-200 pb-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 text-[#128C7E] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    WhatsApp Order Settings
                  </h3>
                  <p className="text-xs text-zinc-500">
                    All 1-Click WhatsApp buttons and Cart orders will be sent to
                    this phone number.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    WhatsApp Phone Number (UAE +971 Format)
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) =>
                      updateSettings({ whatsappNumber: e.target.value })
                    }
                    placeholder="+971553020429"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-mono font-bold text-emerald-700 focus:outline-none focus:border-[#0A2F42]"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    UAE Number: +971553020429 (or 0553020429)
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Display Phone Number in Header (+971)
                  </label>
                  <input
                    type="text"
                    value={settings.supportPhoneDisplay}
                    onChange={(e) =>
                      updateSettings({ supportPhoneDisplay: e.target.value })
                    }
                    placeholder="+971 55 302 0429"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Support Email (footer + SEO schema)
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail || ""}
                    onChange={(e) =>
                      updateSettings({ supportEmail: e.target.value })
                    }
                    placeholder="sales@dubaicigeretteshop.ae"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Floating Bottom WhatsApp Button Text
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappFloatButtonLabel || ""}
                    onChange={(e) =>
                      updateSettings({
                        whatsappFloatButtonLabel: e.target.value,
                      })
                    }
                    placeholder="1-Click WhatsApp Order"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Delivery Time Promise (Shown on Cards &amp; WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={settings.expressDeliveryMinutes}
                    onChange={(e) =>
                      updateSettings({
                        expressDeliveryMinutes: e.target.value,
                      })
                    }
                    placeholder="45–60 Mins"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Free Delivery Minimum Order (AED)
                  </label>
                  <input
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) =>
                      updateSettings({
                        freeDeliveryThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-mono font-bold focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Delivery Fee Below Minimum (AED)
                  </label>
                  <input
                    type="number"
                    value={settings.standardDeliveryFee}
                    onChange={(e) =>
                      updateSettings({
                        standardDeliveryFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 font-mono font-bold focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-zinc-700 mb-1">
                    WhatsApp Opening Greeting Message
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappGreetingTemplate || ""}
                    onChange={(e) =>
                      updateSettings({
                        whatsappGreetingTemplate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F42]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  showToast("WhatsApp settings saved & updated on the website!")
                }
                className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save WhatsApp Settings</span>
              </button>
            </div>

            {/* 24/7 WhatsApp Automation Concierge Bot Settings Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-zinc-200 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    24/7 WhatsApp Automation Bot &amp; Cloud Webhook
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Controls the automated WhatsApp chat concierge on your
                    website and the `/api/whatsapp/webhook` auto-reply endpoint.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = settings.whatsappBot?.enabled ?? true;
                    updateSettings({
                      whatsappBot: {
                        ...(settings.whatsappBot || {
                          botName:
                            "Dubai Cigarette Shop Automated WhatsApp Concierge",
                          welcomeMessage: "",
                          autoReplyDelayMs: 450,
                          webhookVerifyToken: "vapdxb_uae_verify_2026",
                          cloudApiAccessToken: "",
                          cloudApiPhoneNumberId: "",
                        }),
                        enabled: !current,
                      },
                    });
                    showToast(
                      `WhatsApp Automation Bot ${
                        !current ? "ENABLED" : "DISABLED"
                      }!`
                    );
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold ${
                    settings.whatsappBot?.enabled ?? true
                      ? "bg-[#25D366] text-black"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {settings.whatsappBot?.enabled ?? true
                    ? "BOT ACTIVE (ON)"
                    : "BOT OFF"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Automated Concierge Bot Name
                  </label>
                  <input
                    type="text"
                    value={
                      settings.whatsappBot?.botName ||
                      "Dubai Cigarette Shop Automated WhatsApp Concierge"
                    }
                    onChange={(e) =>
                      updateSettings({
                        whatsappBot: {
                          ...settings.whatsappBot,
                          botName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Webhook URL (For Meta WhatsApp Cloud API / Kapso / Twilio)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="https://dubaicigeretteshop.ae/api/whatsapp/webhook"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 border border-zinc-300 font-mono text-xs text-zinc-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-zinc-700 mb-1">
                    Automated Bot Welcome Message
                  </label>
                  <textarea
                    rows={2}
                    value={settings.whatsappBot?.welcomeMessage || ""}
                    onChange={(e) =>
                      updateSettings({
                        whatsappBot: {
                          ...settings.whatsappBot,
                          welcomeMessage: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-200 pb-3">
                <div className="w-9 h-9 rounded-xl bg-[#0A2F42] text-[#F4B143] flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    Social Media Icons &amp; Links
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Paste your social media links below. Leave any field empty
                    to hide that icon from the menu bar &amp; footer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Facebook Page Link
                  </label>
                  <input
                    type="url"
                    value={socials.facebook}
                    onChange={(e) =>
                      updateSettings({
                        socialLinks: { ...socials, facebook: e.target.value },
                      })
                    }
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Instagram Profile Link
                  </label>
                  <input
                    type="url"
                    value={socials.instagram}
                    onChange={(e) =>
                      updateSettings({
                        socialLinks: { ...socials, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/yourprofile"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    X (Twitter) Profile Link
                  </label>
                  <input
                    type="url"
                    value={socials.twitter}
                    onChange={(e) =>
                      updateSettings({
                        socialLinks: { ...socials, twitter: e.target.value },
                      })
                    }
                    placeholder="https://x.com/yourprofile"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    YouTube Channel Link
                  </label>
                  <input
                    type="url"
                    value={socials.youtube}
                    onChange={(e) =>
                      updateSettings({
                        socialLinks: { ...socials, youtube: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Pinterest Link
                  </label>
                  <input
                    type="url"
                    value={socials.pinterest}
                    onChange={(e) =>
                      updateSettings({
                        socialLinks: { ...socials, pinterest: e.target.value },
                      })
                    }
                    placeholder="https://pinterest.com/yourprofile"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    TikTok Link
                  </label>
                  <input
                    type="url"
                    value={socials.tiktok}
                    onChange={(e) =>
                      updateSettings({
                        socialLinks: { ...socials, tiktok: e.target.value },
                      })
                    }
                    placeholder="https://tiktok.com/@yourprofile"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  showToast("Social Media links updated on Menu Bar & Footer!")
                }
                className="px-6 py-3 rounded-xl bg-[#0A2F42] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#F4B143]" />
                <span>Save Social Media Links</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: HERO BANNER IMAGE & THEME CHANGER
           =================================================================== */}
        {activeTab === "hero-theme" && (
          <div className="space-y-6">
            {/* Theme Selector */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#0A2F42]">
                <Palette className="w-5 h-5 text-[#F4B143]" />
                <span>Choose Website Color &amp; Skyline Theme</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    {
                      id: "midnight-gold",
                      title: "1. Burj & Wood Table (Default)",
                      desc: "Warm wooden table + Burj Khalifa golden night skyline.",
                    },
                    {
                      id: "future-glass",
                      title: "2. Dubai Marina Blue Skyline",
                      desc: "Cool Navy & Marina architectural blue theme.",
                    },
                    {
                      id: "royal-sunset",
                      title: "3. Burj Al Arab Golden Sunset",
                      desc: "Warm bronze & golden sunset over Jumeirah.",
                    },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      updateSettings({ activeTheme: t.id as ThemeId });
                      showToast(`Activated Theme: ${t.title}`);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      settings.activeTheme === t.id
                        ? "border-[#0A2F42] bg-[#FDF9EE]"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{t.title}</span>
                      {settings.activeTheme === t.id && (
                        <span className="px-2 py-0.5 rounded bg-[#25D366] text-black text-[10px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Image Upload / Preset Selector */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0A2F42]">
                  <ImageIcon className="w-5 h-5 text-[#F4B143]" />
                  <span>Change Hero Banner Background Image &amp; Title</span>
                </div>

                {settings.heroBackgroundImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ heroBackgroundImageUrl: "" });
                      showToast("Restored Default Burj & Wood Table Hero!");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700"
                  >
                    Reset to Default Wood Table
                  </button>
                )}
              </div>

              {/* 4 Ready-Made Dubai Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {HERO_IMAGE_PRESETS.map((preset) => {
                  const isSelected =
                    settings.heroBackgroundImageUrl === preset.imageUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        updateSettings({
                          heroBackgroundImageUrl: preset.imageUrl,
                          activeTheme: preset.themeMatch,
                        });
                        showToast(`Selected Hero: ${preset.label}`);
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-[#F4B143] bg-[#FDF9EE]"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="h-20 rounded-lg mb-2 overflow-hidden bg-gradient-to-b from-[#1A0E07] to-[#2C1608] flex items-center justify-center relative">
                        {preset.imageUrl ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${preset.imageUrl})`,
                            }}
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-[#F4B143] text-center px-2">
                            Burj Khalifa + Wood Table
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs">{preset.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Upload Photo from Computer OR Paste Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Upload Hero Photo from Your Computer / Phone
                  </label>
                  <label className="cursor-pointer w-full py-3 px-4 rounded-xl bg-[#0A2F42] hover:bg-[#114661] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-[#F4B143]" />
                    <span>Choose Photo...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Or Paste Any Image Link (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /uploads/..."
                    value={settings.heroBackgroundImageUrl || ""}
                    onChange={(e) =>
                      updateSettings({ heroBackgroundImageUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-xs"
                  />
                </div>
              </div>

              {/* Live Hero Image Preview Box */}
              {settings.heroBackgroundImageUrl && (
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={settings.heroBackgroundImageUrl}
                      alt="Hero Preview"
                      className="w-24 h-14 object-cover rounded-lg border border-zinc-300"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-700">
                        ● Custom Hero Image Active
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate max-w-xs">
                        {settings.heroBackgroundImageUrl}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ heroBackgroundImageUrl: "" });
                      showToast("Removed custom Hero Image.");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              {/* Hero Title & 5-Packs Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Hero Banner Center Title Text
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitleOverride || ""}
                    onChange={(e) =>
                      updateSettings({ heroTitleOverride: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm font-bold"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div>
                    <div className="text-xs font-bold">
                      Show 5 Standing Cigarette Packs in Hero
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Turn off if you only want your custom photo to show
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        showFivePacksRow: !(settings.showFivePacksRow ?? true),
                      })
                    }
                    className={`px-4 py-2 rounded-lg text-xs font-extrabold ${
                      settings.showFivePacksRow ?? true
                        ? "bg-[#25D366] text-black"
                        : "bg-zinc-300 text-zinc-700"
                    }`}
                  >
                    {settings.showFivePacksRow ?? true ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: EASY PRODUCT & INVENTORY MANAGER
           =================================================================== */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
              <div>
                <h3 className="font-extrabold text-base">
                  Manage All Products ({products.length} items)
                </h3>
                <p className="text-xs text-zinc-500">
                  Click &quot;+ Add New Product&quot; to add any cigarette carton
                  or secondary item, or click &quot;Edit&quot; on any product
                  below.
                </p>
                {!catalogServerLinked && (
                  <p className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 inline-block">
                    Changes are saved on this browser only and will NOT appear
                    for customers. Log in with the server admin account to
                    publish edits for everyone.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filter products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 pr-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewProduct}
                  className="px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Product</span>
                </button>
              </div>
            </div>

            {/* Easy Product Edit Form (Complete with Pricing, Stock, Specs, Image & Product SEO/AEO) */}
            {editingProduct && (
              <form
                ref={editFormRef}
                onSubmit={handleSaveProduct}
                className="bg-white p-6 rounded-2xl border-2 border-[#0A2F42] shadow-xl space-y-5"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#0A2F42] bg-[#F4B143]/40 px-2 py-0.5 rounded font-bold">
                      {editingProduct.id.startsWith("custom-product-")
                        ? "CREATING NEW PRODUCT"
                        : `EDITING SKU: ${editingProduct.sku}`}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0A2F42] mt-1">
                      {editingProduct.title || "Enter New Product Name Below"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700"
                  >
                    Close Form
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      1. Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marlboro Gold Original"
                      value={editingProduct.title}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      2. Brand Series *
                    </label>
                    <select
                      value={editingProduct.brand}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          brand: e.target.value as BrandName,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                    >
                      <option value="Marlboro">Marlboro</option>
                      <option value="Dunhill">Dunhill</option>
                      <option value="Davidoff">Davidoff</option>
                      <option value="ESSE">ESSE</option>
                      <option value="Parliament">Parliament</option>
                      <option value="Winston">Winston</option>
                      <option value="Vogue">Vogue</option>
                      <option value="West">West</option>
                      <option value="Camel">Camel</option>
                      <option value="Manchester">Manchester</option>
                      <option value="Chesterfield">Chesterfield</option>
                      <option value="L&M">L&amp;M</option>
                      <option value="American Spirit">American Spirit</option>
                      <option value="Benson & Hedges">Benson &amp; Hedges</option>
                      <option value="Captain Black">Captain Black</option>
                      <option value="Villiger">Villiger</option>
                      <option value="Gold Leaf">Gold Leaf</option>
                      <option value="Platinum Seven">Platinum Seven</option>
                      <option value="Mond">Mond</option>
                      <option value="IQOS TEREA">IQOS TEREA</option>
                      <option value="Lambda">Lambda</option>
                      <option value="ELFBAR & HQD">ELFBAR &amp; HQD</option>
                      <option value="Vozol">Vozol</option>
                      <option value="Geek Bar">Geek Bar</option>
                      <option value="Tugboat">Tugboat</option>
                      <option value="ISGO & Ignite">ISGO &amp; Ignite</option>
                      <option value="Fummo">Fummo</option>
                      <option value="Disposable Vapes">Disposable Vapes</option>
                      <option value="MYLE">MYLE</option>
                      <option value="JUUL">JUUL</option>
                      <option value="RELX">RELX</option>
                      <option value="OXVA">OXVA</option>
                      <option value="VOOPOO">VOOPOO</option>
                      <option value="SMOK">SMOK</option>
                      <option value="UWELL & Vaporesso">UWELL &amp; Vaporesso</option>
                      <option value="VGOD & Nasty E-Liquid">VGOD &amp; Nasty E-Liquid</option>
                      <option value="Premium E-Liquid">Premium E-Liquid</option>
                      <option value="VELO & White Fox">VELO &amp; White Fox</option>
                      <option value="Pablo">Pablo</option>
                      <option value="Killa">Killa</option>
                      <option value="Rabbit">Rabbit</option>
                      <option value="X Bar">X Bar</option>
                      <option value="Premium Pouches">Premium Pouches</option>
                      <option value="Al Fakher Shisha">Al Fakher Shisha</option>
                      <option value="Adalya">Adalya</option>
                      <option value="Mazaya">Mazaya</option>
                      <option value="Starbuzz">Starbuzz</option>
                      <option value="Shisha & Hookah">Shisha &amp; Hookah</option>
                      <option value="Premium Accessories">Premium Accessories</option>
                      <option value="Premium Cigars">Premium Cigars</option>


                      <option value="IQOS TEREA">IQOS TEREA</option>
                      <option value="VAP DXB Exclusive">
                        VAP DXB Exclusive
                      </option>
                      <option value="ELFBAR & HQD">ELFBAR &amp; HQD</option>
                      <option value="VGOD & Nasty E-Liquid">
                        VGOD &amp; Nasty E-Liquid
                      </option>
                      <option value="VELO & White Fox">
                        VELO &amp; White Fox
                      </option>
                      <option value="UWELL & Vaporesso">
                        UWELL &amp; Vaporesso
                      </option>
                      <option value="Al Fakher Shisha">
                        Al Fakher Shisha
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      3. Main Category *
                    </label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as Product["category"],
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                    >
                      <option value="cigarettes">
                        Cigarettes (Primary Focus)
                      </option>
                      <option value="iqos-terea">
                        IQOS TEREA / Heated Tobacco
                      </option>
                      <option value="nicotine-pouches">
                        Nicotine Pouches (VELO / White Fox)
                      </option>
                      <option value="vapes">
                        Vape Devices (Disposable / Kit / Mod)
                      </option>
                      <option value="e-liquid">E-Liquid (Salt / Freebase)</option>
                      <option value="accessories">
                        Accessories (Pods / Coils)
                      </option>
                      <option value="hookah-shisha">Hookah &amp; Shisha</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      4. 1 Carton / Unit Price (AED) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingProduct.cartonPrice}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          cartonPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono font-bold text-[#0A2F42]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      5. Old Price Before Discount (AED)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.oldPrice || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          oldPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="e.g. 220"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      6. 5 Cartons VIP Bulk Price (AED) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingProduct.fiveCartonPrice}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          fiveCartonPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      7. Stock Count &amp; SKU Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editingProduct.stockCount}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stockCount: Number(e.target.value),
                          })
                        }
                        placeholder="Qty 50"
                        className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono"
                      />
                      <input
                        type="text"
                        value={editingProduct.sku}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            sku: e.target.value,
                          })
                        }
                        placeholder="SKU"
                        className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      8. Tar &amp; Nicotine Specs
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.tar}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            tar: e.target.value,
                          })
                        }
                        placeholder="Tar 6.0mg"
                        className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                      />
                      <input
                        type="text"
                        value={editingProduct.nicotine}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            nicotine: e.target.value,
                          })
                        }
                        placeholder="Nic 0.5mg"
                        className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      9. Duty-Free Origin &amp; Promo Badge
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.origin}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            origin: e.target.value,
                          })
                        }
                        placeholder="Switzerland Duty-Free"
                        className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                      />
                      <input
                        type="text"
                        value={editingProduct.badge || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            badge: e.target.value,
                          })
                        }
                        placeholder="Badge (Best Seller)"
                        className="w-1/2 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      10. Pack Format &amp; Box Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.format}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            format: e.target.value,
                          })
                        }
                        placeholder="1 Carton (10 Packs)"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                      />
                      <input
                        type="color"
                        value={editingProduct.accentColor || "#D4AF37"}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            accentColor: e.target.value,
                          })
                        }
                        className="w-11 h-10 rounded-lg border border-zinc-300 cursor-pointer"
                        title="Choose Pack Accent Color"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-700 mb-1">
                      11. Product Photos — Cover + Gallery (Upload Multiple OR Paste URLs)
                    </label>
                    <div
                      className="flex flex-col sm:flex-row gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-3 transition-colors data-[drop=on]:border-[#25D366] data-[drop=on]:bg-emerald-50"
                      data-drop="off"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.dataset.drop = "on";
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.dataset.drop = "off";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.dataset.drop = "off";
                        if (e.dataTransfer.files?.length) {
                          applyProductImages(e.dataTransfer.files);
                        }
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Cover Photo URL, or drag & drop one or multiple photos here"
                        value={editingProduct.customImageUrl || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            customImageUrl: e.target.value,
                          })
                        }
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs"
                      />
                      <label className="cursor-pointer py-2.5 px-4 rounded-xl bg-[#0A2F42] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5 text-[#F4B143]" />
                        <span>Upload Photo(s)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProductImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Add Extra Gallery Image by URL */}
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Optional: paste an additional gallery photo URL and click + Add to Gallery"
                        value={galleryUrlInput}
                        onChange={(e) => setGalleryUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = galleryUrlInput.trim();
                          if (!url) return;
                          setEditingProduct((prev) => {
                            if (!prev) return null;
                            if (!prev.customImageUrl) {
                              return { ...prev, customImageUrl: url };
                            }
                            return {
                              ...prev,
                              galleryImages: [
                                ...(prev.galleryImages || []),
                                url,
                              ],
                            };
                          });
                          setGalleryUrlInput("");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold shrink-0"
                      >
                        + Add to Gallery
                      </button>
                    </div>

                    {/* Live Product Photos Strip (Cover + Gallery) */}
                    {(editingProduct.customImageUrl ||
                      (editingProduct.galleryImages &&
                        editingProduct.galleryImages.length > 0)) && (
                      <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-900">
                            ✓ Product Photos (
                            {(editingProduct.customImageUrl ? 1 : 0) +
                              (editingProduct.galleryImages?.length || 0)}{" "}
                            total) — first photo is the main cover
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {editingProduct.customImageUrl && (
                            <div className="relative group flex items-center gap-2 p-2 rounded-lg bg-white border-2 border-[#0A2F42] shadow-sm">
                              <img
                                src={editingProduct.customImageUrl}
                                alt="Cover Preview"
                                className="w-14 h-14 object-contain rounded bg-zinc-50 p-0.5"
                              />
                              <div className="text-[11px]">
                                <span className="px-1.5 py-0.5 rounded bg-[#0A2F42] text-[#F4B143] font-mono text-[9px] font-bold">
                                  COVER
                                </span>
                                <span className="font-mono text-[10px] text-zinc-500 truncate block max-w-[130px] mt-0.5">
                                  {editingProduct.customImageUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingProduct((prev) => {
                                      if (!prev) return null;
                                      const [nextCover, ...rest] =
                                        prev.galleryImages || [];
                                      return {
                                        ...prev,
                                        customImageUrl: nextCover || "",
                                        galleryImages: rest,
                                      };
                                    })
                                  }
                                  className="mt-1 text-[10px] font-bold text-rose-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}

                          {(editingProduct.galleryImages || []).map(
                            (gUrl, idx) => (
                              <div
                                key={`${gUrl}-${idx}`}
                                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-zinc-200 shadow-sm"
                              >
                                <img
                                  src={gUrl}
                                  alt={`Gallery ${idx + 2}`}
                                  className="w-14 h-14 object-contain rounded bg-zinc-50 p-0.5"
                                />
                                <div className="text-[11px] space-y-0.5">
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[9px] font-bold">
                                    PHOTO #{idx + 2}
                                  </span>
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingProduct((prev) => {
                                          if (!prev) return null;
                                          const list = [
                                            ...(prev.galleryImages || []),
                                          ];
                                          const chosen = list.splice(idx, 1)[0];
                                          if (prev.customImageUrl) {
                                            list.unshift(prev.customImageUrl);
                                          }
                                          return {
                                            ...prev,
                                            customImageUrl: chosen,
                                            galleryImages: list,
                                          };
                                        })
                                      }
                                      className="text-[10px] font-bold text-[#0A2F42] hover:underline"
                                    >
                                      Set Cover
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingProduct((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                galleryImages: (
                                                  prev.galleryImages || []
                                                ).filter((_, i) => i !== idx),
                                              }
                                            : null
                                        )
                                      }
                                      className="text-[10px] font-bold text-rose-600 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-zinc-700 mb-1">
                      12. Product Description (Shown on Product Card &amp; Detail Page)
                    </label>
                    <textarea
                      rows={2}
                      value={editingProduct.description}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-[#0A2F42] mb-1">
                      13. Product SEO / AEO Direct Answer Text (Optional — auto-generated if left blank)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Leave empty to auto-generate a 50-word SEO/AEO summary with AED prices, tar/nicotine specs, and WhatsApp delivery info..."
                      value={editingProduct.seoAnswerCapsule || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          seoAnswerCapsule: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF9EE] border border-[#F4B143]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                  <span className="text-xs text-zinc-500">
                    Saving automatically creates the dedicated SEO page{" "}
                    <code className="font-mono text-[#0A2F42]">
                      /product/{editingProduct.id}
                    </code>
                  </span>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Product to Website</span>
                  </button>
                </div>
              </form>
            )}

            {/* Product List — one row per product with photo thumbnail */}
            <div className="flex flex-col gap-3">
              {products
                .filter((p) => {
                  if (!productSearch.trim()) return true;
                  const q = productSearch.toLowerCase();
                  return (
                    p.title.toLowerCase().includes(q) ||
                    p.brand.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q)
                  );
                })
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-3 sm:p-4 rounded-2xl bg-white border border-zinc-200 flex items-center gap-3 sm:gap-4 shadow-sm"
                  >
                    {/* Product photo thumbnail */}
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-amber-200 overflow-hidden shrink-0 flex items-center justify-center"
                      style={{
                        background: p.customImageUrl
                          ? "#FFFFFF"
                          : `linear-gradient(145deg, ${p.accentColor} 0%, ${p.boxSecondaryColor} 100%)`,
                      }}
                    >
                      {p.customImageUrl ? (
                        <img
                          src={p.customImageUrl}
                          alt={p.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[9px] font-black text-white text-center leading-tight px-1">
                          {p.brand}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                        {p.brand} • {p.sku}
                      </span>
                      <Link
                        href={`/product/${p.id}`}
                        className="font-extrabold text-sm sm:text-base text-zinc-900 hover:text-[#0A2F42] truncate block"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs font-mono text-zinc-600 mt-0.5">
                        1 Carton:{" "}
                        <strong className="text-[#0A2F42]">
                          د.إ{p.cartonPrice}
                        </strong>{" "}
                        • 5 Cartons:{" "}
                        <strong className="text-emerald-700">
                          د.إ{p.fiveCartonPrice}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          toggleProductStock(p.id);
                          showToast(`Updated stock for ${p.title}`);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${
                          p.inStock
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {p.inStock ? "In Stock" : "Sold Out"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingProduct(p)}
                        className="px-3 py-1.5 rounded-lg bg-[#0A2F42] text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#F4B143]" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteProduct(p.id);
                          showToast(`Deleted ${p.title}`);
                        }}
                        className="p-2 rounded-lg bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: MENU BAR EDITOR
           =================================================================== */}
        {activeTab === "menu-bar" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">
                  Customize Top Gold Navigation Menu Bar
                </h3>
                <p className="text-xs text-zinc-500">
                  Add, rename, or remove links in the top Amber/Gold Menu Bar.
                </p>
              </div>

              {/* Add Menu Item Form */}
              <form
                onSubmit={handleAddMenuItem}
                className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs"
              >
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Menu Button Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DAVIDOFF GOLD"
                    value={newMenuLabel}
                    onChange={(e) => setNewMenuLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    When Clicked, Show:
                  </label>
                  <select
                    value={newMenuType}
                    onChange={(e) =>
                      setNewMenuType(
                        e.target.value as NavMenuItem["filterType"]
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 font-semibold"
                  >
                    <option value="brand">Specific Brand</option>
                    <option value="category">Product Category</option>
                    <option value="all">All Products (Home)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Target Brand / Category
                  </label>
                  {newMenuType === "brand" ? (
                    <select
                      value={newMenuValue}
                      onChange={(e) => setNewMenuValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 font-semibold"
                    >
                      <option value="Marlboro">Marlboro</option>
                      <option value="Dunhill">Dunhill</option>
                      <option value="Davidoff">Davidoff</option>
                      <option value="ESSE">ESSE</option>
                      <option value="Winston">Winston</option>
                      <option value="Parliament">Parliament</option>
                      <option value="Vogue">Vogue</option>
                      <option value="West">West</option>
                      <option value="Camel">Camel</option>
                      <option value="Manchester">Manchester</option>
                      <option value="Chesterfield">Chesterfield</option>
                      <option value="L&M">L&amp;M</option>
                      <option value="American Spirit">American Spirit</option>
                      <option value="Benson & Hedges">Benson &amp; Hedges</option>
                      <option value="Captain Black">Captain Black</option>
                      <option value="Villiger">Villiger</option>
                      <option value="Gold Leaf">Gold Leaf</option>
                      <option value="Platinum Seven">Platinum Seven</option>
                      <option value="Mond">Mond</option>
                      <option value="IQOS TEREA">IQOS TEREA</option>
                      <option value="Lambda">Lambda</option>
                      <option value="ELFBAR & HQD">ELFBAR &amp; HQD</option>
                      <option value="Vozol">Vozol</option>
                      <option value="Geek Bar">Geek Bar</option>
                      <option value="Tugboat">Tugboat</option>
                      <option value="ISGO & Ignite">ISGO &amp; Ignite</option>
                      <option value="Fummo">Fummo</option>
                      <option value="Disposable Vapes">Disposable Vapes</option>
                      <option value="MYLE">MYLE</option>
                      <option value="JUUL">JUUL</option>
                      <option value="RELX">RELX</option>
                      <option value="OXVA">OXVA</option>
                      <option value="VOOPOO">VOOPOO</option>
                      <option value="SMOK">SMOK</option>
                      <option value="UWELL & Vaporesso">UWELL &amp; Vaporesso</option>
                      <option value="VGOD & Nasty E-Liquid">VGOD &amp; Nasty E-Liquid</option>
                      <option value="Premium E-Liquid">Premium E-Liquid</option>
                      <option value="VELO & White Fox">VELO &amp; White Fox</option>
                      <option value="Pablo">Pablo</option>
                      <option value="Killa">Killa</option>
                      <option value="Rabbit">Rabbit</option>
                      <option value="X Bar">X Bar</option>
                      <option value="Premium Pouches">Premium Pouches</option>
                      <option value="Al Fakher Shisha">Al Fakher Shisha</option>
                      <option value="Adalya">Adalya</option>
                      <option value="Mazaya">Mazaya</option>
                      <option value="Starbuzz">Starbuzz</option>
                      <option value="Shisha & Hookah">Shisha &amp; Hookah</option>
                      <option value="Premium Accessories">Premium Accessories</option>
                      <option value="Premium Cigars">Premium Cigars</option>


                      <option value="IQOS TEREA">IQOS TEREA</option>
                      <option value="VELO & White Fox">
                        VELO &amp; White Fox
                      </option>
                      <option value="ELFBAR & HQD">ELFBAR &amp; HQD</option>
                      <option value="VGOD & Nasty E-Liquid">
                        VGOD &amp; Nasty E-Liquid
                      </option>
                      <option value="Al Fakher Shisha">
                        Al Fakher Shisha
                      </option>
                    </select>
                  ) : newMenuType === "category" ? (
                    <select
                      value={newMenuValue}
                      onChange={(e) => setNewMenuValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 font-semibold"
                    >
                      <option value="cigarettes">
                        Cigarettes (Primary Focus)
                      </option>
                      <option value="iqos-terea">Heated Tobacco</option>
                      <option value="nicotine-pouches">
                        Nicotine Pouches
                      </option>
                      <option value="vapes">Vape Devices</option>
                      <option value="e-liquid">E-Liquid</option>
                      <option value="accessories">Accessories</option>
                      <option value="hookah-shisha">Hookah &amp; Shisha</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="All Products"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-200 text-zinc-500"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-lg bg-[#25D366] text-black font-extrabold flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Menu Bar</span>
                </button>
              </form>

              {/* Current Menu Items List */}
              <div className="space-y-2">
                {navItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#0A2F42] text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-extrabold text-sm text-zinc-900">
                          {item.label}
                        </span>
                        <span className="ml-2 text-xs font-mono text-zinc-500">
                          ({item.filterType}: {item.filterValue})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMenuItem(item.id)}
                      className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold hover:bg-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 5: WEBSITE TEXT, SEO, AEO & GEO SETTINGS
           =================================================================== */}
        {activeTab === "seo-aeo-geo" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#0A2F42]">
                <Sparkles className="w-5 h-5 text-[#F4B143]" />
                <span>
                  Store Name, Top Banner Text, Footer &amp; AI Search (SEO /
                  AEO / GEO)
                </span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Store Brand Name
                    </label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) =>
                        updateSettings({ storeName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Store Location / Hub Address (Shown in Footer)
                    </label>
                    <input
                      type="text"
                      value={settings.storeAddressText || ""}
                      onChange={(e) =>
                        updateSettings({ storeAddressText: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Top Bar Announcement Text
                  </label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) =>
                      updateSettings({ announcementText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Footer &quot;About Us&quot; Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.footerAboutText || ""}
                    onChange={(e) =>
                      updateSettings({ footerAboutText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Google SEO Page Title
                  </label>
                  <input
                    type="text"
                    value={settings.seoMetaTitle || ""}
                    onChange={(e) =>
                      updateSettings({ seoMetaTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Google SEO Meta Description (Shown in Google Search Results)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.seoMetaDescription || ""}
                    onChange={(e) =>
                      updateSettings({ seoMetaDescription: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Target Dubai SEO Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={settings.seoKeywords || ""}
                    onChange={(e) =>
                      updateSettings({ seoKeywords: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    AEO 50-Word Direct Answer Summary (For ChatGPT, Perplexity
                    &amp; Google AI Overviews)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.aeoAnswerCapsule || ""}
                    onChange={(e) =>
                      updateSettings({ aeoAnswerCapsule: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF9EE] border border-[#F4B143]"
                  />
                </div>

                {/* Live Google & AI Search Preview Box */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold block">
                    LIVE GOOGLE SEARCH &amp; AI OVERVIEW PREVIEW
                  </span>
                  <div className="text-xs text-zinc-500">
                    https://dubaicigeretteshop.ae › dubai-cigarettes
                  </div>
                  <div className="text-base font-bold text-[#1a0dab] hover:underline cursor-pointer">
                    {settings.seoMetaTitle}
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {settings.seoMetaDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  showToast("Website text & SEO/AEO settings saved!")
                }
                className="px-6 py-3 rounded-xl bg-[#0A2F42] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#F4B143]" />
                <span>Save Website Text &amp; SEO</span>
              </button>
            </div>

            {/* FAQ Editor */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-zinc-900">
                Frequently Asked Questions (FAQ) Manager
              </h3>

              <form
                onSubmit={handleAddFaq}
                className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs"
              >
                <input
                  type="text"
                  placeholder="Question..."
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-300 font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Answer..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#25D366] text-black font-extrabold"
                >
                  + Add FAQ
                </button>
              </form>

              <div className="space-y-2.5">
                {(settings.faqs || []).map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">
                        {faq.question}
                      </div>
                      <p className="text-zinc-600 mt-1">{faq.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 6: WHATSAPP ORDERS & LIVE TRACKING DISPATCH BOARD
           =================================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            {/* Top Order Controls: Search + Status Filter Pills + Add Manual Order + Customer Track Link */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    Order Tracking &amp; Rider Dispatch Board ({orders.length}{" "}
                    total)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Update status below to notify customers on the{" "}
                    <Link
                      href="/track"
                      className="text-[#0A2F42] font-bold underline"
                    >
                      Live Order Tracking Page (/track)
                    </Link>{" "}
                    or click &quot;Send Tracking on WhatsApp&quot;.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/track"
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4 text-[#0A2F42]" />
                    <span>Open Customer Tracker (/track)</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowManualOrderForm((v) => !v)}
                    className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-black font-extrabold text-xs inline-flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Phone / Walk-In Order</span>
                  </button>
                </div>
              </div>

              {/* Search by Order ID / Customer + Status Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      "ALL",
                      "New WhatsApp Lead",
                      "Confirmed",
                      "Out for Delivery",
                      "Delivered",
                      "Cancelled",
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        orderStatusFilter === st
                          ? "bg-[#0A2F42] text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[230px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Order #EC-8841 or Name..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Create Phone / Walk-In Order Form */}
            {showManualOrderForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetProd =
                    products.find((p) => p.id === manualProductId) ||
                    products[0];
                  if (!targetProd) return;
                  const created = createManualOrder({
                    customerName: manualCustomerName,
                    customerPhone: manualCustomerPhone,
                    deliveryArea: manualArea,
                    addressNote: manualAddressNote,
                    paymentMethod: manualPayment,
                    product: targetProd,
                    packTier: manualPackTier,
                    quantity: manualQty,
                  });
                  setShowManualOrderForm(false);
                  setManualCustomerName("");
                  setManualAddressNote("");
                  showToast(
                    `Created Order #${created.id} for ${created.customerName}!`
                  );
                }}
                className="bg-white p-6 rounded-2xl border-2 border-[#0A2F42] shadow-xl space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <h4 className="font-extrabold text-base text-[#0A2F42]">
                    Create Manual Phone / WhatsApp Order
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowManualOrderForm(false)}
                    className="text-zinc-500 font-bold"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mr. Khalid"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Customer WhatsApp Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualCustomerPhone}
                      onChange={(e) => setManualCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Dubai Delivery Area
                    </label>
                    <select
                      value={manualArea}
                      onChange={(e) => setManualArea(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                    >
                      {DUBAI_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Select Product
                    </label>
                    <select
                      value={manualProductId}
                      onChange={(e) => setManualProductId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} — AED {p.cartonPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Pack Option &amp; Quantity
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={manualPackTier}
                        onChange={(e) =>
                          setManualPackTier(
                            e.target.value as "1-carton" | "5-cartons"
                          )
                        }
                        className="flex-1 px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-300 font-semibold"
                      >
                        <option value="1-carton">1 Carton</option>
                        <option value="5-cartons">5 Cartons VIP</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={manualQty}
                        onChange={(e) =>
                          setManualQty(Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-300 font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Building / Address Note
                    </label>
                    <input
                      type="text"
                      placeholder="Tower / Villa number"
                      value={manualAddressNote}
                      onChange={(e) => setManualAddressNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-extrabold"
                >
                  Save &amp; Generate Order ID
                </button>
              </form>
            )}

            {/* Filtered Orders List */}
            {orders
              .filter((o) => {
                if (
                  orderStatusFilter !== "ALL" &&
                  o.status !== orderStatusFilter
                )
                  return false;
                if (orderSearchQuery.trim() !== "") {
                  const q = orderSearchQuery.toLowerCase();
                  return (
                    o.id.toLowerCase().includes(q) ||
                    o.customerName.toLowerCase().includes(q) ||
                    o.customerPhone.toLowerCase().includes(q) ||
                    o.deliveryArea.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-[#0A2F42]">
                        #{order.id}
                      </span>
                      <span className="font-bold text-base">
                        {order.customerName}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        ({order.customerPhone})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        {order.source}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {order.createdAt}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600">
                      <strong>Area:</strong> {order.deliveryArea} —{" "}
                      {order.addressNote} •{" "}
                      <strong>Payment:</strong> {order.paymentMethod}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-zinc-100 text-xs font-semibold"
                        >
                          {item.title} ({item.packTier}) × {item.quantity} — د.إ
                          {item.unitPrice * item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <span className="font-mono text-lg font-extrabold text-[#0A2F42] mr-1">
                      د.إ{order.total}
                    </span>

                    <select
                      value={order.status}
                      onChange={(e) => {
                        updateOrderStatus(
                          order.id,
                          e.target.value as WhatsAppOrder["status"]
                        );
                        showToast(
                          `Order #${order.id} status updated to ${e.target.value}`
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-300 text-xs font-bold"
                    >
                      <option value="New WhatsApp Lead">
                        New WhatsApp Lead
                      </option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <a
                      href={`https://wa.me/${formatWhatsAppNumberForLink(
                        order.customerPhone
                      )}?text=${encodeURIComponent(
                        `Hello ${order.customerName}, update from ${settings.storeName} (${settings.supportPhoneDisplay}): Your Order #${order.id} (AED ${order.total}) status is now *${order.status}* for delivery to ${order.deliveryArea}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[#25D366] text-black font-extrabold text-xs inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Send Tracking on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        deleteOrder(order.id);
                        showToast(`Deleted Order #${order.id}`);
                      }}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-400 hover:text-rose-600"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ===================================================================
            TAB 7: CUSTOMER LEADS & FUTURE MARKETING (Auto-collected from EVERY order)
           =================================================================== */}
        {activeTab === "leads" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    Collected Customer Leads ({leads.length} total)
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xl">
                    Every order — Express 1-Click, Cart Checkout, or Phone
                    Order — automatically saves the customer here. Repeat
                    customers with the same WhatsApp number merge into one
                    record with total spend. Use these for future promotions,
                    new-stock alerts, and VIP offers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const header =
                        "Lead ID,Name,WhatsApp Phone,Delivery Area,Orders,Total Spent (AED),Last Order,Interested In,Source\n";
                      const rows = leads
                        .map((l) =>
                          [
                            l.id,
                            `"${l.customerName}"`,
                            l.customerPhone,
                            `"${l.deliveryArea}"`,
                            l.totalOrders,
                            l.totalSpent,
                            l.lastOrderId,
                            `"${l.lastProductInterest}"`,
                            l.source,
                          ].join(",")
                        )
                        .join("\n");
                      const blob = new Blob([header + rows], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `dubaicigeretteshop-leads-${Date.now()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast(`Exported ${leads.length} leads to CSV!`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0A2F42] hover:bg-[#104661] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-4 h-4 text-[#F4B143]" />
                    <span>Export Leads (CSV)</span>
                  </button>
                </div>
              </div>

              <div className="relative max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search lead name, phone or area..."
                  value={leadSearchQuery}
                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
                <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="font-bold text-zinc-700">No leads collected yet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  As soon as a customer places any WhatsApp order, their
                  details will appear here automatically.
                </p>
              </div>
            ) : (
              leads
                .filter((l) => {
                  if (leadSearchQuery.trim() === "") return true;
                  const q = leadSearchQuery.toLowerCase();
                  return (
                    l.customerName.toLowerCase().includes(q) ||
                    l.customerPhone.toLowerCase().includes(q) ||
                    l.deliveryArea.toLowerCase().includes(q) ||
                    l.lastOrderId.toLowerCase().includes(q)
                  );
                })
                .map((lead) => (
                  <div
                    key={lead.id}
                    className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-zinc-400">
                          {lead.id}
                        </span>
                        <span className="font-bold text-base">
                          {lead.customerName}
                        </span>
                        <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {lead.customerPhone}
                        </span>
                        {lead.totalOrders > 1 && (
                          <span className="px-2 py-0.5 rounded bg-[#F4B143]/25 text-amber-800 text-[11px] font-extrabold">
                            REPEAT VIP ×{lead.totalOrders}
                          </span>
                        )}
                        <span className="text-xs text-zinc-400">
                          {lead.createdAt}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600">
                        <strong>Area:</strong> {lead.deliveryArea} •{" "}
                        <strong>Last Order:</strong> #{lead.lastOrderId} •{" "}
                        <strong>Interested In:</strong>{" "}
                        {lead.lastProductInterest}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <div className="text-right mr-1">
                        <div className="font-mono text-base font-extrabold text-[#0A2F42]">
                          د.إ{lead.totalSpent.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {lead.totalOrders} order
                          {lead.totalOrders > 1 ? "s" : ""} • {lead.source}
                        </div>
                      </div>

                      {lead.customerPhone.replace(/\D/g, "").length >= 9 ? (
                        <a
                          href={`https://wa.me/${formatWhatsAppNumberForLink(
                            lead.customerPhone
                          )}?text=${encodeURIComponent(
                            `Hello ${lead.customerName}! This is ${settings.storeName} (${settings.supportPhoneDisplay}). We have a special VIP offer for you on ${lead.lastProductInterest}. Reply YES to hear today's deal!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-[#25D366] text-black font-extrabold text-xs inline-flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Send Promo on WhatsApp</span>
                        </a>
                      ) : (
                        <span className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                          Number pending — ask in Order #{lead.lastOrderId} chat
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          deleteLead(lead.id);
                          showToast(`Deleted Lead ${lead.id}`);
                        }}
                        className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-400 hover:text-rose-600"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
        {/* =============================================================
            TAB 8: USERS & SECURITY (admin only)
           ============================================================= */}
        {activeTab === "users-security" && currentUser?.role === "admin" && (
          <div className="space-y-6">
            {/* A. Change My Password */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (pwNew !== pwConfirm) {
                  showToast("New passwords do not match!");
                  return;
                }
                const res = await changePassword(currentUser.id, pwCurrent, pwNew);
                if (!res.ok) {
                  showToast(res.error || "Password change failed.");
                  return;
                }
                setPwCurrent("");
                setPwNew("");
                setPwConfirm("");
                showToast("Your password has been changed!");
              }}
              className="bg-white p-6 rounded-2xl border-2 border-[#0A2F42] shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#0A2F42]" />
                <h3 className="text-lg font-extrabold text-zinc-900">
                  Change My Password
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!pwCurrent || pwNew.length < 6 || pwNew !== pwConfirm}
                className="px-6 py-3 rounded-xl bg-[#0A2F42] hover:bg-[#12455e] disabled:opacity-40 text-white text-sm font-extrabold inline-flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Update My Password
              </button>
            </form>

            {/* B. Create Staff Account */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await upsertAdminUser({
                  id: `u-${Date.now()}`,
                  username: nuUsername,
                  displayName: nuName,
                  role: nuRole,
                  createdAt: Date.now(),
                  password: nuPassword,
                });
                if (!res.ok) {
                  showToast(res.error || "Could not create account.");
                  return;
                }
                setNuUsername("");
                setNuName("");
                setNuPassword("");
                setNuRole("manager");
                showToast("Staff account created & live!");
              }}
              className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-extrabold text-zinc-900">
                  Create Manager / Staff Account
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    value={nuName}
                    onChange={(e) => setNuName(e.target.value)}
                    placeholder="e.g. Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Username (for login)
                  </label>
                  <input
                    type="text"
                    value={nuUsername}
                    onChange={(e) => setNuUsername(e.target.value)}
                    placeholder="e.g. ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="text"
                    value={nuPassword}
                    onChange={(e) => setNuPassword(e.target.value)}
                    placeholder="Set their password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Role
                  </label>
                  <select
                    value={nuRole}
                    onChange={(e) =>
                      setNuRole(e.target.value as "admin" | "manager")
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2F42]"
                  >
                    <option value="manager">Manager (no user control)</option>
                    <option value="admin">Admin (full control)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={!nuUsername.trim() || nuPassword.length < 6}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-extrabold inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Account
              </button>
            </form>

            {/* C. Staff Accounts List */}
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold text-zinc-900">
                Staff Accounts ({adminUsers.length})
              </h3>
              {adminUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white border border-zinc-200 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#0A2F42] text-[#F4B143] font-black flex items-center justify-center shrink-0">
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-zinc-900 flex items-center gap-2 flex-wrap">
                      {u.displayName}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          u.role === "admin"
                            ? "bg-[#F4B143]/25 text-[#8a5a00]"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Login username: <b>{u.username}</b> • Added{" "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {u.id !== currentUser.id &&
                    !(u.role === "admin" &&
                      adminUsers.filter((x) => x.role === "admin").length ===
                        1) && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteAdminUser(u.id);
                          showToast(`Removed ${u.displayName}.`);
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                </div>
              ))}
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Managers can edit products, orders, leads and website content —
                but cannot create accounts or change passwords. Only Admins see
                this tab. The last remaining Admin cannot be removed.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
