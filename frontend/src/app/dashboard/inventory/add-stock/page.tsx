"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getParts, Part, addPart, updatePart } from "@/lib/api-inventory";
import { getVendors, Vendor } from "@/lib/api-vehicles";
import {
  ArrowLeft, Search, Package, Plus, X, ChevronDown,
} from "lucide-react";

interface StockForm {
  partId: string;
  partName: string;
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

const EMPTY_FORM: StockForm = {
  partId: "",
  partName: "",
  preferredVendorId: "",
  preferredVendorName: "",
  purchasePrice: 0,
  mrp: 0,
  rackNumber: "",
  stockQty: 0,
  minStockQty: 0,
  maxStockQty: 0,
  comment: "",
};

export default function AddStockPage() {
  const router = useRouter();
  const [form, setForm] = useState<StockForm>({ ...EMPTY_FORM });
  const [parts, setParts] = useState<Part[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Part selection
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const [showNewPartForm, setShowNewPartForm] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartNumber, setNewPartNumber] = useState("");

  useEffect(() => {
    Promise.all([getParts(), getVendors()])
      .then(([p, v]) => {
        setParts(p || []);
        setVendors(v || []);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  function handlePartSelect(part: Part) {
    setForm((prev) => ({
      ...prev,
      partId: part.id,
      partName: part.name,
      purchasePrice: part.purchasePrice || 0,
      mrp: part.mrp || 0,
      rackNumber: part.rackNumber || "",
      stockQty: part.stockQty || 0,
      minStockQty: part.minStockQty || 0,
      maxStockQty: part.maxStockQty || 0,
      preferredVendorId: part.preferredVendorId || "",
      preferredVendorName: part.preferredVendorName || "",
      comment: part.comment || "",
    }));
    setPartModalOpen(false);
  }

  async function handleCreateNewPart() {
    if (!newPartName.trim()) return;
    try {
      const created = await addPart({
        name: newPartName.trim(),
        partNumber: newPartNumber.trim(),
        brand: "",
        category: "",
        mrp: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        stockQty: 0,
        minStockQty: 0,
        rackNumber: "",
        hsnCode: "",
        gstRate: 0,
        unit: "pcs",
      });
      setParts((prev) => [...prev, created]);
      handlePartSelect(created);
      setShowNewPartForm(false);
      setNewPartName("");
      setNewPartNumber("");
    } catch {
      alert("Failed to create part");
    }
  }

  async function handleSave() {
    if (!form.partId) {
      setError("Please select a part");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updatePart(form.partId, {
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

  const filteredParts = (parts || []).filter((p) => {
    const q = partSearch.toLowerCase();
    return !q || (p.name ?? "").toLowerCase().includes(q) || (p.partNumber ?? "").toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
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
        <h1 className="text-base font-semibold text-foreground">Add Stock</h1>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <div className="bg-bad-light text-bad text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Select Part */}
          <div className="bg-background border border-edge rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Select Part</h2>
            {form.partId ? (
              <div className="flex items-center justify-between bg-primary-light rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{form.partName}</span>
                </div>
                <button onClick={() => setForm((prev) => ({ ...prev, partId: "", partName: "" }))}
                  className="text-primary hover:text-primary-hover">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setPartModalOpen(true)}
                className="w-full flex items-center justify-between border border-edge rounded-lg px-4 py-3 text-sm text-muted hover:bg-hover transition-colors">
                <span>Click to select a part...</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
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
              disabled={saving || !form.partId}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              Save Stock
            </button>
          </div>
        </div>
      </div>

      {/* Part Selection Modal */}
      {partModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-edge w-full max-w-lg mx-4 max-h-[80vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Select Part</h3>
              <button onClick={() => { setPartModalOpen(false); setShowNewPartForm(false); }}
                className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  placeholder="Search parts..."
                  className="w-full pl-9 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Part List */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              {filteredParts.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No parts found</p>
              ) : (
                <div className="space-y-1 mt-2">
                  {filteredParts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => handlePartSelect(part)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-hover transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{part.name}</p>
                        <p className="text-xs text-muted">{part.partNumber || "No part#"} &middot; Stock: {part.stockQty ?? 0}</p>
                      </div>
                      <span className="text-xs text-muted">
                        MRP: ₹{(part.mrp ?? 0).toLocaleString("en-IN")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Part */}
            <div className="px-5 py-3 border-t border-edge">
              {showNewPartForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Part name *"
                    className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    placeholder="Part number (optional)"
                    className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowNewPartForm(false); setNewPartName(""); setNewPartNumber(""); }}
                      className="flex-1 px-3 py-2 border border-edge rounded-lg text-sm text-secondary hover:bg-hover transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleCreateNewPart} disabled={!newPartName.trim()}
                      className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50">
                      Create Part
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewPartForm(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:bg-hover rounded-lg px-3 py-2.5 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add New Part
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
