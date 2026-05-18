"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById, updateInvoiceStatus, Invoice } from "@/lib/api-invoices";
import { ArrowLeft, FileText, Phone, IndianRupee, Wrench, Package } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-warn text-white",
  sent: "bg-primary text-white",
  paid: "bg-ok text-white",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getInvoiceById(id)
      .then(setInvoice)
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!invoice || updating) return;
    setUpdating(true);
    try {
      const updated = await updateInvoiceStatus(invoice.id, newStatus);
      setInvoice(updated);
    } catch { /* keep current state */ }
    finally { setUpdating(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-sm text-muted">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-sm text-bad">Invoice not found</p>
      </div>
    );
  }

  const serviceItems = (invoice.items || []).filter(i => i.itemType === "service");
  const partItems = (invoice.items || []).filter(i => i.itemType === "part");
  // Items without itemType (legacy)
  const otherItems = (invoice.items || []).filter(i => !i.itemType);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[invoice.status] ?? "bg-hover text-muted"}`}>
          {invoice.status.toUpperCase()}
        </span>
      </div>

      {/* Invoice Header */}
      <div className="bg-background rounded-xl border border-edge p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{invoice.invoiceNumber}</h1>
            <p className="text-xs text-muted">{invoice.type === "tax" ? "Tax Invoice" : "Proforma Invoice"} {invoice.date ? `- ${invoice.date}` : ""}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted uppercase mb-1">Customer</p>
            <p className="text-sm font-semibold text-foreground">{invoice.customerName}</p>
            {invoice.customerPhone && (
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-muted" />
                <span className="text-xs text-secondary">{invoice.customerPhone}</span>
              </div>
            )}
          </div>
          {invoice.placeOfSupply && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Place of Supply</p>
              <p className="text-sm text-secondary">{invoice.placeOfSupply}</p>
            </div>
          )}
        </div>
        {invoice.tags && invoice.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-edge-light">
            {invoice.tags.map(t => (
              <span key={t} className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Services Table */}
      {serviceItems.length > 0 && (
        <div className="bg-background rounded-xl border border-edge mb-4 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
            <Wrench className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-secondary">Services</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge-light text-xs text-muted">
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">Rate</th>
                  <th className="text-right px-3 py-2 font-medium">Disc%</th>
                  <th className="text-right px-3 py-2 font-medium">GST%</th>
                  <th className="text-right px-3 py-2 font-medium">GST Amt</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {serviceItems.map((item, i) => (
                  <tr key={i} className="border-b border-edge-light last:border-0">
                    <td className="px-4 py-2.5 text-foreground">
                      {item.description}
                      {item.gstInclusive && <span className="ml-1.5 text-[10px] text-muted bg-dim px-1 py-0.5 rounded">Incl.</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.qty}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.rate.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.discount ? `${item.discount}%` : "-"}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.gstRate}%</td>
                    <td className="px-3 py-2.5 text-right text-muted">{item.gstAmount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parts Table */}
      {partItems.length > 0 && (
        <div className="bg-background rounded-xl border border-edge mb-4 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
            <Package className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-secondary">Parts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge-light text-xs text-muted">
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">HSN</th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">Rate</th>
                  <th className="text-right px-3 py-2 font-medium">Disc%</th>
                  <th className="text-right px-3 py-2 font-medium">GST%</th>
                  <th className="text-right px-3 py-2 font-medium">GST Amt</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {partItems.map((item, i) => (
                  <tr key={i} className="border-b border-edge-light last:border-0">
                    <td className="px-4 py-2.5 text-foreground">
                      {item.description}
                      {item.gstInclusive && <span className="ml-1.5 text-[10px] text-muted bg-dim px-1 py-0.5 rounded">Incl.</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted">{item.hsnSac || "-"}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.qty}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.rate.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.discount ? `${item.discount}%` : "-"}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.gstRate}%</td>
                    <td className="px-3 py-2.5 text-right text-muted">{item.gstAmount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legacy items (no itemType) */}
      {otherItems.length > 0 && (
        <div className="bg-background rounded-xl border border-edge mb-4 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
            <h3 className="text-sm font-semibold text-secondary">Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge-light text-xs text-muted">
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">Rate</th>
                  <th className="text-right px-3 py-2 font-medium">GST%</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {otherItems.map((item, i) => (
                  <tr key={i} className="border-b border-edge-light last:border-0">
                    <td className="px-4 py-2.5 text-foreground">{item.description}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.qty}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.rate.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 text-right text-secondary">{item.gstRate}%</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-background rounded-xl border border-edge p-5 mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-secondary"><span>Subtotal</span><span>{(invoice.totalAmount ?? 0).toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-secondary"><span>GST</span><span>{(invoice.gstAmount ?? 0).toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between font-bold text-foreground text-base border-t border-edge pt-2">
            <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> Grand Total</span>
            <span>{(invoice.grandTotal ?? 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      {invoice.status !== "paid" && (
        <div className="flex gap-3 pb-6">
          {invoice.status === "draft" && (
            <button onClick={() => handleStatusUpdate("sent")} disabled={updating}
              className="flex-1 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              {updating ? "Updating..." : "Mark as Sent"}
            </button>
          )}
          {(invoice.status === "draft" || invoice.status === "sent") && (
            <button onClick={() => handleStatusUpdate("paid")} disabled={updating}
              className="flex-1 py-3 text-sm font-semibold text-white bg-ok rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
              {updating ? "Updating..." : "Mark as Paid"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
