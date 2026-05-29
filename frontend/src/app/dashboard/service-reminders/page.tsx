"use client";

import { useState, useEffect, useMemo } from "react";
import { getOrders, Order } from "@/lib/api-orders";
import {
  Clock,
  Phone,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  IndianRupee,
} from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";

type ViewMode = "cards" | "table";
type TabKey = "due" | "overdue" | "done";

const TAB_CONFIG: Record<TabKey, { label: string; badgeBg: string; badgeText: string; icon: typeof Clock }> = {
  due:      { label: "Due",      badgeBg: "bg-warn-light",  badgeText: "text-warn",  icon: Clock },
  overdue:  { label: "Overdue",  badgeBg: "bg-bad-light",   badgeText: "text-bad",   icon: AlertTriangle },
  done:     { label: "Done",     badgeBg: "bg-ok-light",    badgeText: "text-ok",    icon: CheckCircle2 },
};

const ORDER_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  open:      { label: "Open",      cls: "bg-primary-light text-primary" },
  wip:       { label: "WIP",       cls: "bg-warn-light text-warn" },
  completed: { label: "Completed", cls: "bg-ok-light text-ok" },
  cancelled: { label: "Cancelled", cls: "bg-bad-light text-bad" },
};

/** Map order status → reminder tab */
function getTabForOrder(o: Order): TabKey {
  if (o.status === "completed") return "done";
  if (o.status === "cancelled") return "done";
  return "due"; // open, wip
}

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

function makeColumns(activeTab: TabKey): DataColumn<Order>[] {
  const tabCfg = TAB_CONFIG[activeTab];
  return [
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
    {
      key: "orderStatus",
      header: "Order Status",
      render: (o) => {
        const s = ORDER_STATUS_STYLES[o.status] || { label: o.status || "-", cls: "bg-dim text-muted" };
        return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${s.cls}`}>{s.label}</span>;
      },
      filterValue: (o) => ORDER_STATUS_STYLES[o.status]?.label || o.status || "",
    },
    {
      key: "reminderStatus",
      header: "Status",
      render: () => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tabCfg.badgeBg} ${tabCfg.badgeText}`}>
          {tabCfg.label}
        </span>
      ),
    },
  ];
}

export default function ServiceRemindersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("due");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    setLoading(true);
    setError("");
    getOrders()
      .then((data) => setOrders(data || []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const counts: Record<TabKey, number> = useMemo(() => {
    const c: Record<TabKey, number> = { due: 0, overdue: 0, done: 0 };
    for (const o of orders) c[getTabForOrder(o)]++;
    return c;
  }, [orders]);

  const query = search.toLowerCase();
  const filtered = useMemo(() => {
    return orders
      .filter((o) => getTabForOrder(o) === activeTab)
      .filter((o) =>
        (o.jobCard ?? "").toLowerCase().includes(query) ||
        (o.customerName ?? "").toLowerCase().includes(query) ||
        (o.vehicleNumber ?? "").toLowerCase().includes(query) ||
        (o.phone ?? o.customerPhone ?? "").includes(query) ||
        (o.vehicle ?? "").toLowerCase().includes(query)
      );
  }, [orders, activeTab, query]);

  const columns = useMemo(() => makeColumns(activeTab), [activeTab]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Service Reminders</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">
            {orders.length}
          </span>
        </div>
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

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-bad">{error}</p>
          </div>
        ) : (
          <>
            {/* Tabs + Search */}
            <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-2">
                {(["due", "overdue", "done"] as TabKey[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-primary text-white"
                        : "text-secondary hover:bg-hover"
                    }`}
                  >
                    {TAB_CONFIG[tab].label}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        activeTab === tab
                          ? "bg-white/20 text-white"
                          : "bg-hover text-muted"
                      }`}
                    >
                      {counts[tab]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1" />

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
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
                  <Bell className="w-8 h-8 text-muted" />
                </div>
                <p className="text-foreground font-medium mb-1">
                  {search
                    ? "No orders match your search"
                    : `No ${TAB_CONFIG[activeTab].label.toLowerCase()} orders`}
                </p>
                <p className="text-muted text-sm">
                  {search ? "Try adjusting your search." : "All caught up!"}
                </p>
              </div>
            ) : viewMode === "cards" ? (
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((order) => (
                    <OrderReminderCard key={order.id} order={order} tab={activeTab} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 py-4">
                <DataTable
                  columns={columns}
                  data={filtered}
                  keyExtractor={(o) => o.id}
                  className={TABLE_CLS}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OrderReminderCard({ order, tab }: { order: Order; tab: TabKey }) {
  const tabCfg = TAB_CONFIG[tab];
  const StatusIcon = tabCfg.icon;
  const st = ORDER_STATUS_STYLES[order.status] || { label: order.status || "-", cls: "bg-dim text-muted" };

  return (
    <div className="bg-background border border-edge rounded-lg p-5 hover:shadow-md transition-shadow">
      {/* Top row: job card + tab badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <FileText className="w-4 h-4 text-primary" />{order.jobCard || "-"}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${tabCfg.badgeBg} ${tabCfg.badgeText}`}>
          <StatusIcon className="w-3 h-3" />
          {tabCfg.label}
        </span>
      </div>

      {/* Customer */}
      <p className="text-sm font-medium text-foreground">{order.customerName || "-"}</p>
      <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
        <Phone className="w-3 h-3" />
        {order.phone || order.customerPhone || "-"}
      </div>

      {/* Vehicle */}
      <div className="flex items-center gap-1.5 mt-2 text-sm text-secondary">
        <Car className="w-3.5 h-3.5 text-muted" />
        <span>{order.vehicle || "-"}</span>
        <span className="text-muted font-mono text-xs">({order.vehicleNumber || "-"})</span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted">
        <Calendar className="w-3 h-3" />
        {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
      </div>

      {/* Services */}
      {(order.services || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(order.services || []).map((s) => (
            <span key={s} className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>
      )}

      {/* Footer: amount + order status */}
      <div className="pt-3 mt-3 border-t border-edge-light flex items-center justify-between">
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-foreground">
          <IndianRupee className="w-3.5 h-3.5" />{(order.amount ?? 0).toLocaleString("en-IN")}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${st.cls}`}>{st.label}</span>
      </div>
    </div>
  );
}
