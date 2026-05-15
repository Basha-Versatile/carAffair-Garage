"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearUser, getUser } from "@/lib/auth";
import {
  LayoutDashboard, ClipboardList, BookOpen, Users, Truck, Search, Car,
  Settings, Clock, Star, Bell, BarChart3, FileSpreadsheet, CalendarX,
  Share2, LogOut, Wrench, Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = { label: string; icon: LucideIcon; href: string };
type Section = { title: string; items: MenuItem[] };

const baseSections: Section[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Inventory", icon: ClipboardList, href: "/dashboard/inventory" },
      { label: "Accounts", icon: BookOpen, href: "/dashboard/accounts" },
      { label: "Order Search", icon: Search, href: "/dashboard/order-search" },
      { label: "Cancelled Orders", icon: CalendarX, href: "/dashboard/cancelled-orders" },
    ],
  },
  {
    title: "Contacts",
    items: [
      { label: "My Customers", icon: Users, href: "/dashboard/customers" },
      { label: "My Vendors", icon: Truck, href: "/dashboard/vendors" },
      { label: "Vehicle Search", icon: Car, href: "/dashboard/vehicle-search" },
    ],
  },
  {
    title: "Services",
    items: [
      { label: "Service Reminders", icon: Clock, href: "/dashboard/service-reminders" },
      { label: "Service Feedbacks", icon: Star, href: "/dashboard/service-feedbacks" },
      { label: "Insurance Due", icon: Bell, href: "/dashboard/insurance-due" },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
      { label: "Tally Export", icon: FileSpreadsheet, href: "/dashboard/tally-export" },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Garage Settings", icon: Settings, href: "/dashboard/settings" },
      { label: "Refer & Earn", icon: Share2, href: "/dashboard/refer" },
    ],
  },
];

const superAdminSection: Section = {
  title: "Super Admin",
  items: [
    { label: "Garages", icon: Building2, href: "/dashboard/super-admin/garages" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const sections: Section[] = user?.role === "super_admin"
    ? [baseSections[0], superAdminSection]
    : baseSections;

  function handleLogout() {
    clearUser();
    router.replace("/login");
  }

  return (
    <aside className="w-[240px] bg-background border-r border-edge flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-edge">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-foreground tracking-tight">
          Car Affair
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5">
        {sections.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            {section.title && (
              <div className="mt-4 mb-1.5 px-3 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {section.title}
                </span>
                <div className="flex-1 h-px bg-edge-light" />
              </div>
            )}

            {/* Section items */}
            {section.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-1.75 rounded-md text-[13px] mb-0.5 transition-all duration-150 ${
                    isActive
                      ? "bg-primary-light text-primary font-medium"
                      : "text-secondary hover:bg-hover hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-edge p-2.5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-1.75 rounded-md text-[13px] text-bad hover:bg-bad-light w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
