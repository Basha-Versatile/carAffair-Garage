"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Tags,
  FileDown,
  PackageMinus,
  PackagePlus,
  HandCoins,
  Wrench,
  Cog,
  Timer,
  Receipt,
  CreditCard,
  FileText,
  Bell,
  ChevronRight,
} from "lucide-react";

interface ReportCard {
  label: string;
  icon: typeof TrendingUp;
  iconBg: string;
  iconColor: string;
  href: string;
}

interface HighlightCard {
  label: string;
  description: string;
  icon: typeof Wrench;
  iconBg: string;
  iconColor: string;
  href: string;
}

/* ── Top grid: 2-column ── */
const TOP_REPORTS: ReportCard[] = [
  {
    label: "Income / Expense Reports",
    icon: TrendingUp,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    href: "/dashboard/reports/income-expense",
  },
  {
    label: "Order Based Income Reports",
    icon: ClipboardList,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/reports/order-income",
  },
  {
    label: "TAG / Mechanic Based",
    icon: Tags,
    iconBg: "bg-warn-light",
    iconColor: "text-warn",
    href: "/dashboard/reports/tag-mechanic",
  },
  {
    label: "Invoice Export",
    icon: FileDown,
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
    href: "/dashboard/reports/invoice-export",
  },
  {
    label: "Inventory Stock Out",
    icon: PackageMinus,
    iconBg: "bg-bad-light",
    iconColor: "text-bad",
    href: "/dashboard/reports/stock-out",
  },
  {
    label: "Inventory Stock In",
    icon: PackagePlus,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    href: "/dashboard/reports/stock-in",
  },
  {
    label: "Account Payable",
    icon: HandCoins,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/reports/account-payable",
  },
];

/* ── Full-width highlight cards ── */
const HIGHLIGHT_REPORTS: HighlightCard[] = [
  {
    label: "Service Sales Reports",
    description: "Know your service sales pattern day / month wise",
    icon: Wrench,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    href: "/dashboard/reports/sales-services",
  },
  {
    label: "Parts Sales Reports",
    description: "Know your parts sales pattern day / month wise",
    icon: Cog,
    iconBg: "bg-warn-light",
    iconColor: "text-warn",
    href: "/dashboard/reports/sales-parts",
  },
];

/* ── Bottom grid: 2-column ── */
const BOTTOM_REPORTS: ReportCard[] = [
  {
    label: "Inventory Ageing Report",
    icon: Timer,
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
    href: "/dashboard/reports/inventory-ageing",
  },
  {
    label: "GST Reports",
    icon: Receipt,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/reports/gst",
  },
  {
    label: "Payment Reports",
    icon: CreditCard,
    iconBg: "bg-ok-light",
    iconColor: "text-ok",
    href: "/dashboard/reports/payment",
  },
  {
    label: "Open Order Report",
    icon: FileText,
    iconBg: "bg-bad-light",
    iconColor: "text-bad",
    href: "/dashboard/reports/open-order",
  },
  {
    label: "Service Reports",
    icon: Wrench,
    iconBg: "bg-warn-light",
    iconColor: "text-warn",
    href: "/dashboard/reports/service",
  },
  {
    label: "Service Reminder Report",
    icon: Bell,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    href: "/dashboard/reports/service-reminder",
  },
];

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5">
        <h1 className="text-base font-semibold text-foreground">Reports</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* ── Top grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOP_REPORTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
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

        {/* ── Full-width highlight cards ── */}
        <div className="space-y-3">
          {HIGHLIGHT_REPORTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-4 bg-background border border-edge rounded-lg px-5 py-4 text-left hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </button>
            );
          })}
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BOTTOM_REPORTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
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
      </div>
    </div>
  );
}
