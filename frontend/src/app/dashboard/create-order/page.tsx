"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Car, User, ChevronDown, MapPin } from "lucide-react";
import SelectModal from "@/components/modals/SelectModal";
import AddModelModal from "@/components/modals/AddModelModal";
import {
  getBrands, getModelsByBrand, getBrandById, getModelById,
  findVehicleByRegNumber, addModel, addVehicle, addCustomer, getCustomerById,
  FuelType, VehicleCategory, VehicleBrand, VehicleModel,
} from "@/lib/api-vehicles";
import { addOrder } from "@/lib/api-orders";

type Step = "search" | "form";

interface FormData {
  customerName: string; mobile: string; email: string; address: string; gstin: string;
  regNumber: string; brandId: string; modelId: string; purchaseDate: string;
  engineNumber: string; vinNumber: string; insuranceProvider: string;
  insurerGstin: string; insurerAddress: string; policyNumber: string; insuranceExpiry: string;
}

const emptyForm: FormData = {
  customerName: "", mobile: "", email: "", address: "", gstin: "",
  regNumber: "", brandId: "", modelId: "", purchaseDate: "",
  engineNumber: "", vinNumber: "", insuranceProvider: "",
  insurerGstin: "", insurerAddress: "", policyNumber: "", insuranceExpiry: "",
};

export default function CreateOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [searchReg, setSearchReg] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [addModelModalOpen, setAddModelModalOpen] = useState(false);

  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [modelsForBrand, setModelsForBrand] = useState<VehicleModel[]>([]);

  useEffect(() => { getBrands().then((data) => setBrands(data || [])).catch(() => setBrands([])); }, []);

  useEffect(() => {
    if (form.brandId) {
      getBrandById(form.brandId).then(b => setSelectedBrand(b || null)).catch(() => setSelectedBrand(null));
      getModelsByBrand(form.brandId).then((data) => setModelsForBrand(data || [])).catch(() => setModelsForBrand([]));
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

  function updateForm(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSearch() {
    if (!searchReg.trim()) { setSearchError("Please enter a vehicle registration number"); return; }
    setSearching(true);
    try {
      const existing = await findVehicleByRegNumber(searchReg);
      if (existing) {
        const customer = await getCustomerById(existing.customerId);
        setForm({
          ...emptyForm, regNumber: existing.registrationNumber,
          brandId: existing.brandId || "", modelId: existing.modelId || "",
          purchaseDate: existing.purchaseDate || "", engineNumber: existing.engineNumber || "",
          vinNumber: existing.vinNumber || "", insuranceProvider: existing.insuranceProvider || "",
          insurerGstin: existing.insurerGstin || "", insurerAddress: existing.insurerAddress || "",
          policyNumber: existing.policyNumber || "", insuranceExpiry: existing.insuranceExpiry || "",
          customerName: customer?.name || "", mobile: customer?.phone || "",
          email: customer?.email || "", address: customer?.address || "", gstin: customer?.gstin || "",
        });
      } else {
        setForm({ ...emptyForm, regNumber: searchReg.trim().toUpperCase() });
      }
      setStep("form"); setSearchError("");
    } catch { setSearchError("Failed to search vehicle"); }
    finally { setSearching(false); }
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
      // Refresh models list for brand
      getModelsByBrand(form.brandId).then(setModelsForBrand);
    } catch {
      // Silently handle — modal stays open so user can retry
    }
  }

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name is required";
    if (!form.mobile.trim() || form.mobile.length < 10) e.mobile = "Valid mobile number is required";
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
        registrationNumber: form.regNumber, brandId: form.brandId, modelId: form.modelId,
        customerId: customer.id, purchaseDate: form.purchaseDate || undefined,
        engineNumber: form.engineNumber || undefined, vinNumber: form.vinNumber || undefined,
        insuranceProvider: form.insuranceProvider || undefined, insurerGstin: form.insurerGstin || undefined,
        insurerAddress: form.insurerAddress || undefined, policyNumber: form.policyNumber || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
      });

      const brand = await getBrandById(form.brandId);
      const model = await getModelById(form.modelId);
      const vehicleName = `${brand?.name || ""} ${model?.name || ""}`.trim();
      await addOrder({
        customerName: form.customerName.trim(),
        phone: form.mobile.trim(),
        vehicle: vehicleName,
        vehicleNumber: form.regNumber,
        status: "open",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        services: ["Repair Order"],
      });
      router.push("/dashboard");
    } catch(err) { setErrors({ submit: err instanceof Error ? err.message : "Failed to create order" }); }
    finally { setSubmitting(false); }
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const labelCls = "block text-sm font-medium text-secondary mb-1";
  const selectBtnCls = "w-full flex items-center justify-between px-3.5 py-2.5 border border-edge rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-4">
        <button onClick={() => step === "form" ? setStep("search") : router.push("/dashboard")}
          className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">
          {step === "search" ? "Customer (Repair Order)" : "Add Vehicle & Customer"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step === "search" ? (
          <div className="max-w-lg mx-auto mt-16 px-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-primary-light p-4 rounded-full mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Search Vehicle</h2>
              <p className="text-sm text-muted mt-1">Enter the vehicle registration number to get started</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Vehicle Registration Number</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input type="text" value={searchReg}
                    onChange={(e) => { setSearchReg(e.target.value.toUpperCase()); setSearchError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="e.g. TS 09 AB 1234"
                    className="w-full pl-10 pr-4 py-3 border border-edge rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg tracking-wider uppercase"
                    autoFocus />
                </div>
                {searchError && <p className="text-sm text-bad mt-1.5">{searchError}</p>}
              </div>
              <button onClick={handleSearch} disabled={searching} className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50">
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
            {/* Reg badge */}
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-lg text-sm font-medium">
              <Car className="w-4 h-4" />{form.regNumber}
            </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Purchase Date</label><input type="date" value={form.purchaseDate} onChange={(e) => updateForm("purchaseDate", e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Engine Number</label><input type="text" value={form.engineNumber} onChange={(e) => updateForm("engineNumber", e.target.value)} placeholder="Enter engine number" className={inputCls} /></div>
                </div>
                <div><label className={labelCls}>VIN (Chassis Number)</label><input type="text" value={form.vinNumber} onChange={(e) => updateForm("vinNumber", e.target.value)} placeholder="Enter VIN / chassis number" className={inputCls} /></div>

                <div className="pt-2 border-t border-edge-light">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Insurance Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Insurance Provider</label><input type="text" value={form.insuranceProvider} onChange={(e) => updateForm("insuranceProvider", e.target.value)} placeholder="Enter provider name" className={inputCls} /></div>
                    <div><label className={labelCls}>Policy Number</label><input type="text" value={form.policyNumber} onChange={(e) => updateForm("policyNumber", e.target.value)} placeholder="Enter policy number" className={inputCls} /></div>
                    <div><label className={labelCls}>Insurer GSTIN</label><input type="text" value={form.insurerGstin} onChange={(e) => updateForm("insurerGstin", e.target.value)} placeholder="Enter insurer GSTIN" className={inputCls} /></div>
                    <div><label className={labelCls}>Insurance Expiry</label><input type="date" value={form.insuranceExpiry} onChange={(e) => updateForm("insuranceExpiry", e.target.value)} className={inputCls} /></div>
                  </div>
                  <div className="mt-4"><label className={labelCls}>Insurer Address</label><input type="text" value={form.insurerAddress} onChange={(e) => updateForm("insurerAddress", e.target.value)} placeholder="Enter insurer address" className={inputCls} /></div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-bad-light border border-bad/20 rounded-md px-4 py-3">
                <p className="text-sm text-bad">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pb-6">
              <button onClick={() => setStep("search")} className="px-5 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        )}
      </div>

      <SelectModal open={brandModalOpen} title="Select Brand" items={(brands || []).map((b) => ({ id: b.id, label: b.name }))} selectedId={form.brandId} onSelect={handleBrandSelect} onClose={() => setBrandModalOpen(false)} />
      <SelectModal open={modelModalOpen} title="Select Model" items={(modelsForBrand || []).map((m) => ({ id: m.id, label: `${m.name} ${m.fuelType}`, sublabel: m.category }))} selectedId={form.modelId} onSelect={handleModelSelect} onClose={() => setModelModalOpen(false)} actionButton={{ label: "Add New Model", onClick: () => { setModelModalOpen(false); setTimeout(() => setAddModelModalOpen(true), 200); } }} />
      <AddModelModal open={addModelModalOpen} brandName={selectedBrand?.name || ""} onSave={handleAddModel} onClose={() => setAddModelModalOpen(false)} />
    </div>
  );
}
