"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUser, isGarageOwner, isSuperAdmin, getAccessToken, type User } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  Building2, ArrowLeft, Pencil, X, Check, Loader2,
  Phone, Mail, MapPin, FileText, Globe, Camera, Upload, ChevronDown,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface GarageProfile {
  id: string;
  name: string;
  ownerName: string;
  gstNumber: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  state: string | null;
  city: string | null;
  streetAddress: string | null;
  logoFileId: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function GarageProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState(false);

  const [garage, setGarage] = useState<GarageProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State & City dropdown data
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    gstNumber: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    streetAddress: "",
  });

  // Load user on client side
  useEffect(() => {
    const u = getUser();
    setUser(u);
    setOwner(isGarageOwner() || isSuperAdmin());
  }, []);

  const garageId = user?.garageId;

  // Fetch states list
  useEffect(() => {
    api.get<string[]>("/api/gst/states")
      .then(setStates)
      .catch(() => {});
  }, []);

  // Fetch cities when state changes in edit mode
  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    api.get<string[]>(`/api/gst/cities?state=${encodeURIComponent(form.state)}`)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [form.state]);

  useEffect(() => {
    if (!user) return; // wait for user to load
    if (!garageId) { setLoading(false); return; }
    api.get<GarageProfile>(`/api/garages/${garageId}`)
      .then((data) => {
        setGarage(data);
        setForm({
          name: data.name || "",
          ownerName: data.ownerName || "",
          gstNumber: data.gstNumber || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          state: data.state || "",
          city: data.city || "",
          streetAddress: data.streetAddress || "",
        });
      })
      .catch(() => setError("Failed to load garage details"))
      .finally(() => setLoading(false));
  }, [garageId]);

  function startEditing() {
    if (!garage) return;
    setForm({
      name: garage.name || "",
      ownerName: garage.ownerName || "",
      gstNumber: garage.gstNumber || "",
      email: garage.email || "",
      phone: garage.phone || "",
      address: garage.address || "",
      state: garage.state || "",
      city: garage.city || "",
      streetAddress: garage.streetAddress || "",
    });
    setEditing(true);
    setError("");
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
  }

  async function handleSave() {
    if (!garageId) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.put<GarageProfile>(`/api/garages/${garageId}`, form);
      setGarage(updated);
      setEditing(false);
      setSuccessMsg("Garage profile updated successfully");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !garageId) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/garages/${garageId}/logo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await response.json();
      if (!response.ok || json.success === false) {
        throw new Error(json.message || "Failed to upload logo");
      }
      setGarage(json.data);
      setSuccessMsg("Logo updated successfully");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const logoUrl = garage?.logoFileId ? `${API_BASE_URL}/api/images/${garage.logoFileId}` : null;

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[var(--border-main)] bg-[var(--surface-bg)] text-[var(--surface-fg)] placeholder:text-[var(--text-mut)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed";
  const labelCls = "block text-xs font-semibold text-[var(--text-sec)] mb-1.5 uppercase tracking-wider";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!garageId || !garage) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Building2 className="w-12 h-12 text-[var(--text-mut)] mb-3" />
        <p className="text-[var(--surface-fg)] font-semibold">No garage found</p>
        <p className="text-sm text-[var(--text-mut)] mt-1">Your account is not linked to a garage.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[var(--surface-bg)] border-b border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--surface-hover)] text-[var(--text-sec)] transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <Building2 className="w-5 h-5 text-red-500" />
          <h1 className="text-lg font-bold text-[var(--surface-fg)] tracking-tight">Garage Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-sec)] hover:bg-[var(--surface-hover)] border border-[var(--border-main)] transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            owner && (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            )
          )}
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{successMsg}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
          <X className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Logo & Name Card */}
          <div className="bg-[var(--surface-bg)] border border-[var(--border-main)] rounded-2xl p-6">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl border-2 border-[var(--border-main)] bg-[var(--surface-hover)] flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Garage Logo"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-[var(--text-mut)]" />
                  )}
                </div>
                {owner && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </>
                )}
                {owner && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors"
                  >
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Name info */}
              <div className="flex-1 min-w-0 pt-1">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Garage Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Enter garage name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Owner Name</label>
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                        placeholder="Enter owner name"
                        className={inputCls}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-[var(--surface-fg)] tracking-tight">{garage.name}</h2>
                    <p className="text-sm text-[var(--text-sec)] mt-0.5">Owned by {garage.ownerName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${garage.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${garage.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {garage.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-[var(--surface-bg)] border border-[var(--border-main)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--surface-fg)] mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-500" />
              Contact Details
            </h3>
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    disabled
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Enter email address"
                    className={inputCls}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow icon={Phone} label="Phone" value={garage.phone} />
                <DetailRow icon={Mail} label="Email" value={garage.email} />
              </div>
            )}
          </div>

          {/* Address */}
          <div className="bg-[var(--surface-bg)] border border-[var(--border-main)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--surface-fg)] mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Address
            </h3>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Street Address</label>
                  <input
                    type="text"
                    value={form.streetAddress}
                    onChange={(e) => setForm((p) => ({ ...p, streetAddress: e.target.value }))}
                    placeholder="Enter street address"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>State</label>
                    <div className="relative">
                      <select
                        value={form.state}
                        onChange={(e) => setForm((p) => ({ ...p, state: e.target.value, city: "" }))}
                        className={inputCls + " appearance-none pr-10 cursor-pointer"}
                      >
                        <option value="">Select state</option>
                        {states.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mut)] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <div className="relative">
                      <select
                        value={form.city}
                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                        disabled={!form.state || loadingCities}
                        className={inputCls + " appearance-none pr-10 cursor-pointer"}
                      >
                        <option value="">{loadingCities ? "Loading cities..." : form.state ? "Select city" : "Select state first"}</option>
                        {cities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {loadingCities ? (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mut)] animate-spin pointer-events-none" />
                      ) : (
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-mut)] pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Full Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Enter full address"
                    rows={2}
                    className={inputCls + " resize-none"}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <DetailRow icon={MapPin} label="Street" value={garage.streetAddress} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DetailRow icon={Globe} label="City" value={garage.city} />
                  <DetailRow icon={Globe} label="State" value={garage.state} />
                </div>
                <DetailRow icon={MapPin} label="Full Address" value={garage.address} />
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="bg-[var(--surface-bg)] border border-[var(--border-main)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--surface-fg)] mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              Business Details
            </h3>
            {editing ? (
              <div>
                <label className={labelCls}>GST Number</label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
                  placeholder="Enter GST number"
                  className={inputCls + " font-mono tracking-wider"}
                />
              </div>
            ) : (
              <DetailRow icon={FileText} label="GST Number" value={garage.gstNumber} mono />
            )}
          </div>

          {/* Meta Info */}
          {garage.createdAt && (
            <div className="text-center text-xs text-[var(--text-mut)] pb-4">
              Created {new Date(garage.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              {garage.updatedAt && (
                <> &middot; Last updated {new Date(garage.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }: { icon: typeof Phone; label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[var(--text-mut)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[var(--text-mut)] uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium text-[var(--surface-fg)] mt-0.5 ${mono ? "font-mono tracking-wider" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
