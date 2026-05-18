"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById, updateOrder, Order, TabKey } from "@/lib/api-orders";
import {
  ArrowLeft, Phone, Car, FileText, Calendar, IndianRupee,
  Wrench, CheckCircle2, CreditCard, CircleDot,
} from "lucide-react";

const STATUS_FLOW: TabKey[] = ["open", "wip", "ready", "payment_due", "completed"];

const STATUS_CONFIG: Record<TabKey, { label: string; description: string; color: string; bgColor: string }> = {
  open: { label: "Open", description: "Vehicle received", color: "text-primary", bgColor: "bg-primary" },
  wip: { label: "WIP", description: "Work in progress", color: "text-warn", bgColor: "bg-warn" },
  ready: { label: "Ready", description: "Vehicle is ready", color: "text-ok", bgColor: "bg-ok" },
  payment_due: { label: "Payment Due", description: "Pending payment", color: "text-bad", bgColor: "bg-bad" },
  completed: { label: "Completed", description: "Payment done", color: "text-muted", bgColor: "bg-muted" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrderById(id)
      .then(setOrder)
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: TabKey) {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const updated = await updateOrder(order.id, { status: newStatus });
      setOrder(updated);
    } catch {
      setError("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-3 animate-spin">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm text-muted">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-sm text-bad">{error || "Order not found"}</p>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CONFIG[order.status]?.bgColor} text-white`}>
          {STATUS_CONFIG[order.status]?.label}
        </span>
      </div>

      {/* Job Card Title */}
      <div className="bg-background rounded-xl border border-edge p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{order.jobCard}</h1>
            <p className="text-xs text-muted">{order.date}</p>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted uppercase">Customer</p>
            <p className="text-sm font-semibold text-foreground">{order.customerName}</p>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted" />
              <span className="text-sm text-secondary">{order.phone || order.customerPhone || "-"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted uppercase">Vehicle</p>
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-muted" />
              <span className="text-sm font-semibold text-foreground">{order.vehicle || "-"}</span>
            </div>
            <p className="text-sm text-secondary">{order.vehicleNumber || "-"}</p>
          </div>
        </div>

        {/* Services */}
        {order.services && order.services.length > 0 && (
          <div className="mt-4 pt-4 border-t border-edge-light">
            <p className="text-xs font-medium text-muted uppercase mb-2">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {order.services.map((s) => (
                <span key={s} className="text-xs bg-dim text-secondary px-2.5 py-1 rounded-md">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="mt-4 pt-4 border-t border-edge-light flex items-center justify-between">
          <span className="text-xs font-medium text-muted uppercase">Amount</span>
          <div className="flex items-center gap-1 text-lg font-bold text-foreground">
            <IndianRupee className="w-4 h-4" />
            {(order.amount ?? 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Status Progress Stepper */}
      <div className="bg-background rounded-xl border border-edge p-5 mb-4">
        <p className="text-xs font-medium text-muted uppercase mb-4">Order Progress</p>
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-4 left-5 right-5 h-0.5 bg-edge-light z-0" />
          <div
            className="absolute top-4 left-5 h-0.5 bg-primary z-0 transition-all duration-300"
            style={{ width: `${(currentIdx / (STATUS_FLOW.length - 1)) * (100 - 10)}%` }}
          />

          {STATUS_FLOW.map((status, idx) => {
            const config = STATUS_CONFIG[status];
            const isDone = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={status} className="flex flex-col items-center z-10 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCurrent
                    ? `${config.bgColor} border-transparent text-white scale-110`
                    : isDone
                      ? "bg-primary border-primary text-white"
                      : "bg-background border-edge text-muted"
                }`}>
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : status === "open" ? (
                    <CircleDot className="w-4 h-4" />
                  ) : status === "wip" ? (
                    <Wrench className="w-4 h-4" />
                  ) : status === "ready" ? (
                    <Car className="w-4 h-4" />
                  ) : status === "payment_due" ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium text-center ${isCurrent ? config.color : isDone ? "text-primary" : "text-muted"}`}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {order.status !== "completed" && (
        <div className="bg-background rounded-xl border border-edge p-5">
          <p className="text-xs font-medium text-muted uppercase mb-3">Change Status</p>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_FLOW.filter((s) => s !== "completed").map((status) => {
              const config = STATUS_CONFIG[status];
              const isActive = order.status === status;
              const statusIdx = STATUS_FLOW.indexOf(status);
              const isNext = statusIdx === currentIdx + 1;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isActive || updating}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all border ${
                    isActive
                      ? `${config.bgColor} text-white border-transparent`
                      : isNext
                        ? `border-2 border-dashed ${config.color} border-current bg-background hover:bg-dim`
                        : "border-edge text-muted bg-dim hover:bg-hover"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {config.label}
                  <span className="block text-[9px] mt-0.5 opacity-75">{config.description}</span>
                </button>
              );
            })}
          </div>

          {/* Primary Next Action */}
          {nextStatus && (
            <button
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updating}
              className={`w-full mt-3 py-3 rounded-lg text-sm font-semibold text-white transition-all ${STATUS_CONFIG[nextStatus].bgColor} hover:opacity-90 disabled:opacity-50`}
            >
              {updating ? "Updating..." : `Move to ${STATUS_CONFIG[nextStatus].label}`}
            </button>
          )}

          {/* Mark Completed */}
          {order.status === "payment_due" && (
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={updating}
              className="w-full mt-2 py-3 rounded-lg text-sm font-semibold text-white bg-ok hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {updating ? "Updating..." : "Mark as Completed (Payment Done)"}
            </button>
          )}
        </div>
      )}

      {order.status === "completed" && (
        <div className="bg-ok-light rounded-xl border border-ok/20 p-5 text-center">
          <CheckCircle2 className="w-8 h-8 text-ok mx-auto mb-2" />
          <p className="text-sm font-semibold text-ok">Order Completed</p>
          <p className="text-xs text-muted mt-1">Payment received and order closed</p>
        </div>
      )}
    </div>
  );
}
