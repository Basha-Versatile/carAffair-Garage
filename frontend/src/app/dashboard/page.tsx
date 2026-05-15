"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tabs, TabKey, getOrdersByStatus, getOrderCounts, Order } from "@/lib/api-orders";
import { Plus, FileText, Phone, Car, Calendar, IndianRupee } from "lucide-react";

function OrderCard({ order }: { order: Order }) {
  const statusStyles: Record<string, string> = {
    open: "bg-primary-light text-primary",
    wip: "bg-warn-light text-warn",
    ready: "bg-ok-light text-ok",
    payment_due: "bg-bad-light text-bad",
    completed: "bg-hover text-muted",
  };

  return (
    <div className="bg-background rounded-lg border border-edge p-4 hover:shadow-md transition-shadow cursor-pointer">
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

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<TabKey, number>>({ open: 0, wip: 0, ready: 0, payment_due: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getOrdersByStatus(activeTab),
      getOrderCounts(),
    ]).then(([orderData, countData]) => {
      setOrders(orderData || []);
      setCounts(countData || { open: 0, wip: 0, ready: 0, payment_due: 0, completed: 0 });
    }).catch(() => {
      setError("Failed to load orders. Please try again.");
    }).finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="p-5">
      {/* Quick Actions */}
      <div className="flex justify-center gap-4 mb-6">
        <button onClick={() => router.push("/dashboard/create-order")}
          className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-primary text-white py-3.5 rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
          <div className="bg-white/15 p-1.5 rounded"><Plus className="w-4 h-4" /></div>
          <span className="text-sm font-medium">Create Repair Order</span>
        </button>
        <button className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-accent text-white py-3.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
          <div className="bg-white/15 p-1.5 rounded"><FileText className="w-4 h-4" /></div>
          <span className="text-sm font-medium">Create Invoice</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-edge mb-5">
        <div className="flex">
          {tabs.map((tab) => {
            const count = counts?.[tab.key] ?? 0;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted hover:text-secondary"}`}>
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[11px] tabular-nums px-1.5 py-px rounded-full ${isActive ? "bg-primary-light text-primary" : "bg-hover text-muted"}`}>
                    {count}
                  </span>
                )}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-3 animate-spin">
            <svg className="w-7 h-7 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(orders || []).map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
