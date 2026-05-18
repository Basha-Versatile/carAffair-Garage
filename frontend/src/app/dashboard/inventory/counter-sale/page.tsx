"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Receipt, Search, Tag, IndianRupee } from "lucide-react";
import { getParts, Part, addCounterSale } from "@/lib/inventory-data";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

interface CSForm {
  customerName: string;
  customerPhone: string;
  placeOfSupply: string;
  services: { name: string; qty: number; rate: number }[];
  servicesGstInclusive: boolean;
  parts: { partId: string; qty: number; rate: number }[];
  partsGstInclusive: boolean;
  tags: string[];
}

const emptyForm: CSForm = {
  customerName: "",
  customerPhone: "",
  placeOfSupply: "Telangana",
  services: [],
  servicesGstInclusive: false,
  parts: [],
  partsGstInclusive: false,
  tags: [],
};

export default function CounterSalePage() {
  const router = useRouter();
  const [form, setForm] = useState<CSForm>(emptyForm);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setAvailableParts(getParts());
  }, []);

  /* ── helpers ── */

  function updateForm<K extends keyof CSForm>(field: K, value: CSForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  /* ── service helpers ── */

  function addService() {
    updateForm("services", [...form.services, { name: "", qty: 1, rate: 0 }]);
  }

  function updateService(idx: number, field: keyof CSForm["services"][0], value: string | number) {
    const updated = [...form.services];
    updated[idx] = { ...updated[idx], [field]: value };
    updateForm("services", updated);
  }

  function removeService(idx: number) {
    updateForm("services", form.services.filter((_, i) => i !== idx));
  }

  /* ── parts helpers ── */

  function addPart() {
    updateForm("parts", [...form.parts, { partId: "", qty: 1, rate: 0 }]);
  }

  function updatePart(idx: number, field: keyof CSForm["parts"][0], value: string | number) {
    const updated = [...form.parts];
    updated[idx] = { ...updated[idx], [field]: value };
    // auto-fill rate when part is selected
    if (field === "partId" && typeof value === "string") {
      const found = availableParts.find((p) => p.id === value);
      if (found) updated[idx].rate = found.sellingPrice;
    }
    updateForm("parts", updated);
  }

  function removePart(idx: number) {
    updateForm("parts", form.parts.filter((_, i) => i !== idx));
  }

  /* ── tags helpers ── */

  function addTag() {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    updateForm("tags", [...form.tags, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateForm("tags", form.tags.filter((t) => t !== tag));
  }

  /* ── calculations ── */

  function serviceRowAmount(s: CSForm["services"][0]) {
    return s.qty * s.rate;
  }

  function partRowAmount(p: CSForm["parts"][0]) {
    return p.qty * p.rate;
  }

  const servicesSubTotal = form.services.reduce((sum, s) => sum + serviceRowAmount(s), 0);
  const partsSubTotal = form.parts.reduce((sum, p) => sum + partRowAmount(p), 0);

  // services tax: 18% GST
  const servicesTaxAmount = form.servicesGstInclusive
    ? servicesSubTotal - servicesSubTotal / 1.18
    : servicesSubTotal * 0.18;

  // parts tax: use each part's gstRate
  const partsTaxAmount = form.parts.reduce((sum, p) => {
    const part = availableParts.find((ap) => ap.id === p.partId);
    const gstRate = part ? part.gstRate : 18;
    const amount = partRowAmount(p);
    if (form.partsGstInclusive) {
      return sum + (amount - amount / (1 + gstRate / 100));
    }
    return sum + amount * (gstRate / 100);
  }, 0);

  const grandTotal = form.servicesGstInclusive
    ? servicesSubTotal + (form.partsGstInclusive ? partsSubTotal : partsSubTotal + partsTaxAmount)
    : servicesSubTotal + servicesTaxAmount + (form.partsGstInclusive ? partsSubTotal : partsSubTotal + partsTaxAmount);

  /* ── submit ── */

  function handleSubmit() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name is required";
    if (!form.customerPhone.trim() || form.customerPhone.length < 10) e.customerPhone = "Valid phone number is required";
    if (form.services.length === 0 && form.parts.length === 0) e.items = "Add at least one service or part";
    for (let i = 0; i < form.services.length; i++) {
      if (!form.services[i].name.trim()) { e[`service_${i}`] = "Service name is required"; }
    }
    for (let i = 0; i < form.parts.length; i++) {
      if (!form.parts[i].partId) { e[`part_${i}`] = "Please select a part"; }
    }
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const csItems = form.parts.map((p) => {
      const part = availableParts.find((ap) => ap.id === p.partId);
      const amount = partRowAmount(p);
      const gstRate = part ? part.gstRate : 18;
      let gstAmount: number;
      let baseAmount: number;
      if (form.partsGstInclusive) {
        gstAmount = amount - amount / (1 + gstRate / 100);
        baseAmount = amount - gstAmount;
      } else {
        gstAmount = amount * (gstRate / 100);
        baseAmount = amount;
      }
      return {
        partId: p.partId,
        name: part?.name || "",
        qty: p.qty,
        rate: p.rate,
        amount: baseAmount,
        gstRate,
        gstAmount,
      };
    });

    const csServices = form.services.map((s) => {
      const amount = serviceRowAmount(s);
      const gstRate = 18;
      let gstAmount: number;
      let baseAmount: number;
      if (form.servicesGstInclusive) {
        gstAmount = amount - amount / (1 + gstRate / 100);
        baseAmount = amount - gstAmount;
      } else {
        gstAmount = amount * (gstRate / 100);
        baseAmount = amount;
      }
      return {
        name: s.name,
        qty: s.qty,
        rate: s.rate,
        amount: baseAmount,
        gstRate,
        gstAmount,
      };
    });

    const totalAmount = csItems.reduce((s, i) => s + i.amount, 0) + csServices.reduce((s, sv) => s + sv.amount, 0);
    const gstAmount = csItems.reduce((s, i) => s + i.gstAmount, 0) + csServices.reduce((s, sv) => s + sv.gstAmount, 0);

    addCounterSale({
      invoiceNumber: `CS-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      date: new Date().toISOString().split("T")[0],
      placeOfSupply: form.placeOfSupply,
      items: csItems,
      services: csServices,
      totalAmount,
      gstAmount,
      grandTotal: totalAmount + gstAmount,
      discount: 0,
      paymentStatus: "paid",
      tags: form.tags,
    });

    router.push("/dashboard/inventory");
  }

  /* ── style constants ── */

  const inputCls =
    "w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const labelCls = "block text-sm font-medium text-secondary mb-1";
  const sectionHeaderCls =
    "bg-primary text-white px-4 py-2.5 rounded-t-md flex items-center justify-between";

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/inventory")}
          className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Counter Sale</h1>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-slide-up">
          {/* ── Customer Details ── */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className="px-5 py-3 bg-dim border-b border-edge">
              <h3 className="text-sm font-semibold text-secondary">Customer Details</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Search Customer */}
              <div>
                <label className={labelCls}>Search Customer</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    className={`${inputCls} pl-10`}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Customer Name <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => updateForm("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    className={inputCls}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-bad mt-1">{errors.customerName}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Customer Phone <span className="text-bad">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={form.customerPhone}
                    onChange={(e) =>
                      updateForm("customerPhone", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter phone number"
                    className={inputCls}
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-bad mt-1">{errors.customerPhone}</p>
                  )}
                </div>
              </div>

              {/* Place of Supply */}
              <div>
                <label className={labelCls}>Place of Supply</label>
                <select
                  value={form.placeOfSupply}
                  onChange={(e) => updateForm("placeOfSupply", e.target.value)}
                  className={`${inputCls} appearance-none cursor-pointer`}
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── SERVICES Section ── */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className={sectionHeaderCls}>
              <span className="text-sm font-semibold">SERVICES</span>
              <button
                onClick={addService}
                className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* GST Inclusive Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">GST Inclusive In Rate?</span>
                <button
                  type="button"
                  onClick={() => updateForm("servicesGstInclusive", !form.servicesGstInclusive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    form.servicesGstInclusive ? "bg-primary" : "bg-edge"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.servicesGstInclusive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {form.services.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No services added. Click &quot;+ Add&quot; to add a service.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.services.map((service, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-start animate-fade-in"
                    >
                      <div className="col-span-5">
                        {idx === 0 && <label className={labelCls}>Service Name</label>}
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(idx, "name", e.target.value)}
                          placeholder="Service name"
                          className={inputCls}
                        />
                        {errors[`service_${idx}`] && (
                          <p className="text-xs text-bad mt-1">{errors[`service_${idx}`]}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className={labelCls}>Qty</label>}
                        <input
                          type="number"
                          min={1}
                          value={service.qty}
                          onChange={(e) =>
                            updateService(idx, "qty", Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className={labelCls}>Rate</label>}
                        <input
                          type="number"
                          min={0}
                          value={service.rate}
                          onChange={(e) =>
                            updateService(idx, "rate", Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className={labelCls}>Amount</label>}
                        <div className="px-3.5 py-2.5 text-sm text-foreground font-medium flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3" />
                          {serviceRowAmount(service).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {idx === 0 && <label className={`${labelCls} invisible`}>X</label>}
                        <button
                          onClick={() => removeService(idx)}
                          className="p-2 text-muted hover:text-bad hover:bg-hover rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PARTS / STOCKS Section ── */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className={sectionHeaderCls}>
              <span className="text-sm font-semibold">PARTS / STOCKS</span>
              <button
                onClick={addPart}
                className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* GST Inclusive Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">GST Inclusive In Rate?</span>
                <button
                  type="button"
                  onClick={() => updateForm("partsGstInclusive", !form.partsGstInclusive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    form.partsGstInclusive ? "bg-primary" : "bg-edge"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.partsGstInclusive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {form.parts.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No parts added. Click &quot;+ Add&quot; to add a part.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.parts.map((part, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-start animate-fade-in"
                    >
                      <div className="col-span-5">
                        {idx === 0 && <label className={labelCls}>Part</label>}
                        <select
                          value={part.partId}
                          onChange={(e) => updatePart(idx, "partId", e.target.value)}
                          className={`${inputCls} appearance-none cursor-pointer`}
                        >
                          <option value="">Select part</option>
                          {availableParts.map((ap) => (
                            <option key={ap.id} value={ap.id}>
                              {ap.name} ({ap.partNumber})
                            </option>
                          ))}
                        </select>
                        {errors[`part_${idx}`] && (
                          <p className="text-xs text-bad mt-1">{errors[`part_${idx}`]}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className={labelCls}>Qty</label>}
                        <input
                          type="number"
                          min={1}
                          value={part.qty}
                          onChange={(e) =>
                            updatePart(idx, "qty", Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className={labelCls}>Rate</label>}
                        <input
                          type="number"
                          min={0}
                          value={part.rate}
                          onChange={(e) =>
                            updatePart(idx, "rate", Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className={labelCls}>Amount</label>}
                        <div className="px-3.5 py-2.5 text-sm text-foreground font-medium flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3" />
                          {partRowAmount(part).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {idx === 0 && <label className={`${labelCls} invisible`}>X</label>}
                        <button
                          onClick={() => removePart(idx)}
                          className="p-2 text-muted hover:text-bad hover:bg-hover rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── TAGS Section ── */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className={sectionHeaderCls}>
              <span className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4" />
                TAGS
              </span>
              <button
                onClick={addTag}
                className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Enter tag name"
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                >
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-sm font-medium px-3 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-bad transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Totals Section ── */}
          <div className="bg-dim rounded-lg border border-edge p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">Services Sub Total</span>
              <span className="text-foreground font-medium flex items-center gap-0.5">
                <IndianRupee className="w-3 h-3" />
                {servicesSubTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">Parts Sub Total</span>
              <span className="text-foreground font-medium flex items-center gap-0.5">
                <IndianRupee className="w-3 h-3" />
                {partsSubTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="border-t border-edge-light my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">Services Tax Amount (18% GST)</span>
              <span className="text-foreground font-medium flex items-center gap-0.5">
                <IndianRupee className="w-3 h-3" />
                {servicesTaxAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">Parts Tax Amount</span>
              <span className="text-foreground font-medium flex items-center gap-0.5">
                <IndianRupee className="w-3 h-3" />
                {partsTaxAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="border-t border-edge my-2" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Grand Total</span>
              <span className="text-lg font-bold text-foreground flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />
                {grandTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* ── Validation Error ── */}
          {errors.items && (
            <p className="text-sm text-bad text-center">{errors.items}</p>
          )}

          {/* ── Footer ── */}
          <div className="flex justify-end gap-3 pb-6">
            <button
              onClick={() => router.push("/dashboard/inventory")}
              className="px-5 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors"
            >
              <Receipt className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
