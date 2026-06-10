"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUser, clearUser, isSuperAdmin, User } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, X, Sun, Moon,
  Car, User as UserIcon, FileText, ShoppingCart, Loader2,
  LogOut, Building2, ChevronDown, ClipboardList, Palette, Settings,
  Command,
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import { getCustomers, Customer } from "@/lib/api-vehicles";
import { getVehicles, Vehicle } from "@/lib/api-vehicles";
import { getOrders, Order } from "@/lib/api-orders";
import { getInvoices, Invoice } from "@/lib/api-invoices";
import { api } from "@/lib/api";
import { GarageRegistration, getGarageRegistrations } from "@/lib/api-garage-registration";
import { BrandRequest, getBrandRequests } from "@/lib/api-brand-requests";

// ── Search result types ──

interface SearchResult {
  id: string;
  type: "customer" | "vehicle" | "order" | "invoice" | "garage" | "garage-request" | "brand-request";
  title: string;
  subtitle: string;
  href: string;
}

interface Garage {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  isActive: boolean;
}

// ── Global search cache ──

let cachedCustomers: Customer[] | null = null;
let cachedVehicles: Vehicle[] | null = null;
let cachedOrders: Order[] | null = null;
let cachedInvoices: Invoice[] | null = null;
let cachedGarages: Garage[] | null = null;
let cachedGarageRequests: GarageRegistration[] | null = null;
let cachedBrandRequests: BrandRequest[] | null = null;

async function loadAllData(superAdmin: boolean) {
  if (superAdmin) {
    const [garages, garageRequests, brandRequests] = await Promise.all([
      cachedGarages ? Promise.resolve(cachedGarages) : api.get<Garage[]>("/api/garages").catch(() => []),
      cachedGarageRequests ? Promise.resolve(cachedGarageRequests) : getGarageRegistrations().catch(() => []),
      cachedBrandRequests ? Promise.resolve(cachedBrandRequests) : getBrandRequests().catch(() => []),
    ]);
    cachedGarages = garages;
    cachedGarageRequests = garageRequests;
    cachedBrandRequests = brandRequests;
    return { customers: [], vehicles: [], orders: [], invoices: [], garages, garageRequests, brandRequests };
  }

  const [customers, vehicles, orders, invoices] = await Promise.all([
    cachedCustomers ? Promise.resolve(cachedCustomers) : getCustomers().catch(() => []),
    cachedVehicles ? Promise.resolve(cachedVehicles) : getVehicles().catch(() => []),
    cachedOrders ? Promise.resolve(cachedOrders) : getOrders().catch(() => []),
    cachedInvoices ? Promise.resolve(cachedInvoices) : getInvoices().catch(() => []),
  ]);
  cachedCustomers = customers;
  cachedVehicles = vehicles;
  cachedOrders = orders;
  cachedInvoices = invoices;
  return { customers, vehicles, orders, invoices, garages: [], garageRequests: [], brandRequests: [] };
}

function searchAll(
  q: string,
  customers: Customer[],
  vehicles: Vehicle[],
  orders: Order[],
  invoices: Invoice[],
  garages: Garage[],
  garageRequests: GarageRegistration[] = [],
  brandRequests: BrandRequest[] = [],
): SearchResult[] {
  const term = q.toLowerCase().trim();
  if (!term) return [];

  const results: SearchResult[] = [];
  const MAX = 5;

  let count = 0;
  for (const g of garages) {
    if (count >= MAX) break;
    if (
      g.name?.toLowerCase().includes(term) ||
      g.ownerName?.toLowerCase().includes(term) ||
      g.phone?.includes(term) ||
      g.address?.toLowerCase().includes(term)
    ) {
      results.push({
        id: `g-${g.id}`, type: "garage", title: g.name || "Unknown",
        subtitle: [g.ownerName, g.phone].filter(Boolean).join(" - "),
        href: `/dashboard/super-admin/garages/${g.id}`,
      });
      count++;
    }
  }

  count = 0;
  for (const gr of garageRequests) {
    if (count >= MAX) break;
    if (
      gr.name?.toLowerCase().includes(term) ||
      gr.ownerName?.toLowerCase().includes(term) ||
      gr.phone?.includes(term) ||
      gr.email?.toLowerCase().includes(term)
    ) {
      results.push({
        id: `gr-${gr.id}`, type: "garage-request", title: gr.name || "Unknown",
        subtitle: [gr.ownerName, gr.status].filter(Boolean).join(" - "),
        href: `/dashboard/super-admin/garage-requests/${gr.id}`,
      });
      count++;
    }
  }

  count = 0;
  for (const br of brandRequests) {
    if (count >= MAX) break;
    if (br.name?.toLowerCase().includes(term) || br.garageName?.toLowerCase().includes(term)) {
      results.push({
        id: `br-${br.id}`, type: "brand-request", title: br.name || "Unknown",
        subtitle: [br.garageName, br.status].filter(Boolean).join(" - "),
        href: `/dashboard/super-admin/brand-requests/${br.id}`,
      });
      count++;
    }
  }

  count = 0;
  for (const c of customers) {
    if (count >= MAX) break;
    if (c.name?.toLowerCase().includes(term) || c.phone?.includes(term) || c.email?.toLowerCase().includes(term)) {
      results.push({ id: `c-${c.id}`, type: "customer", title: c.name || "Unknown", subtitle: c.phone || c.email || "", href: "/dashboard/customers" });
      count++;
    }
  }

  count = 0;
  for (const v of vehicles) {
    if (count >= MAX) break;
    if (v.registrationNumber?.toLowerCase().includes(term) || v.brandName?.toLowerCase().includes(term) || v.modelName?.toLowerCase().includes(term)) {
      results.push({ id: `v-${v.id}`, type: "vehicle", title: v.registrationNumber || "Unknown", subtitle: [v.brandName, v.modelName].filter(Boolean).join(" ") || "", href: "/dashboard/vehicle-search" });
      count++;
    }
  }

  count = 0;
  for (const o of orders) {
    if (count >= MAX) break;
    if (o.jobCard?.toLowerCase().includes(term) || o.customerName?.toLowerCase().includes(term) || o.vehicleNumber?.toLowerCase().includes(term) || (o.customerPhone || o.phone || "")?.includes(term)) {
      results.push({ id: `o-${o.id}`, type: "order", title: o.jobCard || "Order", subtitle: `${o.customerName || ""} - ${o.vehicleNumber || ""}`, href: `/dashboard/orders/${o.id}` });
      count++;
    }
  }

  count = 0;
  for (const inv of invoices) {
    if (count >= MAX) break;
    if (inv.invoiceNumber?.toLowerCase().includes(term) || inv.customerName?.toLowerCase().includes(term) || inv.customerPhone?.includes(term)) {
      results.push({ id: `i-${inv.id}`, type: "invoice", title: inv.invoiceNumber || "Invoice", subtitle: `${inv.customerName || ""} - ${inv.grandTotal?.toLocaleString("en-IN") || "0"}`, href: "/dashboard/invoices" });
      count++;
    }
  }

  return results;
}

const TYPE_META: Record<SearchResult["type"], { icon: typeof Car; label: string; color: string; bg: string }> = {
  garage:           { icon: Building2,    label: "Garage",     color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  "garage-request": { icon: ClipboardList, label: "Garage Req", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  "brand-request":  { icon: Palette,      label: "Brand Req",  color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
  customer:         { icon: UserIcon,     label: "Customer",   color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  vehicle:          { icon: Car,          label: "Vehicle",    color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  order:            { icon: ShoppingCart, label: "Order",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  invoice:          { icon: FileText,     label: "Invoice",    color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
};

export default function TopBar() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const superAdmin = isSuperAdmin();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [garageLogoUrl, setGarageLogoUrl] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => { setUserState(getUser()); }, []);

  useEffect(() => {
    if (!user || user.role === "super_admin" || !user.garageId) return;
    api.get<{ logoFileId?: string | null }>(`/api/garages/${user.garageId}`)
      .then((data) => { if (data.logoFileId) setGarageLogoUrl(`${API_BASE_URL}/api/images/${data.logoFileId}`); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setShowDropdown(false); setSearchFocused(false); }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDropdown(false); return; }
    setSearchLoading(true);
    try {
      const { customers, vehicles, orders, invoices, garages, garageRequests, brandRequests } = await loadAllData(superAdmin);
      setDataLoaded(true);
      const res = searchAll(q, customers, vehicles, orders, invoices, garages, garageRequests, brandRequests);
      setResults(res);
      setShowDropdown(true);
    } catch { setResults([]); }
    finally { setSearchLoading(false); }
  }, [superAdmin]);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); setShowDropdown(false); return; }
    if (dataLoaded) {
      const res = searchAll(value, cachedCustomers || [], cachedVehicles || [], cachedOrders || [], cachedInvoices || [], cachedGarages || [], cachedGarageRequests || [], cachedBrandRequests || []);
      setResults(res);
      setShowDropdown(true);
    } else {
      debounceRef.current = setTimeout(() => performSearch(value), 300);
    }
  }

  function handleResultClick(result: SearchResult) { setShowDropdown(false); setQuery(""); router.push(result.href); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setShowDropdown(false); setSearchFocused(false); inputRef.current?.blur(); }
  }

  const handleToggle = () => { window.innerWidth >= 1280 ? toggleSidebar() : toggleMobileSidebar(); };

  function handleLogout() { clearUser(); router.replace("/login"); }

  const roleLabel = user?.role === "super_admin" ? "Super Admin" : user?.role === "garage_admin" ? "Owner" : user?.staffTitle || "Staff";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--surface-bg)]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between w-full h-14 px-4 xl:px-6">
        {/* ── Left ── */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-sec)] xl:hidden transition-colors hover:bg-[var(--surface-hover)]"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-red-500/10">
              <Building2 className="w-3 h-3 text-red-500" />
            </div>
            <span className="text-[13px] font-semibold text-[var(--surface-fg)] truncate">
              {user?.garageName || (superAdmin ? "Super Admin" : "My Garage")}
            </span>
            <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
          </div>
        </div>

        {/* ── Center — search ── */}
        <div className="hidden xl:block flex-1 max-w-md mx-8" ref={searchRef}>
          <div className="relative">
            <div
              className="relative rounded-xl transition-shadow duration-300"
              style={{
                boxShadow: searchFocused ? "0 0 0 2px rgba(239,68,68,0.2), 0 4px 20px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200
                  ${searchFocused ? "text-red-500" : "text-[var(--text-tertiary)]"}`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => { setSearchFocused(true); if (query.trim() && results.length > 0) setShowDropdown(true); }}
                onBlur={() => { if (!query.trim()) setSearchFocused(false); }}
                onKeyDown={handleKeyDown}
                placeholder={superAdmin ? "Search garages, requests..." : "Search anything..."}
                className="w-full pl-9 pr-16 py-2 rounded-xl text-sm text-[var(--surface-fg)] placeholder:text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] focus:outline-none focus:border-red-500/30 transition-all duration-200"
              />
              {!searchFocused && !query && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-hover)] border border-[var(--border-color)]">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                </div>
              )}
              {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-xl max-h-[380px] overflow-y-auto z-[99999]"
                  style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.15), 0 0 0 1px var(--border-color)" }}
                >
                  {results.length === 0 && !searchLoading ? (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-6 h-6 text-[var(--text-tertiary)] opacity-30 mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-tertiary)]">No results for &quot;{query}&quot;</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {results.map((r, i) => {
                        const meta = TYPE_META[r.type];
                        const Icon = meta.icon;
                        return (
                          <motion.button
                            key={r.id}
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                            onClick={() => handleResultClick(r)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors text-left group mx-1 rounded-lg"
                            style={{ width: "calc(100% - 0.5rem)" }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                              style={{ background: meta.bg }}
                            >
                              <Icon className="w-4 h-4" style={{ color: meta.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--surface-fg)] truncate">{r.title}</p>
                              <p className="text-xs text-[var(--text-tertiary)] truncate">{r.subtitle}</p>
                            </div>
                            <span
                              className="text-[9px] font-semibold uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--bg-tertiary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div key="sun" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="w-4 h-4 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-4 h-4 text-[var(--text-sec)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <NotificationDropdown />

          {/* Vertical divider */}
          <div className="hidden sm:block w-px h-6 mx-1.5 bg-[var(--border-color)]" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowProfile((p) => !p)}
              className="flex items-center gap-2.5 py-1 px-1.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  background: garageLogoUrl ? "transparent" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.2)",
                }}
              >
                {garageLogoUrl ? (
                  <Image src={garageLogoUrl} alt="Garage" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-[11px] font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-[13px] font-semibold text-[var(--surface-fg)] leading-tight truncate max-w-[120px]">{user?.name || "User"}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{roleLabel}</p>
              </div>
              <motion.div animate={{ rotate: showProfile ? 180 : 0 }} transition={{ duration: 0.2 }} className="hidden sm:block">
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-xl overflow-hidden z-[99999]"
                  style={{ boxShadow: "0 16px 48px -12px rgba(0,0,0,0.15)" }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                        style={{ background: garageLogoUrl ? "transparent" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
                      >
                        {garageLogoUrl ? (
                          <Image src={garageLogoUrl} alt="Garage" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <span className="text-xs font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--surface-fg)] truncate">{user?.name || "User"}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] truncate">{user?.phone} - {roleLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {user?.role !== "super_admin" && (
                      <button
                        onClick={() => { setShowProfile(false); router.push("/dashboard/settings/garage-profile"); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[var(--text-sec)] hover:text-[var(--surface-fg)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-[13px] font-medium">Garage Profile</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-red-500 hover:bg-red-500/5 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-[13px] font-medium">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
