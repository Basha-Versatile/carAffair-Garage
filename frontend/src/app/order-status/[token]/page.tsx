"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getPublicOrderStatus, getPublicOrderStatusImageUrl,
  type Order, type ServiceAssignment,
} from "@/lib/api-orders";
import {
  Car, Loader2, CheckCircle2, Clock, Wrench, Timer,
  Camera, Calendar, X,
} from "lucide-react";

function formatDuration(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PublicOrderStatusPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getPublicOrderStatus(token)
      .then(setOrder)
      .catch(() => setError("Order not found or link has expired"))
      .finally(() => setLoading(false));
  }, [token]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!token || error) return;
    const interval = setInterval(() => {
      getPublicOrderStatus(token).then(setOrder).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [token, error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-500">{error || "This link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  const assignments = order.serviceAssignments || [];
  const totalTasks = assignments.length;
  const completedTasks = assignments.filter(a => a.status === "completed").length;
  const inProgressTasks = assignments.filter(a => a.status === "in_progress").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Vehicle Service Status</h1>
              <p className="text-xs text-gray-500">{order.jobCard}</p>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Car className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{order.vehicle}</span>
              <span className="text-gray-500 font-mono">{order.vehicleNumber}</span>
            </div>
            {order.estimatedDeliveryDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Estimated delivery: {order.estimatedDeliveryDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Overall Progress</h2>
            <span className="text-sm font-bold text-blue-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #3b82f6, #2563eb)",
              }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>{completedTasks} of {totalTasks} tasks completed</span>
            {inProgressTasks > 0 && <span>{inProgressTasks} in progress</span>}
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {assignments.map((a, idx) => {
            const lineItem = (order.lineItems || []).find(li => li.id === a.lineItemId);
            const serviceName = lineItem?.description || "Service";
            const isCompleted = a.status === "completed";
            const isInProgress = a.status === "in_progress";
            const beforePhotos = a.beforeImageIds || [];
            const afterPhotos = a.afterImageIds || [];

            return (
              <div key={a.lineItemId || idx}
                className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCompleted ? "bg-green-100" :
                      isInProgress ? "bg-blue-100" :
                      "bg-gray-100"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : isInProgress ? (
                        <Timer className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{serviceName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isCompleted ? "Completed" :
                         isInProgress ? (a.workPausedAt ? "Paused" : "In Progress") :
                         "Pending"}
                      </p>
                    </div>
                  </div>
                  {a.totalWorkMs != null && a.totalWorkMs > 0 && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {formatDuration(a.totalWorkMs)}
                    </span>
                  )}
                </div>

                {/* Before/After photos */}
                {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {beforePhotos.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Before
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {beforePhotos.map((id) => (
                            <button key={id}
                              onClick={() => setPreviewImage(getPublicOrderStatusImageUrl(token, id))}
                              className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                              <img src={getPublicOrderStatusImageUrl(token, id)} alt="Before"
                                className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {afterPhotos.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> After
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {afterPhotos.map((id) => (
                            <button key={id}
                              onClick={() => setPreviewImage(getPublicOrderStatusImageUrl(token, id))}
                              className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                              <img src={getPublicOrderStatusImageUrl(token, id)} alt="After"
                                className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          This page auto-refreshes every 30 seconds. Powered by Car Affair.
        </p>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
