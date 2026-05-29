"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getIndianStates } from "@/lib/api-orders";
import { ArrowLeft, Building2, ChevronDown, Search, Check } from "lucide-react";

interface GarageForm {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  gstNumber: string;
  state: string;
  city: string;
  streetAddress: string;
  latitude: string;
  longitude: string;
}

const emptyForm: GarageForm = {
  name: "",
  ownerName: "",
  phone: "",
  email: "",
  gstNumber: "",
  state: "",
  city: "",
  streetAddress: "",
  latitude: "",
  longitude: "",
};

export default function CreateGaragePage() {
  const router = useRouter();
  const [form, setForm] = useState<GarageForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // State dropdown
  const [states, setStates] = useState<string[]>([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState("");
  const stateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getIndianStates().then(setStates).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function updateForm(field: keyof GarageForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Garage name is required";
    if (!form.ownerName.trim()) errs.ownerName = "Owner name is required";
    if (!form.phone.trim() || form.phone.length < 10)
      errs.phone = "Valid 10-digit phone number is required";
    if (!form.state) errs.state = "State is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError("");

    // Build address string from structured fields
    const addressParts = [form.streetAddress, form.city, form.state].filter(Boolean);
    const address = addressParts.join(", ");

    try {
      await api.post("/api/garages", {
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        address: address || undefined,
        state: form.state || undefined,
        city: form.city.trim() || undefined,
        streetAddress: form.streetAddress.trim() || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      });
      router.push("/dashboard/super-admin/garages");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to create garage");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredStates = states.filter((s) =>
    s.toLowerCase().includes(stateFilter.toLowerCase())
  );

  const inputCls =
    "w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const labelCls = "block text-sm font-medium text-secondary mb-1";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/super-admin/garages")}
          className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Register New Garage</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
                <Building2 className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-semibold text-secondary">Garage Details</h3>
              </div>

              <div className="p-5 space-y-4">
                {/* Garage Name */}
                <div>
                  <label className={labelCls}>
                    Garage Name <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Enter garage name"
                    className={inputCls}
                  />
                  {errors.name && <p className="text-xs text-bad mt-1">{errors.name}</p>}
                </div>

                {/* Owner Name */}
                <div>
                  <label className={labelCls}>
                    Owner Name <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => updateForm("ownerName", e.target.value)}
                    placeholder="Enter owner name"
                    className={inputCls}
                  />
                  {errors.ownerName && (
                    <p className="text-xs text-bad mt-1">{errors.ownerName}</p>
                  )}
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Phone Number <span className="text-bad">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) =>
                        updateForm("phone", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 10-digit phone"
                      className={inputCls}
                    />
                    {errors.phone && (
                      <p className="text-xs text-bad mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="Enter email address"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div>
                  <label className={labelCls}>GST Number</label>
                  <input
                    type="text"
                    value={form.gstNumber}
                    onChange={(e) => updateForm("gstNumber", e.target.value)}
                    placeholder="Enter GST number"
                    className={inputCls}
                  />
                </div>

                {/* State + City */}
                <div className="grid grid-cols-2 gap-4">
                  <div ref={stateRef} className="relative">
                    <label className={labelCls}>
                      State <span className="text-bad">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setStateOpen(!stateOpen); setStateFilter(""); }}
                      className={`${inputCls} text-left flex items-center justify-between`}
                    >
                      <span className={form.state ? "text-foreground" : "text-muted"}>
                        {form.state || "Select state..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted" />
                    </button>
                    {stateOpen && (
                      <div className="absolute z-30 top-full left-0 mt-1 w-full bg-background border border-edge rounded-md shadow-lg max-h-60 flex flex-col">
                        <div className="p-2 border-b border-edge">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                            <input
                              type="text"
                              value={stateFilter}
                              onChange={(e) => setStateFilter(e.target.value)}
                              placeholder="Search state..."
                              autoFocus
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-edge rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {filteredStates.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { updateForm("state", s); setStateOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-hover flex items-center justify-between ${
                                form.state === s ? "bg-primary-light text-primary font-medium" : "text-foreground"
                              }`}
                            >
                              {s}
                              {form.state === s && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                          {filteredStates.length === 0 && (
                            <p className="text-sm text-muted text-center py-4">No states found</p>
                          )}
                        </div>
                      </div>
                    )}
                    {errors.state && <p className="text-xs text-bad mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateForm("city", e.target.value)}
                      placeholder="Enter city name"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className={labelCls}>Street Address</label>
                  <input
                    type="text"
                    value={form.streetAddress}
                    onChange={(e) => updateForm("streetAddress", e.target.value)}
                    placeholder="Road, area, locality"
                    className={inputCls}
                  />
                </div>

                {/* Lat + Lng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => updateForm("latitude", e.target.value)}
                      placeholder="e.g. 17.385"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => updateForm("longitude", e.target.value)}
                      placeholder="e.g. 78.4867"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {apiError && (
              <div className="mt-4 px-4 py-3 bg-bad-light border border-bad/20 rounded-md">
                <p className="text-sm text-bad">{apiError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/super-admin/garages")}
                className="px-4 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Register Garage
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
