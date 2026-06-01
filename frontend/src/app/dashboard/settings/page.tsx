"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isGarageOwner, isSuperAdmin } from "@/lib/auth";
import {
  Building2,
  Users,
  Wrench,
  Package,
  Tags,
  ClipboardList,
  CalendarSync,
  SlidersHorizontal,
  ShieldCheck,
  Globe,
  PhoneCall,
  FileText,
  CreditCard,
  ShieldX,
  Shield,
  ScrollText,
  Layers,
  X,
} from "lucide-react";

interface SettingCard {
  label: string;
  icon: typeof Building2;
  iconBg: string;
  iconColor: string;
  href?: string;
  fullWidth?: boolean;
  restricted?: boolean;
  ownerOnly?: boolean;
}

const GARAGE_SETTINGS: SettingCard[] = [
  {
    label: "My Garage Profile",
    icon: Building2,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/settings/garage-profile",
    restricted: true,
  },
  {
    label: "Garage Users",
    icon: Users,
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
    href: "/dashboard/settings/users",
    ownerOnly: true,
  },
  {
    label: "Roles & Permissions",
    icon: Shield,
    iconBg: "bg-warn-light",
    iconColor: "text-warn",
    href: "/dashboard/settings/roles",
    ownerOnly: true,
  },
  {
    label: "Activity Logs",
    icon: ScrollText,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/settings/logs",
    ownerOnly: true,
  },
  {
    label: "Departments",
    icon: Layers,
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
    href: "/dashboard/settings/departments",
    ownerOnly: true,
  },
  {
    label: "Service & Parts Master",
    icon: Wrench,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    href: "/dashboard/settings/service-parts",
  },
  {
    label: "My Service Packages",
    icon: Package,
    iconBg: "bg-warn-light",
    iconColor: "text-warn",
    href: "/dashboard/settings/service-packages",
  },
  {
    label: "Tags Management",
    icon: Tags,
    iconBg: "bg-bad-light",
    iconColor: "text-bad",
    href: "/dashboard/settings/tags",
  },
  {
    label: "Customisation Jobcards / Checklists",
    icon: ClipboardList,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/settings/jobcards",
  },
  {
    label: "Connect To Google Calendar",
    icon: CalendarSync,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    href: "/dashboard/settings/google-calendar",
  },
  {
    label: "Preferences",
    icon: SlidersHorizontal,
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
    href: "/dashboard/settings/preferences",
    fullWidth: true,
    restricted: true,
  },
];

const ADDON_MODULES: SettingCard[] = [
  {
    label: "Parts Approval Process",
    icon: ShieldCheck,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    restricted: true,
  },
  {
    label: "Customer Booking Portal",
    icon: Globe,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    restricted: true,
  },
  {
    label: "Post Service Feedback (IVR)",
    icon: PhoneCall,
    iconBg: "bg-warn-light",
    iconColor: "text-warn",
    restricted: true,
  },
  {
    label: "Customise Estimate / Invoice PDF format",
    icon: FileText,
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
    href: "/dashboard/settings/invoice-pdf",
  },
  {
    label: "Enable Payment Gateway Request",
    icon: CreditCard,
    iconBg: "bg-bad-light",
    iconColor: "text-bad",
    href: "/dashboard/settings/payment-gateway",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [showDenied, setShowDenied] = useState(false);

  const owner = isGarageOwner() || isSuperAdmin();

  function handleClick(item: SettingCard) {
    if (item.ownerOnly && !owner) {
      setShowDenied(true);
      return;
    }
    if (item.restricted) {
      setShowDenied(true);
      return;
    }
    if (item.href) router.push(item.href);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5">
        <h1 className="text-base font-semibold text-foreground">Garage Settings</h1>
        <p className="text-xs text-muted mt-0.5">Configure your garage profile, users, services, and more.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        {/* ── Garage Settings ── */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">Garage Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GARAGE_SETTINGS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleClick(item)}
                  className={`flex items-center gap-3.5 bg-background border border-edge rounded-lg px-4 py-3.5 text-left hover:shadow-md hover:border-primary/30 transition-all ${
                    item.fullWidth ? "md:col-span-2" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Add-On Modules ── */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-1">Add-On Modules</h2>
          <p className="text-xs text-muted mb-3">Optional modules to extend your garage capabilities.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ADDON_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleClick(item)}
                  className="flex items-center gap-3.5 bg-background border border-edge rounded-lg px-4 py-3.5 text-left hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Access Denied Modal ── */}
      {showDenied && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="inline-flex items-center justify-center bg-bad-light p-3.5 rounded-full mb-4">
              <ShieldX className="w-7 h-7 text-bad" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Access Denied</h3>
            <p className="text-sm text-muted mb-5">
              You don&apos;t have permission to access this setting. Please contact the garage owner.
            </p>
            <button
              onClick={() => setShowDenied(false)}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
