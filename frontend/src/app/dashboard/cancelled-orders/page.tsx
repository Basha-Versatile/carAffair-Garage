"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getOrdersByStatus, type Order } from "@/lib/api-orders";
import { Search, CalendarX, Loader2, Calendar } from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";

type DatePreset = "all" | "week" | "month" | "custom";

function getPresetRange(preset: DatePreset): { from: string; to: string } | null {
  if (preset === "all") return null;
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split("T")[0], to };
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], to };
}

export default function CancelledOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // date filter
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    getOrdersByStatus("cancelled")
      .then((data) => setOrders(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dateRange = useMemo(() => {
    if (preset === "custom") return { from: customFrom || undefined, to: customTo || undefined };
    const r = getPresetRange(preset);
    return r ? { from: r.from, to: r.to } : { from: undefined, to: undefined };
  }, [preset, customFrom, customTo]);

  const filtered = useMemo(() => {
    let list = orders;

    // date filter
    if (dateRange.from) list = list.filter((o) => (o.date || "") >= dateRange.from!);
    if (dateRange.to) list = list.filter((o) => (o.date || "") <= dateRange.to!);

    // text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        (o.jobCard ?? "").toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.phone ?? o.customerPhone ?? "").includes(q) ||
        (o.vehicleNumber ?? "").toLowerCase().includes(q) ||
        (o.vehicle ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, dateRange, search]);

  const columns: DataColumn<Order>[] = useMemo(() => [
    {
      key: "jobCard",
      header: "Job Card",
      render: (o) => <span className="text-sm font-bold text-[var(--surface-fg)] tracking-wide">{o.jobCard || "-"}</span>,
      sortValue: (o) => o.jobCard || "",
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div>
          <p className="text-sm font-semibold text-[var(--surface-fg)]">{o.customerName || "-"}</p>
          <p className="text-xs text-[var(--text-mut)] mt-0.5">{o.phone || o.customerPhone || "-"}</p>
        </div>
      ),
      filterValue: (o) => o.customerName || "",
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (o) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-sec)]">{o.vehicle || "-"}</p>
          <p className="text-xs text-[var(--text-mut)] font-mono tracking-wider mt-0.5">{o.vehicleNumber || "-"}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (o) => (
        <span className="text-sm text-[var(--text-sec)] whitespace-nowrap">
          {o.date ? new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
        </span>
      ),
      sortValue: (o) => o.date ? new Date(o.date).getTime() : 0,
    },
    {
      key: "reason",
      header: "Reason",
      render: (o) => (
        <span className="text-xs text-[var(--text-mut)] line-clamp-2">
          {o.customerRejectionNote || "-"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (o) => (
        <span className="text-sm font-bold text-[var(--surface-fg)] tabular-nums">
          ₹{(o.grandTotal ?? o.amount ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortValue: (o) => o.grandTotal ?? o.amount ?? 0,
    },
  ], []);

  const TABLE_CLS = "bg-[var(--surface-bg)] rounded-xl border border-[var(--border-main)] overflow-hidden";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[var(--surface-bg)] border-b border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarX className="w-5 h-5 text-red-500" />
          <h1 className="text-lg font-bold text-[var(--surface-fg)] tracking-tight">Cancelled Orders</h1>
          <span className="bg-[var(--surface-hover)] text-[var(--text-mut)] text-xs font-semibold px-2.5 py-1 rounded-full">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4 pb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mut)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job card, customer, vehicle..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-main)] bg-[var(--surface-bg)] text-[var(--surface-fg)] placeholder:text-[var(--text-mut)] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
            />
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[var(--text-mut)]" />
            {(["all", "week", "month"] as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  preset === p
                    ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
                    : "border-[var(--border-main)] text-[var(--text-sec)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {p === "all" ? "All Time" : p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
            <button
              onClick={() => setPreset("custom")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                preset === "custom"
                  ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
                  : "border-[var(--border-main)] text-[var(--text-sec)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Custom
            </button>
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-main)] bg-[var(--surface-bg)] text-[var(--surface-fg)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <span className="text-xs text-[var(--text-mut)]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-main)] bg-[var(--surface-bg)] text-[var(--surface-fg)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          {filtered.length === 0 && !loading ? (
            <div className="text-center py-16">
              <CalendarX className="w-10 h-10 text-[var(--text-mut)] mx-auto mb-3" />
              <p className="text-[var(--surface-fg)] font-medium">No cancelled orders</p>
              <p className="text-sm text-[var(--text-mut)] mt-1">
                {search || preset !== "all" ? "Try adjusting your search or date filters." : "Orders cancelled by customers will appear here."}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(o) => o.id}
              onRowClick={(o) => router.push(`/dashboard/orders/${o.id}`)}
              className={TABLE_CLS}
            />
          )}
        </div>
      </div>
    </div>
  );
}
