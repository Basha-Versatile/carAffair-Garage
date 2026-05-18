"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPartById, Part, updatePart, getStockHistory, StockHistory } from "@/lib/api-inventory";
import { getVendors, Vendor } from "@/lib/api-vehicles";
import {
  ArrowLeft, Package, ArrowDownToLine, ArrowUpFromLine, Loader2,
} from "lucide-react";

interface StockForm {
  preferredVendorId: string;
  preferredVendorName: string;
  purchasePrice: number;
  mrp: number;
  rackNumber: string;
  stockQty: number;
  minStockQty: number;
  maxStockQty: number;
  comment: string;
}

export default function EditStockPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [part, setPart] = useState<Part | null>(null);
  const [form, setForm] = useState<StockForm>({
    preferredVendorId: "",
    preferredVendorName: "",
    purchasePrice: 0,
    mrp: 0,
    rackNumber: "",
    stockQty: 0,
    minStockQty: 0,
    maxStockQty: 0,
    comment: "",
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getPartById(id), getVendors(), getStockHistory(id)])
      .then(([p, v, h]) => {
        if (!p) {
          setError("Part not found");
          return;
        }
        setPart(p);
        setForm({
          preferredVendorId: p.preferredVendorId || "",
          preferredVendorName: p.preferredVendorName || "",
          purchasePrice: p.purchasePrice || 0,
          mrp: p.mrp || 0,
          rackNumber: p.rackNumber || "",
          stockQty: p.stockQty || 0,
          minStockQty: p.minStockQty || 0,
          maxStockQty: p.maxStockQty || 0,
          comment: p.comment || "",
        });
        setVendors(v || []);
        setHistory(h || []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updatePart(id, {
        purchasePrice: form.purchasePrice,
        mrp: form.mrp,
        rackNumber: form.rackNumber,
        stockQty: form.stockQty,
        minStockQty: form.minStockQty,
        maxStockQty: form.maxStockQty,
        preferredVendorId: form.preferredVendorId,
        preferredVendorName: form.preferredVendorName,
        comment: form.comment,
      });
      router.push("/dashboard/inventory");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save stock");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!part) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-bad">{error || "Part not found"}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-foreground">Edit Stock</h1>
          <p className="text-xs text-muted">{part.name} {part.partNumber ? `(${part.partNumber})` : ""}</p>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <div className="bg-bad-light text-bad text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Part Info */}
          <div className="bg-primary-light rounded-lg px-5 py-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">{part.name}</p>
              <p className="text-xs text-primary/70">
                {part.partNumber || "No part#"} &middot; {part.brand || "No brand"} &middot; {part.category || "No category"}
              </p>
            </div>
          </div>

          {/* Stock Details */}
          <div className="bg-background border border-edge rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Stock Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preferred Vendor */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Preferred Vendor</label>
                <select
                  value={form.preferredVendorId}
                  onChange={(e) => {
                    const v = vendors.find((v) => v.id === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      preferredVendorId: e.target.value,
                      preferredVendorName: v?.name || "",
                    }));
                  }}
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                  <option value="">Select Vendor</option>
                  {(vendors || []).map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Purchase Price (Without GST)</label>
                <input
                  type="number"
                  value={form.purchasePrice || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">MRP</label>
                <input
                  type="number"
                  value={form.mrp || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, mrp: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Rack ID */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Rack ID</label>
                <input
                  type="text"
                  value={form.rackNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, rackNumber: e.target.value }))}
                  placeholder="e.g. A1-03"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Current Stock */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Current Stock</label>
                <input
                  type="number"
                  value={form.stockQty || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, stockQty: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Min Stock */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Min Stock</label>
                <input
                  type="number"
                  value={form.minStockQty || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, minStockQty: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Max Stock */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Max Stock</label>
                <input
                  type="number"
                  value={form.maxStockQty || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxStockQty: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-secondary mb-1.5">Comment</label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Add any notes about this stock..."
                rows={3}
                className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              Save Stock
            </button>
          </div>

          {/* Inventory History */}
          <div className="bg-background border border-edge rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Inventory History</h2>
            <p className="text-xs text-muted mb-3">Stockin / Stockout data</p>

            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted">No inventory history yet</p>
              </div>
            ) : (
              <div className="bg-background rounded-lg border border-edge overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dim border-b border-edge">
                        <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Date</th>
                        <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Stockin / Stockout</th>
                        <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Ref RO/PO</th>
                        <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Change by</th>
                        <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Mode</th>
                        <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge-light">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-hover transition-colors">
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">{h.date || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {h.type === "stockin" ? (
                              <span className="inline-flex items-center gap-1 text-ok font-medium">
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                +{h.qty}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-bad font-medium">
                                <ArrowUpFromLine className="w-3.5 h-3.5" />
                                -{h.qty}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-secondary whitespace-nowrap">{h.refNumber || "-"}</td>
                          <td className="px-4 py-3 text-secondary whitespace-nowrap">{h.changedBy || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-medium bg-dim text-secondary px-2 py-0.5 rounded capitalize">
                              {h.mode || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted max-w-[200px] truncate">{h.comment || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
