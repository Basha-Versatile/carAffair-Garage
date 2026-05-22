"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getExpenses,
  Expense,
  getPartPurchases,
  PartPurchase,
} from "@/lib/api-accounts";
import {
  ArrowDownLeft,
  Receipt,
  BookOpen,
  Plus,
  Package,
} from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { canManage } from "@/lib/auth";

// ── Tab config ──

type AccountTab = "expenses" | "partPurchase" | "income";

const TABS: { key: AccountTab; label: string }[] = [
  { key: "expenses", label: "Expenses" },
  { key: "partPurchase", label: "Part Purchase" },
  { key: "income", label: "Income" },
];

// ── Expense columns ──

const expenseColumns: DataColumn<Expense>[] = [
  {
    key: "date",
    header: "Date",
    render: (e) => (
      <span className="text-foreground whitespace-nowrap">
        {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    ),
    sortValue: (e) => new Date(e.date).getTime(),
  },
  {
    key: "voucherNo",
    header: "Voucher No",
    render: (e) => <span className="text-muted font-mono text-xs">{e.voucherNo}</span>,
  },
  {
    key: "label",
    header: "Label",
    render: (e) => <span className="text-foreground">{e.labelName || "\u2014"}</span>,
    filterValue: (e) => e.labelName || "",
  },
  {
    key: "vendor",
    header: "Vendor",
    render: (e) => <span className="text-foreground">{e.vendorName || "\u2014"}</span>,
    filterValue: (e) => e.vendorName || "",
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (e) => (
      <span className="font-semibold text-error-600 dark:text-error-400 whitespace-nowrap">
        ₹{e.amount.toLocaleString("en-IN")}
      </span>
    ),
    sortValue: (e) => e.amount,
  },
  {
    key: "channel",
    header: "Channel",
    render: (e) => (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-white/10 text-muted">
        {e.paymentChannel || "\u2014"}
      </span>
    ),
    filterValue: (e) => e.paymentChannel || "",
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    render: (e) => {
      const s = e.paidStatus || "PAID";
      return (
        <span
          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
            s === "CREDIT"
              ? "bg-warning-100 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400"
              : "bg-success-100 dark:bg-success-500/15 text-success-600 dark:text-success-400"
          }`}
        >
          {s}
        </span>
      );
    },
    filterValue: (e) => e.paidStatus || "PAID",
  },
];

// ── Part Purchase columns ──

const purchaseColumns: DataColumn<PartPurchase>[] = [
  {
    key: "date",
    header: "Date",
    render: (p) => (
      <span className="text-foreground whitespace-nowrap">
        {new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    ),
    sortValue: (p) => new Date(p.date).getTime(),
  },
  {
    key: "voucherNo",
    header: "Voucher No",
    render: (p) => <span className="text-muted font-mono text-xs">{p.voucherNo}</span>,
  },
  {
    key: "vendor",
    header: "Vendor",
    render: (p) => <span className="text-foreground">{p.vendorName || "\u2014"}</span>,
    filterValue: (p) => p.vendorName || "",
  },
  {
    key: "repairOrder",
    header: "Repair Order",
    render: (p) => <span className="text-foreground">{p.repairOrderJobCard || "\u2014"}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (p) => (
      <span className="font-semibold text-error-600 dark:text-error-400 whitespace-nowrap">
        ₹{p.amount.toLocaleString("en-IN")}
      </span>
    ),
    sortValue: (p) => p.amount,
  },
  {
    key: "channel",
    header: "Channel",
    render: (p) => (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-white/10 text-muted">
        {p.paymentChannel || "\u2014"}
      </span>
    ),
    filterValue: (p) => p.paymentChannel || "",
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    render: (p) => {
      const s = p.paidStatus || "PAID";
      return (
        <span
          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
            s === "CREDIT"
              ? "bg-warning-100 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400"
              : "bg-success-100 dark:bg-success-500/15 text-success-600 dark:text-success-400"
          }`}
        >
          {s}
        </span>
      );
    },
    filterValue: (p) => p.paidStatus || "PAID",
  },
];

// ── Analytics helper ──

function StatusAnalytics({
  items,
}: {
  items: { amount: number; paidStatus?: string }[];
}) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items
    .filter((i) => (i.paidStatus || "PAID") === "PAID")
    .reduce((s, i) => s + i.amount, 0);
  const credit = items
    .filter((i) => i.paidStatus === "CREDIT")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="glass-card p-4 mb-4">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-success-500" />
          <span className="text-xs text-muted">Paid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-warning-500" />
          <span className="text-xs text-muted">Credit</span>
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 divide-x divide-edge">
        <div className="px-3 first:pl-0">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">
            Total
          </p>
          <p className="text-lg font-bold text-foreground">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="px-3">
          <p className="text-[11px] uppercase tracking-wider text-success-600 dark:text-success-400 mb-0.5">
            Paid
          </p>
          <p className="text-lg font-bold text-success-600 dark:text-success-400">
            ₹{paid.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="px-3">
          <p className="text-[11px] uppercase tracking-wider text-warning-600 dark:text-warning-400 mb-0.5">
            Credit
          </p>
          <p className="text-lg font-bold text-warning-600 dark:text-warning-400">
            ₹{credit.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──

export default function AccountsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>("expenses");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [purchases, setPurchases] = useState<PartPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "expenses") {
      setExpensesLoading(true);
      getExpenses()
        .then((data) => setExpenses(data))
        .catch(() => {})
        .finally(() => setExpensesLoading(false));
    } else if (activeTab === "partPurchase") {
      setPurchasesLoading(true);
      getPartPurchases()
        .then((data) => setPurchases(data))
        .catch(() => {})
        .finally(() => setPurchasesLoading(false));
    }
  }, [activeTab]);

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground">Accounts</h1>
        <button
          onClick={() => router.push("/dashboard/accounts/daybook")}
          className="flex items-center gap-2 bg-success-500 hover:bg-success-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-theme-xs"
        >
          <BookOpen className="w-4 h-4" />
          Account Book
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-edge">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-5">
        {/* ── Expenses Tab ── */}
        {activeTab === "expenses" && (
          <div>
            {canManage("ACCOUNTS") && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => router.push("/dashboard/accounts/add-expense")}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-theme-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              </div>
            )}

            {expensesLoading ? (
              <div className="glass-card p-8 text-center">
                <div className="animate-pulse text-muted text-sm">Loading expenses...</div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Receipt className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted">No expenses recorded yet</p>
                <p className="text-xs text-muted mt-1">
                  Click &quot;Add Expense&quot; to create your first expense entry
                </p>
              </div>
            ) : (
              <>
                <StatusAnalytics items={expenses} />
                <DataTable
                  columns={expenseColumns}
                  data={expenses}
                  keyExtractor={(e) => e.id}
                />
              </>
            )}
          </div>
        )}

        {/* ── Part Purchase Tab ── */}
        {activeTab === "partPurchase" && (
          <div>
            {canManage("ACCOUNTS") && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => router.push("/dashboard/accounts/add-part-purchase")}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-theme-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Part Purchase
                </button>
              </div>
            )}

            {purchasesLoading ? (
              <div className="glass-card p-8 text-center">
                <div className="animate-pulse text-muted text-sm">Loading part purchases...</div>
              </div>
            ) : purchases.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Package className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted">No part purchases recorded yet</p>
                <p className="text-xs text-muted mt-1">
                  Click &quot;Add Part Purchase&quot; to create your first entry
                </p>
              </div>
            ) : (
              <>
                <StatusAnalytics items={purchases} />
                <DataTable
                  columns={purchaseColumns}
                  data={purchases}
                  keyExtractor={(p) => p.id}
                />
              </>
            )}
          </div>
        )}

        {/* ── Income Tab ── */}
        {activeTab === "income" && (
          <div className="glass-card p-10 text-center">
            <ArrowDownLeft className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium text-foreground">Income</p>
            <p className="text-sm text-muted mt-1">Coming Soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
