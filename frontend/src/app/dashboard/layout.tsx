"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, isGarageStaff, isSuperAdmin, clearUser, canView, getFirstPermittedRoute } from "@/lib/auth";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import NotificationToast from "@/components/NotificationToast";

function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden"
      onClick={toggleMobileSidebar}
    />
  );
}

/** Maps route prefixes to permission modules for garage_staff route guards. */
const ROUTE_MODULE_MAP: Record<string, string> = {
  "/dashboard/create-order": "ORDERS",
  "/dashboard/create-invoice": "INVOICES",
  "/dashboard/invoices": "INVOICES",
  "/dashboard/inventory": "INVENTORY",
  "/dashboard/accounts": "ACCOUNTS",
  "/dashboard/order-search": "ORDERS",
  "/dashboard/cancelled-orders": "ORDERS",
  "/dashboard/customers": "CUSTOMERS",
  "/dashboard/vendors": "VENDORS",
  "/dashboard/vehicle-search": "VEHICLES",
  "/dashboard/appointments": "APPOINTMENTS",
  "/dashboard/service-reminders": "REMINDERS",
  "/dashboard/service-feedbacks": "REMINDERS",
  "/dashboard/insurance-due": "REMINDERS",
  "/dashboard/reports": "REPORTS",
  "/dashboard/tally-export": "REPORTS",
  "/dashboard/settings": "SETTINGS",
};

function getRequiredModule(pathname: string): string | null {
  for (const [prefix, module] of Object.entries(ROUTE_MODULE_MAP)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return module;
    }
  }
  return null;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered } = useSidebar();
  const showFull = isExpanded || isHovered;
  const pathname = usePathname();
  const router = useRouter();
  const [denied, setDenied] = useState(false);
  const [suspended, setSuspended] = useState(false);

  // Check garage active status for non-super-admin users
  useEffect(() => {
    if (isSuperAdmin()) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const token = typeof window !== "undefined"
      ? (() => { try { return JSON.parse(localStorage.getItem("garrage_auth") || "{}").accessToken; } catch { return null; } })()
      : null;
    if (!token) return;
    fetch(`${API_BASE}/api/orders/counts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 403) {
          return res.json().then((data) => {
            if (data?.error === "GARAGE_INACTIVE") setSuspended(true);
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isGarageStaff()) {
      setDenied(false);
      return;
    }

    // Dashboard page: if staff lacks DASHBOARD:VIEW, redirect to first permitted route
    if (pathname === "/dashboard") {
      if (!canView("DASHBOARD")) {
        const target = getFirstPermittedRoute();
        if (target !== "/dashboard") {
          router.replace(target);
          return;
        }
      }
      setDenied(false);
      return;
    }

    const requiredModule = getRequiredModule(pathname);
    if (requiredModule && !canView(requiredModule)) {
      setDenied(true);
      const target = getFirstPermittedRoute();
      const timer = setTimeout(() => router.replace(target), 2000);
      return () => clearTimeout(timer);
    } else {
      setDenied(false);
    }
  }, [pathname, router]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <Backdrop />
      <div
        className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300
          ${showFull ? "xl:ml-[240px]" : "xl:ml-[72px]"}`}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto relative">
          {/* Glassmorphic mesh gradient background */}
          <div className="glass-bg-mesh" aria-hidden="true" />
          <div className="relative">
            {suspended ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Suspended</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  Your garage account has been suspended by the administrator. Please contact support for more information.
                </p>
                <button
                  onClick={() => { clearUser(); router.replace("/login"); }}
                  className="px-6 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : denied ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Access Denied</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">You don&apos;t have permission to access this page. Redirecting...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <NotificationProvider>
        <DashboardContent>{children}</DashboardContent>
        <NotificationToast />
      </NotificationProvider>
    </SidebarProvider>
  );
}
