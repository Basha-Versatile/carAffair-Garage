"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getInvoices, Invoice } from "@/lib/api-invoices";
import { Plus, FileText, IndianRupee, Calendar, LayoutGrid, List } from "lucide-react";

type StatusFilter = "all" | "draft" | "sent" | "paid";
type ViewMode = "cards" | "table";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-warn-light text-warn",
  sent: "bg-primary-light text-primary",
  paid: "bg-ok-light text-ok",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    setLoading(true);
    getInvoices()
      .then(data => setInvoices(data || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
  const counts = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === "draft").length,
    sent: invoices.filter(i => i.status === "sent").length,
    paid: invoices.filter(i => i.status === "paid").length,
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-foreground">Invoices</h1>
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
          <button onClick={() => router.push("/dashboard/create-invoice")}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-edge mb-5">
        <div className="flex">
          {(["all", "draft", "sent", "paid"] as StatusFilter[]).map(tab => {
            const isActive = filter === tab;
            return (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted hover:text-secondary"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {counts[tab] > 0 && (
                  <span className={`ml-1.5 text-[11px] px-1.5 py-px rounded-full ${isActive ? "bg-primary-light text-primary" : "bg-hover text-muted"}`}>
                    {counts[tab]}
                  </span>
                )}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-3 animate-spin">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm text-muted">Loading invoices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-3">
            <FileText className="w-7 h-7 text-muted" />
          </div>
          <p className="text-sm text-muted">No invoices found</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(inv => (
            <div key={inv.id} onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
              className="bg-background rounded-lg border border-edge p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted mt-0.5">{inv.type === "tax" ? "Tax Invoice" : "Proforma"}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status] ?? "bg-hover text-muted"}`}>
                  {inv.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-secondary font-medium">{inv.customerName}</p>
                {(inv.date || inv.createdAt) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Calendar className="w-3 h-3" />
                    {inv.date || inv.createdAt?.split("T")[0]}
                  </div>
                )}
                {inv.tags && inv.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {inv.tags.map(t => (
                      <span key={t} className="text-[10px] bg-dim text-muted px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-edge-light flex items-center justify-between">
                <span className="text-xs text-muted">{inv.items?.length || 0} items</span>
                <div className="flex items-center gap-0.5 text-sm font-semibold text-foreground">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {(inv.grandTotal ?? 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-background rounded-lg border border-edge overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dim border-b border-edge">
                <th className="text-left px-4 py-3 font-medium text-secondary">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-secondary">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-secondary">Date</th>
                <th className="text-left px-4 py-3 font-medium text-secondary">Items</th>
                <th className="text-left px-4 py-3 font-medium text-secondary">Status</th>
                <th className="text-right px-4 py-3 font-medium text-secondary">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-light">
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                  className="hover:bg-hover transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted">{inv.type === "tax" ? "Tax" : "Proforma"}</p>
                  </td>
                  <td className="px-4 py-3 text-secondary">{inv.customerName}</td>
                  <td className="px-4 py-3 text-muted">{inv.date || inv.createdAt?.split("T")[0] || "-"}</td>
                  <td className="px-4 py-3 text-muted">{inv.items?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status] ?? "bg-hover text-muted"}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {(inv.grandTotal ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
