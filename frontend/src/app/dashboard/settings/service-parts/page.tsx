"use client";

import { useState, useEffect, useMemo } from "react";
import { canManage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  ArrowLeft,
  Loader2,
  Wrench,
  Cog,
  X,
  Save,
} from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import {
  GarageService,
  getGarageServices,
  createGarageService,
  updateGarageService,
} from "@/lib/api-garage-services";
import {
  Part,
  getParts,
  addPart,
  updatePart,
} from "@/lib/api-inventory";

type TabKey = "services" | "parts";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

/* ── Service form defaults ── */
const EMPTY_SERVICE: Omit<GarageService, "id"> = {
  name: "",
  price: 0,
  sacNumber: "",
  isGeneric: true,
  hasGst: true,
  gstRate: 18,
};

/* ── Part form defaults ── */
const EMPTY_PART: Omit<Part, "id"> = {
  name: "",
  partNumber: "",
  brand: "",
  category: "",
  mrp: 0,
  sellingPrice: 0,
  purchasePrice: 0,
  stockQty: 0,
  minStockQty: 0,
  rackNumber: "",
  hsnCode: "",
  gstRate: 18,
  unit: "Pcs",
};

/* ═══════════════════════════════════════════
   Service columns
   ═══════════════════════════════════════════ */
function makeServiceColumns(onEdit: (s: GarageService) => void): DataColumn<GarageService>[] {
  return [
    {
      key: "name",
      header: "Name",
      render: (s) => <span className="font-medium text-foreground">{s.name}</span>,
      sortValue: (s) => s.name,
    },
    {
      key: "sacNumber",
      header: "SAC",
      render: (s) => <span className="text-muted font-mono text-xs">{s.sacNumber || "-"}</span>,
    },
    {
      key: "gstRate",
      header: "GST %",
      align: "right",
      render: (s) => <span className="text-muted">{s.hasGst ? `${s.gstRate}%` : "-"}</span>,
      sortValue: (s) => s.gstRate,
    },
    {
      key: "price",
      header: "MRP",
      align: "right",
      render: (s) => (
        <span className="font-semibold text-foreground tabular-nums">
          ₹{(s.price ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortValue: (s) => s.price ?? 0,
    },
    {
      key: "edit",
      header: "Edit",
      align: "right",
      render: (s) =>
        canManage("SETTINGS") ? (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(s); }}
            className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];
}

/* ═══════════════════════════════════════════
   Part columns
   ═══════════════════════════════════════════ */
function makePartColumns(onEdit: (p: Part) => void): DataColumn<Part>[] {
  return [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          <p className="text-xs text-muted font-mono">{p.partNumber || "-"}</p>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: "category",
      header: "Category",
      render: (p) => <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{p.category || "-"}</span>,
      filterValue: (p) => p.category || "",
    },
    {
      key: "hsnCode",
      header: "HSN",
      render: (p) => <span className="text-muted font-mono text-xs">{p.hsnCode || "-"}</span>,
    },
    {
      key: "gstRate",
      header: "GST %",
      align: "right",
      render: (p) => <span className="text-muted">{p.gstRate ? `${p.gstRate}%` : "-"}</span>,
      sortValue: (p) => p.gstRate,
    },
    {
      key: "mrp",
      header: "MRP",
      align: "right",
      render: (p) => (
        <span className="font-semibold text-foreground tabular-nums">
          ₹{(p.mrp ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortValue: (p) => p.mrp ?? 0,
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (p) => (
        <span className={`font-medium tabular-nums ${(p.stockQty ?? 0) <= (p.minStockQty ?? 0) ? "text-bad" : "text-foreground"}`}>
          {p.stockQty ?? 0}
        </span>
      ),
      sortValue: (p) => p.stockQty ?? 0,
    },
    {
      key: "edit",
      header: "Edit",
      align: "right",
      render: (p) =>
        canManage("SETTINGS") ? (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(p); }}
            className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function ServicePartsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("services");
  const [search, setSearch] = useState("");

  // data
  const [services, setServices] = useState<GarageService[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form modal
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<GarageService | null>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [saving, setSaving] = useState(false);

  // service form state
  const [svcForm, setSvcForm] = useState(EMPTY_SERVICE);
  // part form state
  const [partForm, setPartForm] = useState(EMPTY_PART);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [svcData, partData] = await Promise.all([
        getGarageServices().catch(() => []),
        getParts().catch(() => []),
      ]);
      setServices(svcData || []);
      setParts(partData || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // filter
  const query = search.toLowerCase();
  const filteredServices = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(query) || (s.sacNumber ?? "").toLowerCase().includes(query)),
    [services, query],
  );
  const filteredParts = useMemo(
    () =>
      parts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.partNumber ?? "").toLowerCase().includes(query) ||
          (p.category ?? "").toLowerCase().includes(query) ||
          (p.hsnCode ?? "").toLowerCase().includes(query),
      ),
    [parts, query],
  );

  // columns
  const serviceColumns = useMemo(() => makeServiceColumns(openEditService), []);
  const partColumns = useMemo(() => makePartColumns(openEditPart), []);

  /* ── Open forms ── */
  function openAddService() {
    setEditingService(null);
    setSvcForm({ ...EMPTY_SERVICE });
    setShowForm(true);
  }
  function openEditService(s: GarageService) {
    setEditingService(s);
    setSvcForm({
      name: s.name,
      price: s.price,
      sacNumber: s.sacNumber || "",
      isGeneric: s.isGeneric,
      hasGst: s.hasGst,
      gstRate: s.gstRate,
    });
    setShowForm(true);
  }
  function openAddPart() {
    setEditingPart(null);
    setPartForm({ ...EMPTY_PART });
    setShowForm(true);
  }
  function openEditPart(p: Part) {
    setEditingPart(p);
    setPartForm({
      name: p.name,
      partNumber: p.partNumber || "",
      brand: p.brand || "",
      category: p.category || "",
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      purchasePrice: p.purchasePrice,
      stockQty: p.stockQty,
      minStockQty: p.minStockQty,
      rackNumber: p.rackNumber || "",
      hsnCode: p.hsnCode || "",
      gstRate: p.gstRate,
      unit: p.unit || "Pcs",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
    setEditingPart(null);
  }

  /* ── Save ── */
  async function handleSaveService() {
    if (!svcForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingService) {
        const updated = await updateGarageService(editingService.id, svcForm);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await createGarageService(svcForm);
        setServices((prev) => [created, ...prev]);
      }
      closeForm();
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePart() {
    if (!partForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingPart) {
        await updatePart(editingPart.id, partForm);
        setParts((prev) => prev.map((p) => (p.id === editingPart.id ? { ...p, ...partForm } : p)));
      } else {
        const created = await addPart(partForm as Omit<Part, "id">);
        setParts((prev) => [created, ...prev]);
      }
      closeForm();
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  }

  const isServiceTab = tab === "services";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Service & Parts Master</h1>
          <p className="text-xs text-muted mt-0.5">Manage your services and parts catalog.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Tabs + Search + Add */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            {([
              { key: "services" as TabKey, label: "Services", count: services.length, icon: Wrench },
              { key: "parts" as TabKey, label: "Parts", count: parts.length, icon: Cog },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-primary text-white" : "text-secondary hover:bg-hover"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === t.key ? "bg-white/20 text-white" : "bg-hover text-muted"
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isServiceTab ? "Search services..." : "Search parts..."}
              className="w-full pl-9 pr-4 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Add button */}
          {canManage("SETTINGS") && (
            <button
              onClick={isServiceTab ? openAddService : openAddPart}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isServiceTab ? "Add Service" : "Add Part"}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-bad">{error}</p>
          </div>
        ) : isServiceTab ? (
          filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
                <Wrench className="w-8 h-8 text-muted" />
              </div>
              <p className="text-foreground font-medium mb-1">
                {search ? "No services match your search" : "No services yet"}
              </p>
              <p className="text-muted text-sm">
                {search ? "Try a different search." : "Add your first service to get started."}
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              <DataTable columns={serviceColumns} data={filteredServices} keyExtractor={(s) => s.id} className={TABLE_CLS} />
            </div>
          )
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Cog className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {search ? "No parts match your search" : "No parts yet"}
            </p>
            <p className="text-muted text-sm">
              {search ? "Try a different search." : "Add your first part to get started."}
            </p>
          </div>
        ) : (
          <div className="px-6 py-4">
            <DataTable columns={partColumns} data={filteredParts} keyExtractor={(p) => p.id} className={TABLE_CLS} />
          </div>
        )}
      </div>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">
                {isServiceTab
                  ? editingService ? "Edit Service" : "Add New Service"
                  : editingPart ? "Edit Part" : "Add New Part"}
              </h3>
              <button onClick={closeForm} className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {isServiceTab ? (
                /* ── Service Form ── */
                <>
                  <Field label="Service Name *">
                    <input
                      type="text"
                      value={svcForm.name}
                      onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
                      placeholder="e.g. General Service, Oil Change"
                      className={INPUT_CLS}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Price (₹)">
                      <input
                        type="number"
                        value={svcForm.price || ""}
                        onChange={(e) => setSvcForm({ ...svcForm, price: +e.target.value })}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="SAC Number">
                      <input
                        type="text"
                        value={svcForm.sacNumber || ""}
                        onChange={(e) => setSvcForm({ ...svcForm, sacNumber: e.target.value })}
                        placeholder="e.g. 998714"
                        className={INPUT_CLS}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="GST Applicable">
                      <select
                        value={svcForm.hasGst ? "yes" : "no"}
                        onChange={(e) => setSvcForm({ ...svcForm, hasGst: e.target.value === "yes" })}
                        className={INPUT_CLS}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </Field>
                    {svcForm.hasGst && (
                      <Field label="GST Rate (%)">
                        <select
                          value={svcForm.gstRate}
                          onChange={(e) => setSvcForm({ ...svcForm, gstRate: +e.target.value })}
                          className={INPUT_CLS}
                        >
                          {[5, 12, 18, 28].map((r) => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </Field>
                    )}
                  </div>
                </>
              ) : (
                /* ── Part Form ── */
                <>
                  <Field label="Part Name *">
                    <input
                      type="text"
                      value={partForm.name}
                      onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                      placeholder="e.g. Oil Filter, Brake Pad"
                      className={INPUT_CLS}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Part Number">
                      <input
                        type="text"
                        value={partForm.partNumber}
                        onChange={(e) => setPartForm({ ...partForm, partNumber: e.target.value })}
                        placeholder="e.g. OIF-1234"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="Category">
                      <input
                        type="text"
                        value={partForm.category || ""}
                        onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                        placeholder="e.g. Filters"
                        className={INPUT_CLS}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="MRP (₹)">
                      <input
                        type="number"
                        value={partForm.mrp || ""}
                        onChange={(e) => setPartForm({ ...partForm, mrp: +e.target.value })}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="Selling Price (₹)">
                      <input
                        type="number"
                        value={partForm.sellingPrice || ""}
                        onChange={(e) => setPartForm({ ...partForm, sellingPrice: +e.target.value })}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="Purchase Price (₹)">
                      <input
                        type="number"
                        value={partForm.purchasePrice || ""}
                        onChange={(e) => setPartForm({ ...partForm, purchasePrice: +e.target.value })}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="HSN Code">
                      <input
                        type="text"
                        value={partForm.hsnCode}
                        onChange={(e) => setPartForm({ ...partForm, hsnCode: e.target.value })}
                        placeholder="e.g. 8421"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="GST Rate (%)">
                      <select
                        value={partForm.gstRate}
                        onChange={(e) => setPartForm({ ...partForm, gstRate: +e.target.value })}
                        className={INPUT_CLS}
                      >
                        {[5, 12, 18, 28].map((r) => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Stock Qty">
                      <input
                        type="number"
                        value={partForm.stockQty || ""}
                        onChange={(e) => setPartForm({ ...partForm, stockQty: +e.target.value })}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="Min Stock">
                      <input
                        type="number"
                        value={partForm.minStockQty || ""}
                        onChange={(e) => setPartForm({ ...partForm, minStockQty: +e.target.value })}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="Unit">
                      <select
                        value={partForm.unit}
                        onChange={(e) => setPartForm({ ...partForm, unit: e.target.value })}
                        className={INPUT_CLS}
                      >
                        {["Pcs", "Ltr", "Kg", "Set", "Pair", "Mtr"].map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="Rack Number">
                    <input
                      type="text"
                      value={partForm.rackNumber}
                      onChange={(e) => setPartForm({ ...partForm, rackNumber: e.target.value })}
                      placeholder="e.g. A-03"
                      className={INPUT_CLS}
                    />
                  </Field>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-edge">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isServiceTab ? handleSaveService : handleSavePart}
                disabled={saving}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared helpers ── */

const INPUT_CLS =
  "w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
