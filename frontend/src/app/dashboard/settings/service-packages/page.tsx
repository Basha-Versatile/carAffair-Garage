"use client";

import { useState, useEffect, useMemo } from "react";
import { canManage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  Package,
  X,
  Save,
  ChevronDown,
  Wrench,
} from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import {
  ServicePackage,
  PackageServiceItem,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from "@/lib/api-packages";
import {
  GarageService,
  getGarageServices,
} from "@/lib/api-garage-services";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

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

function makeColumns(
  onEdit: (p: ServicePackage) => void,
  onDelete: (p: ServicePackage) => void,
): DataColumn<ServicePackage>[] {
  return [
    {
      key: "name",
      header: "Package Name",
      render: (p) => (
        <div>
          <span className="font-medium text-foreground">{p.name}</span>
          {p.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-1">{p.description}</p>
          )}
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: "services",
      header: "Services",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.serviceItems.slice(0, 3).map((s, i) => (
            <span key={i} className="text-[11px] bg-hover text-muted px-1.5 py-0.5 rounded">
              {s.serviceName}
            </span>
          ))}
          {p.serviceItems.length > 3 && (
            <span className="text-[11px] bg-primary-light text-primary px-1.5 py-0.5 rounded font-medium">
              +{p.serviceItems.length - 3} more
            </span>
          )}
          {p.serviceItems.length === 0 && (
            <span className="text-xs text-muted">No services</span>
          )}
        </div>
      ),
      sortValue: (p) => p.serviceItems.length,
    },
    {
      key: "count",
      header: "Items",
      align: "right",
      render: (p) => (
        <span className="font-semibold text-foreground tabular-nums">
          {p.serviceItems.length}
        </span>
      ),
      sortValue: (p) => p.serviceItems.length,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) =>
        canManage("SETTINGS") ? (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(p); }}
              className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(p); }}
              className="p-1.5 rounded-md text-muted hover:text-bad hover:bg-hover transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null,
    },
  ];
}

export default function ServicePackagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [allServices, setAllServices] = useState<GarageService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<PackageServiceItem[]>([]);

  // service picker
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // delete confirmation
  const [deletingPkg, setDeletingPkg] = useState<ServicePackage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [pkgData, svcData] = await Promise.all([
        getPackages().catch(() => []),
        getGarageServices().catch(() => []),
      ]);
      setPackages(pkgData || []);
      setAllServices(svcData || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const query = search.toLowerCase();
  const filteredPackages = useMemo(
    () =>
      packages.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description ?? "").toLowerCase().includes(query) ||
          p.serviceItems.some((s) => s.serviceName.toLowerCase().includes(query)),
      ),
    [packages, query],
  );

  const columns = useMemo(
    () => makeColumns(openEdit, (p) => setDeletingPkg(p)),
    [],
  );

  const selectedServiceIds = new Set(selectedServices.map((s) => s.serviceId));
  const filteredAvailableServices = useMemo(() => {
    const sq = serviceSearch.toLowerCase();
    return allServices.filter(
      (s) => !selectedServiceIds.has(s.id) && s.name.toLowerCase().includes(sq),
    );
  }, [allServices, selectedServiceIds, serviceSearch]);

  function openAdd() {
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedServices([]);
    setServiceSearch("");
    setShowForm(true);
  }

  function openEdit(pkg: ServicePackage) {
    setEditing(pkg);
    setName(pkg.name);
    setDescription(pkg.description || "");
    setSelectedServices([...pkg.serviceItems]);
    setServiceSearch("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function addService(svc: GarageService) {
    setSelectedServices((prev) => [
      ...prev,
      {
        serviceId: svc.id,
        serviceName: svc.name,
        hsnSac: svc.sacNumber || "",
        defaultQty: 1,
        defaultRate: 0,
        gstRate: svc.gstRate || 0,
      },
    ]);
    setServiceSearch("");
    setShowServiceDropdown(false);
  }

  function removeService(serviceId: string) {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        serviceItems: selectedServices,
        partItems: [],
        totalEstimate: 0,
        isActive: true,
      };
      if (editing) {
        const updated = await updatePackage(editing.id, payload);
        setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createPackage(payload as Omit<ServicePackage, "id">);
        setPackages((prev) => [created, ...prev]);
      }
      closeForm();
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingPkg) return;
    setDeleting(true);
    try {
      await deletePackage(deletingPkg.id);
      setPackages((prev) => prev.filter((p) => p.id !== deletingPkg.id));
      setDeletingPkg(null);
    } catch {
      // keep dialog
    } finally {
      setDeleting(false);
    }
  }

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
          <h1 className="text-base font-semibold text-foreground">Service Packages</h1>
          <p className="text-xs text-muted mt-0.5">
            Group services into packages for quick selection when creating orders. Prices are set at order time.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search + Add */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-white">
              <Package className="w-3.5 h-3.5" />
              Packages
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-white/20 text-white">
                {packages.length}
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-9 pr-4 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Add button */}
          {canManage("SETTINGS") && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Package
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
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Package className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {search ? "No packages match your search" : "No packages yet"}
            </p>
            <p className="text-muted text-sm">
              {search
                ? "Try a different search."
                : "Create your first service package to group services together."}
            </p>
          </div>
        ) : (
          <div className="px-6 py-4">
            <DataTable
              columns={columns}
              data={filteredPackages}
              keyExtractor={(p) => p.id}
              className={TABLE_CLS}
            />
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">
                {editing ? "Edit Package" : "Create New Package"}
              </h3>
              <button
                onClick={closeForm}
                className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <Field label="Package Name *">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Basic Service, Full Body Care"
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Description">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for this package"
                  className={INPUT_CLS}
                />
              </Field>

              {/* Service Picker */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Services in Package
                </label>

                {/* Selected services */}
                {selectedServices.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {selectedServices.map((s, idx) => (
                      <div
                        key={s.serviceId + idx}
                        className="flex items-center justify-between px-3 py-2 bg-hover rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-sm text-foreground truncate">{s.serviceName}</span>
                          {s.hsnSac && (
                            <span className="text-[10px] text-muted font-mono">
                              SAC: {s.hsnSac}
                            </span>
                          )}
                          {s.gstRate > 0 && (
                            <span className="text-[10px] text-muted">
                              GST {s.gstRate}%
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeService(s.serviceId)}
                          className="p-1 rounded text-muted hover:text-bad transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search + dropdown to add services */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => {
                        setServiceSearch(e.target.value);
                        setShowServiceDropdown(true);
                      }}
                      onFocus={() => setShowServiceDropdown(true)}
                      placeholder="Search services to add..."
                      className="w-full pl-9 pr-8 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {showServiceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-edge rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                      {filteredAvailableServices.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-muted">
                          {allServices.length === 0
                            ? "No services in your catalog yet"
                            : "No matching services available"}
                        </div>
                      ) : (
                        filteredAvailableServices.map((svc) => (
                          <button
                            key={svc.id}
                            onClick={() => addService(svc)}
                            className="w-full text-left px-3 py-2 hover:bg-hover transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="text-sm text-foreground block truncate">
                                {svc.name}
                              </span>
                              <span className="text-[10px] text-muted">
                                {svc.sacNumber ? `SAC: ${svc.sacNumber}` : ""}
                                {svc.sacNumber && svc.gstRate ? " · " : ""}
                                {svc.gstRate ? `GST ${svc.gstRate}%` : ""}
                              </span>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedServices.length === 0 && (
                  <p className="text-[11px] text-muted mt-1.5">
                    Search and add services from your catalog. Prices will be set when using the package in an order.
                  </p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-edge">
              <span className="text-xs text-muted">
                {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Package"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deletingPkg && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="px-5 py-4 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">Delete Package</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-secondary">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">{deletingPkg.name}</span>?
                This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-edge">
              <button
                onClick={() => setDeletingPkg(null)}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
