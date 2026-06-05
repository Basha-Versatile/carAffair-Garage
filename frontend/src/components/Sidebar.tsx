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
        module: "REMINDERS",
      },
      {
        label: "Service Feedbacks",
        icon: Star,
        href: "/dashboard/service-feedbacks",
        module: "REMINDERS",
      },
      {
        label: "Insurance Due",
        icon: Bell,
        href: "/dashboard/insurance-due",
        module: "REMINDERS",
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        label: "Reports",
        icon: BarChart3,
        href: "/dashboard/reports",
        module: "REPORTS",
      },
      {
        label: "Tally Export",
        icon: FileSpreadsheet,
        href: "/dashboard/tally-export",
        module: "REPORTS",
      },
    ],
  },
  {
    title: "Administration",
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
        ownerOnly: true,
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

  // Show section headers only when user has items across multiple titled sections
  const titledSectionCount = sections.filter((s) => s.title).length;
  const showSectionHeaders = titledSectionCount > 1;

  // Collapsible sections — default open: section containing active route
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

  // Keep active section open when route changes
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: showFull ? 280 : 84 }}
      transition={{ duration: 0.3, ease: "easeInOut" as const }}
      className={`fixed top-0 left-0 flex flex-col h-full z-50 overflow-visible
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--surface-bg)]" />
      <div className="absolute inset-0 border-r border-[var(--border-color)]" />

      {/* Decorative glow orbs */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-red-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Collapse toggle button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleSidebar}
        className="absolute top-5 -right-3.5 z-50 w-7 h-7 hidden xl:flex items-center justify-center rounded-full bg-[var(--surface-bg)] border border-[var(--border-color)] text-[var(--text-tertiary)] hover:bg-red-600 hover:border-red-600 hover:text-white shadow-md transition-all duration-200 cursor-pointer"
      >
        {showFull ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </motion.button>

      {/* Brand */}
      <div
        className={`relative z-10 h-14 flex items-center gap-2.5 px-4 border-b border-[var(--border-color)] shrink-0 ${
          !showFull ? "justify-center" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {showFull && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-[15px] font-semibold text-[var(--surface-fg)] tracking-tight whitespace-nowrap"
            >
              Car Affair - Garrage
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Create Repair Order button */}
      {user?.role !== "super_admin" && (!staffMode || canView("ORDERS")) && (
        <div className="relative z-10 px-3 pt-3 pb-2 shrink-0">
          <Link href="/dashboard/create-order">
            <motion.div
              whileHover={{ x: showFull ? 3 : 0 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow-lg shadow-red-600/20 transition-all cursor-pointer h-[46px]
                ${showFull ? "px-3" : "justify-center"}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/15">
                <Plus className="w-5 h-5" />
              </div>
              <AnimatePresence>
                {showFull && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                  >
                    Create Repair Order
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={`relative z-10 flex-1 py-3 px-3 ${showFull ? "overflow-y-auto" : "overflow-visible"}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map((section, si) => (
          <div key={si}>
            {/* Section header or separator */}
            {si > 0 && section.title && (
              showSectionHeaders && showFull ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full mt-5 mb-2 flex items-center justify-between px-3 py-1.5 group cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {section.title}
                  </span>
                  <motion.span
                    animate={{ rotate: openSections.has(section.title) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-red-500 transition-colors" />
                  </motion.span>
                </button>
              ) : showFull ? (
                <div className="my-2.5 mx-3">
                  <div className="h-px bg-[var(--border-color)]" />
                </div>
              ) : (
                <div className="my-2 flex justify-center">
                  <div className="w-6 h-px bg-[var(--border-color)]" />
                </div>
              )
            )}

            {/* Section items */}
            <AnimatePresence initial={false}>
              {(!showSectionHeaders || !section.title || !showFull || openSections.has(section.title)) && (
                <motion.div
                  initial={showSectionHeaders && section.title && showFull ? { height: 0, opacity: 0 } : false}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={showSectionHeaders && section.title && showFull ? { height: 0, opacity: 0 } : undefined}
                  transition={{ duration: 0.25, ease: "easeInOut" as const }}
                  className="overflow-hidden"
                >
            <div className="flex flex-col gap-2.5">
              {section.items.map((item) => {
                const isActive = isItemActive(item.href, pathname, item.exact);
                return (
                  <Link key={item.href} href={item.href} title={!showFull ? item.label : undefined}>
                    <motion.div
                      whileHover={{ x: showFull ? 3 : 0 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-3.5 transition-all duration-200 group relative
                        ${showFull ? "px-3 py-3 h-[46px] rounded-xl overflow-hidden" : "justify-center h-[46px] w-full rounded-xl"}
                        ${isActive
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                          : "text-[var(--text-sec)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-100" />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-red-500/20 transition-all duration-200" />
                      )}

                      <div className="relative z-10 flex items-center gap-3.5 w-full">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                            ${isActive ? "bg-white/15" : "bg-[var(--bg-tertiary)] group-hover:bg-red-100 dark:group-hover:bg-red-500/15"}`}
                        >
                          <item.icon
                            className={`w-5 h-5 transition-colors duration-200
                              ${isActive ? "text-white" : "text-[var(--text-mut)] group-hover:text-red-600 dark:group-hover:text-red-400"}`}
                          />
                        </div>
                        <AnimatePresence>
                          {showFull && (
                            <motion.span
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              className={`text-sm whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      {!showFull && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 whitespace-nowrap z-50">
                          <span className="text-xs font-medium text-[var(--surface-fg)]">{item.label}</span>
                          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45 bg-[var(--surface-bg)] border-l border-b border-[var(--border-color)]" />
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

      {/* Logout */}
      <div className="relative z-10 border-t border-[var(--border-color)] p-3 shrink-0">
        <button
          onClick={handleLogout}
          title={!showFull ? "Logout" : undefined}
          className={`group relative w-full flex items-center gap-3.5 transition-all duration-200 cursor-pointer text-[var(--text-sec)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10
            ${showFull ? "px-3 py-3 h-[46px] rounded-xl" : "justify-center h-[46px] rounded-xl"}`}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] group-hover:bg-red-100 dark:group-hover:bg-red-500/15 transition-colors">
            <LogOut className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {showFull && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {/* Tooltip on collapsed */}
          {!showFull && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 whitespace-nowrap z-50">
              <span className="text-xs font-medium text-[var(--surface-fg)]">
                Logout
              </span>
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45 bg-[var(--surface-bg)] border-l border-b border-[var(--border-color)]" />
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
