"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { tabs, TabKey, getOrders, getOrdersByStatus, getOrderCounts, Order } from "@/lib/api-orders";
import { getCustomers } from "@/lib/api-customers";
import { getParts, Part } from "@/lib/api-inventory";
import {
  Plus, FileText, Phone, Car, Calendar, IndianRupee, LayoutGrid, List,
  TrendingUp, TrendingDown, Users, AlertTriangle, ClipboardList,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

type ViewMode = "cards" | "table";

/* ── KPI card ─────────────────────────────────────── */

function KpiCard({
  label, value, icon: Icon, iconBg, change,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  change?: { pct: number; label: string };
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && change.pct !== 0 && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              change.pct > 0
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
            }`}
          >
            {change.pct > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change.pct).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted mt-0.5">
          {label}
          {change && change.label && (
            <span className="text-muted"> &middot; {change.label}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Order card (existing) ────────────────────────── */

function OrderCard({ order, onClick }: { order: Order; onClick?: () => void }) {
  const statusStyles: Record<string, string> = {
    open: "bg-primary-light text-primary",
    wip: "bg-warn-light text-warn",
    ready: "bg-ok-light text-ok",
    payment_due: "bg-bad-light text-bad",
    completed: "bg-hover text-muted",
  };

  return (
    <div onClick={onClick} className="bg-background rounded-lg border border-edge p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{order.customerName || "-"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3 h-3 text-muted" />
            <span className="text-xs text-muted">{order.phone || "-"}</span>
          </div>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusStyles[order.status] ?? ""}`}>
          {(order.status ?? "").replace("_", " ").toUpperCase()}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <FileText className="w-3.5 h-3.5 text-muted" />
          <span className="font-medium">{order.jobCard || "-"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Car className="w-3.5 h-3.5 text-muted" />
          <span>{order.vehicle || "-"}</span>
          <span className="text-muted">{order.vehicleNumber || "-"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Calendar className="w-3.5 h-3.5" />
          {order.date || "-"}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-edge-light flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {(order.services || []).map((s) => (
            <span key={s} className="text-[11px] bg-dim text-muted px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>
        <div className="flex items-center gap-0.5 text-sm font-semibold text-foreground">
          <IndianRupee className="w-3.5 h-3.5" />
          {(order.amount ?? 0).toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}

/* ── Custom tooltip for area chart ────────────────── */

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-muted mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">
        ₹{payload[0].value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

/* ── Status colors for donut chart ────────────────── */

const STATUS_COLORS: Record<string, string> = {
  Open: "#dc2626",
  WIP: "#d97706",
  Ready: "#16a34a",
  "Payment Due": "#e11d48",
  Completed: "#a1a1aa",
};

/* ── Main dashboard ───────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();

  // ─── Analytics state ───
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [lowStockParts, setLowStockParts] = useState<Part[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // ─── Orders list state (existing) ───
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<TabKey, number>>({ open: 0, wip: 0, ready: 0, payment_due: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // ─── Fetch analytics data once on mount ───
  useEffect(() => {
    setAnalyticsLoading(true);
    Promise.all([
      getOrders(),
      getOrderCounts(),
      getCustomers(),
      getParts(),
    ])
      .then(([ordersData, countsData, customers, parts]) => {
        setAllOrders(ordersData || []);
        setCounts(countsData || { open: 0, wip: 0, ready: 0, payment_due: 0, completed: 0 });
        setCustomerCount((customers || []).length);
        setLowStockParts(
          (parts || []).filter((p) => p.stockQty <= p.minStockQty)
        );
      })
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, []);

  // ─── Fetch orders for active tab ───
  useEffect(() => {
    setLoading(true);
    setError("");
    getOrdersByStatus(activeTab)
      .then((data) => setOrders(data || []))
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [activeTab]);

  // ─── Computed analytics ───

  const totalOrders = useMemo(
    () => Object.values(counts).reduce((s, c) => s + c, 0),
    [counts]
  );

  const { currentMonthRevenue, previousMonthRevenue } = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    let cur = 0;
    let prev = 0;
    allOrders.forEach((o) => {
      if (!o.date) return;
      const d = new Date(o.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      if (m === curMonth && y === curYear) cur += o.amount || 0;
      const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
      const prevYear = curMonth === 0 ? curYear - 1 : curYear;
      if (m === prevMonth && y === prevYear) prev += o.amount || 0;
    });
    return { currentMonthRevenue: cur, previousMonthRevenue: prev };
  }, [allOrders]);

  const revenueChange = useMemo(() => {
    if (previousMonthRevenue === 0) return { pct: 0, label: "vs last month" };
    const pct = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    return { pct, label: "vs last month" };
  }, [currentMonthRevenue, previousMonthRevenue]);

  const monthlyRevenueData = useMemo(() => {
    const now = new Date();
    const result: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const m = d.getMonth();
      const y = d.getFullYear();
      const revenue = allOrders
        .filter((o) => {
          if (!o.date) return false;
          const od = new Date(o.date);
          return od.getMonth() === m && od.getFullYear() === y;
        })
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      result.push({ month: label, revenue });
    }
    return result;
  }, [allOrders]);

  const statusDonutData = useMemo(() => {
    return [
      { name: "Open", value: counts.open },
      { name: "WIP", value: counts.wip },
      { name: "Ready", value: counts.ready },
      { name: "Payment Due", value: counts.payment_due },
      { name: "Completed", value: counts.completed },
    ].filter((d) => d.value > 0);
  }, [counts]);

  return (
    <div className="p-5 space-y-6">
      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue This Month"
          value={analyticsLoading ? "..." : `₹${currentMonthRevenue.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          iconBg="bg-brand-500"
          change={revenueChange}
        />
        <KpiCard
          label="Total Orders"
          value={analyticsLoading ? "..." : totalOrders.toLocaleString()}
          icon={ClipboardList}
          iconBg="bg-success-500"
        />
        <KpiCard
          label="Total Customers"
          value={analyticsLoading ? "..." : customerCount.toLocaleString()}
          icon={Users}
          iconBg="bg-warning-500"
        />
        <KpiCard
          label="Low Stock Parts"
          value={analyticsLoading ? "..." : lowStockParts.length.toLocaleString()}
          icon={AlertTriangle}
          iconBg="bg-error-500"
        />
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend — Area Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
          <div className="h-64">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted">Loading chart...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#98a2b3" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#98a2b3" }}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                    }
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders by Status — Donut Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Orders by Status</h3>
          <div className="h-64 flex items-center justify-center">
            {analyticsLoading ? (
              <p className="text-sm text-muted">Loading chart...</p>
            ) : statusDonutData.length === 0 ? (
              <p className="text-sm text-muted">No orders yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusDonutData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || "#98a2b3"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, `${name}`]}
                  />
                  {/* Center label */}
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl font-bold"
                  >
                    {totalOrders}
                  </text>
                  <text
                    x="50%"
                    y="56%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted text-xs"
                  >
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend */}
          {statusDonutData.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {statusDonutData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-secondary">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: STATUS_COLORS[entry.name] }}
                  />
                  {entry.name}
                  <span className="text-muted font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => router.push("/dashboard/create-order")}
          className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-brand-500 text-white py-3.5 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-sm"
        >
          <div className="bg-white/15 p-1.5 rounded">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Create Repair Order</span>
        </button>
        <button
          onClick={() => router.push("/dashboard/create-invoice")}
          className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-brand-500 text-white py-3.5 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-sm"
        >
          <div className="bg-white/15 p-1.5 rounded">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Create Invoice</span>
        </button>
      </div>

      {/* ═══ Recent Orders ═══ */}
      <div>
        <div className="border-b border-edge mb-5">
          <div className="flex items-center justify-between">
            <div className="flex">
              {tabs.map((tab) => {
                const count = counts?.[tab.key] ?? 0;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted hover:text-secondary"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`ml-1.5 text-[11px] tabular-nums px-1.5 py-px rounded-full ${
                          isActive
                            ? "bg-primary-light text-primary"
                            : "bg-hover text-muted"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center border border-edge rounded-lg overflow-hidden mr-1 mb-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 transition-colors ${
                  viewMode === "cards"
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-hover"
                }`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 transition-colors ${
                  viewMode === "table"
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-hover"
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-3 animate-spin">
              <svg
                className="w-7 h-7 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm text-muted">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-sm text-bad">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-3">
              <FileText className="w-7 h-7 text-muted" />
            </div>
            <p className="text-sm text-muted">No orders in this category</p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(orders || []).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dim border-b border-edge">
                  <th className="text-left px-4 py-3 font-medium text-secondary">Job Card</th>
                  <th className="text-left px-4 py-3 font-medium text-secondary">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-secondary">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-secondary">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-secondary">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-secondary">Services</th>
                  <th className="text-left px-4 py-3 font-medium text-secondary">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-secondary">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-light">
                {(orders || []).map((order) => {
                  const statusStyles: Record<string, string> = {
                    open: "bg-primary-light text-primary",
                    wip: "bg-warn-light text-warn",
                    ready: "bg-ok-light text-ok",
                    payment_due: "bg-bad-light text-bad",
                    completed: "bg-hover text-muted",
                  };
                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="hover:bg-hover transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{order.jobCard || "-"}</td>
                      <td className="px-4 py-3 text-secondary">{order.customerName || "-"}</td>
                      <td className="px-4 py-3 text-muted">{order.phone || "-"}</td>
                      <td className="px-4 py-3 text-secondary">
                        {order.vehicle || "-"}{" "}
                        <span className="text-muted">{order.vehicleNumber || ""}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{order.date || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(order.services || []).map((s) => (
                            <span key={s} className="text-[11px] bg-dim text-muted px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            statusStyles[order.status] ?? ""
                          }`}
                        >
                          {(order.status ?? "").replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {(order.amount ?? 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
