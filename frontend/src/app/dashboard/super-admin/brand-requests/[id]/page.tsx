"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Building2,
  Car,
  Upload,
  ImageIcon,
} from "lucide-react";
import {
  BrandRequest,
  getBrandRequestById,
  approveBrandRequest,
  rejectBrandRequest,
} from "@/lib/api-brand-requests";

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-warn-light text-warn">
          <Clock className="w-3.5 h-3.5" />
          Pending Review
        </span>
      );
    case "APPROVED":
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-ok-light text-ok">
          <CheckCircle className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    case "REJECTED":
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-bad-light text-bad">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    default:
      return null;
  }
}

export default function BrandRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [req, setReq] = useState<BrandRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "bad"; message: string } | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getBrandRequestById(id);
        setReq(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load brand request");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleApprove() {
    setShowApproveModal(false);
    setActionLoading(true);
    try {
      await approveBrandRequest(id, logoFile || undefined);
      setToast({ type: "ok", message: "Brand approved successfully!" });
      const updated = await getBrandRequestById(id);
      setReq(updated);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: unknown) {
      setToast({
        type: "bad",
        message: err instanceof Error ? err.message : "Failed to approve.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setShowRejectModal(false);
    setActionLoading(true);
    try {
      await rejectBrandRequest(id, rejectReason.trim());
      setToast({ type: "ok", message: "Brand request rejected." });
      setRejectReason("");
      const updated = await getBrandRequestById(id);
      setReq(updated);
    } catch (err: unknown) {
      setToast({
        type: "bad",
        message: err instanceof Error ? err.message : "Failed to reject.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !req) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/super-admin/brand-requests")}
            className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Brand Request</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-sm text-bad">{error || "Brand request not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/super-admin/brand-requests")}
            className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{req.name}</h1>
          {statusBadge(req.status)}
        </div>

        {req.status === "PENDING" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowRejectModal(true); setRejectReason(""); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-bad border border-bad/30 rounded-lg hover:bg-bad-light transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-ok rounded-lg hover:bg-ok/90 transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Rejection reason banner */}
        {req.status === "REJECTED" && req.rejectionReason && (
          <div className="bg-bad-light border border-bad/20 rounded-lg px-5 py-4">
            <p className="text-sm text-bad">
              <span className="font-semibold">Rejection Reason:</span> {req.rejectionReason}
            </p>
          </div>
        )}

        {/* Details Card */}
        <div className="bg-background rounded-lg border border-edge overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
            <Car className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-secondary">Brand Request Details</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-0.5">Brand Name</p>
                <p className="text-sm font-medium text-foreground">{req.name}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Requested By</p>
                </div>
                <p className="text-sm font-medium text-foreground mt-0.5">{req.garageName || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Submitted On</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">
                  {req.createdAt ? formatDate(req.createdAt) : "-"}
                </p>
              </div>
              {req.updatedAt && req.status !== "PENDING" && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <p className="text-xs text-muted">
                      {req.status === "APPROVED" ? "Approved On" : "Rejected On"}
                    </p>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{formatDate(req.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Logo */}
        {req.status === "APPROVED" && req.logoFileId && (
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
              <ImageIcon className="w-4 h-4 text-muted" />
              <h3 className="text-sm font-semibold text-secondary">Brand Logo</h3>
            </div>
            <div className="p-5 flex justify-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/images/${req.logoFileId}`}
                alt={req.name}
                className="w-24 h-24 object-contain rounded-lg border border-edge"
              />
            </div>
          </div>
        )}

        {/* Action Section for pending */}
        {req.status === "PENDING" && (
          <div className="bg-background rounded-lg border border-edge p-5">
            <h3 className="text-sm font-semibold text-secondary mb-3">Actions</h3>
            <p className="text-sm text-muted mb-4">
              Review the brand request. On approval, you can optionally upload a logo for this brand.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-ok rounded-lg hover:bg-ok/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve Brand
              </button>
              <button
                onClick={() => { setShowRejectModal(true); setRejectReason(""); }}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-bad rounded-lg hover:bg-bad/90 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject Brand
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal with logo upload */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm bg-background rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Approve Brand</h3>
            <p className="text-sm text-secondary mb-1">
              Approving brand: <span className="font-medium text-foreground">{req.name}</span>
            </p>
            <p className="text-xs text-muted mb-4">
              Optionally upload a logo for this brand. You can also add it later.
            </p>

            {/* Logo upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-edge rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded" />
                  <p className="text-xs text-muted">{logoFile?.name}</p>
                  <p className="text-xs text-primary">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted" />
                  <p className="text-xs text-muted">Click to upload brand logo (optional)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowApproveModal(false); setLogoFile(null); setLogoPreview(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-ok rounded-lg hover:bg-ok/90 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm bg-background rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Reject Brand</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-secondary mb-4">
              Rejecting <span className="font-medium text-foreground">{req.name}</span>.
              Optionally provide a reason:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary border border-edge rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-bad rounded-lg hover:bg-bad/90 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all duration-300 ${
            toast.type === "ok" ? "bg-ok" : "bg-bad"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
