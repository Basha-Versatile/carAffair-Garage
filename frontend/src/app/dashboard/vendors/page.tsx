"use client";

import { useState, useEffect } from "react";
import { getVendors, addVendor, Vendor } from "@/lib/api-vehicles";
import { Search, Plus, Phone, Mail, MoreVertical, Truck, X, Eye, Loader2, LayoutGrid, List } from "lucide-react";
import { canManage } from "@/lib/auth";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

const vendorColumns: DataColumn<Vendor>[] = [
  {
    key: "name",
    header: "Name",
    render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-warn-light flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-warn">{(v.name ?? "?").charAt(0).toUpperCase()}</span>
        </div>
        <span className="font-medium text-foreground">{v.name || "-"}</span>
      </div>
    ),
    filterValue: (v) => v.name || "",
    sortValue: (v) => v.name || "",
  },
  {
    key: "phone",
    header: "Phone",
    render: (v) => <span className="text-secondary">{v.phone || "-"}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (v) => <span className="text-muted">{v.email || "-"}</span>,
  },
  {
    key: "gstin",
    header: "GSTIN",
    render: (v) => <span className="text-muted">{v.gstin || "-"}</span>,
  },
  {
    key: "brands",
    header: "Brands",
    render: (v) =>
      (v.brands || []).length > 0 ? (
        <div className="flex gap-1 flex-wrap">
          {(v.brands || []).map((b) => (
            <span key={b} className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded">{b}</span>
          ))}
        </div>
      ) : (
        <span className="text-muted">-</span>
      ),
  },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    render: () => (
      <div className="flex items-center justify-end gap-1">
        <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />View
        </button>
        <button className="p-1.5 text-muted hover:bg-hover rounded-md transition-colors">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
  },
];

interface VendorForm {
  name: string; phone: string; email: string; address: string;
  gstin: string; pan: string; referenceId: string;
}

const emptyVendorForm: VendorForm = {
  name: "", phone: "", email: "", address: "", gstin: "", pan: "", referenceId: "",
};

type ViewMode = "list" | "table";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VendorForm>(emptyVendorForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState<PageSize>(PAGE_SIZES[0]);

  useEffect(() => { setListPage(1); }, [search]);

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    getVendors().then((data) => setVendors(data || [])).catch(() => {
      setFetchError("Failed to load vendors. Please try again.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = (vendors || []).filter((v) => {
    const q = search.toLowerCase();
    return (v.name ?? "").toLowerCase().includes(q) || (v.phone ?? "").includes(q) || (v.email && v.email.toLowerCase().includes(q));
  });

  function updateForm(field: keyof VendorForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vendor name is required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "Valid phone number is required";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSubmitting(true);
    try {
      await addVendor({
        name: form.name.trim(), phone: form.phone.trim(),
        email: form.email.trim() || undefined, address: form.address.trim() || undefined,
        gstin: form.gstin.trim() || undefined, pan: form.pan.trim() || undefined,
        referenceId: form.referenceId.trim() || undefined, brands: [],
      });
      const updated = await getVendors();
      setVendors(updated || []);
      setShowForm(false); setForm(emptyVendorForm); setErrors({});
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Failed to save vendor. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const labelCls = "block text-sm font-medium text-secondary mb-1.5";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">My Vendors</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">{vendors.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-edge rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
              title="List view">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
              title="Table view">
              <List className="w-4 h-4" />
            </button>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">VIEW ALL DUE</button>
          {canManage("VENDORS") && (
            <button onClick={() => { setShowForm(true); setForm(emptyVendorForm); setErrors({}); }}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
              <Plus className="w-4 h-4" />Vendor
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors..."
              className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>

        {/* Vendor List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-16">
            <p className="text-sm text-bad">{fetchError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Truck className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">{search ? "Vendors not found" : "No vendors yet"}</p>
            <p className="text-muted text-sm mb-4">
              {search ? "No vendors match your search criteria." : "Add your first vendor to get started."}
            </p>
            {canManage("VENDORS") && (
              <button onClick={() => { setShowForm(true); setForm(emptyVendorForm); setErrors({}); }}
                className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
                <Plus className="w-4 h-4" />Add Vendor
              </button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="px-6 py-3">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(filtered.length / listPageSize));
              const safePage = Math.min(listPage, totalPages);
              const start = (safePage - 1) * listPageSize;
              const paged = filtered.slice(start, start + listPageSize);
              return (
                <>
                  <div className="bg-background rounded-xl border border-edge divide-y divide-edge-light">
                    {paged.map((vendor) => <VendorRow key={vendor.id} vendor={vendor} />)}
                  </div>
                  <div className="bg-background rounded-lg border border-edge overflow-hidden mt-4">
                    <Pagination total={filtered.length} page={safePage} pageSize={listPageSize} onPageChange={setListPage} onPageSizeChange={setListPageSize} />
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="px-6 py-3">
            <DataTable
              columns={vendorColumns}
              data={filtered}
              keyExtractor={(v) => v.id}
              className={TABLE_CLS}
            />
          </div>
        )}
      </div>

      {/* ── Add Vendor Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Add Vendor</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className={labelCls}>Vendor Name <span className="text-bad">*</span></label>
                <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Enter vendor name" className={inputCls} autoFocus />
                {errors.name && <p className="text-xs text-bad mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className={labelCls}>Phone Number <span className="text-bad">*</span></label>
                <input type="tel" maxLength={10} value={form.phone} onChange={(e) => updateForm("phone", e.target.value.replace(/\D/g, ""))} placeholder="Enter phone number" className={inputCls} />
                {errors.phone && <p className="text-xs text-bad mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="Enter email address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="Enter address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input type="text" value={form.gstin} onChange={(e) => updateForm("gstin", e.target.value)} placeholder="Enter GSTIN" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>PAN</label>
                <input type="text" value={form.pan} onChange={(e) => updateForm("pan", e.target.value)} placeholder="Enter PAN number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vendor Reference Id</label>
                <input type="text" value={form.referenceId} onChange={(e) => updateForm("referenceId", e.target.value)} placeholder="Enter reference ID" className={inputCls} />
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mx-5 mb-2 bg-bad-light border border-bad/20 rounded-md px-4 py-3">
                <p className="text-sm text-bad">{errors.submit}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-edge px-5 py-3.5 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:bg-hover rounded-md transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-hover transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-warn-light flex items-center justify-center">
          <span className="text-sm font-semibold text-warn">{(vendor.name ?? "?").charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{vendor.name || "-"}</p>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone || "-"}</span>
            {vendor.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{vendor.email}</span>}
          </div>
          {(vendor.brands || []).length > 0 && (
            <div className="flex gap-1 mt-1">
              {(vendor.brands || []).map((b) => (
                <span key={b} className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />View Details
        </button>
        <button className="p-2 text-muted hover:bg-hover rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
