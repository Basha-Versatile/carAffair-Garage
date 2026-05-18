"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Building2 } from "lucide-react";

interface GarageForm {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  latitude: string;
  longitude: string;
}

const emptyForm: GarageForm = {
  name: "",
  ownerName: "",
  phone: "",
  email: "",
  gstNumber: "",
  address: "",
  latitude: "",
  longitude: "",
};

export default function CreateGaragePage() {
  const router = useRouter();
  const [form, setForm] = useState<GarageForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

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
    if (!form.address.trim()) errs.address = "Address is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      await api.post("/api/garages", {
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        address: form.address.trim(),
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

                {/* Address */}
                <div>
                  <label className={labelCls}>
                    Address <span className="text-bad">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="Enter full address"
                    className={inputCls}
                  />
                  {errors.address && (
                    <p className="text-xs text-bad mt-1">{errors.address}</p>
                  )}
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
