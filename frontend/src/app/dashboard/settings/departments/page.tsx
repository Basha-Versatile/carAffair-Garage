"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import {
  Search, Plus, Pencil, Trash2, ArrowLeft, Loader2,
  Layers, X, Save, GripVertical,
} from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from "@/lib/departments-local";

export default function DepartmentsPage() {
  const router = useRouter();
  const user = getUser();
  const garageId = user?.garageId || "";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // form
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(1);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, [garageId]);

  function loadDepartments() {
    setLoading(true);
    const data = getDepartments(garageId);
    setDepartments(data);
    setLoading(false);
  }

  const query = search.toLowerCase();
  const filtered = useMemo(
    () => departments.filter((d) => d.name.toLowerCase().includes(query)),
    [departments, query],
  );

  function openAdd() {
    setEditingDept(null);
    setFormName("");
    setFormSortOrder(departments.length + 1);
    setShowForm(true);
  }

  function openEdit(d: Department) {
    setEditingDept(d);
    setFormName(d.name);
    setFormSortOrder(d.sortOrder);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingDept(null);
  }

  function handleSave() {
    if (!formName.trim()) return;
    if (editingDept) {
      updateDepartment(garageId, editingDept.id, { name: formName.trim(), sortOrder: formSortOrder });
    } else {
      createDepartment(garageId, formName.trim(), formSortOrder);
    }
    loadDepartments();
    closeForm();
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteDepartment(garageId, deleteId);
    loadDepartments();
    setDeleteId(null);
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
          <h1 className="text-base font-semibold text-foreground">Departments</h1>
          <p className="text-xs text-muted mt-0.5">Create departments to group services &amp; parts for department-wise billing.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search + Add */}
        <div className="px-6 pt-4 pb-3 flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments..."
              className="w-full pl-9 pr-4 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex-1" />

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Layers className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {search ? "No departments match your search" : "No departments yet"}
            </p>
            <p className="text-muted text-sm">
              {search ? "Try a different search." : "Create departments like Mechanical, Electrical, AC, Body Shop to get started."}
            </p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-2">
            {filtered.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center gap-3 bg-background border border-edge rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <GripVertical className="w-4 h-4 text-muted/50 shrink-0" />

                {/* Sort order badge */}
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-light text-primary text-xs font-bold shrink-0">
                  {dept.sortOrder}
                </span>

                {/* Name */}
                <span className="text-sm font-medium text-foreground flex-1">{dept.name}</span>

                {/* Edit */}
                <button
                  onClick={() => openEdit(dept)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:bg-primary-light px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteId(dept.id)}
                  className="p-1.5 rounded-md text-muted hover:text-bad hover:bg-bad-light transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">
                {editingDept ? "Edit Department" : "Add Department"}
              </h3>
              <button onClick={closeForm} className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Department Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Mechanical, Electrical, AC"
                  className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Sort Order</label>
                <input
                  type="number"
                  min={1}
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-[11px] text-muted mt-1">Controls the display order on estimates and invoices.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-edge">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-xs mx-4 p-5 text-center">
            <div className="inline-flex items-center justify-center bg-bad-light p-3 rounded-full mb-3">
              <Trash2 className="w-5 h-5 text-bad" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Delete Department?</h3>
            <p className="text-xs text-muted mb-4">
              This will remove the department. Services and parts linked to it will become uncategorized.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 bg-bad text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
