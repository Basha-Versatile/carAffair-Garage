"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getOrders, getOrderCounts, getVehicleAnalytics, Order, VehicleAnalytics } from "@/lib/api-orders";
import { getInvoices, Invoice } from "@/lib/api-invoices";
import { getCustomers } from "@/lib/api-customers";
import { getParts, Part } from "@/lib/api-inventory";
import { getExpenses, Expense, getPartPurchases, PartPurchase } from "@/lib/api-accounts";
import { getVehicles, Vehicle, getBrands, VehicleBrand } from "@/lib/api-vehicles";
import { getGarageServices, GarageService } from "@/lib/api-garage-services";
import { isGarageStaff, isSuperAdmin, getUser, canView, canViewFinancial, getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { updateAssignmentStatus, type ServiceAssignment } from "@/lib/api-orders";
import { getTodayAttendance, getAbsentees, type Attendance } from "@/lib/api-attendance";
import { getStaffPerformance, type StaffPerformance } from "@/lib/api-performance";
import {
  DateRangeFilter, filterByDate, getDateCutoff, getPresetLabel,
  DATE_PRESETS, type DateRange,
} from "@/components/DateRangeFilter";
import {
  Car, IndianRupee,
  TrendingUp, TrendingDown, Users, AlertTriangle, ClipboardList,
  Wrench, CheckCircle2, Clock, Loader2, Building2, Palette,
  ChevronRight, ArrowRight, Fuel, Tag, Package, FileText,
  BarChart3, PieChart as PieChartIcon, CalendarDays, Receipt,
  ShoppingCart, Calendar, CreditCard, Truck,
  UserCheck, UserX, Trophy, Phone, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from "recharts";

/* ── Palette ──────────────────────────────────────── */

const BRAND_COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#ea580c", "#4f46e5", "#059669",
  "#be123c", "#1d4ed8", "#15803d", "#b45309", "#6d28d9",
];

const STATUS_COLORS: Record<string, string> = {
  Open: "#dc2626",
  WIP: "#d97706",
  Completed: "#16a34a",
  Cancelled: "#e11d48",
};

const INVOICE_COLORS: Record<string, string> = {
  Paid: "#16a34a",
  Sent: "#2563eb",
  Draft: "#98a2b3",
};

const FUEL_COLORS: Record<string, string> = {
  Petrol: "#dc2626",
  Diesel: "#1d4ed8",
  CNG: "#16a34a",
  LPG: "#d97706",
  HYBRID: "#7c3aed",
  ELECTRIC: "#0891b2",
};

const CATEGORY_COLORS: Record<string, string> = {
  Sedan: "#2563eb",
  Hatchback: "#16a34a",
  SUV: "#d97706",
  Luxury: "#7c3aed",
  VAN: "#dc2626",
};

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

/* ── Section header ───────────────────────────────── */

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-brand-500" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── Chart card wrapper ───────────────────────────── */

function ChartCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card p-5 ${className}`}>{children}</div>;
}

/* ── Custom tooltips ──────────────────────────────── */

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs border border-edge">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-foreground flex items-center gap-1.5">
          {p.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />}
          {p.name ? `${p.name}: ` : ""}₹{p.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs border border-edge">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-foreground flex items-center gap-1.5">
          {p.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />}
          {p.name ? `${p.name}: ` : ""}{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ── Donut center label ──────────────────────────── */

function DonutCenter({ x, y, value, label }: { x: string; y: string; value: string | number; label: string }) {
  return (
    <>
      <text x={x} y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
        {value}
      </text>
      <text x={x} y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-[11px]">
        {label}
      </text>
    </>
  );
}

/* ── Inline legend ────────────────────────────────── */

function InlineLegend({ items }: { items: { name: string; color: string; value: number | string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
          {item.name}
          <span className="font-semibold text-foreground ml-0.5">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Date filter — shared component ──────────────── */
// DateRangeFilter, filterByDate, getDateCutoff, getPresetLabel, DATE_PRESETS
// imported from @/components/DateRangeFilter

/* ── Widget card with header + date filter ──────── */

function WidgetCard({
  title,
  icon: Icon,
  count,
  dateRange,
  onDateChange,
  customFrom,
  customTo,
  onCustomChange,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  count?: number | string;
  dateRange: DateRange;
  onDateChange: (v: DateRange) => void;
  customFrom?: string;
  customTo?: string;
  onCustomChange?: (from: string, to: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-light">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          {count !== undefined && (
            <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full ml-1">{count}</span>
          )}
        </div>
        <DateRangeFilter value={dateRange} onChange={onDateChange} customFrom={customFrom} customTo={customTo} onCustomChange={onCustomChange} />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Staff Task Item ──────────────────────────────── */

interface TaskItem {
  orderId: string;
  jobCard: string;
  customerName: string;
  vehicle: string;
  vehicleNumber: string;
  assignment: ServiceAssignment;
  serviceDescription: string;
}

/* ── Staff Dashboard ─────────────────────────────── */

function StaffDashboard() {
  const router = useRouter();
  const user = getUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tasks: TaskItem[] = useMemo(() => {
    if (!user) return [];
    const result: TaskItem[] = [];
    for (const order of orders) {
      if (!order.serviceAssignments) continue;
      for (const a of order.serviceAssignments) {
        if (a.assignedUserId === user.id) {
          const li = (order.lineItems || []).find(l => l.id === a.lineItemId);
          result.push({
            orderId: order.id,
            jobCard: order.jobCard,
            customerName: order.customerName,
            vehicle: order.vehicle,
            vehicleNumber: order.vehicleNumber,
            assignment: a,
            serviceDescription: li?.description || "Service",
          });
        }
      }
    }
    return result;
  }, [orders, user]);

  const pending = tasks.filter(t => t.assignment.status === "pending").length;
  const inProgress = tasks.filter(t => t.assignment.status === "in_progress").length;
  const completed = tasks.filter(t => t.assignment.status === "completed").length;
  const activeTasks = tasks.filter(t => t.assignment.status !== "completed");

  async function handleStatusUpdate(task: TaskItem, newStatus: string) {
    setUpdatingId(task.assignment.lineItemId);
    try {
      await updateAssignmentStatus(task.orderId, task.assignment.lineItemId, newStatus);
      const updated = await getOrders();
      setOrders(updated);
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Welcome, {user?.name || "Staff"}</h1>
        <p className="text-sm text-muted mt-0.5">{user?.staffTitle || "Staff Member"}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks" value={tasks.length.toString()} icon={ClipboardList} iconBg="bg-brand-500" />
        <KpiCard label="Pending" value={pending.toString()} icon={Clock} iconBg="bg-gray-400" />
        <KpiCard label="In Progress" value={inProgress.toString()} icon={Wrench} iconBg="bg-warning-500" />
        <KpiCard label="Completed" value={completed.toString()} icon={CheckCircle2} iconBg="bg-success-500" />
      </div>

      {tasks.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Overall Progress</p>
            <span className="text-xs font-medium text-muted">{completed} / {tasks.length} completed</span>
          </div>
          <div className="w-full h-2.5 bg-hover rounded-full overflow-hidden">
            <div className="h-full bg-success-500 rounded-full transition-all" style={{ width: `${(completed / tasks.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Active Tasks
          {activeTasks.length > 0 && (
            <span className="ml-2 text-xs font-medium text-muted bg-hover px-2 py-0.5 rounded-full">{activeTasks.length}</span>
          )}
        </h2>

        {activeTasks.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-ok mx-auto mb-3" />
            <p className="text-foreground font-medium">All tasks completed!</p>
            <p className="text-sm text-muted mt-1">No pending work right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div key={`${task.orderId}-${task.assignment.lineItemId}`}
                className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{task.serviceDescription}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      <span className="font-medium text-primary">{task.jobCard}</span>
                      <span className="flex items-center gap-1"><Car className="w-3 h-3" />{task.vehicle}</span>
                      <span className="font-mono">{task.vehicleNumber}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">Customer: {task.customerName}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    task.assignment.status === "in_progress" ? "bg-warn/10 text-warn" : "bg-dim text-muted"
                  }`}>
                    {task.assignment.status === "in_progress" ? "In Progress" : "Pending"}
                  </span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-edge-light">
                  {task.assignment.status === "pending" && (
                    <button onClick={() => handleStatusUpdate(task, "in_progress")}
                      disabled={updatingId === task.assignment.lineItemId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-warn text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                      <Wrench className="w-3.5 h-3.5" />
                      {updatingId === task.assignment.lineItemId ? "..." : "Start Work"}
                    </button>
                  )}
                  {task.assignment.status === "in_progress" && (
                    <button onClick={() => handleStatusUpdate(task, "completed")}
                      disabled={updatingId === task.assignment.lineItemId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-ok text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {updatingId === task.assignment.lineItemId ? "..." : "Mark Complete"}
                    </button>
                  )}
                  <button onClick={() => router.push(`/dashboard/orders/${task.orderId}`)}
                    className="px-4 py-2 text-xs font-medium text-secondary border border-edge rounded-lg hover:bg-hover">
                    View Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completed > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Completed
            <span className="ml-2 text-xs font-medium text-ok bg-ok/10 px-2 py-0.5 rounded-full">{completed}</span>
          </h2>
          <div className="space-y-2">
            {tasks.filter(t => t.assignment.status === "completed").map((task) => (
              <div key={`${task.orderId}-${task.assignment.lineItemId}`}
                className="glass-card-light p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
                      {task.serviceDescription}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted ml-6">
                      <span className="font-medium">{task.jobCard}</span>
                      <span>{task.vehicle} ({task.vehicleNumber})</span>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/dashboard/orders/${task.orderId}`)}
                    className="px-3 py-1.5 text-xs font-medium text-secondary border border-edge rounded-lg hover:bg-hover shrink-0">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Super Admin Dashboard ────────────────────────── */

interface SuperAdminStats {
  totalGarages: number;
  activeGarages: number;
  inactiveGarages: number;
  totalGarageRequests: number;
  pendingGarageRequests: number;
  approvedGarageRequests: number;
  rejectedGarageRequests: number;
  totalBrandRequests: number;
  pendingBrandRequests: number;
  approvedBrandRequests: number;
  rejectedBrandRequests: number;
}

function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<SuperAdminStats>("/api/garages/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  const s = stats || {
    totalGarages: 0, activeGarages: 0, inactiveGarages: 0,
    totalGarageRequests: 0, pendingGarageRequests: 0, approvedGarageRequests: 0, rejectedGarageRequests: 0,
    totalBrandRequests: 0, pendingBrandRequests: 0, approvedBrandRequests: 0, rejectedBrandRequests: 0,
  };

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Active Garages" value={s.activeGarages.toLocaleString()} icon={Building2} iconBg="bg-success-500" />
        <KpiCard label="Inactive Garages" value={s.inactiveGarages.toLocaleString()} icon={Building2} iconBg="bg-error-500" />
        <KpiCard label="Pending Garage Requests" value={s.pendingGarageRequests.toLocaleString()} icon={ClipboardList} iconBg="bg-warning-500" />
        <KpiCard label="Pending Brand Requests" value={s.pendingBrandRequests.toLocaleString()} icon={Palette} iconBg="bg-brand-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Garage Status */}
        <div onClick={() => router.push("/dashboard/super-admin/garages")} className="glass-card p-5 cursor-pointer hover:shadow-theme-lg transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Garage Status</h3>
            <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-xs text-muted mb-3">{s.totalGarages} total garages</p>
          <div className="h-48 flex items-center justify-center">
            {s.totalGarages === 0 ? (
              <p className="text-sm text-muted">No garages yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: "Active", value: s.activeGarages }, { name: "Inactive", value: s.inactiveGarages }].filter(d => d.value > 0)} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    <Cell fill="#16a34a" />
                    {s.inactiveGarages > 0 && <Cell fill="#dc2626" />}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  <DonutCenter x="50%" y="46%" value={s.totalGarages} label="Total" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <InlineLegend items={[{ name: "Active", color: "#16a34a", value: s.activeGarages }, { name: "Inactive", color: "#dc2626", value: s.inactiveGarages }]} />
        </div>

        {/* Garage Requests */}
        <div onClick={() => router.push("/dashboard/super-admin/garage-requests")} className="glass-card p-5 cursor-pointer hover:shadow-theme-lg transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Garage Requests</h3>
            <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-xs text-muted mb-3">{s.totalGarageRequests} total requests</p>
          <div className="h-48 flex items-center justify-center">
            {s.totalGarageRequests === 0 ? (
              <p className="text-sm text-muted">No requests yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: "Pending", value: s.pendingGarageRequests }, { name: "Approved", value: s.approvedGarageRequests }, { name: "Rejected", value: s.rejectedGarageRequests }].filter(d => d.value > 0)} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    {[{ name: "Pending", color: "#f59e0b" }, { name: "Approved", color: "#16a34a" }, { name: "Rejected", color: "#dc2626" }].filter(d => { const val = d.name === "Pending" ? s.pendingGarageRequests : d.name === "Approved" ? s.approvedGarageRequests : s.rejectedGarageRequests; return val > 0; }).map((d) => (<Cell key={d.name} fill={d.color} />))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  <DonutCenter x="50%" y="46%" value={s.totalGarageRequests} label="Total" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <InlineLegend items={[{ name: "Pending", color: "#f59e0b", value: s.pendingGarageRequests }, { name: "Approved", color: "#16a34a", value: s.approvedGarageRequests }, { name: "Rejected", color: "#dc2626", value: s.rejectedGarageRequests }]} />
        </div>

        {/* Brand Requests */}
        <div onClick={() => router.push("/dashboard/super-admin/brand-requests")} className="glass-card p-5 cursor-pointer hover:shadow-theme-lg transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Brand Requests</h3>
            <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-xs text-muted mb-3">{s.totalBrandRequests} total requests</p>
          <div className="h-48 flex items-center justify-center">
            {s.totalBrandRequests === 0 ? (
              <p className="text-sm text-muted">No requests yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: "Pending", value: s.pendingBrandRequests }, { name: "Approved", value: s.approvedBrandRequests }, { name: "Rejected", value: s.rejectedBrandRequests }].filter(d => d.value > 0)} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    {[{ name: "Pending", color: "#f59e0b" }, { name: "Approved", color: "#16a34a" }, { name: "Rejected", color: "#dc2626" }].filter(d => { const val = d.name === "Pending" ? s.pendingBrandRequests : d.name === "Approved" ? s.approvedBrandRequests : s.rejectedBrandRequests; return val > 0; }).map((d) => (<Cell key={d.name} fill={d.color} />))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  <DonutCenter x="50%" y="46%" value={s.totalBrandRequests} label="Total" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <InlineLegend items={[{ name: "Pending", color: "#f59e0b", value: s.pendingBrandRequests }, { name: "Approved", color: "#16a34a", value: s.approvedBrandRequests }, { name: "Rejected", color: "#dc2626", value: s.rejectedBrandRequests }]} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => router.push("/dashboard/super-admin/garages")} className="glass-card p-4 flex items-center gap-3 hover:shadow-theme-lg transition-shadow text-left group">
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">Manage Garages</p><p className="text-xs text-muted">{s.totalGarages} total</p></div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
        </button>
        <button onClick={() => router.push("/dashboard/super-admin/garage-requests")} className="glass-card p-4 flex items-center gap-3 hover:shadow-theme-lg transition-shadow text-left group">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0"><ClipboardList className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">Garage Requests</p><p className="text-xs text-muted">{s.pendingGarageRequests} pending</p></div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
        </button>
        <button onClick={() => router.push("/dashboard/super-admin/brand-requests")} className="glass-card p-4 flex items-center gap-3 hover:shadow-theme-lg transition-shadow text-left group">
          <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center shrink-0"><Palette className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">Brand Requests</p><p className="text-xs text-muted">{s.pendingBrandRequests} pending</p></div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADMIN DASHBOARD — Enhanced Analytics
   ══════════════════════════════════════════════════════ */

export default function DashboardPage() {
  if (isSuperAdmin()) return <SuperAdminDashboard />;
  const staffMode = isGarageStaff();
  if (staffMode) return <StaffDashboard />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const router = useRouter();

  // ─── Per-widget date filters ───
  const [vehicleDateRange, setVehicleDateRange] = useState<DateRange>("all");
  const [orderStatusDateRange, setOrderStatusDateRange] = useState<DateRange>("30d");
  const [orderDayWiseDateRange, setOrderDayWiseDateRange] = useState<DateRange>("30d");
  const [salesDateRange, setSalesDateRange] = useState<DateRange>("30d");
  const [purchasesDateRange, setPurchasesDateRange] = useState<DateRange>("30d");
  const [revenueDateRange, setRevenueDateRange] = useState<DateRange>("all");
  const [servicePartsDateRange, setServicePartsDateRange] = useState<DateRange>("30d");
  const [inventoryDateRange, setInventoryDateRange] = useState<DateRange>("all");

  // ─── Per-widget custom date ranges ───
  const [customDates, setCustomDates] = useState<Record<string, { from: string; to: string }>>({});
  const cd = (key: string) => customDates[key] || { from: "", to: "" };
  const setCd = (key: string, from: string, to: string) =>
    setCustomDates(prev => ({ ...prev, [key]: { from, to } }));

  // ─── Raw data ───
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allServices, setAllServices] = useState<GarageService[]>([]);
  const [allPurchases, setAllPurchases] = useState<PartPurchase[]>([]);
  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleAnalytics[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({ open: 0, wip: 0, payment_due: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  // ─── Staff & Appointments data ───
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [absentStaff, setAbsentStaff] = useState<{ id: string; name: string }[]>([]);
  const [staffPerf, setStaffPerf] = useState<StaffPerformance[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<{ id: string; customerName: string; service: string; preferredDate: string; preferredTime: string; vehicleRegNumber: string; status: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const today = now.toISOString().split("T")[0];

    Promise.all([
      getOrders(),
      getOrderCounts(),
      getCustomers(),
      getParts(),
      getInvoices(),
      getVehicles(),
      getExpenses().catch(() => []),
      getVehicleAnalytics().catch(() => []),
      getGarageServices().catch(() => []),
      getPartPurchases().catch(() => []),
      getTodayAttendance().catch(() => []),
      getAbsentees().catch(() => []),
      getStaffPerformance(monthStart, today).catch(() => []),
      fetch(`${API_BASE}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      }).then(r => r.json()).then(j => j.data || []).catch(() => []),
    ])
      .then(([orders, countsData, customers, parts, invoices, vehicles, expenses, vAnalytics, services, purchases, attendance, absent, perf, bookings]) => {
        setAllOrders(orders || []);
        setCounts(countsData || { open: 0, wip: 0, completed: 0, cancelled: 0 });
        setCustomerCount((customers || []).length);
        setAllParts(parts || []);
        setAllInvoices(invoices || []);
        setAllVehicles(vehicles || []);
        setAllExpenses(expenses || []);
        setVehicleAnalytics(vAnalytics || []);
        setAllServices(services || []);
        setAllPurchases(purchases || []);
        setTodayAttendance(attendance || []);
        setAbsentStaff(absent || []);
        setStaffPerf(perf || []);
        const upcoming = (bookings || [])
          .filter((b: { status: string; preferredDate: string }) => b.status === "pending" || b.status === "confirmed")
          .sort((a: { preferredDate: string }, b: { preferredDate: string }) => a.preferredDate.localeCompare(b.preferredDate))
          .slice(0, 5);
        setUpcomingBookings(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // filterByDate imported from @/components/DateRangeFilter

  // ─── KPI Computations ───
  const totalOrders = useMemo(() => Object.values(counts).reduce((s, c) => s + c, 0), [counts]);

  const { currentMonthRevenue, previousMonthRevenue } = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    let cur = 0, prev = 0;
    allOrders.forEach((o) => {
      if (!o.date) return;
      const d = new Date(o.date);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) cur += o.amount || 0;
      const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
      const prevYear = curMonth === 0 ? curYear - 1 : curYear;
      if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) prev += o.amount || 0;
    });
    return { currentMonthRevenue: cur, previousMonthRevenue: prev };
  }, [allOrders]);

  const revenueChange = useMemo(() => {
    if (previousMonthRevenue === 0) return { pct: 0, label: "vs last month" };
    return { pct: ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100, label: "vs last month" };
  }, [currentMonthRevenue, previousMonthRevenue]);

  const lowStockParts = useMemo(() => allParts.filter(p => p.stockQty <= p.minStockQty), [allParts]);

  const avgOrderValue = useMemo(() => {
    if (allOrders.length === 0) return 0;
    return Math.round(allOrders.reduce((s, o) => s + (o.amount || 0), 0) / allOrders.length);
  }, [allOrders]);

  const collectionRate = useMemo(() => {
    if (allInvoices.length === 0) return 0;
    const paid = allInvoices.filter(i => i.status === "paid").length;
    return Math.round((paid / allInvoices.length) * 100);
  }, [allInvoices]);

  const totalExpenses = useMemo(() => allExpenses.reduce((s, e) => s + (e.amount || 0), 0), [allExpenses]);

  // ═══════════════════════════════════════════════════
  // WIDGET 1: Vehicle by Make (tile grid)
  // ═══════════════════════════════════════════════════
  const vehicleBrandGrid = useMemo(() => {
    // Vehicles don't have creation dates, so filter via linked orders when a date range is set
    if (vehicleDateRange === "all") {
      if (vehicleAnalytics.length > 0) {
        return vehicleAnalytics.sort((a, b) => b.count - a.count).map(v => ({ name: v.brandName, count: v.count }));
      }
      const map: Record<string, number> = {};
      allVehicles.forEach(v => { if (v.brandName) map[v.brandName] = (map[v.brandName] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    }
    // When date-filtered, count vehicles from orders in that period
    const { from, to } = cd("vehicle");
    const filteredOrd = filterByDate(allOrders, vehicleDateRange, from, to);
    const vehicleIds = new Set(filteredOrd.map(o => o.vehicleId).filter(Boolean));
    const matchingVehicles = allVehicles.filter(v => vehicleIds.has(v.id));
    const map: Record<string, number> = {};
    matchingVehicles.forEach(v => { if (v.brandName) map[v.brandName] = (map[v.brandName] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [allVehicles, allOrders, vehicleAnalytics, vehicleDateRange, customDates]);

  const totalVehiclesFiltered = useMemo(() => vehicleBrandGrid.reduce((s, b) => s + b.count, 0), [vehicleBrandGrid]);

  // ═══════════════════════════════════════════════════
  // WIDGET 2: Work Orders Status (table with amounts)
  // ═══════════════════════════════════════════════════
  const orderStatusRows = useMemo(() => {
    const { from, to } = cd("orderStatus");
    const filtered = filterByDate(allOrders, orderStatusDateRange, from, to);
    const statusConfig: { key: string; label: string; color: string; icon: React.ElementType }[] = [
      { key: "open", label: "Open", color: "#dc2626", icon: ClipboardList },
      { key: "wip", label: "In Progress", color: "#d97706", icon: Wrench },
      { key: "payment_due", label: "Payment Due", color: "#2563eb", icon: CreditCard },
      { key: "completed", label: "Completed", color: "#16a34a", icon: CheckCircle2 },
      { key: "cancelled", label: "Cancelled", color: "#e11d48", icon: AlertTriangle },
    ];
    return statusConfig.map(s => {
      const matching = filtered.filter(o => o.status === s.key);
      return {
        ...s,
        count: matching.length,
        amount: matching.reduce((sum, o) => sum + (o.amount || 0), 0),
      };
    });
  }, [allOrders, orderStatusDateRange, customDates]);

  const orderStatusTotal = useMemo(() => ({
    count: orderStatusRows.reduce((s, r) => s + r.count, 0),
    amount: orderStatusRows.reduce((s, r) => s + r.amount, 0),
  }), [orderStatusRows]);

  // ═══════════════════════════════════════════════════
  // WIDGET 3: Work Orders Day Wise (bar chart)
  // ═══════════════════════════════════════════════════
  const orderDayWiseData = useMemo(() => {
    const { from, to } = cd("orderDayWise");
    const filtered = filterByDate(allOrders, orderDayWiseDateRange, from, to);
    const map: Record<string, { count: number; amount: number }> = {};
    filtered.forEach(o => {
      if (!o.date) return;
      const day = new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!map[day]) map[day] = { count: 0, amount: 0 };
      map[day].count += 1;
      map[day].amount += o.amount || 0;
    });
    // Sort by date
    return Object.entries(map)
      .sort((a, b) => {
        const da = filtered.find(o => o.date && new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) === a[0])?.date || "";
        const db = filtered.find(o => o.date && new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) === b[0])?.date || "";
        return new Date(da).getTime() - new Date(db).getTime();
      })
      .slice(-15) // last 15 days max
      .map(([day, data]) => ({ day, ...data }));
  }, [allOrders, orderDayWiseDateRange, customDates]);

  // ═══════════════════════════════════════════════════
  // WIDGET 4: Sales Summary
  // ═══════════════════════════════════════════════════
  const salesSummary = useMemo(() => {
    const { from, to } = cd("sales");
    const filteredOrd = filterByDate(allOrders, salesDateRange, from, to);
    const filteredInv = filterByDate(allInvoices, salesDateRange, from, to);
    // Estimates = orders that have lineItems (estimate sent)
    const estimates = filteredOrd.filter(o => (o.lineItems || []).length > 0);
    const invoices = filteredInv;
    const paidInvoices = filteredInv.filter(i => i.status === "paid");
    return {
      estimates: { count: estimates.length, amount: estimates.reduce((s, o) => s + (o.grandTotal || o.amount || 0), 0) },
      invoices: { count: invoices.length, amount: invoices.reduce((s, i) => s + (i.grandTotal || 0), 0) },
      paid: { count: paidInvoices.length, amount: paidInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0) },
    };
  }, [allOrders, allInvoices, salesDateRange, customDates]);

  // ═══════════════════════════════════════════════════
  // WIDGET 5: Purchases Summary
  // ═══════════════════════════════════════════════════
  const purchasesSummary = useMemo(() => {
    const { from, to } = cd("purchases");
    const filteredPurch = filterByDate(allPurchases, purchasesDateRange, from, to);
    const filteredExp = filterByDate(allExpenses, purchasesDateRange, from, to);
    return {
      purchases: { count: filteredPurch.length, amount: filteredPurch.reduce((s, p) => s + (p.amount || 0), 0) },
      expenses: { count: filteredExp.length, amount: filteredExp.reduce((s, e) => s + (e.amount || 0), 0) },
      total: filteredPurch.reduce((s, p) => s + (p.amount || 0), 0) + filteredExp.reduce((s, e) => s + (e.amount || 0), 0),
    };
  }, [allPurchases, allExpenses, purchasesDateRange, customDates]);

  // ═══════════════════════════════════════════════════
  // Revenue & Expenses Trend
  // ═══════════════════════════════════════════════════
  const monthlyRevenueData = useMemo(() => {
    const now = new Date();
    const result: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const m = d.getMonth(), y = d.getFullYear();
      const revenue = allOrders.filter(o => o.date && new Date(o.date).getMonth() === m && new Date(o.date).getFullYear() === y).reduce((s, o) => s + (o.amount || 0), 0);
      const exp = allExpenses.filter(e => e.date && new Date(e.date).getMonth() === m && new Date(e.date).getFullYear() === y).reduce((s, e) => s + (e.amount || 0), 0);
      result.push({ month: label, revenue, expenses: exp });
    }
    return result;
  }, [allOrders, allExpenses]);

  // ═══════════════════════════════════════════════════
  // Service vs Parts + Top Services/Parts
  // ═══════════════════════════════════════════════════
  const svcPartsOrders = useMemo(() => {
    const { from, to } = cd("serviceParts");
    return filterByDate(allOrders, servicePartsDateRange, from, to);
  }, [allOrders, servicePartsDateRange, customDates]);

  const serviceVsPartsData = useMemo(() => {
    let svcRev = 0, partRev = 0;
    svcPartsOrders.forEach(o => {
      (o.lineItems || []).forEach(li => {
        if (li.itemType === "service") svcRev += li.amount || 0;
        else if (li.itemType === "part") partRev += li.amount || 0;
      });
    });
    return [
      { name: "Services", value: Math.round(svcRev) },
      { name: "Parts", value: Math.round(partRev) },
    ].filter(d => d.value > 0);
  }, [svcPartsOrders]);

  const topServicesData = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    svcPartsOrders.forEach(o => {
      (o.lineItems || []).forEach(li => {
        if (li.itemType === "service") {
          const key = li.description || "Unknown";
          if (!map[key]) map[key] = { count: 0, revenue: 0 };
          map[key].count += li.qty || 1;
          map[key].revenue += li.amount || 0;
        }
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8)
      .map(([name, data]) => ({ name: name.length > 25 ? name.slice(0, 22) + "..." : name, count: data.count, revenue: Math.round(data.revenue) }));
  }, [svcPartsOrders]);

  const topPartsData = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    svcPartsOrders.forEach(o => {
      (o.lineItems || []).forEach(li => {
        if (li.itemType === "part") {
          const key = li.description || "Unknown";
          if (!map[key]) map[key] = { qty: 0, revenue: 0 };
          map[key].qty += li.qty || 1;
          map[key].revenue += li.amount || 0;
        }
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8)
      .map(([name, data]) => ({ name: name.length > 25 ? name.slice(0, 22) + "..." : name, qty: data.qty, revenue: Math.round(data.revenue) }));
  }, [svcPartsOrders]);

  // ═══════════════════════════════════════════════════
  // Inventory
  // ═══════════════════════════════════════════════════
  const partsCategoryData = useMemo(() => {
    const map: Record<string, { stock: number; value: number }> = {};
    allParts.forEach(p => {
      const cat = (typeof p.category === "string" ? p.category : "Uncategorized");
      if (!map[cat]) map[cat] = { stock: 0, value: 0 };
      map[cat].stock += p.stockQty || 0;
      map[cat].value += (p.stockQty || 0) * (p.purchasePrice || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([name, data]) => ({ name, stock: data.stock, value: Math.round(data.value) }));
  }, [allParts]);

  const expenseByCategoryData = useMemo(() => {
    const { from, to } = cd("inventory");
    const filtered = filterByDate(allExpenses, inventoryDateRange, from, to);
    const map: Record<string, number> = {};
    filtered.forEach(e => {
      const label = e.labelName || "Other";
      map[label] = (map[label] || 0) + (e.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 17) + "..." : name, value: Math.round(value) }));
  }, [allExpenses, inventoryDateRange, customDates]);

  // ─── Render ───
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">

      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">Business overview and analytics</p>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {canViewFinancial("DASHBOARD") && (
          <KpiCard label="Revenue This Month" value={`₹${currentMonthRevenue.toLocaleString("en-IN")}`} icon={IndianRupee} iconBg="bg-brand-500" change={revenueChange} />
        )}
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} icon={ClipboardList} iconBg="bg-success-500" />
        <KpiCard label="Customers" value={customerCount.toLocaleString()} icon={Users} iconBg="bg-warning-500" />
        {canViewFinancial("DASHBOARD") && (
          <KpiCard label="Avg Order Value" value={`₹${avgOrderValue.toLocaleString("en-IN")}`} icon={Receipt} iconBg="bg-purple-500" />
        )}
        {canViewFinancial("DASHBOARD") && (
          <KpiCard label="Collection Rate" value={`${collectionRate}%`} icon={FileText} iconBg="bg-teal-500" />
        )}
        <KpiCard label="Low Stock Parts" value={lowStockParts.length.toLocaleString()} icon={AlertTriangle} iconBg="bg-error-500" />
      </div>

      {/* ═══ Staff Attendance + Top Performers + Appointments ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* TODAY'S ATTENDANCE */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-light">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success-500/10 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-success-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Today&apos;s Attendance</h3>
            </div>
            <button onClick={() => router.push("/dashboard/attendance")} className="text-[11px] font-medium text-brand-500 hover:underline">View All</button>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-success-500">{todayAttendance.filter(a => a.status === "checked_in").length}</p>
                <p className="text-[11px] text-muted">Working</p>
              </div>
              <div className="w-px h-10 bg-edge-light" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-foreground">{todayAttendance.filter(a => a.status === "checked_out").length}</p>
                <p className="text-[11px] text-muted">Done</p>
              </div>
              <div className="w-px h-10 bg-edge-light" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-error-500">{absentStaff.length}</p>
                <p className="text-[11px] text-muted">Absent</p>
              </div>
            </div>
            {todayAttendance.length === 0 && absentStaff.length === 0 ? (
              <p className="text-xs text-muted text-center py-3">No staff data</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {todayAttendance.slice(0, 5).map(a => (
                  <div key={a.id} onClick={() => router.push(`/dashboard/attendance/employee/${a.staffId}`)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${a.status === "checked_in" ? "bg-success-500 animate-pulse" : "bg-muted"}`} />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{a.staffName}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${a.status === "checked_in" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" : "bg-hover text-muted"}`}>
                      {a.status === "checked_in" ? "Working" : "Done"}
                    </span>
                  </div>
                ))}
                {absentStaff.slice(0, 3).map(s => (
                  <div key={s.id} onClick={() => router.push(`/dashboard/attendance/employee/${s.id}`)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer">
                    <UserX className="w-3 h-3 text-error-500 shrink-0" />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{s.name}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">Absent</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TOP PERFORMERS THIS MONTH */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-light">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-warning-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Top Performers</h3>
            </div>
            <button onClick={() => router.push("/dashboard/reports/staff-performance")} className="text-[11px] font-medium text-brand-500 hover:underline">View All</button>
          </div>
          <div className="p-5">
            {staffPerf.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No performance data this month</p>
            ) : (
              <div className="space-y-2.5">
                {staffPerf.slice(0, 5).map((sp, i) => (
                  <div key={sp.staffId} onClick={() => router.push(`/dashboard/attendance/employee/${sp.staffId}`)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover transition-colors cursor-pointer">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      i === 0 ? "bg-warning-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-gray-300"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{sp.staffName}</p>
                      <p className="text-[10px] text-muted">{sp.role}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{sp.tasksCompleted}</p>
                      <p className="text-[10px] text-muted">tasks</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        sp.attendanceRate >= 80 ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                          : sp.attendanceRate >= 60 ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                          : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                      }`}>
                        {sp.attendanceRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* UPCOMING APPOINTMENTS */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-light">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-brand-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Upcoming Appointments</h3>
            </div>
            <button onClick={() => router.push("/dashboard/appointments")} className="text-[11px] font-medium text-brand-500 hover:underline">View All</button>
          </div>
          <div className="p-5">
            {upcomingBookings.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((b) => (
                  <div key={b.id} onClick={() => router.push("/dashboard/appointments")} className="px-3 py-2.5 rounded-lg border border-edge-light hover:border-brand-500/20 hover:bg-brand-500/[0.02] transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground truncate">{b.customerName}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        b.status === "confirmed" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" : "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                      }`}>
                        {b.status === "confirmed" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted truncate">{b.service}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(b.preferredDate).toLocaleDateString([], { day: "2-digit", month: "short" })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.preferredTime}</span>
                      <span className="flex items-center gap-1 font-mono"><Car className="w-3 h-3" />{b.vehicleRegNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Vehicle by Make + Work Orders Status ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* VEHICLE BY MAKE */}
        <WidgetCard title="Vehicle by Make" icon={Car} count={totalVehiclesFiltered} dateRange={vehicleDateRange} onDateChange={setVehicleDateRange} customFrom={cd("vehicle").from} customTo={cd("vehicle").to} onCustomChange={(f, t) => setCd("vehicle", f, t)}>
          {vehicleBrandGrid.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted">No vehicle data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {vehicleBrandGrid.map((brand, i) => (
                <div
                  key={brand.name}
                  onClick={() => router.push(`/dashboard/vehicle-search?brand=${encodeURIComponent(brand.name)}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-edge-light hover:border-brand-500/30 hover:bg-brand-500/[0.03] transition-all group cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}
                  >
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{brand.name}</p>
                    <p className="text-xs text-muted">{brand.count} vehicle{brand.count !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </WidgetCard>

        {/* WORK ORDERS STATUS */}
        <WidgetCard title="Work Orders Status" icon={ClipboardList} count={orderStatusTotal.count} dateRange={orderStatusDateRange} onDateChange={setOrderStatusDateRange} customFrom={cd("orderStatus").from} customTo={cd("orderStatus").to} onCustomChange={(f, t) => setCd("orderStatus", f, t)}>
          <div className="space-y-1">
            {orderStatusRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.key}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover transition-colors"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                  <Icon className="w-4 h-4 shrink-0" style={{ color: row.color }} />
                  <span className="text-sm font-medium text-foreground flex-1">{row.label}</span>
                  <span className="text-sm font-bold text-foreground min-w-[28px] text-right">{row.count}</span>
                  {canViewFinancial("DASHBOARD") && (
                    <span className="text-xs text-muted min-w-[90px] text-right font-mono">₹{row.amount.toLocaleString("en-IN")}</span>
                  )}
                </div>
              );
            })}
            {/* Total row */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-500/5 border border-brand-500/10 mt-2">
              <div className="w-2 h-2 rounded-full shrink-0 bg-brand-500" />
              <span className="text-sm font-bold text-brand-500 flex-1">Total</span>
              <span className="text-sm font-bold text-brand-500 min-w-[28px] text-right">{orderStatusTotal.count}</span>
              {canViewFinancial("DASHBOARD") && (
                <span className="text-xs font-bold text-brand-500 min-w-[90px] text-right font-mono">₹{orderStatusTotal.amount.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>
        </WidgetCard>
      </div>

      {/* ═══ Work Orders Day Wise ═══ */}
      <WidgetCard title="Work Orders Day Wise" icon={Calendar} count={orderDayWiseData.reduce((s, d) => s + d.count, 0)} dateRange={orderDayWiseDateRange} onDateChange={setOrderDayWiseDateRange} customFrom={cd("orderDayWise").from} customTo={cd("orderDayWise").to} onCustomChange={(f, t) => setCd("orderDayWise", f, t)}>
        {orderDayWiseData.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted">No orders in selected period</p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderDayWiseData}>
                <defs>
                  <linearGradient id="dayBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e5e7eb)" strokeOpacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} allowDecimals={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="count" name="Orders" fill="url(#dayBarGrad)" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </WidgetCard>

      {/* ═══ Sales + Purchases ═══ */}
      {canViewFinancial("DASHBOARD") && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* SALES */}
          <WidgetCard title="Sales" icon={IndianRupee} dateRange={salesDateRange} onDateChange={setSalesDateRange} customFrom={cd("sales").from} customTo={cd("sales").to} onCustomChange={(f, t) => setCd("sales", f, t)}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Estimates", count: salesSummary.estimates.count, amount: salesSummary.estimates.amount, color: "bg-blue-500", icon: FileText },
                { label: "Invoices", count: salesSummary.invoices.count, amount: salesSummary.invoices.amount, color: "bg-purple-500", icon: Receipt },
                { label: "Paid", count: salesSummary.paid.count, amount: salesSummary.paid.amount, color: "bg-emerald-500", icon: CheckCircle2 },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-edge-light p-4 text-center hover:border-brand-500/20 transition-all">
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      <ItemIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{item.count}</p>
                    <p className="text-xs text-muted mt-0.5">{item.label}</p>
                    <p className="text-xs font-semibold text-foreground mt-1">₹{item.amount.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
            </div>
          </WidgetCard>

          {/* PURCHASES */}
          <WidgetCard title="Purchases" icon={ShoppingCart} dateRange={purchasesDateRange} onDateChange={setPurchasesDateRange} customFrom={cd("purchases").from} customTo={cd("purchases").to} onCustomChange={(f, t) => setCd("purchases", f, t)}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Part Purchases", count: purchasesSummary.purchases.count, amount: purchasesSummary.purchases.amount, color: "bg-orange-500", icon: Truck },
                { label: "Expenses", count: purchasesSummary.expenses.count, amount: purchasesSummary.expenses.amount, color: "bg-red-500", icon: Tag },
                { label: "Total Outflow", count: purchasesSummary.purchases.count + purchasesSummary.expenses.count, amount: purchasesSummary.total, color: "bg-gray-600", icon: CreditCard },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-edge-light p-4 text-center hover:border-brand-500/20 transition-all">
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      <ItemIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{item.count}</p>
                    <p className="text-xs text-muted mt-0.5">{item.label}</p>
                    <p className="text-xs font-semibold text-foreground mt-1">₹{item.amount.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
            </div>
          </WidgetCard>
        </div>
      )}

      {/* ═══ Revenue & Orders Trend ═══ */}
      {canViewFinancial("DASHBOARD") && (
        <WidgetCard title="Revenue vs Expenses" icon={BarChart3} dateRange={revenueDateRange} onDateChange={setRevenueDateRange} customFrom={cd("revenue").from} customTo={cd("revenue").to} onCustomChange={(f, t) => setCd("revenue", f, t)}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e5e7eb)" strokeOpacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#98a2b3" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#98a2b3" }} tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#dc2626" strokeWidth={2.5} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#d97706" strokeWidth={2} fill="url(#expGrad)" />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WidgetCard>
      )}

      {/* ═══ Service & Parts Analytics ═══ */}
      {canViewFinancial("DASHBOARD") && (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <WidgetCard title="Service vs Parts Revenue" icon={Wrench} dateRange={servicePartsDateRange} onDateChange={setServicePartsDateRange} customFrom={cd("serviceParts").from} customTo={cd("serviceParts").to} onCustomChange={(f, t) => setCd("serviceParts", f, t)}>
          <div className="h-64 flex items-center justify-center">
            {serviceVsPartsData.length === 0 ? (
              <p className="text-sm text-muted">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceVsPartsData} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    <Cell fill="#dc2626" />
                    <Cell fill="#2563eb" />
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]} />
                  <DonutCenter x="50%" y="46%" value={`₹${((serviceVsPartsData.reduce((s, d) => s + d.value, 0)) / 1000).toFixed(0)}k`} label="Total" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {serviceVsPartsData.length > 0 && (
            <InlineLegend items={serviceVsPartsData.map((d, i) => ({ name: d.name, color: i === 0 ? "#dc2626" : "#2563eb", value: `₹${d.value.toLocaleString("en-IN")}` }))} />
          )}
        </WidgetCard>

        <WidgetCard title="Top Services by Revenue" icon={Wrench} dateRange={servicePartsDateRange} onDateChange={setServicePartsDateRange} customFrom={cd("serviceParts").from} customTo={cd("serviceParts").to} onCustomChange={(f, t) => setCd("serviceParts", f, t)}>
          <div className="h-64">
            {topServicesData.length === 0 ? (
              <div className="flex items-center justify-center h-full"><p className="text-sm text-muted">No service data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e5e7eb)" strokeOpacity={0.5} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} width={130} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#dc2626" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </WidgetCard>
      </div>
      )}

      {/* ═══ Inventory & Expenses ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <WidgetCard title="Parts Stock by Category" icon={Package} dateRange={inventoryDateRange} onDateChange={setInventoryDateRange} customFrom={cd("inventory").from} customTo={cd("inventory").to} onCustomChange={(f, t) => setCd("inventory", f, t)}>
          <div className="h-64">
            {partsCategoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full"><p className="text-sm text-muted">No inventory data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partsCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e5e7eb)" strokeOpacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a2b3", angle: -35, textAnchor: "end" }} height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} allowDecimals={false} />
                  <Tooltip content={<CountTooltip />} />
                  <Bar dataKey="stock" name="Units in Stock" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </WidgetCard>

        {canViewFinancial("DASHBOARD") && (
          <WidgetCard title="Expenses by Category" icon={Tag} dateRange={inventoryDateRange} onDateChange={setInventoryDateRange} customFrom={cd("inventory").from} customTo={cd("inventory").to} onCustomChange={(f, t) => setCd("inventory", f, t)}>
            <div className="h-64">
              {expenseByCategoryData.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-sm text-muted">No expenses recorded</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseByCategoryData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e5e7eb)" strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} width={110} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="value" name="Amount" fill="#d97706" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </WidgetCard>
        )}
      </div>

      {/* ═══ Low Stock Alert Table ═══ */}
      {lowStockParts.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-edge-light">
            <div className="w-8 h-8 rounded-lg bg-error-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-error-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Low Stock Alerts</h3>
            <span className="text-xs font-bold text-error-500 bg-error-500/10 px-2 py-0.5 rounded-full">{lowStockParts.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-hover/50">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Part Name</th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Category</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Current</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Min Required</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-edge-light hover:bg-hover transition-colors">
                    <td className="py-2.5 px-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-2.5 px-4 text-muted">{typeof p.category === "string" ? p.category : "—"}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-foreground">{p.stockQty}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted">{p.minStockQty}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.stockQty === 0
                          ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                          : "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                      }`}>
                        {p.stockQty === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
