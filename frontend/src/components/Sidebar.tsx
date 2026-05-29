"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearUser, getUser, isGarageStaff, isGarageOwner, isSuperAdmin, canView } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Users,
  Truck,
  Search,
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = { label: string; icon: LucideIcon; href: string; module?: string; ownerOnly?: boolean; staffOnly?: boolean; exact?: boolean };
type Section = { title: string; items: MenuItem[] };

const baseSections: Section[] = [
  {
    title: "",
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", module: "DASHBOARD" }],
  },
  {
    title: "Operations",
    items: [
      { label: "My Tasks", icon: ClipboardList, href: "/dashboard/my-tasks", module: "ORDERS", staffOnly: true },
      { label: "Invoices", icon: FileSpreadsheet, href: "/dashboard/invoices", module: "INVOICES" },
      { label: "Inventory", icon: ClipboardList, href: "/dashboard/inventory", module: "INVENTORY" },
      { label: "Accounts", icon: BookOpen, href: "/dashboard/accounts", module: "ACCOUNTS" },
      { label: "Order Search", icon: Search, href: "/dashboard/order-search", module: "ORDERS" },
      { label: "Cancelled Orders", icon: CalendarX, href: "/dashboard/cancelled-orders", module: "ORDERS" },
    ],
  },
  {
    title: "Contacts",
    items: [
      { label: "My Customers", icon: Users, href: "/dashboard/customers", module: "CUSTOMERS" },
      { label: "My Vendors", icon: Truck, href: "/dashboard/vendors", module: "VENDORS" },
      { label: "Vehicle Search", icon: Car, href: "/dashboard/vehicle-search", module: "VEHICLES" },
    ],
  },
  {
    title: "Services",
    items: [
      { label: "Appointments", icon: Calendar, href: "/dashboard/appointments", module: "APPOINTMENTS" },
      { label: "Service Reminders", icon: Clock, href: "/dashboard/service-reminders", module: "REMINDERS" },
      { label: "Service Feedbacks", icon: Star, href: "/dashboard/service-feedbacks", module: "REMINDERS" },
      { label: "Insurance Due", icon: Bell, href: "/dashboard/insurance-due", module: "REMINDERS" },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Reports", icon: BarChart3, href: "/dashboard/reports", module: "REPORTS" },
      { label: "Tally Export", icon: FileSpreadsheet, href: "/dashboard/tally-export", module: "REPORTS" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Roles & Permissions", icon: Shield, href: "/dashboard/settings/roles", ownerOnly: true },
      { label: "Garage Users", icon: UserCog, href: "/dashboard/settings/users", ownerOnly: true },
      { label: "Activity Logs", icon: ScrollText, href: "/dashboard/settings/logs", ownerOnly: true },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Garage Settings", icon: Settings, href: "/dashboard/settings", module: "SETTINGS", exact: true },
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
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();

  const staffMode = isGarageStaff();
  const owner = isGarageOwner() || isSuperAdmin();

  const rawSections: Section[] =
    user?.role === "super_admin"
      ? [baseSections[0], superAdminSection]
      : baseSections;

  // Filter items: ownerOnly items hidden from non-owners, staffOnly hidden from non-staff, module items hidden from unpermitted staff
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

  function handleLogout() {
    clearUser();
    router.replace("/login");
  }

  return (
    <aside
      className={`fixed top-0 left-0 flex flex-col h-full z-50 border-r
        bg-white dark:bg-gray-900 dark:border-gray-800 border-gray-200
        transition-all duration-300 ease-in-out
        ${showFull ? "w-[240px]" : "w-[72px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand */}
      <div
        className={`h-14 flex items-center gap-2.5 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0 ${
          !showFull ? "justify-center" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        {showFull && (
          <span className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
            Car Affair - Garrage
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 no-scrollbar">
        {sections.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            {section.title && (
              <div
                className={`mt-4 mb-1.5 flex items-center gap-2 ${
                  showFull ? "px-3" : "justify-center"
                }`}
              >
                {showFull ? (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {section.title}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </>
                ) : (
                  <div className="w-5 h-px bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            )}

            {/* Section items */}
            {section.items.map((item) => {
              const isActive =
                item.href === "/dashboard" || item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!showFull ? item.label : undefined}
                  className={`menu-item group mb-0.5 ${
                    isActive ? "menu-item-active" : "menu-item-inactive"
                  } ${!showFull ? "justify-center px-0" : ""}`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  />
                  {showFull && (
                    <span className="text-[13px] whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2 shrink-0">
        <button
          onClick={handleLogout}
          title={!showFull ? "Logout" : undefined}
          className={`menu-item text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 w-full ${
            !showFull ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {showFull && <span className="text-[13px]">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
