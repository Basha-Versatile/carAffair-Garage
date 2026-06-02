"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { tabs, TabKey, getOrders, getOrdersByStatus, getOrderCounts, Order } from "@/lib/api-orders";
import { getCustomers } from "@/lib/api-customers";
import { getParts, Part } from "@/lib/api-inventory";
import { canManage, isGarageStaff, isSuperAdmin, getUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { updateAssignmentStatus, type ServiceAssignment } from "@/lib/api-orders";
import {
  Plus, FileText, Phone, Car, Calendar, IndianRupee, LayoutGrid, List,
  TrendingUp, TrendingDown, Users, AlertTriangle, ClipboardList,
  Wrench, CheckCircle2, Clock, Loader2, Building2, Palette,
  ChevronRight, XCircle, CheckCircle, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

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
    payment_due: "bg-orange-100 text-orange-600",
    completed: "bg-ok-light text-ok",
    cancelled: "bg-bad-light text-bad",
  };

  return (
    <div onClick={onClick} className="glass-card-light p-4 hover:shadow-theme-lg transition-shadow cursor-pointer">
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
  Completed: "#16a34a",
  Cancelled: "#e11d48",
};

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
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Welcome, {user?.name || "Staff"}</h1>
        <p className="text-sm text-muted mt-0.5">{user?.staffTitle || "Staff Member"}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks" value={tasks.length.toString()} icon={ClipboardList} iconBg="bg-brand-500" />
        <KpiCard label="Pending" value={pending.toString()} icon={Clock} iconBg="bg-gray-400" />
        <KpiCard label="In Progress" value={inProgress.toString()} icon={Wrench} iconBg="bg-warning-500" />
        <KpiCard label="Completed" value={completed.toString()} icon={CheckCircle2} iconBg="bg-success-500" />
      </div>

      {/* Progress bar */}
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

      {/* Active Tasks */}
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

      {/* Completed Tasks (collapsible) */}
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
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Platform overview and management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active Garages"
          value={s.activeGarages.toLocaleString()}
          icon={Building2}
          iconBg="bg-success-500"
        />
        <KpiCard
          label="Inactive Garages"
          value={s.inactiveGarages.toLocaleString()}
          icon={Building2}
          iconBg="bg-error-500"
        />
        <KpiCard
          label="Pending Garage Requests"
          value={s.pendingGarageRequests.toLocaleString()}
          icon={ClipboardList}
          iconBg="bg-warning-500"
        />
        <KpiCard
          label="Pending Brand Requests"
          value={s.pendingBrandRequests.toLocaleString()}
          icon={Palette}
          iconBg="bg-brand-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Garage Status — Donut */}
        <div
          onClick={() => router.push("/dashboard/super-admin/garages")}
          className="glass-card p-5 cursor-pointer hover:shadow-theme-lg transition-shadow group"
        >
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
                  <Pie
                    data={[
                      { name: "Active", value: s.activeGarages },
                      { name: "Inactive", value: s.inactiveGarages },
                    ].filter(d => d.value > 0)}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#16a34a" />
                    {s.inactiveGarages > 0 && <Cell fill="#dc2626" />}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                    {s.totalGarages}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-[11px]">
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-5 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Active <span className="font-semibold text-foreground ml-0.5">{s.activeGarages}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Inactive <span className="font-semibold text-foreground ml-0.5">{s.inactiveGarages}</span>
            </div>
          </div>
        </div>

        {/* Garage Requests — Donut */}
        <div
          onClick={() => router.push("/dashboard/super-admin/garage-requests")}
          className="glass-card p-5 cursor-pointer hover:shadow-theme-lg transition-shadow group"
        >
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
                  <Pie
                    data={[
                      { name: "Pending", value: s.pendingGarageRequests },
                      { name: "Approved", value: s.approvedGarageRequests },
                      { name: "Rejected", value: s.rejectedGarageRequests },
                    ].filter(d => d.value > 0)}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {[
                      { name: "Pending", color: "#f59e0b" },
                      { name: "Approved", color: "#16a34a" },
                      { name: "Rejected", color: "#dc2626" },
                    ]
                      .filter(d => {
                        const val = d.name === "Pending" ? s.pendingGarageRequests : d.name === "Approved" ? s.approvedGarageRequests : s.rejectedGarageRequests;
                        return val > 0;
                      })
                      .map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                    {s.totalGarageRequests}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-[11px]">
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Pending <span className="font-semibold text-foreground ml-0.5">{s.pendingGarageRequests}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Approved <span className="font-semibold text-foreground ml-0.5">{s.approvedGarageRequests}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Rejected <span className="font-semibold text-foreground ml-0.5">{s.rejectedGarageRequests}</span>
            </div>
          </div>
        </div>

        {/* Brand Requests — Donut */}
        <div
          onClick={() => router.push("/dashboard/super-admin/brand-requests")}
          className="glass-card p-5 cursor-pointer hover:shadow-theme-lg transition-shadow group"
        >
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
                  <Pie
                    data={[
                      { name: "Pending", value: s.pendingBrandRequests },
                      { name: "Approved", value: s.approvedBrandRequests },
                      { name: "Rejected", value: s.rejectedBrandRequests },
                    ].filter(d => d.value > 0)}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {[
                      { name: "Pending", color: "#f59e0b" },
                      { name: "Approved", color: "#16a34a" },
                      { name: "Rejected", color: "#dc2626" },
                    ]
                      .filter(d => {
                        const val = d.name === "Pending" ? s.pendingBrandRequests : d.name === "Approved" ? s.approvedBrandRequests : s.rejectedBrandRequests;
                        return val > 0;
                      })
                      .map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                    {s.totalBrandRequests}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-[11px]">
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Pending <span className="font-semibold text-foreground ml-0.5">{s.pendingBrandRequests}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Approved <span className="font-semibold text-foreground ml-0.5">{s.approvedBrandRequests}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Rejected <span className="font-semibold text-foreground ml-0.5">{s.rejectedBrandRequests}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => router.push("/dashboard/super-admin/garages")}
          className="glass-card p-4 flex items-center gap-3 hover:shadow-theme-lg transition-shadow text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Manage Garages</p>
            <p className="text-xs text-muted">{s.totalGarages} total</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
        </button>

        <button
          onClick={() => router.push("/dashboard/super-admin/garage-requests")}
          className="glass-card p-4 flex items-center gap-3 hover:shadow-theme-lg transition-shadow text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Garage Requests</p>
            <p className="text-xs text-muted">{s.pendingGarageRequests} pending</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
        </button>

        <button
          onClick={() => router.push("/dashboard/super-admin/brand-requests")}
          className="glass-card p-4 flex items-center gap-3 hover:shadow-theme-lg transition-shadow text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Brand Requests</p>
            <p className="text-xs text-muted">{s.pendingBrandRequests} pending</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors shrink-0" />
        </button>
      </div>
    </div>
  );
}

/* ── Main dashboard ───────────────────────────────── */

export default function DashboardPage() {
  if (isSuperAdmin()) return <SuperAdminDashboard />;

  const staffMode = isGarageStaff();
  if (staffMode) return <StaffDashboard />;

  return <AdminDashboard />;
}

function AdminDashboard() {
  const router = useRouter();

  // ─── Analytics state ───
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [lowStockParts, setLowStockParts] = useState<Part[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // ─── Orders list state (existing) ───
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<TabKey, number>>({ open: 0, wip: 0, payment_due: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState<PageSize>(PAGE_SIZES[0]);

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
        setCounts(countsData || { open: 0, wip: 0, completed: 0, cancelled: 0 });
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
    setOrderPage(1);
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
      { name: "Completed", value: counts.completed },
      { name: "Cancelled", value: counts.cancelled },
    ].filter((d) => d.value > 0);
  }, [counts]);

  return (
    <div className="p-5 space-y-6">
      {/* ═══ Quick Actions ═══ */}
      {(canManage("ORDERS") || canManage("INVOICES")) && (
        <div className="flex justify-center gap-4">
          {canManage("ORDERS") && (
            <button
              onClick={() => router.push("/dashboard/create-order")}
              className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-brand-500/90 backdrop-blur-sm text-white py-3.5 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-md border border-white/10"
            >
              <div className="bg-white/20 p-1.5 rounded">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Create Repair Order</span>
            </button>
          )}
          {canManage("INVOICES") && (
            <button
              onClick={() => router.push("/dashboard/create-invoice")}
              className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-brand-500/90 backdrop-blur-sm text-white py-3.5 rounded-xl hover:bg-brand-600 transition-colors shadow-theme-md border border-white/10"
            >
              <div className="bg-white/20 p-1.5 rounded">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Create Invoice</span>
            </button>
          )}
        </div>
      )}

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
        ) : (() => {
          const totalPages = Math.max(1, Math.ceil(orders.length / orderPageSize));
          const safePage = Math.min(orderPage, totalPages);
          const start = (safePage - 1) * orderPageSize;
          const pagedOrders = orders.slice(start, start + orderPageSize);
          return viewMode === "cards" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {pagedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  />
                ))}
              </div>
              <div className="glass-card overflow-hidden mt-3">
                <Pagination
                  total={orders.length}
                  page={safePage}
                  pageSize={orderPageSize}
                  onPageChange={setOrderPage}
                  onPageSizeChange={setOrderPageSize}
                />
              </div>
            </>
          ) : (
            <div className="glass-card overflow-hidden">
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
                  {pagedOrders.map((order) => {
                    const statusStyles: Record<string, string> = {
                      open: "bg-primary-light text-primary",
                      wip: "bg-warn-light text-warn",
                      completed: "bg-ok-light text-ok",
                      cancelled: "bg-bad-light text-bad",
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
              <Pagination
                total={orders.length}
                page={safePage}
                pageSize={orderPageSize}
                onPageChange={setOrderPage}
                onPageSizeChange={setOrderPageSize}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
