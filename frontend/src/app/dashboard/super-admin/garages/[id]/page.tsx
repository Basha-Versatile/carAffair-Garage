"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft, Phone, Mail, MapPin, Hash, Users, Car, FileText, IndianRupee,
  CheckCircle, XCircle, Building2, Calendar,
} from "lucide-react";

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

        {/* Today's Orders */}
        {stats && (
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary">Today&apos;s Orders</p>
              <span className="text-lg font-bold text-foreground">
                {stats.todayOrders ?? 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
