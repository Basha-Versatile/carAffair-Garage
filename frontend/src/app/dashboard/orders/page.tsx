"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getOrders, getOrdersByStatus, getOrderCounts, Order, TabKey, tabs } from "@/lib/api-orders";
import { Search, FileText, Loader2, Calendar, LayoutGrid, List, Plus } from "lucide-react";
import { canView, canManage, canViewFinancial } from "@/lib/auth";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

type ViewMode = "cards" | "table";
type DatePreset = "all" | "week" | "month" | "custom";

const STATUS_STYLES: Record<string, { label: string; cls: string; dot: string }> = {
  open:        { label: "Open",        cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",             dot: "bg-blue-500" },
  wip:         { label: "WIP",         cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",         dot: "bg-amber-500" },
  payment_due: { label: "Payment Due", cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",     dot: "bg-orange-500" },
  completed:   { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",   cls: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",                 dot: "bg-red-500" },
};


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

/* ── Static Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { label: status || "-", cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
export default function OrderSearchPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [cardPage, setCardPage] = useState(1);
  const [cardPageSize, setCardPageSize] = useState<PageSize>(PAGE_SIZES[0]);

  // status tab filter
  const [activeTab, setActiveTab] = useState<TabKey | "all">("all");
  const [counts, setCounts] = useState<Record<string, number>>({});

  // date filter
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([getOrders(), getOrderCounts()])
      .then(([data, countsData]) => {
        setOrders(data || []);
        setCounts(countsData || {});
      })
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  // date range
  const dateRange = useMemo(() => {
    if (preset === "custom") return { from: customFrom || undefined, to: customTo || undefined };
    const r = getPresetRange(preset);
    return r ? { from: r.from, to: r.to } : { from: undefined, to: undefined };
  }, [preset, customFrom, customTo]);

  // filtered data
  const filtered = useMemo(() => {
    let list = orders;

    // status tab filter
    if (activeTab !== "all") {
      list = list.filter((o) => o.status === activeTab);
    }

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
  }, [orders, activeTab, dateRange, search]);

  useEffect(() => { setCardPage(1); }, [filtered.length]);


  const totalCount = useMemo(() => Object.values(counts).reduce((s, c) => s + c, 0), [counts]);

  // Table columns with status changer
  const orderColumns: DataColumn<Order>[] = useMemo(() => [
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
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge status={o.status} />,
      filterValue: (o) => STATUS_STYLES[o.status]?.label || o.status || "",
    },
    ...(canViewFinancial("ORDERS") ? [{
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (o: Order) => (
        <span className="text-sm font-bold text-[var(--surface-fg)] tabular-nums">
          ₹{(o.amount ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortValue: (o: Order) => o.amount ?? 0,
    }] : []),
  ], []);

  const TABLE_CLS = "bg-[var(--surface-bg)] rounded-xl border border-[var(--border-main)] overflow-hidden";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[var(--surface-bg)] border-b border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[var(--surface-fg)] tracking-tight">Orders</h1>
          <span className="bg-[var(--surface-hover)] text-[var(--text-mut)] text-xs font-semibold px-2.5 py-1 rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {canManage("ORDERS") && (
            <button
              onClick={() => router.push("/dashboard/create-order")}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-red-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Job Card
            </button>
          )}
          <div className="flex items-center border border-[var(--border-main)] rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("cards")}
              className={`p-2 transition-colors ${viewMode === "cards" ? "bg-red-600 text-white" : "text-[var(--text-mut)] hover:bg-[var(--surface-hover)]"}`}
              title="Card view">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-red-600 text-white" : "text-[var(--text-mut)] hover:bg-[var(--surface-hover)]"}`}
              title="Table view">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Status Tabs */}
        <div className="px-6 pt-4 border-b border-[var(--border-lt)]">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap rounded-t-lg ${
                activeTab === "all"
                  ? "text-red-600 dark:text-red-400"
                  : "text-[var(--text-mut)] hover:text-[var(--text-sec)]"
              }`}
            >
              All
              <span className={`ml-1.5 text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
                activeTab === "all" ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400" : "bg-[var(--surface-hover)] text-[var(--text-mut)]"
              }`}>
                {totalCount}
              </span>
              {activeTab === "all" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />}
            </button>
            {tabs.map((tab) => {
              const count = counts[tab.key] ?? 0;
              const isActive = activeTab === tab.key;
              const dot = STATUS_STYLES[tab.key]?.dot || "bg-gray-400";
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap rounded-t-lg flex items-center gap-1.5 ${
                    isActive
                      ? "text-red-600 dark:text-red-400"
                      : "text-[var(--text-mut)] hover:text-[var(--text-sec)]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400" : "bg-[var(--surface-hover)] text-[var(--text-mut)]"
                    }`}>
                      {count}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Date Filters */}
        <div className="px-6 pt-4 pb-3 flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mut)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job card, customer, phone, vehicle..."
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--border-main)] rounded-xl text-sm font-medium text-[var(--surface-fg)] placeholder:text-[var(--text-mut)] bg-[var(--surface-bg)] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 dark:focus:border-red-800 transition-all"
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreset("all")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                preset === "all"
                  ? "border-red-500 bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                  : "border-[var(--border-main)] text-[var(--text-mut)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPreset("week")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                preset === "week"
                  ? "border-red-500 bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                  : "border-[var(--border-main)] text-[var(--text-mut)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPreset("month")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                preset === "month"
                  ? "border-red-500 bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                  : "border-[var(--border-main)] text-[var(--text-mut)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPreset("custom")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                preset === "custom"
                  ? "border-red-500 bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                  : "border-[var(--border-main)] text-[var(--text-mut)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {preset === "custom" && (
          <div className="px-6 pb-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 border border-[var(--border-main)] rounded-lg bg-[var(--surface-bg)] text-sm font-medium text-[var(--surface-fg)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <span className="text-sm font-medium text-[var(--text-mut)]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 border border-[var(--border-main)] rounded-lg bg-[var(--surface-bg)] text-sm font-medium text-[var(--surface-fg)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-red-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-[var(--surface-hover)] p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-[var(--text-mut)]" />
            </div>
            <p className="text-[var(--surface-fg)] font-semibold text-base mb-1">
              {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
            </p>
            <p className="text-[var(--text-mut)] text-sm">
              {orders.length === 0 ? "Create an order to get started." : "Try adjusting the search, status, or date range."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="px-6 py-4">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(filtered.length / cardPageSize));
              const safePage = Math.min(cardPage, totalPages);
              const start = (safePage - 1) * cardPageSize;
              const paged = filtered.slice(start, start + cardPageSize);
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paged.map((order) => {
                      const st = STATUS_STYLES[order.status] || { label: order.status || "-", cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
                      return (
                        <div key={order.id} onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          className="bg-[var(--surface-bg)] rounded-xl border border-[var(--border-main)] p-5 hover:shadow-lg hover:border-red-500/20 transition-all cursor-pointer group">
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--surface-fg)]">
                              <FileText className="w-4 h-4 text-red-500" />{order.jobCard || "-"}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${st.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[var(--surface-fg)]">{order.customerName || "-"}</p>
                          <p className="text-xs text-[var(--text-mut)] mt-0.5">{order.phone || order.customerPhone || "-"}</p>
                          <div className="flex items-center gap-1.5 mt-2.5 text-sm font-medium text-[var(--text-sec)]">
                            <span>{order.vehicle || "-"}</span>
                            <span className="text-[var(--text-mut)] font-mono text-xs">({order.vehicleNumber || "-"})</span>
                          </div>
                          <p className="text-xs text-[var(--text-mut)] mt-1.5">
                            {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </p>
                          {(order.services || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(order.services || []).map((s) => (
                                <span key={s} className="text-[11px] font-medium bg-[var(--surface-hover)] text-[var(--text-sec)] px-2 py-0.5 rounded-md">{s}</span>
                              ))}
                            </div>
                          )}
                          {canViewFinancial("ORDERS") && (
                            <div className="pt-3 mt-3 border-t border-[var(--border-lt)]">
                              <span className="text-sm font-bold text-[var(--surface-fg)]">₹{(order.amount ?? 0).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={`${TABLE_CLS} mt-4`}>
                    <Pagination total={filtered.length} page={safePage} pageSize={cardPageSize} onPageChange={setCardPage} onPageSizeChange={setCardPageSize} />
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="px-6 py-4">
            <DataTable
              columns={orderColumns}
              data={filtered}
              keyExtractor={(o) => o.id}
              className={TABLE_CLS}
              onRowClick={(o) => router.push(`/dashboard/orders/${o.id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
