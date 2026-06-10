"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  Users,
  X,
  Save,
} from "lucide-react";
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  removeStaffMember,
  getAssignableRoles,
  type StaffMember,
  type AssignableRole,
} from "@/lib/api-staff";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";
import { canManage } from "@/lib/auth";

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

function formatPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `+91 ${digits}`;
}

export default function GarageUsersPage() {
  const router = useRouter();

  // data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // form modal
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // pagination
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState<PageSize>(PAGE_SIZES[0]);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setPageError("");
    try {
      const [staffData, rolesData] = await Promise.all([
        getStaffMembers().catch(() => []),
        getAssignableRoles().catch(() => []),
      ]);
      setStaff(staffData || []);
      setRoles((rolesData || []).filter((r) => r.isActive));
    } catch {
      setPageError("Failed to load staff data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Form helpers ──

  const isEditMode = editingStaff !== null;

  function openAdd() {
    setEditingStaff(null);
    setFormPhone("");
    setFormName("");
    setFormEmail("");
    setFormTitle("");
    setFormRoleId(roles.length > 0 ? roles[0].id : "");
    setFormError("");
    setShowForm(true);
  }

  function openEdit(member: StaffMember) {
    setEditingStaff(member);
    setFormPhone(member.phone);
    setFormName(member.name);
    setFormEmail(member.email || "");
    setFormTitle(member.staffTitle || "");
    setFormRoleId(member.garageRoleId || "");
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingStaff(null);
    setFormError("");
  }

  function validate(): string | null {
    if (!isEditMode) {
      const digits = formPhone.replace(/\D/g, "");
      if (digits.length !== 10) return "Phone number must be exactly 10 digits.";
    }
    if (!formName.trim()) return "Name is required.";
    if (!formRoleId) return "Please select a role.";
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      if (isEditMode && editingStaff) {
        const updated = await updateStaffMember(editingStaff.id, {
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          staffTitle: formTitle.trim() || undefined,
          garageRoleId: formRoleId,
        });
        setStaff((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
      } else {
        const created = await createStaffMember({
          phone: formPhone.replace(/\D/g, ""),
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          staffTitle: formTitle.trim() || undefined,
          garageRoleId: formRoleId,
        });
        setStaff((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete helpers ──

  function openDelete(member: StaffMember) {
    setDeleteTarget(member);
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
      await removeStaffMember(deleteTarget.id);
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      closeDelete();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to remove staff member.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  // ── Role name lookup ──
  function getRoleName(member: StaffMember): string {
    if (member.roleName) return member.roleName;
    const role = roles.find((r) => r.id === member.garageRoleId);
    return role?.name || "\u2014";
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
          <h1 className="text-base font-semibold text-foreground">Garage Users</h1>
          <p className="text-xs text-muted mt-0.5">
            Manage staff members who can access your garage dashboard.
          </p>
        </div>
        {canManage("STAFF") && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Page-level error */}
        {pageError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-bad-light text-bad text-sm">
            {pageError}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-primary-light p-4 rounded-full mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">No staff members yet</p>
            <p className="text-muted text-sm mb-5">
              Add your first staff member to start managing garage access.
            </p>
            {canManage("STAFF") && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Staff Member
              </button>
            )}
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(staff.length / tablePageSize));
            const safePage = Math.min(tablePage, totalPages);
            const start = (safePage - 1) * tablePageSize;
            const pagedStaff = staff.slice(start, start + tablePageSize);
            return (
              <>
                {/* ── Desktop Table (md and above) ── */}
                <div className="hidden md:block px-6 py-4">
                  <div className="bg-background rounded-lg border border-edge overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-edge bg-dim">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                            Name
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                            Phone
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                            Title
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                            Role
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                            Status
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedStaff.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-edge last:border-b-0 hover:bg-dim transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">
                                {member.name}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-secondary font-mono text-xs">
                                {formatPhone(member.phone)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-secondary">
                                {member.staffTitle || "\u2014"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded font-medium">
                                {getRoleName(member)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {member.isActive ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-ok bg-ok-light px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-dim px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {canManage("STAFF") && (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEdit(member)}
                                    className="flex items-center gap-1 text-xs font-medium text-primary hover:bg-primary-light px-2.5 py-1.5 rounded-md transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openDelete(member)}
                                    className="p-1.5 rounded-md text-muted hover:text-bad hover:bg-bad-light transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Pagination total={staff.length} page={safePage} pageSize={tablePageSize} onPageChange={setTablePage} onPageSizeChange={setTablePageSize} />
                  </div>
                </div>

                {/* ── Mobile Card Layout (below md) ── */}
                <div className="md:hidden px-4 py-4 space-y-3">
                  {pagedStaff.map((member) => (
                    <div
                      key={member.id}
                      className="bg-background border border-edge rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {member.name}
                          </p>
                          <p className="text-xs text-secondary font-mono mt-0.5">
                            {formatPhone(member.phone)}
                          </p>
                        </div>
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-ok bg-ok-light px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-dim px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {member.staffTitle && (
                          <span className="text-xs text-secondary bg-dim px-2 py-0.5 rounded">
                            {member.staffTitle}
                          </span>
                        )}
                        <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded font-medium">
                          {getRoleName(member)}
                        </span>
                      </div>

                      {canManage("STAFF") && (
                        <div className="flex items-center justify-end gap-2 border-t border-edge pt-3">
                          <button
                            onClick={() => openEdit(member)}
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:bg-primary-light px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => openDelete(member)}
                            className="flex items-center gap-1 text-xs font-medium text-muted hover:text-bad hover:bg-bad-light px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="bg-background rounded-lg border border-edge overflow-hidden">
                    <Pagination total={staff.length} page={safePage} pageSize={tablePageSize} onPageChange={setTablePage} onPageSizeChange={setTablePageSize} />
                  </div>
                </div>
              </>
            );
          })()
        )}
      </div>

      {/* ── Add/Edit Staff Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">
                {isEditMode ? "Edit Staff Member" : "Add New Staff Member"}
              </h3>
              <button
                onClick={closeForm}
                className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Form error */}
              {formError && (
                <div className="px-3 py-2.5 rounded-lg bg-bad-light text-bad text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Phone (only for create) */}
              {!isEditMode && (
                <Field label="Phone Number *">
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormPhone(val);
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={INPUT_CLS}
                    autoFocus
                  />
                  {formPhone && (
                    <p className="text-xs text-muted mt-1">
                      Will be saved as {formatPhone(formPhone)}
                    </p>
                  )}
                </Field>
              )}

              {/* Name */}
              <Field label="Full Name *">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className={INPUT_CLS}
                  autoFocus={isEditMode}
                />
              </Field>

              {/* Email */}
              <Field label="Email (optional)">
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. ravi@garage.com"
                  className={INPUT_CLS}
                />
              </Field>

              {/* Staff Title */}
              <Field label="Staff Title (optional)">
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Front Desk, Accountant, Mechanic"
                  className={INPUT_CLS}
                />
              </Field>

              {/* Role */}
              <Field label="Role *">
                <select
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value)}
                  className={INPUT_CLS}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {roles.length === 0 && (
                  <p className="text-xs text-warn mt-1">
                    No roles found. Please create a role first.
                  </p>
                )}
              </Field>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-edge">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-xs mx-4 p-5 text-center">
            <div className="inline-flex items-center justify-center bg-bad-light p-3 rounded-full mb-3">
              <Trash2 className="w-5 h-5 text-bad" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Remove Staff Member?
            </h3>
            <p className="text-xs text-muted mb-4">
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="px-3 py-2 rounded-lg bg-bad-light text-bad text-xs font-medium mb-4">
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
                {deleting ? "Removing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
