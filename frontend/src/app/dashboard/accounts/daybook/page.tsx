"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getAccountTransactions,
  getCashInHand,
  getBankBalance,
  AccountTransaction,
  TransactionChannel,
} from "@/lib/api-accounts";
import {
  ArrowLeft,
  Wallet,
  Landmark,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";

// ── Type styles ──

const TYPE_STYLES: Record<string, string> = {
  Payment:  "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  Receipt:  "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  Expense:  "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
  Transfer: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  Refund:   "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};

// ── Helpers ──

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ── Date range presets ──

type DatePreset = "week" | "month" | "custom";

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  if (preset === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return { from: weekAgo.toISOString().split("T")[0], to };
  }

  // month
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: firstOfMonth.toISOString().split("T")[0], to };
}

// ── Table columns ──

const txnColumns: DataColumn<AccountTransaction>[] = [
  {
    key: "amount",
    header: "Amount (₹)",
    render: (t) => {
      const isOut = t.type === "Payment" || t.type === "Expense" || t.type === "Transfer";
      return (
        <span className={`font-semibold tabular-nums ${isOut ? "text-error-600 dark:text-error-400" : "text-success-600 dark:text-success-400"}`}>
          {isOut ? "- " : "+ "}{formatCurrency(t.amount)}
        </span>
      );
    },
    sortValue: (t) => t.amount,
  },
  {
    key: "date",
    header: "Date",
    render: (t) => <span className="text-muted whitespace-nowrap">{formatDate(t.date)}</span>,
    sortValue: (t) => new Date(t.date).getTime(),
  },
  {
    key: "type",
    header: "Type",
    render: (t) => (
      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[t.type] || ""}`}>
        {t.type}
      </span>
    ),
    filterValue: (t) => t.type,
  },
  {
    key: "comment",
    header: "Comment",
    render: (t) => <span className="text-foreground">{t.comment}</span>,
  },
  {
    key: "user",
    header: "User",
    render: (t) => <span className="text-muted">{t.user}</span>,
    filterValue: (t) => t.user,
  },
];

// ── Page ──

export default function AccountBookPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TransactionChannel>("Cash");
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [entries, setEntries] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [cashInHand, setCashInHand] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // load balances
  useEffect(() => {
    setBalanceLoading(true);
    Promise.all([getCashInHand(), getBankBalance()])
      .then(([cash, bank]) => { setCashInHand(cash); setBankBalance(bank); })
      .catch(() => {})
      .finally(() => setBalanceLoading(false));
  }, []);

  // compute active date range
  const dateRange = useMemo(() => {
    if (preset === "custom") {
      return { from: customFrom || undefined, to: customTo || undefined };
    }
    const r = getPresetRange(preset);
    return { from: r.from, to: r.to };
  }, [preset, customFrom, customTo]);

  // load transactions
  useEffect(() => {
    setLoading(true);
    getAccountTransactions(activeTab, dateRange.from, dateRange.to)
      .then((data) => setEntries(data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [activeTab, dateRange]);

  // totals
  const totals = useMemo(() => {
    const inflow = entries
      .filter((t) => t.type === "Receipt" || t.type === "Refund")
      .reduce((s, t) => s + t.amount, 0);
    const outflow = entries
      .filter((t) => t.type === "Payment" || t.type === "Expense" || t.type === "Transfer")
      .reduce((s, t) => s + t.amount, 0);
    return { inflow, outflow };
  }, [entries]);

  const totalsFooter = entries.length > 0 ? (
    <tfoot>
      <tr className="bg-dim dark:bg-white/[0.02] border-t-2 border-edge">
        <td className="px-4 py-3 text-right">
          <div className="space-y-0.5">
            <p className="text-xs text-success-600 dark:text-success-400 font-semibold">+ {formatCurrency(totals.inflow)}</p>
            <p className="text-xs text-error-600 dark:text-error-400 font-semibold">- {formatCurrency(totals.outflow)}</p>
          </div>
        </td>
        <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-foreground">
          Period Totals
        </td>
      </tr>
    </tfoot>
  ) : undefined;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/accounts")}
          className="p-2 rounded-lg text-muted hover:bg-hover hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Account Book</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Cash in Hand */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Cash in Hand</p>
              {balanceLoading ? (
                <div className="h-8 w-28 bg-dim rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {formatCurrency(cashInHand)}
                </p>
              )}
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Amount in Bank */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Amount in Bank</p>
              {balanceLoading ? (
                <div className="h-8 w-28 bg-dim rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {formatCurrency(bankBalance)}
                </p>
              )}
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Cash / Bank Tabs */}
        <div className="flex border border-edge rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab("Cash")}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "Cash"
                ? "bg-success-500 text-white"
                : "text-muted hover:bg-hover"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              Cash Transactions
            </span>
          </button>
          <button
            onClick={() => setActiveTab("Bank")}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "Bank"
                ? "bg-brand-500 text-white"
                : "text-muted hover:bg-hover"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Landmark className="w-4 h-4" />
              Bank Transactions
            </span>
          </button>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreset("week")}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              preset === "week"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                : "border-edge text-muted hover:bg-hover"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPreset("month")}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              preset === "month"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                : "border-edge text-muted hover:bg-hover"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPreset("custom")}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
              preset === "custom"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                : "border-edge text-muted hover:bg-hover"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {preset === "custom" && (
        <div className="glass-card p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Calendar className="w-4 h-4 text-muted shrink-0" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 border border-edge rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              />
              <span className="text-sm text-muted">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 border border-edge rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Loading transactions...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <ArrowUpDown className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted">No transactions found for this period.</p>
        </div>
      ) : (
        <DataTable
          columns={txnColumns}
          data={entries}
          keyExtractor={(t) => t.id}
          className="bg-background rounded-xl border border-edge overflow-hidden shadow-theme-xs"
          footer={totalsFooter}
        />
      )}
    </div>
  );
}
