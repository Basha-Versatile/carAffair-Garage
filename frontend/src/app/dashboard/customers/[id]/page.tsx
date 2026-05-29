"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, User, Car, FileText,
  ClipboardList, Loader2, ExternalLink, Download, MessageCircle,
  Plus, IndianRupee,
} from "lucide-react";
import { getCustomerById, getVehiclesByCustomer, Customer, Vehicle } from "@/lib/api-vehicles";
import { getOrdersByCustomer, Order } from "@/lib/api-orders";
import { getInvoices, Invoice } from "@/lib/api-invoices";
import { getAccessToken } from "@/lib/auth";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "bg-primary-light text-primary" },
  wip:         { label: "WIP",         cls: "bg-warn-light text-warn" },
  payment_due: { label: "Payment Due", cls: "bg-orange-100 text-orange-600" },
  completed:   { label: "Completed",   cls: "bg-ok-light text-ok" },
  cancelled:   { label: "Cancelled",   cls: "bg-bad-light text-bad" },
};

type Tab = "orders" | "vehicles";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [invoiceMap, setInvoiceMap] = useState<Record<string, Invoice>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      getCustomerById(customerId),
      getOrdersByCustomer(customerId),
      getVehiclesByCustomer(customerId),
      getInvoices(),
    ])
      .then(([c, o, v, invoices]) => {
        setCustomer(c ?? null);
        setOrders(o || []);
        setVehicles(v || []);
        // Build map: repairOrderId → Invoice
        const map: Record<string, Invoice> = {};
        for (const inv of invoices || []) {
          if (inv.repairOrderId) map[inv.repairOrderId] = inv;
        }
        setInvoiceMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-sm text-muted">Customer not found.</p>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.grandTotal || o.amount || 0), 0);

  const outstanding = orders
    .filter((o) => o.status !== "completed" && o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.grandTotal || o.amount || 0), 0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  function downloadInvoicePdf(invoiceId: string) {
    const token = getAccessToken();
    const url = `${API_BASE}/api/invoices/${invoiceId}/pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "invoice.pdf";
        a.click();
        URL.revokeObjectURL(a.href);
      });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </button>

      {/* Customer Header */}
      <div className="bg-background rounded-lg border border-edge p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{(customer.name ?? "?").charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {customer.phone && (
                <span className="flex items-center gap-1 text-sm text-secondary">
                  <Phone className="w-3.5 h-3.5 text-muted" /> {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1 text-sm text-secondary">
                  <Mail className="w-3.5 h-3.5 text-muted" /> {customer.email}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1 text-sm text-muted">
                  <MapPin className="w-3.5 h-3.5" /> {customer.address}
                </span>
              )}
            </div>
            {customer.gstin && (
              <p className="text-xs text-muted mt-1">GSTIN: {customer.gstin}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {customer.phone && (
              <a href={`https://wa.me/91${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="p-2 text-ok hover:bg-ok-light rounded-lg transition-colors" title="WhatsApp">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            <Link href="/dashboard/create-order"
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors">
              <Plus className="w-4 h-4" /> Create Order
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ClipboardList, color: "text-primary" },
          { label: "Vehicles", value: vehicles.length, icon: Car, color: "text-accent" },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-ok" },
          { label: "Outstanding", value: `₹${outstanding.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-warn" },
        ].map((stat) => (
          <div key={stat.label} className="bg-background rounded-lg border border-edge p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dim rounded-lg p-1 w-fit">
        {(["orders", "vehicles"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-secondary"
            }`}>
            {t === "orders" ? `Orders (${orders.length})` : `Vehicles (${vehicles.length})`}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-background rounded-lg border border-edge p-8 text-center">
              <ClipboardList className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No orders found for this customer.</p>
            </div>
          ) : (
            orders.map((order) => {
              const st = STATUS_STYLES[order.status] || { label: order.status || "-", cls: "bg-dim text-muted" };
              const invoice = invoiceMap[order.id];
              return (
                <div key={order.id} className="bg-background rounded-lg border border-edge p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-foreground">{order.jobCard || "-"}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-secondary">
                        <Car className="w-3.5 h-3.5 text-muted" />
                        <span>{order.vehicle || "-"}</span>
                        <span className="text-muted font-mono text-xs">({order.vehicleNumber || "-"})</span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-foreground">₹{(order.grandTotal || order.amount || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-edge-light">
                    <Link href={`/dashboard/orders/${order.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary bg-primary-light rounded-md hover:bg-primary/10 transition-colors">
                      <ExternalLink className="w-3 h-3" /> View Order
                    </Link>
                    {order.estimateToken && (
                      <Link href={`/estimate/${order.estimateToken}`} target="_blank"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-accent bg-accent-light rounded-md hover:bg-accent/10 transition-colors">
                        <FileText className="w-3 h-3" /> Estimate
                      </Link>
                    )}
                    {invoice && (
                      <button onClick={() => downloadInvoicePdf(invoice.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-ok bg-ok-light rounded-md hover:bg-ok/10 transition-colors">
                        <Download className="w-3 h-3" /> Invoice PDF
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vehicles Tab */}
      {tab === "vehicles" && (
        <div className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="bg-background rounded-lg border border-edge p-8 text-center">
              <Car className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No vehicles found for this customer.</p>
            </div>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="bg-background rounded-lg border border-edge p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{v.registrationNumber || "-"}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      {[v.brandName, v.modelName].filter(Boolean).join(" ") || "Unknown"}
                      {v.fuelType && <span className="text-muted"> &middot; {v.fuelType}</span>}
                      {v.category && <span className="text-muted"> &middot; {v.category}</span>}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {v.engineNumber && <span className="text-xs text-muted">Engine: {v.engineNumber}</span>}
                      {v.insuranceExpiry && <span className="text-xs text-muted">Insurance Exp: {v.insuranceExpiry}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
