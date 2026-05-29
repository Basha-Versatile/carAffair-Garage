"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Hash,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  X,
  User,
} from "lucide-react";
import {
  GarageRegistration,
  getGarageRegistrationById,
  approveRegistration,
  rejectRegistration,
} from "@/lib/api-garage-registration";

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

export default function GarageRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reg, setReg] = useState<GarageRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "bad";
    message: string;
  } | null>(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Approve confirmation
  const [showApproveModal, setShowApproveModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getGarageRegistrationById(id);
        setReg(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load registration"
        );
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

  async function handleApprove() {
    setShowApproveModal(false);
    setActionLoading(true);
    try {
      await approveRegistration(id);
      setToast({
        type: "ok",
        message: "Registration approved! Garage account created and email sent.",
      });
      // Refresh data
      const updated = await getGarageRegistrationById(id);
      setReg(updated);
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
      await rejectRegistration(id, rejectReason.trim());
      setToast({ type: "ok", message: "Registration rejected." });
      setRejectReason("");
      const updated = await getGarageRegistrationById(id);
      setReg(updated);
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

  if (error || !reg) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
          <button
            onClick={() =>
              router.push("/dashboard/super-admin/garage-requests")
            }
            className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            Request Details
          </h1>
        </div>
        <div className="text-center py-16">
          <p className="text-sm text-bad">{error || "Registration not found"}</p>
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
            onClick={() =>
              router.push("/dashboard/super-admin/garage-requests")
            }
            className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {reg.name}
          </h1>
          {statusBadge(reg.status)}
        </div>

        {/* Header actions for pending */}
        {reg.status === "PENDING" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowRejectModal(true);
                setRejectReason("");
              }}
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
        {reg.status === "REJECTED" && reg.rejectionReason && (
          <div className="bg-bad-light border border-bad/20 rounded-lg px-5 py-4">
            <p className="text-sm text-bad">
              <span className="font-semibold">Rejection Reason:</span>{" "}
              {reg.rejectionReason}
            </p>
          </div>
        )}

        {/* Registration Info Card */}
        <div className="bg-background rounded-lg border border-edge overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-dim border-b border-edge">
            <Building2 className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-secondary">
              Registration Details
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-0.5">Garage Name</p>
                <p className="text-sm font-medium text-foreground">
                  {reg.name || "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Owner Name</p>
                </div>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {reg.ownerName || "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Phone</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">
                  {reg.phone || "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Email</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">
                  {reg.email || "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">GST Number</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">
                  {reg.gstNumber || "-"}
                </p>
              </div>
              {reg.state && (
                <div>
                  <p className="text-xs text-muted mb-0.5">State</p>
                  <p className="text-sm text-foreground">{reg.state}</p>
                </div>
              )}
              {reg.city && (
                <div>
                  <p className="text-xs text-muted mb-0.5">City</p>
                  <p className="text-sm text-foreground">{reg.city}</p>
                </div>
              )}
              {reg.streetAddress && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <p className="text-xs text-muted">Street Address</p>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{reg.streetAddress}</p>
                </div>
              )}
              {!reg.state && !reg.streetAddress && reg.address && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <p className="text-xs text-muted">Address</p>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">
                    {reg.address}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <p className="text-xs text-muted">Submitted On</p>
                </div>
                <p className="text-sm text-foreground mt-0.5">
                  {reg.createdAt ? formatDate(reg.createdAt) : "-"}
                </p>
              </div>
              {reg.updatedAt && reg.status !== "PENDING" && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <p className="text-xs text-muted">
                      {reg.status === "APPROVED"
                        ? "Approved On"
                        : "Rejected On"}
                    </p>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">
                    {formatDate(reg.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Section for pending — large buttons at bottom */}
        {reg.status === "PENDING" && (
          <div className="bg-background rounded-lg border border-edge p-5">
            <h3 className="text-sm font-semibold text-secondary mb-3">
              Actions
            </h3>
            <p className="text-sm text-muted mb-4">
              Review the details above. Approving will create the garage account
              and send a login link to the owner via email.
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
                Approve Registration
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(true);
                  setRejectReason("");
                }}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-bad rounded-lg hover:bg-bad/90 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject Registration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm bg-background rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Approve Registration
            </h3>
            <p className="text-sm text-secondary mb-1">
              This will create a garage account and admin user for:
            </p>
            <p className="text-sm font-medium text-foreground mb-4">
              {reg.name} ({reg.ownerName})
            </p>
            <p className="text-xs text-muted mb-6">
              The garage owner will receive an email with a link to login as
              garage admin.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
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
              <h3 className="text-lg font-semibold text-foreground">
                Reject Registration
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-secondary mb-4">
              Rejecting{" "}
              <span className="font-medium text-foreground">{reg.name}</span>.
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
