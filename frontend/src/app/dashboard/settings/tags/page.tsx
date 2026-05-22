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
  Tags,
  X,
  Save,
} from "lucide-react";
import {
  Tag,
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/lib/api-tags";

const TAG_COLORS = [
  { name: "Blue",    hex: "#3b82f6" },
  { name: "Red",     hex: "#ef4444" },
  { name: "Green",   hex: "#22c55e" },
  { name: "Orange",  hex: "#f97316" },
  { name: "Purple",  hex: "#a855f7" },
  { name: "Pink",    hex: "#ec4899" },
  { name: "Teal",    hex: "#14b8a6" },
  { name: "Gray",    hex: "#6b7280" },
];

const TAG_TYPES = ["general", "invoice", "order"];

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // form
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("general");
  const [formColor, setFormColor] = useState(TAG_COLORS[0].hex);
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    setError("");
    try {
      const data = await getTags();
      setTags(data || []);
    } catch {
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }

  const query = search.toLowerCase();
  const filtered = useMemo(
    () => tags.filter((t) => t.name.toLowerCase().includes(query) || t.type.toLowerCase().includes(query)),
    [tags, query],
  );

  function openAdd() {
    setEditingTag(null);
    setFormName("");
    setFormType("general");
    setFormColor(TAG_COLORS[0].hex);
    setShowForm(true);
  }

  function openEdit(t: Tag) {
    setEditingTag(t);
    setFormName(t.name);
    setFormType(t.type);
    setFormColor(t.color || TAG_COLORS[0].hex);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTag(null);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingTag) {
        const updated = await updateTag(editingTag.id, { name: formName, type: formType, color: formColor });
        setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await createTag({ name: formName, type: formType, color: formColor });
        setTags((prev) => [created, ...prev]);
      }
      closeForm();
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTag(deleteId);
      setTags((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch {
      // keep dialog open
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
          <h1 className="text-base font-semibold text-foreground">Tags</h1>
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
              placeholder="Search tags..."
              className="w-full pl-9 pr-4 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex-1" />

          {canManage("SETTINGS") && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Tag
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Tags className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {search ? "No tags match your search" : "No tags yet"}
            </p>
            <p className="text-muted text-sm">
              {search ? "Try a different search." : "Create your first tag to get started."}
            </p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-2">
            {filtered.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 bg-background border border-edge rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
              >
                {/* Tag badge */}
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border-2"
                  style={{ borderColor: tag.color || "#6b7280", color: tag.color || "#6b7280" }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color || "#6b7280" }}
                  />
                  {tag.name}
                </span>

                {/* Type chip */}
                <span className="text-[11px] text-muted bg-hover px-2 py-0.5 rounded capitalize">{tag.type}</span>

                <div className="flex-1" />

                {/* Edit */}
                {canManage("SETTINGS") && (
                  <button
                    onClick={() => openEdit(tag)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:bg-primary-light px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}

                {/* Delete */}
                {canManage("SETTINGS") && (
                  <button
                    onClick={() => setDeleteId(tag.id)}
                    className="p-1.5 rounded-md text-muted hover:text-bad hover:bg-bad-light transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                {editingTag ? "Edit Tag" : "Create New Tag"}
              </h3>
              <button onClick={closeForm} className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Tag Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Regular Service"
                  className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent capitalize"
                >
                  {TAG_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormColor(c.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formColor === c.hex ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              {formName.trim() && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Preview</label>
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border-2"
                    style={{ borderColor: formColor, color: formColor }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: formColor }} />
                    {formName}
                  </span>
                </div>
              )}
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
                disabled={saving || !formName.trim()}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save"}
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
            <h3 className="text-sm font-semibold text-foreground mb-1">Delete Tag?</h3>
            <p className="text-xs text-muted mb-4">
              This action cannot be undone. The tag will be permanently removed.
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
                disabled={deleting}
                className="flex items-center gap-1.5 bg-bad text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
