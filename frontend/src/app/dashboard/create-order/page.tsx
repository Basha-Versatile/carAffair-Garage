"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Car, User, ChevronDown, MapPin, Plus, Phone, Loader2, CloudDownload, CheckCircle2, Circle, AlertCircle, Gauge, Fuel, Upload, Camera, X, StickyNote, Bell } from "lucide-react";
import SelectModal from "@/components/modals/SelectModal";
import AddModelModal from "@/components/modals/AddModelModal";
import {
  getBrands, getModelsByBrand, getBrandById, getModelById,
  addModel, addVehicle, addCustomer, getCustomerById,
  getVehicles, Vehicle, lookupRC, RcLookupResult,
  FuelType, VehicleCategory, VehicleBrand, VehicleModel,
} from "@/lib/api-vehicles";
import { addOrder, uploadOrderImages } from "@/lib/api-orders";
import { submitBrandRequest } from "@/lib/api-brand-requests";

type Step = "search" | "form" | "inspection";
type RcPhase = "idle" | "fetching" | "gathered" | "filling" | "done" | "error";

interface VehicleResult extends Vehicle {
  brandName: string;
  modelName: string;
  customerName: string;
  customerPhone: string;
}

interface FormData {
  customerName: string; mobile: string; email: string; address: string; gstin: string;
  regNumber: string; brandId: string; modelId: string; purchaseDate: string;
  engineNumber: string; vinNumber: string; insuranceProvider: string;
  insurerGstin: string; insurerAddress: string; policyNumber: string; insuranceExpiry: string;
  odometerReading: string; fuelLevel: string;
}

const emptyForm: FormData = {
  customerName: "", mobile: "", email: "", address: "", gstin: "",
  regNumber: "", brandId: "", modelId: "", purchaseDate: "",
  engineNumber: "", vinNumber: "", insuranceProvider: "",
  insurerGstin: "", insurerAddress: "", policyNumber: "", insuranceExpiry: "",
  odometerReading: "", fuelLevel: "",
};

const FUEL_LEVELS = [
  { value: "empty", label: "E", description: "Empty" },
  { value: "quarter", label: "\u00BC", description: "Quarter" },
  { value: "half", label: "\u00BD", description: "Half" },
  { value: "three_quarter", label: "\u00BE", description: "Three Quarter" },
  { value: "full", label: "F", description: "Full" },
];

export default function CreateOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [searchReg, setSearchReg] = useState("");
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

  // RC Lookup state
  const [rcPhase, setRcPhase] = useState<RcPhase>("idle");
  const [rcData, setRcData] = useState<RcLookupResult | null>(null);
  const [rcError, setRcError] = useState("");

  // all vehicles (preloaded + enriched)
  const [allVehicles, setAllVehicles] = useState<VehicleResult[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inspection step state (step 3)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customerRemarks, setCustomerRemarks] = useState<string[]>([""]);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add brand request
  const [addBrandModalOpen, setAddBrandModalOpen] = useState(false);
  const [customBrandName, setCustomBrandName] = useState("");
  const [addBrandLoading, setAddBrandLoading] = useState(false);
  const [addBrandError, setAddBrandError] = useState("");

  // preload brands
  useEffect(() => { getBrands().then((data) => setBrands(data || [])).catch(() => setBrands([])); }, []);

  // preload all vehicles + enrich
  useEffect(() => {
    async function load() {
      setVehiclesLoading(true);
      try {
        const raw = await getVehicles();
        const enriched: VehicleResult[] = await Promise.all(
          (raw || []).map(async (v) => {
            let brandName = v.brandName || "";
            let modelName = v.modelName || "";
            let customerName = "";
            let customerPhone = "";
            try {
              if (!brandName && v.brandId) {
                const brand = await getBrandById(v.brandId);
                brandName = brand?.name || "";
              }
              if (!modelName && v.modelId) {
                const model = await getModelById(v.modelId);
                modelName = model?.name || "";
              }
              const customer = await getCustomerById(v.customerId);
              customerName = customer?.name || "";
              customerPhone = customer?.phone || "";
            } catch { /* ignore */ }
            return { ...v, brandName, modelName, customerName, customerPhone };
          })
        );
        setAllVehicles(enriched);
      } catch {
        setAllVehicles([]);
      } finally {
        setVehiclesLoading(false);
      }
    }
    load();
  }, []);

  // brand/model lookup for form step
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

  // live filtered results as user types
  const filtered = useMemo(() => {
    const q = searchReg.trim().toLowerCase();
    if (!q) return [];
    return allVehicles.filter((v) =>
      v.registrationNumber?.toLowerCase().includes(q)
    );
  }, [searchReg, allVehicles]);

  // check if exact duplicate exists
  const exactDuplicate = useMemo(() => {
    const q = searchReg.trim().toUpperCase();
    if (!q) return false;
    return allVehicles.some(
      (v) => v.registrationNumber?.toUpperCase() === q
    );
  }, [searchReg, allVehicles]);

  const hasQuery = searchReg.trim().length > 0;

  function updateForm(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSelectVehicle(v: VehicleResult) {
    setForm({
      ...emptyForm,
      regNumber: v.registrationNumber,
      brandId: v.brandId || "",
      modelId: v.modelId || "",
      purchaseDate: v.purchaseDate || "",
      engineNumber: v.engineNumber || "",
      vinNumber: v.vinNumber || "",
      insuranceProvider: v.insuranceProvider || "",
      insurerGstin: v.insurerGstin || "",
      insurerAddress: v.insurerAddress || "",
      policyNumber: v.policyNumber || "",
      insuranceExpiry: v.insuranceExpiry || "",
      customerName: v.customerName || "",
      mobile: v.customerPhone || "",
    });
    try {
      const customer = await getCustomerById(v.customerId);
      if (customer) {
        setForm((prev) => ({
          ...prev,
          customerName: customer.name || prev.customerName,
          mobile: customer.phone || prev.mobile,
          email: customer.email || "",
          address: customer.address || "",
          gstin: customer.gstin || "",
        }));
      }
    } catch { /* ignore */ }
    setStep("form");
  }

  function handleAddAsNew() {
    const reg = searchReg.trim().toUpperCase();
    if (exactDuplicate) return;
    setForm({ ...emptyForm, regNumber: reg });
    setRcData(null);
    setRcError("");
    setRcPhase("idle");
    setStep("form");
  }

  function resetRcState() {
    setRcPhase("idle");
    setRcData(null);
    setRcError("");
  }

  /** Delay helper for progress animation */
  function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

  /** Main search handler: check local → if not found, auto-fetch from RTO */
  async function handleSearch() {
    const reg = searchReg.trim().toUpperCase();
    if (!reg) return;

    // If found locally, do nothing (results already show via live filter)
    if (filtered.length > 0) return;
    if (exactDuplicate) return;

    // Not found locally → start RC fetch with step-by-step progress
    setRcPhase("fetching");
    setRcError("");
    setRcData(null);

    try {
      const rc = await lookupRC(reg);
      setRcData(rc);

      // Step 2: gathered
      setRcPhase("gathered");
      await wait(800);

      // Step 3: filling
      setRcPhase("filling");
      setForm({
        ...emptyForm,
        regNumber: reg,
        customerName: rc.ownerName || "",
        address: rc.address || "",
        mobile: rc.mobileNumber || "",
        brandId: rc.matchedBrandId || "",
        modelId: rc.matchedModelId || "",
        purchaseDate: rc.registrationDate || "",
        engineNumber: rc.engineNumber || "",
        vinNumber: rc.chassisNumber || "",
        insuranceProvider: rc.insuranceCompany || "",
        policyNumber: rc.policyNumber || "",
        insuranceExpiry: rc.insuranceUpto || "",
      });
      await wait(600);

      // Step 4: done → transition to form
      setRcPhase("done");
      await wait(400);
      setStep("form");
    } catch (err) {
      setRcPhase("error");
      setRcError(err instanceof Error ? err.message : "RC lookup failed. You can add the vehicle manually.");
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
      getModelsByBrand(form.brandId).then(setModelsForBrand);
    } catch { /* modal stays open for retry */ }
  }

  function handleAddImages(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  }

  function handleRemoveImage(idx: number) {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRemark() { setCustomerRemarks((prev) => [...prev, ""]); }
  function updateRemark(idx: number, value: string) { setCustomerRemarks((prev) => prev.map((r, i) => (i === idx ? value : r))); }
  function removeRemark(idx: number) { setCustomerRemarks((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleAddBrand() {
    const name = customBrandName.trim();
    if (!name) return;
    setAddBrandLoading(true);
    setAddBrandError("");
    try {
      const request = await submitBrandRequest(name);
      // Use the pre-created brand's id
      updateForm("brandId", request.approvedBrandId || "");
      updateForm("modelId", "");
      setAddBrandModalOpen(false);
      setCustomBrandName("");
      // Refresh brands list
      const updatedBrands = await getBrands();
      setBrands(updatedBrands || []);
      const newBrand = updatedBrands.find((b) => b.id === request.approvedBrandId);
      setSelectedBrand(newBrand || null);
      setSelectedModel(null);
      setModelsForBrand([]);
      // Open model modal for the new brand
      setTimeout(() => setModelModalOpen(true), 200);
    } catch (err) {
      setAddBrandError(err instanceof Error ? err.message : "Failed to request brand");
    } finally {
      setAddBrandLoading(false);
    }
  }

  function handleGoToInspection() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name is required";
    if (!form.mobile.trim() || form.mobile.length < 10) e.mobile = "Valid mobile number is required";
    if (!form.brandId) e.brandId = "Please select a make";
    if (!form.modelId) e.modelId = "Please select a model";
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setStep("inspection");
  }

  async function handleSubmit() {
    if (imageFiles.length === 0) {
      setErrors({ submit: "Please upload at least one image" });
      return;
    }

    setSubmitting(true);
    try {
      const customer = await addCustomer({
        name: form.customerName.trim(), phone: form.mobile.trim(),
        email: form.email.trim() || undefined, address: form.address.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
      });
      const vehicle = await addVehicle({
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
      const filteredRemarks = customerRemarks.filter((r) => r.trim() !== "");
      const order = await addOrder({
        customerName: form.customerName.trim(),
        phone: form.mobile.trim(),
        vehicle: vehicleName,
        vehicleNumber: form.regNumber,
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: "open",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        services: [],
        odometerReading: form.odometerReading ? Number(form.odometerReading) : undefined,
        fuelLevel: form.fuelLevel || undefined,
        customerRemarks: filteredRemarks.length > 0 ? filteredRemarks : undefined,
        inspectionNotes: inspectionNotes || undefined,
        notifyCustomer: notifyCustomer && !!form.email.trim(),
      });

      // Upload images to the created order
      if (imageFiles.length > 0) {
        await uploadOrderImages(order.id, imageFiles);
      }

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
        <button onClick={() => {
          if (step === "inspection") { setStep("form"); }
          else if (step === "form") { setStep("search"); resetRcState(); }
          else { router.push("/dashboard"); }
        }}
          className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">
          {step === "search" ? "Customer (Repair Order)" : step === "form" ? "Add Vehicle & Customer" : "Inspection & Remarks"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Search Step ── */}
        {step === "search" && (
          <div className="max-w-2xl mx-auto mt-12 px-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-primary-light p-4 rounded-full mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Search Vehicle</h2>
              <p className="text-sm text-muted mt-1">Enter the vehicle registration number to get started</p>
            </div>

            {/* Search input with button */}
            <div className="mb-4">
              <label className={labelCls}>Vehicle Registration Number</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchReg}
                    onChange={(e) => { setSearchReg(e.target.value.toUpperCase()); if (rcPhase !== "idle") resetRcState(); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    placeholder="e.g. TS 09 AB 1234"
                    className="w-full pl-10 pr-4 py-3 border border-edge rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg tracking-wider uppercase"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!hasQuery || rcPhase === "fetching" || vehiclesLoading}
                  className="px-5 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 shrink-0"
                >
                  {vehiclesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
              </div>
            </div>

            {/* Live results — found vehicles */}
            {hasQuery && !vehiclesLoading && filtered.length > 0 && rcPhase === "idle" && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted">
                  {filtered.length} vehicle{filtered.length > 1 ? "s" : ""} found
                </p>
                {filtered.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className="w-full bg-background rounded-lg border border-edge p-4 hover:border-primary hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary px-2.5 py-0.5 rounded text-sm font-semibold tracking-wider">
                          <Car className="w-3.5 h-3.5" />{v.registrationNumber}
                        </span>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <User className="w-3.5 h-3.5 text-muted shrink-0" />
                            {v.customerName || "Unknown"}
                          </span>
                          {v.customerPhone && (
                            <span className="flex items-center gap-1.5 text-muted">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              {v.customerPhone}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-primary font-medium shrink-0 mt-1">Select →</span>
                    </div>
                  </button>
                ))}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 border-t border-edge-light" />
                  <span className="text-xs text-muted">or</span>
                  <div className="flex-1 border-t border-edge-light" />
                </div>
                <button
                  onClick={handleAddAsNew}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add &quot;{searchReg}&quot; as New Vehicle
                </button>
              </div>
            )}

            {/* RC Fetch Progress Stepper */}
            {rcPhase !== "idle" && (
              <div className="bg-background rounded-xl border border-edge p-6 animate-scale-in">
                {/* Reg number badge */}
                <div className="flex items-center justify-center mb-5">
                  <span className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wider">
                    <Car className="w-4 h-4" />{searchReg.trim().toUpperCase()}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="space-y-0">
                  {/* Step 1: Fetching */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {rcPhase === "fetching" ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      ) : rcPhase === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-bad/10 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-bad" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ok/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-ok" />
                        </div>
                      )}
                      <div className={`w-0.5 h-6 ${rcPhase === "fetching" || rcPhase === "error" ? "bg-edge" : "bg-ok/30"}`} />
                    </div>
                    <div className="pt-1.5">
                      <p className={`text-sm font-medium ${rcPhase === "fetching" ? "text-primary" : rcPhase === "error" ? "text-bad" : "text-ok"}`}>
                        {rcPhase === "fetching" ? "Fetching RC details from RTO..." : rcPhase === "error" ? "Failed to fetch" : "RC details fetched"}
                      </p>
                      {rcPhase === "fetching" && (
                        <p className="text-xs text-muted mt-0.5">Connecting to RTO database</p>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Gathered */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {(rcPhase === "fetching" || rcPhase === "error") ? (
                        <div className="w-8 h-8 rounded-full bg-dim flex items-center justify-center">
                          <Circle className="w-4 h-4 text-muted" />
                        </div>
                      ) : rcPhase === "gathered" ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ok/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-ok" />
                        </div>
                      )}
                      <div className={`w-0.5 h-6 ${["fetching", "gathered", "error"].includes(rcPhase) ? "bg-edge" : "bg-ok/30"}`} />
                    </div>
                    <div className="pt-1.5">
                      <p className={`text-sm font-medium ${(rcPhase === "fetching" || rcPhase === "error") ? "text-muted" : rcPhase === "gathered" ? "text-primary" : "text-ok"}`}>
                        {(rcPhase === "fetching" || rcPhase === "error") ? "Vehicle details gathered" : "Vehicle details gathered"}
                      </p>
                      {rcPhase === "gathered" && rcData && (
                        <p className="text-xs text-muted mt-0.5">
                          {rcData.makerDescription} &middot; {rcData.fuelType} &middot; {rcData.color}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Filling */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {["fetching", "gathered", "error"].includes(rcPhase) ? (
                        <div className="w-8 h-8 rounded-full bg-dim flex items-center justify-center">
                          <Circle className="w-4 h-4 text-muted" />
                        </div>
                      ) : rcPhase === "filling" ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ok/10 flex items-center justify-center animate-scale-in">
                          <CheckCircle2 className="w-4 h-4 text-ok" />
                        </div>
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className={`text-sm font-medium ${["fetching", "gathered", "error"].includes(rcPhase) ? "text-muted" : rcPhase === "filling" ? "text-primary" : "text-ok"}`}>
                        {rcPhase === "done" ? "Form auto-filled!" : "Auto-filling form details"}
                      </p>
                      {rcPhase === "filling" && (
                        <p className="text-xs text-muted mt-0.5">Mapping owner, vehicle &amp; insurance details</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error state: show error message + manual entry option */}
                {rcPhase === "error" && (
                  <div className="mt-5 space-y-3">
                    <div className="bg-bad-light rounded-lg px-4 py-3">
                      <p className="text-sm text-bad">{rcError}</p>
                    </div>
                    <button
                      onClick={handleAddAsNew}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Manually Instead
                    </button>
                    <button
                      onClick={resetRcState}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-secondary hover:text-foreground transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Duplicate message */}
            {hasQuery && !vehiclesLoading && filtered.length === 0 && rcPhase === "idle" && exactDuplicate && (
              <div className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-edge rounded-lg text-sm text-muted">
                <Car className="w-4 h-4" />
                &quot;{searchReg}&quot; already exists — select it above
              </div>
            )}

            {/* Loading state */}
            {hasQuery && vehiclesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-muted ml-2">Loading vehicles...</span>
              </div>
            )}
          </div>
        )}

        {/* ── Form Step ── */}
        {step === "form" && (
          <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
            {/* Reg badge */}
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-lg text-sm font-medium">
              <Car className="w-4 h-4" />{form.regNumber}
            </div>

            {/* RC Data Banner — shown when form was auto-filled from RC lookup */}
            {rcData && (
              <>
                {/* All matched — success banner */}
                {form.brandId && form.modelId && (
                  <div className="bg-ok-light border border-ok/20 rounded-lg px-4 py-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
                    <p className="text-sm text-ok font-medium">
                      Auto-filled from RC — Matched: {selectedBrand?.name} {selectedModel?.name} {selectedModel?.fuelType}
                    </p>
                  </div>
                )}

                {/* Make not matched — warning banner */}
                {!form.brandId && rcData.makerDescription && (
                  <div className="bg-warning-50 border border-warning-300/40 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-800">Make could not be auto-matched</p>
                        <p className="text-xs text-warning-600 mt-0.5">
                          RTO returned <span className="font-semibold">&quot;{rcData.makerDescription}&quot;</span> which doesn&apos;t match any existing make. Please select the correct make manually.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setBrandModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-warning-500 text-white rounded-lg text-sm font-medium hover:bg-warning-600 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Select Make
                    </button>
                  </div>
                )}

                {/* Make matched but model not matched — warning banner */}
                {form.brandId && !form.modelId && rcData.makerModel && (
                  <div className="bg-warning-50 border border-warning-300/40 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-800">Model could not be auto-matched</p>
                        <p className="text-xs text-warning-600 mt-0.5">
                          RTO returned <span className="font-semibold">&quot;{rcData.makerModel}&quot;</span> for {selectedBrand?.name || "the selected make"}. Please select or add the correct model.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setModelModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-warning-500 text-white rounded-lg text-sm font-medium hover:bg-warning-600 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Select Model
                    </button>
                  </div>
                )}
              </>
            )}

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

                {/* Odometer & Fuel Level */}
                <div className="pt-2 border-t border-edge-light">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Vehicle Condition</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}><span className="inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> Odometer (KMs)</span></label>
                      <input type="number" value={form.odometerReading} onChange={(e) => updateForm("odometerReading", e.target.value)} placeholder="e.g. 45000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}><span className="inline-flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5" /> Fuel Level</span></label>
                      <div className="flex gap-1.5">
                        {FUEL_LEVELS.map((fl) => (
                          <button key={fl.value} type="button" onClick={() => updateForm("fuelLevel", form.fuelLevel === fl.value ? "" : fl.value)}
                            title={fl.description}
                            className={`flex-1 py-2.5 text-xs font-semibold rounded-md border transition-colors ${
                              form.fuelLevel === fl.value
                                ? "bg-primary text-white border-primary"
                                : "bg-background text-muted border-edge hover:border-primary hover:text-foreground"
                            }`}
                          >{fl.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

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
              <button onClick={() => { setStep("search"); resetRcState(); }} className="px-5 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors">Cancel</button>
              <button onClick={handleGoToInspection} className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Inspection Step ── */}
        {step === "inspection" && (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
            {/* Reg badge */}
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-lg text-sm font-medium">
              <Car className="w-4 h-4" />{form.regNumber}
              <span className="mx-1 text-primary/40">|</span>
              <User className="w-3.5 h-3.5" />{form.customerName}
            </div>

            {/* Image Upload */}
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
                <Camera className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-semibold text-secondary">Inspection Images <span className="text-bad">*</span></h3>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-3 mb-3">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-edge">
                      <img src={src} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-bad/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-edge hover:border-primary flex flex-col items-center justify-center gap-1 text-muted hover:text-primary transition-colors">
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px]">Upload</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { handleAddImages(e.target.files); e.target.value = ""; }} />
                <p className="text-xs text-muted">Upload at least one inspection image. You can add more later.</p>
              </div>
            </div>

            {/* Customer Remarks */}
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-muted" />
                  <h3 className="text-sm font-semibold text-secondary">Customer Remarks</h3>
                </div>
                <button onClick={addRemark} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="p-5 space-y-2">
                {customerRemarks.map((remark, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="text" value={remark}
                      onChange={(e) => updateRemark(idx, e.target.value)}
                      placeholder={`Remark ${idx + 1}`}
                      className="flex-1 px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                    {customerRemarks.length > 1 && (
                      <button onClick={() => removeRemark(idx)} className="p-1.5 text-muted hover:text-bad transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection Notes */}
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
                <StickyNote className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-semibold text-secondary">Inspection Notes</h3>
              </div>
              <div className="p-5">
                <textarea value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Scratches, dents, other observations..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" />
              </div>
            </div>

            {/* Notify Customer Toggle */}
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted" />
                  <div>
                    <p className="text-sm font-semibold text-secondary">Notify Customer</p>
                    <p className="text-xs text-muted mt-0.5">Send onboarding email with vehicle info &amp; remarks</p>
                  </div>
                </div>
                <button type="button" onClick={() => setNotifyCustomer(!notifyCustomer)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${notifyCustomer ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifyCustomer ? "translate-x-5" : ""}`} />
                </button>
              </div>
              {notifyCustomer && !form.email.trim() && (
                <div className="px-5 pb-4 -mt-1">
                  <p className="text-xs text-amber-600 dark:text-amber-400">Customer email is required to send notification</p>
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="bg-bad-light border border-bad/20 rounded-md px-4 py-3">
                <p className="text-sm text-bad">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pb-6">
              <button onClick={() => setStep("form")} className="px-5 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        )}
      </div>

      <SelectModal open={brandModalOpen} title="Select Brand" items={(brands || []).map((b) => ({ id: b.id, label: b.name }))} selectedId={form.brandId} onSelect={handleBrandSelect} onClose={() => setBrandModalOpen(false)} actionButton={{ label: "Brand Not Listed? Request New", onClick: () => { setBrandModalOpen(false); setTimeout(() => { setCustomBrandName(""); setAddBrandError(""); setAddBrandModalOpen(true); }, 200); } }} />

      {/* Add Brand Request Modal */}
      {addBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddBrandModalOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Request New Brand</h3>
              <button onClick={() => setAddBrandModalOpen(false)} className="p-1 text-muted hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted mb-4">This brand will be available immediately. The logo will be added by the admin after approval.</p>
            <input type="text" value={customBrandName} onChange={(e) => setCustomBrandName(e.target.value)} placeholder="Brand name (e.g. Toyota)" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && customBrandName.trim()) handleAddBrand(); }}
              className="w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3" />
            {addBrandError && <p className="text-xs text-bad mb-3">{addBrandError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setAddBrandModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary border border-edge rounded-md hover:bg-hover transition-colors">Cancel</button>
              <button onClick={handleAddBrand} disabled={!customBrandName.trim() || addBrandLoading} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {addBrandLoading ? "Requesting..." : "Request Brand"}
              </button>
            </div>
          </div>
        </div>
      )}
      <SelectModal open={modelModalOpen} title="Select Model" items={(modelsForBrand || []).map((m) => ({ id: m.id, label: `${m.name} ${m.fuelType}`, sublabel: m.category }))} selectedId={form.modelId} onSelect={handleModelSelect} onClose={() => setModelModalOpen(false)} actionButton={{ label: "Add New Model", onClick: () => { setModelModalOpen(false); setTimeout(() => setAddModelModalOpen(true), 200); } }} />
      <AddModelModal open={addModelModalOpen} brandName={selectedBrand?.name || ""} onSave={handleAddModel} onClose={() => setAddModelModalOpen(false)} />
    </div>
  );
}
