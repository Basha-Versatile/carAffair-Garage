"use client";

import { useState, useEffect } from "react";
import {
  getCustomers, addCustomer, addVehicle, getBrands, getBrandById,
  getModelsByBrand, getModelById, addModel, Customer, VehicleBrand,
  VehicleModel, FuelType, VehicleCategory,
} from "@/lib/api-vehicles";
import { Search, Plus, Phone, MessageCircle, MoreVertical, X, User, Car, ChevronDown, MapPin, Loader2, LayoutGrid, List, Mail } from "lucide-react";
import SelectModal from "@/components/modals/SelectModal";
import AddModelModal from "@/components/modals/AddModelModal";

interface CustomerForm {
  customerName: string; mobile: string; email: string; address: string; gstin: string;
  regNumber: string; brandId: string; modelId: string; purchaseDate: string;
  engineNumber: string; vinNumber: string; insuranceProvider: string;
  insurerGstin: string; insurerAddress: string; policyNumber: string; insuranceExpiry: string;
}

const emptyForm: CustomerForm = {
  customerName: "", mobile: "", email: "", address: "", gstin: "",
  regNumber: "", brandId: "", modelId: "", purchaseDate: "",
  engineNumber: "", vinNumber: "", insuranceProvider: "",
  insurerGstin: "", insurerAddress: "", policyNumber: "", insuranceExpiry: "",
};

type ViewMode = "list" | "table";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [addModelModalOpen, setAddModelModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [modelsForBrand, setModelsForBrand] = useState<VehicleModel[]>([]);

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    getCustomers().then((data) => setCustomers(data || [])).catch(() => {
      setFetchError("Failed to load customers. Please try again.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { getBrands().then((data) => setBrands(data || [])).catch(() => setBrands([])); }, []);

  useEffect(() => {
    if (form.brandId) {
      getBrandById(form.brandId).then(b => setSelectedBrand(b || null)).catch(() => setSelectedBrand(null));
      getModelsByBrand(form.brandId).then(setModelsForBrand).catch(() => setModelsForBrand([]));
    } else {
      setSelectedBrand(null);
      setModelsForBrand([]);
    }
  }, [form.brandId]);

  useEffect(() => {
    if (form.modelId) {
      getModelById(form.modelId).then(m => setSelectedModel(m || null)).catch(() => setSelectedModel(null));
    } else {
      setSelectedModel(null);
    }
  }, [form.modelId]);

  const filtered = (customers || []).filter((c) => {
    const q = search.toLowerCase();
    return (c.name ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q) || (c.email && c.email.toLowerCase().includes(q));
  });

  function updateForm(field: keyof CustomerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name is required";
    if (!form.mobile.trim() || form.mobile.length < 10) e.mobile = "Valid mobile number is required";
    if (!form.regNumber.trim()) e.regNumber = "Registration number is required";
    if (!form.brandId) e.brandId = "Please select a make";
    if (!form.modelId) e.modelId = "Please select a model";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSubmitting(true);
    try {
      const customer = await addCustomer({
        name: form.customerName.trim(), phone: form.mobile.trim(),
        email: form.email.trim() || undefined, address: form.address.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
      });
      await addVehicle({
        registrationNumber: form.regNumber.trim().toUpperCase(), brandId: form.brandId, modelId: form.modelId,
        customerId: customer.id, purchaseDate: form.purchaseDate || undefined,
        engineNumber: form.engineNumber || undefined, vinNumber: form.vinNumber || undefined,
        insuranceProvider: form.insuranceProvider || undefined, insurerGstin: form.insurerGstin || undefined,
        insurerAddress: form.insurerAddress || undefined, policyNumber: form.policyNumber || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
      });
      const updated = await getCustomers();
      setCustomers(updated || []);
      setShowForm(false); setForm(emptyForm); setErrors({});
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Failed to save customer. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function handleBrandSelect(brandId: string) {
    updateForm("brandId", brandId); updateForm("modelId", "");
    setBrandModalOpen(false); setTimeout(() => setModelModalOpen(true), 200);
  }
  function handleModelSelect(modelId: string) { updateForm("modelId", modelId); setModelModalOpen(false); }
  async function handleAddModel(data: { name: string; fuelType: FuelType; category: VehicleCategory }) {
    try {
      const m = await addModel({ brandId: form.brandId, name: data.name, fuelType: data.fuelType, category: data.category });
      updateForm("modelId", m.id); setAddModelModalOpen(false); setModelModalOpen(false);
      getModelsByBrand(form.brandId).then(setModelsForBrand).catch(() => {});
    } catch {
      // handle silently
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const labelCls = "block text-sm font-medium text-secondary mb-1";
  const selectBtnCls = "w-full flex items-center justify-between px-3.5 py-2.5 border border-edge rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">My Customers</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">{customers.length}</span>
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
          <button onClick={() => { setShowForm(true); setForm(emptyForm); setErrors({}); }}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
            <Plus className="w-4 h-4" />Customer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / mobile no / Reg no"
              className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>

        {/* Customer List */}
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
              <User className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted text-sm">
              {customers.length === 0 ? "No customers yet. Add your first customer." : "No customers match your search."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="px-6 py-3">
            <div className="bg-background rounded-xl border border-edge divide-y divide-edge-light">
              {filtered.map((customer) => <CustomerRow key={customer.id} customer={customer} />)}
            </div>
          </div>
        ) : (
          <div className="px-6 py-3">
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dim border-b border-edge">
                    <th className="text-left px-4 py-3 font-medium text-secondary">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Address</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">GSTIN</th>
                    <th className="text-right px-4 py-3 font-medium text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-light">
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="hover:bg-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">{(customer.name ?? "?").charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-foreground">{customer.name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary">{customer.phone || "-"}</td>
                      <td className="px-4 py-3 text-muted">{customer.email || "-"}</td>
                      <td className="px-4 py-3 text-muted max-w-[200px] truncate">{customer.address || "-"}</td>
                      <td className="px-4 py-3 text-muted">{customer.gstin || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-ok hover:bg-ok-light rounded-md transition-colors" title="WhatsApp">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-muted hover:bg-hover rounded-md transition-colors">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Customer Slide-over ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative bg-background w-full max-w-xl shadow-xl flex flex-col animate-slide-in">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-edge">
              <h2 className="text-base font-semibold text-foreground">Add Customer</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Personal Details */}
              <div className="bg-background rounded-lg border border-edge overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted" />
                    <h3 className="text-sm font-semibold text-secondary">Personal Details</h3>
                  </div>
                  <button onClick={() => setShowMore(!showMore)} className="text-xs text-primary font-medium hover:underline">
                    {showMore ? "Less" : "More"}
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Customer Name <span className="text-bad">*</span></label>
                      <input type="text" value={form.customerName} onChange={(e) => updateForm("customerName", e.target.value)} placeholder="Enter customer name" className={inputCls} />
                      {errors.customerName && <p className="text-xs text-bad mt-1">{errors.customerName}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Mobile Number <span className="text-bad">*</span></label>
                      <input type="tel" maxLength={10} value={form.mobile} onChange={(e) => updateForm("mobile", e.target.value.replace(/\D/g, ""))} placeholder="Enter mobile number" className={inputCls} />
                      {errors.mobile && <p className="text-xs text-bad mt-1">{errors.mobile}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="Enter email address" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Address</label>
                    <div className="relative">
                      <input type="text" value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="Enter address" className={`${inputCls} pr-10`} />
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    </div>
                  </div>
                  {showMore && (
                    <div>
                      <label className={labelCls}>GSTIN</label>
                      <input type="text" value={form.gstin} onChange={(e) => updateForm("gstin", e.target.value)} placeholder="Enter GSTIN" className={inputCls} />
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-background rounded-lg border border-edge overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
                  <Car className="w-4 h-4 text-muted" />
                  <h3 className="text-sm font-semibold text-secondary">Vehicle Details</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelCls}>Registration Number <span className="text-bad">*</span></label>
                    <input type="text" value={form.regNumber} onChange={(e) => updateForm("regNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. TS 09 AB 1234" className={`${inputCls} uppercase tracking-wider`} />
                    {errors.regNumber && <p className="text-xs text-bad mt-1">{errors.regNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Make <span className="text-bad">*</span></label>
                      <button onClick={() => setBrandModalOpen(true)} className={selectBtnCls}>
                        <span className={selectedBrand ? "text-foreground" : "text-muted"}>{selectedBrand?.name || "Select make"}</span>
                        <ChevronDown className="w-4 h-4 text-muted" />
                      </button>
                      {errors.brandId && <p className="text-xs text-bad mt-1">{errors.brandId}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Model <span className="text-bad">*</span></label>
                      <button onClick={() => { if (!form.brandId) { setErrors((p) => ({ ...p, brandId: "Select a make first" })); return; } setModelModalOpen(true); }} className={selectBtnCls}>
                        <span className={selectedModel ? "text-foreground" : "text-muted"}>
                          {selectedModel ? `${selectedModel.name} ${selectedModel.fuelType}` : "Select model"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted" />
                      </button>
                      {errors.modelId && <p className="text-xs text-bad mt-1">{errors.modelId}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Purchase Date</label><input type="date" value={form.purchaseDate} onChange={(e) => updateForm("purchaseDate", e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Engine Number</label><input type="text" value={form.engineNumber} onChange={(e) => updateForm("engineNumber", e.target.value)} placeholder="Enter engine number" className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>VIN (Chassis Number)</label><input type="text" value={form.vinNumber} onChange={(e) => updateForm("vinNumber", e.target.value)} placeholder="Enter VIN / chassis number" className={inputCls} /></div>

                  <div className="pt-2 border-t border-edge-light">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Insurance Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Insurance Provider</label><input type="text" value={form.insuranceProvider} onChange={(e) => updateForm("insuranceProvider", e.target.value)} placeholder="Enter provider" className={inputCls} /></div>
                      <div><label className={labelCls}>Policy Number</label><input type="text" value={form.policyNumber} onChange={(e) => updateForm("policyNumber", e.target.value)} placeholder="Enter policy number" className={inputCls} /></div>
                      <div><label className={labelCls}>Insurer GSTIN</label><input type="text" value={form.insurerGstin} onChange={(e) => updateForm("insurerGstin", e.target.value)} placeholder="Enter GSTIN" className={inputCls} /></div>
                      <div><label className={labelCls}>Insurance Expiry</label><input type="date" value={form.insuranceExpiry} onChange={(e) => updateForm("insuranceExpiry", e.target.value)} className={inputCls} /></div>
                    </div>
                    <div className="mt-4"><label className={labelCls}>Insurer Address</label><input type="text" value={form.insurerAddress} onChange={(e) => updateForm("insurerAddress", e.target.value)} placeholder="Enter insurer address" className={inputCls} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mx-6 mb-2 bg-bad-light border border-bad/20 rounded-md px-4 py-3">
                <p className="text-sm text-bad">{errors.submit}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-edge px-6 py-3.5 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      <SelectModal open={brandModalOpen} title="Select Brand" items={(brands || []).map((b) => ({ id: b.id, label: b.name }))} selectedId={form.brandId} onSelect={handleBrandSelect} onClose={() => setBrandModalOpen(false)} />
      <SelectModal open={modelModalOpen} title="Select Model" items={(modelsForBrand || []).map((m) => ({ id: m.id, label: `${m.name} ${m.fuelType}`, sublabel: m.category }))} selectedId={form.modelId} onSelect={handleModelSelect} onClose={() => setModelModalOpen(false)} actionButton={{ label: "Add New Model", onClick: () => { setModelModalOpen(false); setTimeout(() => setAddModelModalOpen(true), 200); } }} />
      <AddModelModal open={addModelModalOpen} brandName={selectedBrand?.name || ""} onSave={handleAddModel} onClose={() => setAddModelModalOpen(false)} />
    </div>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-hover transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{(customer.name ?? "?").charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{customer.name || "-"}</p>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Phone className="w-3 h-3" />{customer.phone || "-"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 text-ok hover:bg-ok-light rounded-lg transition-colors" title="WhatsApp">
          <MessageCircle className="w-4 h-4" />
        </button>
        <button className="p-2 text-muted hover:bg-hover rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
