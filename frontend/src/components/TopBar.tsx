"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, User } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Search, Bell, Menu, X, Sun, Moon,
  Car, User as UserIcon, FileText, ShoppingCart, Loader2,
} from "lucide-react";
import { getCustomers, Customer } from "@/lib/api-vehicles";
import { getVehicles, Vehicle } from "@/lib/api-vehicles";
import { getOrders, Order } from "@/lib/api-orders";
import { getInvoices, Invoice } from "@/lib/api-invoices";

// ── Search result types ──

interface SearchResult {
  id: string;
  type: "customer" | "vehicle" | "order" | "invoice";
  title: string;
  subtitle: string;
  href: string;
}

// ── Global search cache ──

let cachedCustomers: Customer[] | null = null;
let cachedVehicles: Vehicle[] | null = null;
let cachedOrders: Order[] | null = null;
let cachedInvoices: Invoice[] | null = null;

async function loadAllData() {
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
  return { customers, vehicles, orders, invoices };
}

function searchAll(
  q: string,
  customers: Customer[],
  vehicles: Vehicle[],
  orders: Order[],
  invoices: Invoice[],
): SearchResult[] {
  const term = q.toLowerCase().trim();
  if (!term) return [];

  const results: SearchResult[] = [];
  const MAX = 5; // max per category

  // customers
  let count = 0;
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
        subtitle: `${o.customerName || ""} • ${o.vehicleNumber || ""}`,
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
        subtitle: `${inv.customerName || ""} • ₹${inv.grandTotal?.toLocaleString("en-IN") || "0"}`,
        href: "/dashboard/invoices",
      });
      count++;
    }
  }

  return results;
}

const TYPE_META: Record<SearchResult["type"], { icon: typeof Car; label: string; color: string }> = {
  customer: { icon: UserIcon, label: "Customer", color: "text-brand-500 bg-brand-50 dark:bg-brand-500/15" },
  vehicle:  { icon: Car, label: "Vehicle", color: "text-success-500 bg-success-50 dark:bg-success-500/15" },
  order:    { icon: ShoppingCart, label: "Order", color: "text-warning-500 bg-warning-50 dark:bg-warning-500/15" },
  invoice:  { icon: FileText, label: "Invoice", color: "text-error-500 bg-error-50 dark:bg-error-500/15" },
};

export default function TopBar() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  // search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
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
      const { customers, vehicles, orders, invoices } = await loadAllData();
      setDataLoaded(true);
      const res = searchAll(q, customers, vehicles, orders, invoices);
      setResults(res);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // if data is already loaded, search immediately
    if (dataLoaded) {
      const res = searchAll(
        value,
        cachedCustomers || [],
        cachedVehicles || [],
        cachedOrders || [],
        cachedInvoices || [],
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

  return (
    <header className="sticky top-0 z-10 flex w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 border-b border-white/50 dark:border-gray-800/50">
      <div className="flex items-center justify-between w-full px-4 py-3 xl:px-6">
        {/* Left — hamburger + info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 xl:border xl:border-gray-200 xl:dark:border-gray-800"
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
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.garageName || "My Garage"}
            </span>
            <span className="text-gray-300 dark:text-gray-600 select-none">/</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user?.name || "User"}
            </span>
          </div>
        </div>

        {/* Center — search (desktop only) */}
        <div className="hidden xl:block flex-1 max-w-md mx-6" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => { if (query.trim() && results.length > 0) setShowDropdown(true); }}
              onKeyDown={handleKeyDown}
              placeholder="Search name, jobcard, phone, vehicle..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:focus:border-brand-800 transition-shadow"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-[400px] overflow-y-auto z-[99999]">
                {results.length === 0 && !searchLoading ? (
                  <div className="px-4 py-6 text-center">
                    <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No results found for &quot;{query}&quot;</p>
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
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.subtitle}</p>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <div className="ml-1 w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
