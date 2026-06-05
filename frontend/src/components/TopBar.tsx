"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearUser, isSuperAdmin, User } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, X, Sun, Moon,
  Car, User as UserIcon, FileText, ShoppingCart, Loader2,
  LogOut, Building2, ChevronDown, ClipboardList, Palette,
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

  // garages (super admin)
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
        id: `g-${g.id}`,
        type: "garage",
        title: g.name || "Unknown",
        subtitle: [g.ownerName, g.phone].filter(Boolean).join(" - "),
        href: `/dashboard/super-admin/garages/${g.id}`,
      });
      count++;
    }
  }

  // garage requests (super admin)
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
        id: `gr-${gr.id}`,
        type: "garage-request",
        title: gr.name || "Unknown",
        subtitle: [gr.ownerName, gr.status].filter(Boolean).join(" - "),
        href: `/dashboard/super-admin/garage-requests/${gr.id}`,
      });
      count++;
    }
  }

  // brand requests (super admin)
  count = 0;
  for (const br of brandRequests) {
    if (count >= MAX) break;
    if (
      br.name?.toLowerCase().includes(term) ||
      br.garageName?.toLowerCase().includes(term)
    ) {
      results.push({
        id: `br-${br.id}`,
        type: "brand-request",
        title: br.name || "Unknown",
        subtitle: [br.garageName, br.status].filter(Boolean).join(" - "),
        href: `/dashboard/super-admin/brand-requests/${br.id}`,
      });
      count++;
    }
  }

  // customers
  count = 0;
  for (const c of customers) {
    if (count >= MAX) break;
    if (
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    ) {
      results.push({
        id: `c-${c.id}`,
        type: "customer",
        title: c.name || "Unknown",
        subtitle: c.phone || c.email || "",
        href: "/dashboard/customers",
      });
      count++;
    }
  }

  // vehicles
  count = 0;
  for (const v of vehicles) {
    if (count >= MAX) break;
    if (
      v.registrationNumber?.toLowerCase().includes(term) ||
      v.brandName?.toLowerCase().includes(term) ||
      v.modelName?.toLowerCase().includes(term)
    ) {
      results.push({
        id: `v-${v.id}`,
        type: "vehicle",
        title: v.registrationNumber || "Unknown",
        subtitle: [v.brandName, v.modelName].filter(Boolean).join(" ") || "",
        href: "/dashboard/vehicle-search",
      });
      count++;
    }
  }

  // orders
  count = 0;
  for (const o of orders) {
    if (count >= MAX) break;
    if (
      o.jobCard?.toLowerCase().includes(term) ||
      o.customerName?.toLowerCase().includes(term) ||
      o.vehicleNumber?.toLowerCase().includes(term) ||
      (o.customerPhone || o.phone || "")?.includes(term)
    ) {
      results.push({
        id: `o-${o.id}`,
        type: "order",
        title: o.jobCard || "Order",
        subtitle: `${o.customerName || ""} - ${o.vehicleNumber || ""}`,
        href: `/dashboard/orders/${o.id}`,
      });
      count++;
    }
  }

  // invoices
  count = 0;
  for (const inv of invoices) {
    if (count >= MAX) break;
    if (
      inv.invoiceNumber?.toLowerCase().includes(term) ||
      inv.customerName?.toLowerCase().includes(term) ||
      inv.customerPhone?.includes(term)
    ) {
      results.push({
        id: `i-${inv.id}`,
        type: "invoice",
        title: inv.invoiceNumber || "Invoice",
        subtitle: `${inv.customerName || ""} - ${inv.grandTotal?.toLocaleString("en-IN") || "0"}`,
        href: "/dashboard/invoices",
      });
      count++;
    }
  }

  return results;
}

const TYPE_META: Record<SearchResult["type"], { icon: typeof Car; label: string; color: string }> = {
  garage:           { icon: Building2, label: "Garage", color: "text-purple-500 bg-purple-50 dark:bg-purple-500/15" },
  "garage-request": { icon: ClipboardList, label: "Garage Req", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/15" },
  "brand-request":  { icon: Palette, label: "Brand Req", color: "text-teal-500 bg-teal-50 dark:bg-teal-500/15" },
  customer:         { icon: UserIcon, label: "Customer", color: "text-brand-500 bg-brand-50 dark:bg-brand-500/15" },
  vehicle:          { icon: Car, label: "Vehicle", color: "text-success-500 bg-success-50 dark:bg-success-500/15" },
  order:            { icon: ShoppingCart, label: "Order", color: "text-warning-500 bg-warning-50 dark:bg-warning-500/15" },
  invoice:          { icon: FileText, label: "Invoice", color: "text-error-500 bg-error-50 dark:bg-error-500/15" },
};

export default function TopBar() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const superAdmin = isSuperAdmin();

  // search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // profile dropdown state
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { customers, vehicles, orders, invoices, garages, garageRequests, brandRequests } = await loadAllData(superAdmin);
      setDataLoaded(true);
      const res = searchAll(q, customers, vehicles, orders, invoices, garages, garageRequests, brandRequests);
      setResults(res);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [superAdmin]);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (dataLoaded) {
      const res = searchAll(
        value,
        cachedCustomers || [],
        cachedVehicles || [],
        cachedOrders || [],
        cachedInvoices || [],
        cachedGarages || [],
        cachedGarageRequests || [],
        cachedBrandRequests || [],
      );
      setResults(res);
      setShowDropdown(true);
    } else {
      debounceRef.current = setTimeout(() => performSearch(value), 300);
    }
  }

  function handleResultClick(result: SearchResult) {
    setShowDropdown(false);
    setQuery("");
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  }

  const handleToggle = () => {
    if (window.innerWidth >= 1280) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  function handleLogout() {
    clearUser();
    router.replace("/login");
  }

  const roleLabel = user?.role === "super_admin"
    ? "Super Admin"
    : user?.role === "garage_admin"
      ? "Owner"
      : user?.staffTitle || "Staff";

  return (
      <header className="sticky top-0 z-30 glass-strong border-b border-[var(--border-glass)]">
        <div className="flex items-center justify-between w-full px-4 py-3 xl:px-6">
          {/* Left -- hamburger + info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-xl glass hover:bg-[var(--bg-glass-hover)] text-[var(--text-tertiary)] transition-all xl:hidden"
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-[var(--surface-fg)] truncate">
                {user?.garageName || (superAdmin ? "Super Admin" : "My Garage")}
              </span>
              <span className="text-[var(--text-tertiary)] select-none">/</span>
              <span className="text-sm text-[var(--text-sec)] truncate">
                {user?.name || "User"}
              </span>
            </div>
          </div>

          {/* Center -- search (desktop only) */}
          <div className="hidden xl:block flex-1 max-w-md mx-6" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => { if (query.trim() && results.length > 0) setShowDropdown(true); }}
                onKeyDown={handleKeyDown}
                placeholder={superAdmin ? "Search garages, requests, brands..." : "Search anything..."}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--surface-fg)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] animate-spin" />
              )}

              {/* Search Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 glass-strong rounded-2xl border border-[var(--border-color)] shadow-2xl max-h-[400px] overflow-y-auto z-[99999]"
                  >
                    {results.length === 0 && !searchLoading ? (
                      <div className="px-4 py-6 text-center">
                        <Search className="w-8 h-8 text-[var(--text-tertiary)] opacity-30 mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-tertiary)]">No results found for &quot;{query}&quot;</p>
                      </div>
                    ) : (
                      <div className="py-1.5">
                        {results.map((r) => {
                          const meta = TYPE_META[r.type];
                          const Icon = meta.icon;
                          return (
                            <button
                              key={r.id}
                              onClick={() => handleResultClick(r)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[var(--surface-fg)] truncate">{r.title}</p>
                                <p className="text-xs text-[var(--text-tertiary)] truncate">{r.subtitle}</p>
                              </div>
                              <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider shrink-0">
                                {meta.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right -- actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-xl glass hover:bg-[var(--bg-glass-hover)] transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--text-sec)]" />
              )}
            </motion.button>

            <NotificationDropdown />

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile((p) => !p)}
                className="flex items-center gap-3 pl-3 border-l border-[var(--border-color)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20">
                  <span className="text-xs font-semibold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-[var(--surface-fg)]">{user?.name || "User"}</p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.phone} - {roleLabel}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200 hidden sm:block ${showProfile ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 glass-strong rounded-2xl border border-[var(--border-color)] shadow-xl z-[99999] overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--surface-fg)] truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate">
                            {user?.phone} - {roleLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
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
