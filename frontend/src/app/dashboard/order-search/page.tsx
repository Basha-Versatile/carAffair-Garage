"use client";

import { useState, useEffect, useMemo } from "react";
import { getOrders, Order } from "@/lib/api-orders";
import { Search, FileText, Loader2, Calendar, LayoutGrid, List } from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

type ViewMode = "cards" | "table";
type DatePreset = "week" | "month" | "custom";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "bg-primary-light text-primary" },
  wip:         { label: "WIP",         cls: "bg-warn-light text-warn" },
  ready:       { label: "Ready",       cls: "bg-ok-light text-ok" },
  payment_due: { label: "Payment Due", cls: "bg-bad-light text-bad" },
  completed:   { label: "Completed",   cls: "bg-dim text-muted" },
};

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split("T")[0], to };
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], to };
}

const orderColumns: DataColumn<Order>[] = [
  {
    key: "jobCard",
    header: "Job Card",
    render: (o) => <span className="font-semibold text-foreground">{o.jobCard || "-"}</span>,
    sortValue: (o) => o.jobCard || "",
  },
  {
    key: "customer",
    header: "Customer",
    render: (o) => (
      <div>
        <p className="text-foreground font-medium">{o.customerName || "-"}</p>
        <p className="text-xs text-muted">{o.phone || o.customerPhone || "-"}</p>
      </div>
    ),
  },
  {
    key: "vehicle",
    header: "Vehicle",
    render: (o) => (
      <div>
        <p className="text-secondary">{o.vehicle || "-"}</p>
        <p className="text-xs text-muted font-mono tracking-wider">{o.vehicleNumber || "-"}</p>
      </div>
    ),
  },
  {
    key: "date",
    header: "Date",
    render: (o) => (
      <span className="text-muted whitespace-nowrap">
        {o.date ? new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
      </span>
    ),
    sortValue: (o) => o.date ? new Date(o.date).getTime() : 0,
  },
  {
    key: "services",
    header: "Services",
    render: (o) => (
      <div className="flex flex-wrap gap-1">
        {(o.services || []).map((s) => (
          <span key={s} className="text-[11px] bg-accent-light text-accent px-2 py-0.5 rounded">{s}</span>
        ))}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (o) => {
      const s = STATUS_STYLES[o.status] || { label: o.status || "-", cls: "bg-dim text-muted" };
      return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${s.cls}`}>{s.label}</span>;
    },
    filterValue: (o) => STATUS_STYLES[o.status]?.label || o.status || "",
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (o) => (
      <span className="font-semibold text-foreground tabular-nums">
        ₹{(o.amount ?? 0).toLocaleString("en-IN")}
      </span>
    ),
    sortValue: (o) => o.amount ?? 0,
  },
];

export default function OrderSearchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // date filter
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getOrders()
      .then((data) => setOrders(data || []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  // date range
  const dateRange = useMemo(() => {
    if (preset === "custom") return { from: customFrom || undefined, to: customTo || undefined };
    const r = getPresetRange(preset);
    return { from: r.from, to: r.to };
  }, [preset, customFrom, customTo]);

  // filtered data
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Repair Orders</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-edge rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("cards")}
              className={`p-2 transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
              title="Card view">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
              title="Table view">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search + Date Filters */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job card, customer, vehicle..."
              className="w-full pl-10 pr-4 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Date Preset Buttons */}
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

        {/* Custom Date Range */}
        {preset === "custom" && (
          <div className="px-6 pb-2">
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
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-bad">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {orders.length === 0 ? "No repair orders yet" : "No orders match your filters"}
            </p>
            <p className="text-muted text-sm">
              {orders.length === 0 ? "Create a repair order from the dashboard." : "Try adjusting the search or date range."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((order) => {
                const st = STATUS_STYLES[order.status] || { label: order.status || "-", cls: "bg-dim text-muted" };
                return (
                  <div key={order.id} className="bg-background rounded-lg border border-edge p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <FileText className="w-4 h-4 text-primary" />{order.jobCard || "-"}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{order.customerName || "-"}</p>
                    <p className="text-xs text-muted mt-0.5">{order.phone || order.customerPhone || "-"}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-secondary">
                      <span>{order.vehicle || "-"}</span>
                      <span className="text-muted font-mono text-xs">({order.vehicleNumber || "-"})</span>
                    </div>
                    <p className="text-xs text-muted mt-1.5">
                      {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </p>
                    {(order.services || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {order.services.map((s) => (
                          <span key={s} className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="pt-3 mt-3 border-t border-edge-light">
                      <span className="text-sm font-semibold text-foreground">₹{(order.amount ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            <DataTable
              columns={orderColumns}
              data={filtered}
              keyExtractor={(o) => o.id}
              className={TABLE_CLS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
