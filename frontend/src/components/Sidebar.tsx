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
  Plus,
  Package,
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
type Section = { title: string; icon?: LucideIcon; items: MenuItem[] };

const baseSections: Section[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        module: "DASHBOARD",
      },
    ],
  },
  {
    title: "Workshop",
    icon: Briefcase,
    items: [
      {
        label: "Orders",
        icon: Briefcase,
        href: "/dashboard/orders",
        module: "ORDERS",
      },
      {
        label: "Vehicles",
        icon: Car,
        href: "/dashboard/vehicle-search",
        module: "VEHICLES",
      },
      {
        label: "Invoices",
        icon: FileSpreadsheet,
        href: "/dashboard/invoices",
        module: "INVOICES",
      },
      {
        label: "My Tasks",
        icon: ClipboardList,
        href: "/dashboard/my-tasks",
        module: "ORDERS",
        staffOnly: true,
      },
      {
        label: "Cancelled Orders",
        icon: CalendarX,
        href: "/dashboard/cancelled-orders",
        module: "ORDERS",
      },
    ],
  },
  {
    title: "Contacts",
    icon: Users,
    items: [
      {
        label: "Customers",
        icon: Users,
        href: "/dashboard/customers",
        module: "CUSTOMERS",
      },
      {
        label: "Vendors",
        icon: Truck,
        href: "/dashboard/vendors",
        module: "VENDORS",
      },
    ],
  },
  {
    title: "Stock & Finance",
    icon: Package,
    items: [
      {
        label: "Inventory",
        icon: ClipboardList,
        href: "/dashboard/inventory",
        module: "INVENTORY",
      },
      {
        label: "Accounts",
        icon: BookOpen,
        href: "/dashboard/accounts",
        module: "ACCOUNTS",
      },
    ],
  },
  {
    title: "Scheduling",
    icon: Calendar,
    items: [
      {
        label: "Appointments",
        icon: Calendar,
        href: "/dashboard/appointments",
        module: "APPOINTMENTS",
      },
      {
        label: "Service Reminders",
        icon: Clock,
        href: "/dashboard/service-reminders",
        module: "SERVICE_REMINDERS",
      },
      {
        label: "Service Feedbacks",
        icon: Star,
        href: "/dashboard/service-feedbacks",
        module: "SERVICE_FEEDBACKS",
      },
      {
        label: "Insurance Due",
        icon: Bell,
        href: "/dashboard/insurance-due",
        module: "INSURANCE_DUE",
      },
    ],
  },
  {
    title: "Staff",
    icon: UserCog,
    items: [
      {
        label: "Check In",
        icon: Clock,
        href: "/dashboard/attendance/checkin",
        staffOnly: true,
      },
      {
        label: "Attendance",
        icon: Calendar,
        href: "/dashboard/attendance",
        module: "ATTENDANCE",
        exact: true,
      },
      {
        label: "Leaves",
        icon: CalendarX,
        href: "/dashboard/leaves",
        module: "LEAVES",
      },
      {
        label: "Staff Performance",
        icon: Users,
        href: "/dashboard/reports/staff-performance",
        module: "STAFF_PERFORMANCE",
      },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [
      {
        label: "Reports",
        icon: BarChart3,
        href: "/dashboard/reports",
        module: "REPORTS",
        exact: true,
      },
      {
        label: "Tally Export",
        icon: FileSpreadsheet,
        href: "/dashboard/tally-export",
        module: "TALLY_EXPORT",
      },
    ],
  },
  {
    title: "Administration",
    icon: Settings,
    items: [
      {
        label: "Roles & Permissions",
        icon: Shield,
        href: "/dashboard/settings/roles",
        ownerOnly: true,
      },
      {
        label: "Garage Users",
        icon: UserCog,
        href: "/dashboard/settings/users",
        module: "STAFF",
      },
      {
        label: "Activity Logs",
        icon: ScrollText,
        href: "/dashboard/settings/logs",
        ownerOnly: true,
      },
      {
        label: "Garage Settings",
        icon: Settings,
        href: "/dashboard/settings",
        module: "SETTINGS",
        exact: true,
      },
      { label: "Refer & Earn", icon: Share2, href: "/dashboard/refer" },
    ],
  },
];

const superAdminSection: Section = {
  title: "Super Admin",
  icon: Building2,
  items: [
    {
      label: "Garages",
      icon: Building2,
      href: "/dashboard/super-admin/garages",
    },
    {
      label: "Garage Requests",
      icon: ClipboardList,
      href: "/dashboard/super-admin/garage-requests",
    },
    {
      label: "Brand Requests",
      icon: Car,
      href: "/dashboard/super-admin/brand-requests",
    },
  ],
};

function isItemActive(href: string, pathname: string, exact?: boolean) {
  if (href === "/dashboard" || exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function isSectionActive(section: Section, pathname: string) {
  return section.items.some((item) =>
    isItemActive(item.href, pathname, item.exact),
  );
}

function FilledIcon({
  icon: Icon,
  size = 18,
  color,
  active,
}: {
  icon: LucideIcon;
  size?: number;
  color: string;
  active?: boolean;
}) {
  return (
    <Icon
      style={{
        width: size,
        height: size,
        color,
        fill: color,
        fillOpacity: active ? 0.2 : 0.15,
      }}
      strokeWidth={2}
    />
  );
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

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of sections) {
      if (!section.title) continue;
      if (isSectionActive(section, pathname)) {
        initial.add(section.title);
      }
    }
    return initial;
  });

  useEffect(() => {
    for (const section of sections) {
      if (!section.title) continue;
      if (isSectionActive(section, pathname)) {
        setOpenSections((prev) => {
          if (prev.has(section.title)) return prev;
          const next = new Set(prev);
          next.add(section.title);
          return next;
        });
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

  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "garage_admin"
        ? "Owner"
        : user?.roleName || user?.staffTitle || "Staff";

  return (
    <motion.aside
      initial={false}
      animate={{ width: showFull ? 272 : 78 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 flex flex-col h-full z-50 overflow-visible select-none bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Collapse toggle ── */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={toggleSidebar}
        className="absolute top-6 -right-3 z-50 w-6 h-6 hidden xl:flex items-center justify-center rounded-full cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <motion.div
          animate={{ rotate: showFull ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="h-3 w-3 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* ═══ LOGO ═══ */}
      <div
        className={`flex items-center shrink-0 ${showFull ? "h-16 gap-3 px-5" : "h-16 justify-center"}`}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
        >
          <Wrench className="w-[17px] h-[17px] text-white" />
        </div>
        <AnimatePresence>
          {showFull && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-[15px] font-bold tracking-tight whitespace-nowrap text-gray-900 dark:text-white">
                Car Affair
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Garrage
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-gray-100 dark:bg-gray-800" />

      {/* ═══ CTA ═══ */}
      {user?.role !== "super_admin" && (!staffMode || canManage("ORDERS")) && (
        <div
          className={`px-3 pt-3 pb-1 shrink-0 ${showFull ? "" : "flex justify-center"}`}
        >
          <Link href="/dashboard/create-order">
            <div
              className={`flex items-center text-white rounded-xl transition-all hover:opacity-90
                ${showFull ? "gap-2.5 px-4 h-10" : "justify-center w-11 h-10"}`}
              style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
              }}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <AnimatePresence>
                {showFull && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[13px] font-semibold whitespace-nowrap overflow-hidden"
                  >
                    New Job Card
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
        </div>
      )}

      {/* ═══ NAVIGATION ═══ */}
      <nav
        className={`flex-1 py-3 overflow-y-auto ${showFull ? "px-3" : "px-2"}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* MENU label */}
        <AnimatePresence>
          {showFull && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-400"
            >
              Menu
            </motion.p>
          )}
        </AnimatePresence>

        {sections.map((section) => {
          const isOpen = openSections.has(section.title);
          const sectionIsActive = isSectionActive(section, pathname);
          const SectionIcon = section.icon;

          // Dashboard (no title) — standalone row with filled icon
          if (!section.title) {
            return section.items.map((item) => {
              const active = isItemActive(item.href, pathname, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!showFull ? item.label : undefined}
                >
                  <div
                    className={`group relative flex items-center rounded-xl mb-2 transition-all duration-200
                      ${showFull ? "gap-3 px-3 py-2.5" : "justify-center py-2.5"}
                      ${active ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                  >
                    <div
                      className={`shrink-0 flex items-center justify-center rounded-lg
                        ${showFull ? "w-8 h-8" : "w-9 h-9"}`}
                      style={{
                        background: active
                          ? "linear-gradient(135deg, #6366f1, #818cf8)"
                          : "transparent",
                      }}
                    >
                      <item.icon
                        className="w-[18px] h-[18px]"
                        style={{
                          color: active ? "#ffffff" : "#334155",
                          fill: active ? "#ffffff" : "#334155",
                          fillOpacity: active ? 1 : 0.15,
                          strokeWidth: 2,
                        }}
                      />
                    </div>
                    <AnimatePresence>
                      {showFull && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[14px] whitespace-nowrap"
                          style={{
                            color: active ? "#6366f1" : "#1e293b",
                            fontWeight: active ? 700 : 800,
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {/* Collapsed tooltip */}
                    {!showFull && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border shadow-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        <span className="text-xs font-medium">
                          {item.label}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            });
          }

          // Sections with title — collapsible with filled icons
          return (
            <div key={section.title} className="mt-1.5">
              {/* Section header row */}
              {showFull ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    sectionIsActive
                      ? "hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {SectionIcon && (
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                      <FilledIcon
                        icon={SectionIcon}
                        size={20}
                        color={sectionIsActive ? "#6366f1" : "#334155"}
                        active={sectionIsActive}
                      />
                    </div>
                  )}
                  <span
                    className="flex-1 text-left text-[14px]"
                    style={{
                      color: sectionIsActive ? "#0f172a" : "#1e293b",
                      fontWeight: sectionIsActive ? 600 : 500,
                    }}
                  >
                    {section.title}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown
                      className="w-4 h-4"
                      style={{ color: sectionIsActive ? "#6366f1" : "#475569" }}
                    />
                  </motion.div>
                </button>
              ) : (
                // Collapsed: show section icon only
                <div className="relative group flex justify-center py-2">
                  {SectionIcon && (
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                        sectionIsActive
                          ? "bg-indigo-50 dark:bg-indigo-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() => {
                        if (section.items[0])
                          router.push(section.items[0].href);
                      }}
                    >
                      <FilledIcon
                        icon={SectionIcon}
                        size={18}
                        color={sectionIsActive ? "#6366f1" : "#334155"}
                        active={sectionIsActive}
                      />
                    </div>
                  )}
                  {/* Collapsed tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border shadow-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <span className="text-xs font-medium">{section.title}</span>
                  </div>
                </div>
              )}

              {/* Child items — plain text, indented, no border line */}
              <AnimatePresence initial={false}>
                {showFull && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-8 py-1">
                      {section.items.map((item) => {
                        const active = isItemActive(
                          item.href,
                          pathname,
                          item.exact,
                        );
                        return (
                          <Link key={item.href} href={item.href}>
                            <div
                              className={`py-2.5 px-4 rounded-lg transition-all duration-150 cursor-pointer ${
                                active
                                  ? "bg-indigo-50 dark:bg-indigo-500/10"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }`}
                            >
                              <span
                                className="text-[13.5px]"
                                style={{
                                  color: active ? "#6366f1" : "#334155",
                                  fontWeight: active ? 600 : 400,
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ═══ USER + LOGOUT ═══ */}
      <div className="shrink-0">
        <div className="mx-4 h-px bg-gray-100 dark:bg-gray-800" />
        <div
          className={`flex items-center py-3 ${showFull ? "px-4 gap-3" : "justify-center px-2"}`}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
          >
            <span className="text-[12px] font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
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
                <p className="text-[12px] font-semibold truncate text-gray-900 dark:text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] truncate text-gray-400">
                  {roleLabel}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showFull && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {!showFull && (
          <div className="px-2 pb-2">
            <button
              onClick={handleLogout}
              title="Logout"
              className="group relative w-full flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border shadow-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                <span className="text-xs font-medium">Logout</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
