"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  clearUser,
  getUser,
  isGarageStaff,
  isGarageOwner,
  isSuperAdmin,
  canView,
  canManage,
} from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Users,
  Truck,
  Briefcase,
  Car,
  Settings,
  Clock,
  Star,
  Bell,
  BarChart3,
  FileSpreadsheet,
  CalendarX,
  Share2,
  LogOut,
  Wrench,
  Building2,
  Calendar,
  Shield,
  UserCog,
  ScrollText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  module?: string;
  ownerOnly?: boolean;
  staffOnly?: boolean;
  exact?: boolean;
};
type Section = { title: string; items: MenuItem[] };

const baseSections: Section[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", module: "DASHBOARD" },
    ],
  },
  {
    title: "Workshop",
    items: [
      { label: "Orders", icon: Briefcase, href: "/dashboard/orders", module: "ORDERS" },
      { label: "Vehicles", icon: Car, href: "/dashboard/vehicle-search", module: "VEHICLES" },
      { label: "Invoices", icon: FileSpreadsheet, href: "/dashboard/invoices", module: "INVOICES" },
      { label: "My Tasks", icon: ClipboardList, href: "/dashboard/my-tasks", module: "ORDERS", staffOnly: true },
      { label: "Cancelled Orders", icon: CalendarX, href: "/dashboard/cancelled-orders", module: "ORDERS" },
    ],
  },
  {
    title: "Contacts",
    items: [
      { label: "Customers", icon: Users, href: "/dashboard/customers", module: "CUSTOMERS" },
      { label: "Vendors", icon: Truck, href: "/dashboard/vendors", module: "VENDORS" },
    ],
  },
  {
    title: "Stock & Finance",
    items: [
      { label: "Inventory", icon: ClipboardList, href: "/dashboard/inventory", module: "INVENTORY" },
      { label: "Accounts", icon: BookOpen, href: "/dashboard/accounts", module: "ACCOUNTS" },
    ],
  },
  {
    title: "Scheduling",
    items: [
      { label: "Appointments", icon: Calendar, href: "/dashboard/appointments", module: "APPOINTMENTS" },
      { label: "Service Reminders", icon: Clock, href: "/dashboard/service-reminders", module: "SERVICE_REMINDERS" },
      { label: "Service Feedbacks", icon: Star, href: "/dashboard/service-feedbacks", module: "SERVICE_FEEDBACKS" },
      { label: "Insurance Due", icon: Bell, href: "/dashboard/insurance-due", module: "INSURANCE_DUE" },
    ],
  },
  {
    title: "Staff",
    items: [
      { label: "Check In", icon: Clock, href: "/dashboard/attendance/checkin", staffOnly: true },
      { label: "Attendance", icon: Calendar, href: "/dashboard/attendance", module: "ATTENDANCE", exact: true },
      { label: "Leaves", icon: CalendarX, href: "/dashboard/leaves", module: "LEAVES" },
      { label: "Staff Performance", icon: Users, href: "/dashboard/reports/staff-performance", module: "STAFF_PERFORMANCE" },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Reports", icon: BarChart3, href: "/dashboard/reports", module: "REPORTS", exact: true },
      { label: "Tally Export", icon: FileSpreadsheet, href: "/dashboard/tally-export", module: "TALLY_EXPORT" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Roles & Permissions", icon: Shield, href: "/dashboard/settings/roles", ownerOnly: true },
      { label: "Garage Users", icon: UserCog, href: "/dashboard/settings/users", module: "STAFF" },
      { label: "Activity Logs", icon: ScrollText, href: "/dashboard/settings/logs", ownerOnly: true },
      { label: "Garage Settings", icon: Settings, href: "/dashboard/settings", module: "SETTINGS", exact: true },
      { label: "Refer & Earn", icon: Share2, href: "/dashboard/refer" },
    ],
  },
];

const superAdminSection: Section = {
  title: "Super Admin",
  items: [
    { label: "Garages", icon: Building2, href: "/dashboard/super-admin/garages" },
    { label: "Garage Requests", icon: ClipboardList, href: "/dashboard/super-admin/garage-requests" },
    { label: "Brand Requests", icon: Car, href: "/dashboard/super-admin/brand-requests" },
  ],
};

function isItemActive(href: string, pathname: string, exact?: boolean) {
  if (href === "/dashboard" || exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar } =
    useSidebar();

  const staffMode = isGarageStaff();
  const owner = isGarageOwner() || isSuperAdmin();

  const rawSections: Section[] =
    user?.role === "super_admin"
      ? [baseSections[0], superAdminSection]
      : baseSections;

  const sections: Section[] = rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.ownerOnly && !owner) return false;
        if (item.staffOnly && !staffMode) return false;
        if (staffMode && item.module && !canView(item.module)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const showFull = isExpanded || isHovered || isMobileOpen;

  const titledSectionCount = sections.filter((s) => s.title).length;
  const showSectionHeaders = titledSectionCount > 1;

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of sections) {
      if (!section.title) continue;
      for (const item of section.items) {
        if (isItemActive(item.href, pathname, item.exact)) {
          initial.add(section.title);
          break;
        }
      }
    }
    return initial;
  });

  useEffect(() => {
    for (const section of sections) {
      if (!section.title) continue;
      for (const item of section.items) {
        if (isItemActive(item.href, pathname, item.exact)) {
          setOpenSections((prev) => {
            if (prev.has(section.title)) return prev;
            const next = new Set(prev);
            next.add(section.title);
            return next;
          });
          break;
        }
      }
    }
  }, [pathname]);

  function toggleSection(title: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function handleLogout() {
    clearUser();
    router.replace("/login");
  }

  const roleLabel = user?.role === "super_admin" ? "Super Admin" : user?.role === "garage_admin" ? "Owner" : user?.staffTitle || "Staff";

  return (
    <motion.aside
      initial={false}
      animate={{ width: showFull ? 272 : 78 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`sidebar-root fixed top-0 left-0 flex flex-col h-full z-50 overflow-visible select-none
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Gradient background (top-to-bottom brand gradient) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, var(--sb-grad-start) 0%, var(--sb-grad-mid) 45%, var(--sb-grad-end) 100%)",
        }}
      />

      {/* ── Mesh gradient overlay for depth ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 80% 5%, var(--sb-mesh-1) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 10% 95%, var(--sb-mesh-2) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 100% 50%, var(--sb-mesh-3) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Grain texture ── */}
      <div className="grain absolute inset-0 pointer-events-none" />

      {/* ── Right edge border ── */}
      <div
        className="absolute top-0 right-0 w-px h-full"
        style={{
          background: "linear-gradient(180deg, var(--sb-border) 0%, var(--sb-border-strong) 50%, var(--sb-border) 100%)",
        }}
      />

      {/* ── Collapse toggle ── */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={toggleSidebar}
        className="absolute top-6 -right-3 z-50 w-6 h-6 hidden xl:flex items-center justify-center rounded-full cursor-pointer border border-[var(--border-color)] bg-[var(--surface-bg)] shadow-md hover:shadow-lg hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-200"
      >
        <motion.div
          animate={{ rotate: showFull ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="h-3 w-3 text-[var(--text-sec)]" />
        </motion.div>
      </motion.button>

      {/* ═══════════════════════════════════════
         BRAND / LOGO
         ═══════════════════════════════════════ */}
      <div
        className={`relative z-10 flex items-center shrink-0 ${showFull ? "h-16 gap-3 px-5" : "h-16 justify-center"}`}
      >
        <motion.div
          whileHover={{ rotate: -12, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="relative w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
            boxShadow: "0 0 20px var(--sb-glow), 0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Wrench className="w-[18px] h-[18px] text-white" />
          {/* Shine highlight */}
          <div className="absolute inset-0 rounded-[14px] overflow-hidden pointer-events-none">
            <div
              className="absolute -top-1 -left-1 w-6 h-6 rounded-full"
              style={{ background: "rgba(255,255,255,0.25)", filter: "blur(5px)" }}
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {showFull && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col min-w-0"
            >
              <span
                className="text-[15px] font-bold tracking-tight whitespace-nowrap leading-tight"
                style={{ color: "var(--sb-text-primary)" }}
              >
                Car Affair
              </span>
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.25em] whitespace-nowrap"
                style={{ color: "var(--sb-text-muted)" }}
              >
                Garrage
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand separator */}
      <div className="relative z-10 mx-4 h-px" style={{ background: "var(--sb-border)" }} />

      {/* ═══════════════════════════════════════
         CREATE JOB CARD — CTA
         ═══════════════════════════════════════ */}
      {user?.role !== "super_admin" && (!staffMode || canManage("ORDERS")) && (
        <div className="relative z-10 px-3 pt-4 pb-1 shrink-0">
          <Link href="/dashboard/create-order">
            <motion.div
              whileHover={{ scale: 1.025, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={`sidebar-cta-btn relative flex items-center text-white cursor-pointer overflow-hidden
                ${showFull ? "gap-3 px-4 h-11 rounded-[14px]" : "justify-center h-11 rounded-[14px]"}`}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)",
                boxShadow: "0 0 24px var(--sb-glow), 0 4px 12px rgba(0,0,0,0.12)",
              }}
            >
              {/* Shimmer sweep */}
              <div className="sidebar-cta-shimmer absolute inset-0 pointer-events-none" />

              <div
                className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <Plus className="w-4 h-4" />
              </div>
              <AnimatePresence>
                {showFull && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="relative z-10 flex items-center gap-2"
                  >
                    <span className="text-[13px] font-semibold whitespace-nowrap">
                      New Job Card
                    </span>
                    <Zap className="w-3 h-3 text-yellow-300/80" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════
         NAVIGATION
         ═══════════════════════════════════════ */}
      <nav
        className={`relative z-10 flex-1 py-3 ${showFull ? "px-3 overflow-y-auto" : "px-2 overflow-visible"}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map((section, si) => (
          <div key={si}>
            {/* ── Section header / divider ── */}
            {si > 0 && section.title && (
              showSectionHeaders && showFull ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="sidebar-section-btn w-full mt-5 mb-1 flex items-center justify-between px-3 py-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="sidebar-section-dot w-1 h-3 rounded-full transition-colors duration-200"
                    />
                    <span
                      className="sidebar-section-label text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-200"
                    >
                      {section.title}
                    </span>
                  </div>
                  <motion.span
                    animate={{ rotate: openSections.has(section.title) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="sidebar-section-chevron w-3 h-3 transition-colors duration-200" />
                  </motion.span>
                </button>
              ) : showFull ? (
                <div className="my-3 mx-3 h-px" style={{ background: "var(--sb-border)" }} />
              ) : (
                <div className="my-2.5 flex justify-center">
                  <div className="w-5 h-px" style={{ background: "var(--sb-border)" }} />
                </div>
              )
            )}

            {/* ── Section items ── */}
            <AnimatePresence initial={false}>
              {(!showSectionHeaders || !section.title || !showFull || openSections.has(section.title)) && (
                <motion.div
                  initial={showSectionHeaders && section.title && showFull ? { height: 0, opacity: 0 } : false}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={showSectionHeaders && section.title && showFull ? { height: 0, opacity: 0 } : undefined}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const isActive = isItemActive(item.href, pathname, item.exact);
                      return (
                        <Link key={item.href} href={item.href} title={!showFull ? item.label : undefined}>
                          <motion.div
                            whileTap={{ scale: 0.97 }}
                            className={`sidebar-nav-item relative flex items-center transition-all duration-150 group
                              ${showFull ? "gap-3 px-3 py-2 rounded-[12px]" : "justify-center py-2 rounded-[12px]"}`}
                            style={{
                              background: isActive ? "var(--sb-active-bg)" : "transparent",
                              boxShadow: isActive
                                ? "inset 0 0 0 1px var(--sb-active-border), 0 0 12px var(--sb-active-bg)"
                                : "none",
                            }}
                          >
                            {/* Left active bar */}
                            {isActive && (
                              <motion.div
                                layoutId="sidebar-active-bar"
                                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                                style={{
                                  height: 20,
                                  background: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
                                  boxShadow: "0 0 10px var(--sb-glow)",
                                }}
                              />
                            )}

                            {/* Icon container */}
                            <div
                              className={`sidebar-nav-icon shrink-0 flex items-center justify-center rounded-[10px] transition-all duration-200
                                ${showFull ? "w-8 h-8" : "w-9 h-9"}`}
                              style={{
                                background: isActive ? "var(--sb-icon-bg-hover)" : "var(--sb-icon-bg)",
                              }}
                            >
                              <item.icon
                                className="w-[16px] h-[16px] transition-colors duration-200"
                                style={{
                                  color: isActive ? "#ef4444" : "var(--sb-text-secondary)",
                                }}
                              />
                            </div>

                            {/* Label */}
                            <AnimatePresence>
                              {showFull && (
                                <motion.span
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-[13px] whitespace-nowrap"
                                  style={{
                                    color: isActive ? "var(--sb-text-primary)" : "var(--sb-text-secondary)",
                                    fontWeight: isActive ? 600 : 500,
                                  }}
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {/* Active badge dot */}
                            {isActive && showFull && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  background: "#ef4444",
                                  boxShadow: "0 0 6px rgba(239,68,68,0.5)",
                                }}
                              />
                            )}

                            {/* Collapsed tooltip */}
                            {!showFull && (
                              <div
                                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 whitespace-nowrap z-50 border shadow-xl"
                                style={{
                                  background: "var(--surface-bg)",
                                  borderColor: "var(--border-color)",
                                  color: "var(--surface-fg)",
                                }}
                              >
                                <span className="text-xs font-medium">{item.label}</span>
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-2 h-2 rotate-45 border-l border-b"
                                  style={{
                                    background: "var(--surface-bg)",
                                    borderColor: "var(--border-color)",
                                  }}
                                />
                              </div>
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* ═══════════════════════════════════════
         USER PROFILE + LOGOUT
         ═══════════════════════════════════════ */}
      <div className="relative z-10 shrink-0">
        {/* Separator */}
        <div className="mx-4 h-px" style={{ background: "var(--sb-border)" }} />

        {/* User row */}
        <div
          className={`flex items-center py-3 ${showFull ? "px-4 gap-3" : "justify-center px-2"}`}
        >
          {/* Avatar */}
          <div
            className="relative w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              boxShadow: "0 0 12px var(--sb-glow), 0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <span className="text-[12px] font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
            {/* Online status dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{
                background: "#22c55e",
                borderColor: "var(--sb-grad-end)",
                boxShadow: "0 0 6px rgba(34,197,94,0.4)",
              }}
            />
          </div>

          <AnimatePresence>
            {showFull && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[12px] font-semibold truncate" style={{ color: "var(--sb-text-primary)" }}>
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--sb-text-muted)" }}>
                  {roleLabel}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout button (expanded) */}
          <AnimatePresence>
            {showFull && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="sidebar-logout-btn w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer"
                style={{ background: "var(--sb-icon-bg)" }}
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" style={{ color: "var(--sb-text-secondary)" }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsed: separate logout */}
        {!showFull && (
          <div className="px-2 pb-2">
            <button
              onClick={handleLogout}
              title="Logout"
              className="sidebar-logout-btn group relative w-full flex items-center justify-center py-2 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" style={{ color: "var(--sb-text-secondary)" }} />
              {/* Tooltip */}
              <div
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 whitespace-nowrap z-50 border shadow-xl"
                style={{
                  background: "var(--surface-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--surface-fg)",
                }}
              >
                <span className="text-xs font-medium">Logout</span>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-2 h-2 rotate-45 border-l border-b"
                  style={{ background: "var(--surface-bg)", borderColor: "var(--border-color)" }}
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
