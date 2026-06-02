"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft, Phone, Mail, MapPin, Hash, Users, Car, FileText, IndianRupee,
  CheckCircle, XCircle, Building2, Calendar, Power, Loader2, AlertTriangle,
  ShieldOff, UserX, ServerOff,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

interface Garage {
  id: string;
  name: string;
  ownerName: string;
  gstNumber: string;
  email: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  adminUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface GarageDashboard {
  totalCustomers: number;
  totalVehicles: number;
  totalOrders: number;
  openOrders: number;
  wipOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

export default function GarageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [garage, setGarage] = useState<Garage | null>(null);
  const [stats, setStats] = useState<GarageDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  async function handleToggleActive() {
    if (!garage || toggling) return;
    setToggling(true);
    try {
      const updated = await api.put<Garage>(`/api/garages/${id}/toggle-active`, {});
      setGarage(updated);
    } catch {
      // ignore
    } finally {
      setToggling(false);
      setShowDeactivateModal(false);
    }
  }

  function handleDeactivateClick() {
    if (garage?.isActive) {
      setShowDeactivateModal(true);
    } else {
      handleToggleActive();
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [garageData, statsData] = await Promise.all([
          api.get<Garage>(`/api/garages/${id}`),
          api.get<GarageDashboard>(`/api/garages/${id}/dashboard`),
        ]);
        setGarage(garageData);
        setStats(statsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load garage details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !garage) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/super-admin/garages")}
            className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Garage Details</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-sm text-bad">{error || "Garage not found"}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Customers",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary-light",
    },
    {
      label: "Total Vehicles",
      value: stats?.totalVehicles ?? 0,
      icon: Car,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      sub: `${stats?.openOrders ?? 0} open, ${stats?.wipOrders ?? 0} WIP`,
      icon: FileText,
      color: "text-warn",
      bg: "bg-warn-light",
    },
    {
      label: "Total Revenue",
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-ok",
      bg: "bg-ok-light",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/super-admin/garages")}
          className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{garage.name}</h1>
        {garage.isActive ? (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-ok-light text-ok">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bad-light text-bad">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleDeactivateClick}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              garage.isActive
                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            }`}
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            {garage.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Garage Info Card */}
        <div className="bg-background rounded-lg border border-edge overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
            <Building2 className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-secondary">Garage Information</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-0.5">Garage Name</p>
                <p className="text-sm font-medium text-foreground">{garage.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Owner Name</p>
                <p className="text-sm font-medium text-foreground">{garage.ownerName || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Phone</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">{garage.phone || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Email</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">{garage.email || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">GST Number</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">{garage.gstNumber || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Address</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">{garage.address || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Created</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">
                  {garage.createdAt
                    ? new Date(garage.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div>
          <h3 className="text-sm font-semibold text-secondary mb-3">Dashboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-background rounded-lg border border-edge p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted font-medium">{card.label}</p>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-muted mt-1">{card.sub}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Orders Breakdown Chart + Today's Orders */}
        {stats && (stats.totalOrders > 0 || stats.todayOrders > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Orders by Status — Donut */}
            <div className="bg-background rounded-lg border border-edge p-5">
              <h3 className="text-sm font-semibold text-secondary mb-4">Orders by Status</h3>
              <div className="h-52 flex items-center justify-center">
                {stats.totalOrders === 0 ? (
                  <p className="text-sm text-muted">No orders yet</p>
                ) : (() => {
                  const completedOrders = stats.totalOrders - stats.openOrders - stats.wipOrders;
                  const donutData = [
                    { name: "Open", value: stats.openOrders, color: "#dc2626" },
                    { name: "WIP", value: stats.wipOrders, color: "#d97706" },
                    { name: "Completed", value: completedOrders > 0 ? completedOrders : 0, color: "#16a34a" },
                  ].filter(d => d.value > 0);
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                          {stats.totalOrders}
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-[11px]">
                          Total
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              {stats.totalOrders > 0 && (
                <div className="flex items-center justify-center gap-5 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    Open <span className="font-semibold text-foreground ml-0.5">{stats.openOrders}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    WIP <span className="font-semibold text-foreground ml-0.5">{stats.wipOrders}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Completed <span className="font-semibold text-foreground ml-0.5">{Math.max(0, stats.totalOrders - stats.openOrders - stats.wipOrders)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Orders + Quick Stats */}
            <div className="bg-background rounded-lg border border-edge p-5 flex flex-col">
              <h3 className="text-sm font-semibold text-secondary mb-4">Activity Summary</h3>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-brand-500/5 border border-brand-500/10">
                  <div>
                    <p className="text-xs text-muted mb-0.5">Today&apos;s Orders</p>
                    <p className="text-2xl font-bold text-foreground">{stats.todayOrders ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-brand-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.openOrders}</p>
                    <p className="text-[11px] text-muted mt-0.5">Open Orders</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.wipOrders}</p>
                    <p className="text-[11px] text-muted mt-0.5">Work in Progress</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                  <p className="text-xs text-muted">Completed Orders</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.max(0, stats.totalOrders - stats.openOrders - stats.wipOrders)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !toggling && setShowDeactivateModal(false)}
          />
          <div className="relative bg-background rounded-xl border border-edge shadow-2xl w-full max-w-md overflow-hidden">
            {/* Warning Header */}
            <div className="bg-red-50 dark:bg-red-500/10 px-6 py-5 flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5.5 h-5.5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
                  Deactivate Garage
                </h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-0.5">
                  You are about to deactivate <span className="font-semibold">{garage.name}</span>
                </p>
              </div>
            </div>

            {/* Consequences */}
            <div className="px-6 py-5 space-y-3.5">
              <p className="text-sm font-medium text-foreground">
                The following will happen immediately:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <ShieldOff className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Portal access blocked</p>
                    <p className="text-xs text-muted mt-0.5">
                      The garage admin and all staff members will be immediately locked out of the dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <ServerOff className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">All API requests rejected</p>
                    <p className="text-xs text-muted mt-0.5">
                      Every API call from this garage will return a 403 error. Orders, invoices, and customer data cannot be accessed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <UserX className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Active sessions terminated</p>
                    <p className="text-xs text-muted mt-0.5">
                      Any currently logged-in users from this garage will see a &quot;suspended&quot; screen on their next action.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  No data will be deleted. You can reactivate this garage at any time to restore full access.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-dim border-t border-edge flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                disabled={toggling}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-foreground hover:bg-hover rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {toggling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                Deactivate Garage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
