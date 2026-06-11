"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
  Save,
  ShieldCheck,
  Shield,
} from "lucide-react";
import {
  getRoles,
  updateRole,
  deleteRole,
  type GarageRole,
} from "@/lib/api-roles";
import { MODULES, MODULE_LABELS, MODULE_SUB_PAGES, PERMISSION_GROUPS, FINANCIAL_MODULES, type Module } from "@/lib/permissions";

export default function RolesPage() {
  const router = useRouter();

  // Data
  const [roles, setRoles] = useState<GarageRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal form
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<GarageRole | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formFinancialModules, setFormFinancialModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<GarageRole | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Load roles on mount ──
  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    setError("");
    try {
      const data = await getRoles();
      setRoles(data || []);
    } catch {
      setError("Failed to load roles. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Permission helpers ──
  function hasPermission(module: Module, action: "VIEW" | "MANAGE"): boolean {
    if (action === "VIEW") {
      return formPermissions.includes(`${module}:VIEW`) || formPermissions.includes(`${module}:MANAGE`);
    }
    return formPermissions.includes(`${module}:MANAGE`);
  }

  function togglePermission(module: Module, action: "VIEW" | "MANAGE") {
    setFormPermissions((prev) => {
      const viewPerm = `${module}:VIEW`;
      const managePerm = `${module}:MANAGE`;

      let next = [...prev];

      if (action === "MANAGE") {
        if (next.includes(managePerm)) {
          next = next.filter((p) => p !== managePerm);
        } else {
          if (!next.includes(managePerm)) next.push(managePerm);
          if (!next.includes(viewPerm)) next.push(viewPerm);
        }
      } else {
        if (next.includes(viewPerm)) {
          next = next.filter((p) => p !== viewPerm && p !== managePerm);
          setFormFinancialModules((fm) => fm.filter((m) => m !== module));
        } else {
          next.push(viewPerm);
        }
      }

      return next;
    });
  }

  // ── Financial module helpers ──
  function hasFinancial(module: Module): boolean {
    return formFinancialModules.includes(module);
  }

  function toggleFinancial(module: Module) {
    setFormFinancialModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  }

  // ── Open edit modal ──
  function openEdit(role: GarageRole) {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || "");
    setFormPermissions([...role.permissions]);
    setFormFinancialModules([...(role.financialModules || [])]);
    setFormError("");
    setShowModal(true);
  }

  // ── Close modal ──
  function closeModal() {
    setShowModal(false);
    setEditingRole(null);
    setFormError("");
  }

  // ── Save (create / update) ──
  async function handleSave() {
    if (!formName.trim()) {
      setFormError("Role name is required.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        permissions: formPermissions,
        financialModules: formFinancialModules,
      };

      if (editingRole) {
        const updated = await updateRole(editingRole.id, payload);
        setRoles((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
      }
      closeModal();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save role.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──
  function openDelete(role: GarageRole) {
    setDeleteTarget(role);
    setDeleteError("");
  }

  function closeDelete() {
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteRole(deleteTarget.id);
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      closeDelete();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete role. It may be assigned to staff members.";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Count permissions for display ──
  function permissionCount(permissions: string[]): number {
    return permissions.length;
  }

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">
            Roles Management
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage permissions for your garage staff roles.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-sm text-muted mt-3">Loading roles...</p>
          </div>
        ) : error ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center py-24">
            <div className="inline-flex items-center justify-center bg-bad-light p-4 rounded-full mb-4">
              <X className="w-7 h-7 text-bad" />
            </div>
            <p className="text-sm text-bad font-medium mb-1">{error}</p>
            <button
              onClick={loadRoles}
              className="text-sm text-primary hover:underline mt-2"
            >
              Try again
            </button>
          </div>
        ) : roles.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24">
            <div className="inline-flex items-center justify-center bg-primary-light p-5 rounded-full mb-5">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              No roles found
            </h3>
            <p className="text-sm text-muted text-center max-w-sm">
              Default roles will be created automatically when the garage is set up.
            </p>
          </div>
        ) : (
          /* Role cards grid */
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-background border border-edge rounded-lg shadow-md p-5 flex flex-col hover:shadow-lg transition-shadow"
              >
                {/* Top row: icon + actions */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {role.name}
                        </h3>
                        {role.isDefault && (
                          <span className="text-[10px] font-medium text-primary bg-primary-light px-1.5 py-0.5 rounded shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permission count badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-light px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    {permissionCount(role.permissions)} permission
                    {permissionCount(role.permissions) !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-edge">
                  <button
                    onClick={() => openEdit(role)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary-light px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <div className="flex-1" />
                  {!role.isDefault && (
                    <button
                      onClick={() => openDelete(role)}
                      className="flex items-center gap-1.5 text-xs font-medium text-bad hover:bg-bad-light px-3 py-1.5 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-edge shrink-0">
              <h3 className="text-sm font-semibold text-foreground">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Form error */}
              {formError && (
                <div className="bg-bad-light border border-bad/20 text-bad text-sm px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}

              {/* Role name */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Role Name <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Service Advisor"
                  disabled={editingRole?.isDefault}
                  className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                  autoFocus
                />
                {editingRole?.isDefault && (
                  <p className="text-[11px] text-muted mt-1">Default role names cannot be changed.</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this role's responsibilities..."
                  rows={2}
                  className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Permission grid – grouped by sidebar sections */}
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Permissions
                </label>
                <div className="space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupHasFinancial = group.modules.some((m) =>
                      FINANCIAL_MODULES.includes(m)
                    );
                    return (
                    <div key={group.title} className="border border-edge rounded-lg overflow-hidden">
                      {/* Group header */}
                      <div className={`grid ${groupHasFinancial ? "grid-cols-[1fr_60px_60px_60px]" : "grid-cols-[1fr_60px_60px]"} bg-dim px-4 py-2 border-b border-edge`}>
                        <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                          {group.title}
                        </span>
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide text-center">
                          View
                        </span>
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide text-center">
                          Manage
                        </span>
                        {groupHasFinancial && (
                          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide text-center">
                            &#x20B9;
                          </span>
                        )}
                      </div>

                      {/* Module rows */}
                      {group.modules.map((mod, idx) => {
                        const isFinancialModule = FINANCIAL_MODULES.includes(mod);
                        const modHasAccess = hasPermission(mod, "VIEW");
                        return (
                        <div
                          key={mod}
                          className={`grid ${groupHasFinancial ? "grid-cols-[1fr_60px_60px_60px]" : "grid-cols-[1fr_60px_60px]"} items-center px-4 py-2.5 ${
                            idx < group.modules.length - 1
                              ? "border-b border-edge"
                              : ""
                          } hover:bg-dim/50 transition-colors`}
                        >
                          <div>
                            <span className="text-sm text-foreground font-medium">
                              {MODULE_LABELS[mod]}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {MODULE_SUB_PAGES[mod].map((sub) => (
                                <span
                                  key={sub}
                                  className="text-[10px] text-muted bg-dim px-1.5 py-0.5 rounded"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* View checkbox */}
                          <div className="flex justify-center">
                            <label className="relative flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPermission(mod, "VIEW")}
                                onChange={() => togglePermission(mod, "VIEW")}
                                className="sr-only peer"
                              />
                              <div className="w-5 h-5 border-2 border-edge rounded-md peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                                {hasPermission(mod, "VIEW") && (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Manage checkbox */}
                          <div className="flex justify-center">
                            <label className="relative flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPermission(mod, "MANAGE")}
                                onChange={() => togglePermission(mod, "MANAGE")}
                                className="sr-only peer"
                              />
                              <div className="w-5 h-5 border-2 border-edge rounded-md peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                                {hasPermission(mod, "MANAGE") && (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Financial toggle — only for modules with financial data */}
                          {groupHasFinancial && (
                            <div className="flex justify-center">
                              {isFinancialModule ? (
                                <label className={`relative flex items-center justify-center ${modHasAccess ? "cursor-pointer" : "cursor-not-allowed opacity-30"}`}>
                                  <input
                                    type="checkbox"
                                    checked={hasFinancial(mod)}
                                    onChange={() => toggleFinancial(mod)}
                                    disabled={!modHasAccess}
                                    className="sr-only peer"
                                  />
                                  <div className={`w-5 h-5 border-2 rounded-md transition-colors flex items-center justify-center ${
                                    hasFinancial(mod) && modHasAccess
                                      ? "bg-amber-500 border-amber-500"
                                      : "border-edge"
                                  }`}>
                                    {hasFinancial(mod) && modHasAccess && (
                                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </label>
                              ) : (
                                <span className="w-5 h-5" />
                              )}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted mt-2">
                  Checking &quot;Manage&quot; automatically grants
                  &quot;View&quot; access. Unchecking &quot;View&quot; also
                  removes &quot;Manage&quot;.
                  The <span className="text-amber-600 font-semibold">&#x20B9;</span> column
                  controls whether the role can see prices, totals, GST, and
                  other financial data in that module.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-edge shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="inline-flex items-center justify-center bg-bad-light p-3.5 rounded-full mb-4">
              <Trash2 className="w-6 h-6 text-bad" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Delete &quot;{deleteTarget.name}&quot;?
            </h3>
            <p className="text-xs text-muted mb-4">
              This action cannot be undone. The role and all its permission
              settings will be permanently removed.
            </p>

            {/* Delete error */}
            {deleteError && (
              <div className="bg-bad-light border border-bad/20 text-bad text-xs px-3 py-2 rounded-lg mb-4 text-left">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={closeDelete}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 bg-bad text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
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
