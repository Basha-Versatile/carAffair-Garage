"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getOrders, startTimer, pauseTimer, resumeTimer, completeTimer,
  uploadTaskBeforeImages, uploadTaskAfterImages,
  getImageUrl,
  type Order, type ServiceAssignment,
} from "@/lib/api-orders";
import { getUser } from "@/lib/auth";
import {
  ClipboardList, Loader2, Car,
  Play, Pause, Square, Timer,
  Camera, Image as ImageIcon, X, Upload,
} from "lucide-react";

type TaskStatus = "all" | "pending" | "in_progress" | "completed";

interface TaskItem {
  orderId: string;
  jobCard: string;
  customerName: string;
  vehicle: string;
  vehicleNumber: string;
  assignment: ServiceAssignment;
  serviceDescription: string;
}

/** Format milliseconds as HH:MM:SS */
function formatDuration(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Calculate elapsed work time for a task in milliseconds */
function getElapsedMs(a: ServiceAssignment): number {
  if (a.totalWorkMs != null && a.totalWorkMs > 0) return a.totalWorkMs;
  if (!a.workStartedAt) return 0;

  const started = new Date(a.workStartedAt).getTime();
  const paused = a.totalPausedMs || 0;

  if (a.workPausedAt) {
    const pausedAt = new Date(a.workPausedAt).getTime();
    return Math.max(0, pausedAt - started - paused);
  }

  return Math.max(0, Date.now() - started - paused);
}

export default function MyTasksPage() {
  const router = useRouter();
  const user = getUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTask, setActiveUploadTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    getOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tasks: TaskItem[] = useMemo(() => {
    if (!user) return [];
    const result: TaskItem[] = [];
    for (const order of orders) {
      if (!order.serviceAssignments) continue;
      for (const assignment of order.serviceAssignments) {
        if (assignment.assignedUserId === user.id) {
          const lineItem = (order.lineItems || []).find(li => li.id === assignment.lineItemId);
          result.push({
            orderId: order.id,
            jobCard: order.jobCard,
            customerName: order.customerName,
            vehicle: order.vehicle,
            vehicleNumber: order.vehicleNumber,
            assignment,
            serviceDescription: lineItem?.description || "Service",
          });
        }
      }
    }
    return result;
  }, [orders, user]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tasks;
    return tasks.filter(t => t.assignment.status === statusFilter);
  }, [tasks, statusFilter]);

  const refreshOrders = useCallback(async () => {
    try {
      const updated = await getOrders();
      setOrders(updated);
    } catch { /* ignore */ }
  }, []);

  async function handleStart(task: TaskItem) {
    setUpdatingId(task.assignment.lineItemId);
    try {
      await startTimer(task.orderId, task.assignment.lineItemId);
      await refreshOrders();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  async function handlePause(task: TaskItem) {
    setUpdatingId(task.assignment.lineItemId);
    try {
      await pauseTimer(task.orderId, task.assignment.lineItemId);
      await refreshOrders();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  async function handleResume(task: TaskItem) {
    setUpdatingId(task.assignment.lineItemId);
    try {
      await resumeTimer(task.orderId, task.assignment.lineItemId);
      await refreshOrders();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  async function handleComplete(task: TaskItem) {
    setUpdatingId(task.assignment.lineItemId);
    try {
      await completeTimer(task.orderId, task.assignment.lineItemId);
      await refreshOrders();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  async function handlePhotoUpload(task: TaskItem, type: "before" | "after", files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingId(task.assignment.lineItemId);
    try {
      const fileArray = Array.from(files);
      if (type === "before") {
        await uploadTaskBeforeImages(task.orderId, task.assignment.lineItemId, fileArray);
      } else {
        await uploadTaskAfterImages(task.orderId, task.assignment.lineItemId, fileArray);
      }
      await refreshOrders();
    } catch { /* ignore */ }
    finally { setUploadingId(null); }
  }

  const tabs: { key: TaskStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: tasks.length },
    { key: "pending", label: "Pending", count: tasks.filter(t => t.assignment.status === "pending").length },
    { key: "in_progress", label: "In Progress", count: tasks.filter(t => t.assignment.status === "in_progress").length },
    { key: "completed", label: "Completed", count: tasks.filter(t => t.assignment.status === "completed").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-primary" />
        <h1 className="text-base font-semibold text-foreground">My Tasks</h1>
        <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      {/* Status tabs */}
      <div className="bg-background border-b border-edge px-6 flex gap-0">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
            }`}>
            {t.label}
            <span className="ml-1.5 text-xs bg-hover text-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-foreground font-medium">No tasks found</p>
            <p className="text-sm text-muted mt-1">
              {statusFilter === "all" ? "You don't have any assigned tasks yet." : `No ${statusFilter.replace("_", " ")} tasks.`}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.map((task) => {
              const a = task.assignment;
              const isRunning = a.status === "in_progress" && !a.workPausedAt;
              const isPaused = a.status === "in_progress" && !!a.workPausedAt;
              const isCompleted = a.status === "completed";
              const isPending = a.status === "pending";
              const elapsed = getElapsedMs(a);
              const hasTimer = a.workStartedAt != null;
              const beforePhotos = a.beforeImageIds || [];
              const afterPhotos = a.afterImageIds || [];
              const hasPhotos = beforePhotos.length > 0 || afterPhotos.length > 0;

              return (
                <div key={`${task.orderId}-${a.lineItemId}`}
                  className="bg-background rounded-xl border border-edge p-5">
                  {/* Task header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{task.serviceDescription}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                        <span className="font-medium text-primary">{task.jobCard}</span>
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" />{task.vehicle}</span>
                        <span className="font-mono">{task.vehicleNumber}</span>
                      </div>
                      <p className="text-xs text-muted mt-1">Customer: {task.customerName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isCompleted ? "bg-ok/10 text-ok" :
                      a.status === "in_progress" ? "bg-warn/10 text-warn" :
                      "bg-dim text-muted"
                    }`}>
                      {isPaused ? "Paused" :
                       isRunning ? "In Progress" :
                       isCompleted ? "Completed" : "Pending"}
                    </span>
                  </div>

                  {/* Timer display */}
                  {hasTimer && (
                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${
                      isRunning ? "bg-warn/5 border border-warn/20" :
                      isPaused ? "bg-dim border border-edge" :
                      isCompleted ? "bg-ok/5 border border-ok/20" : ""
                    }`}>
                      <Timer className={`w-4 h-4 ${
                        isRunning ? "text-warn animate-pulse" :
                        isPaused ? "text-muted" :
                        "text-ok"
                      }`} />
                      <span className={`font-mono text-sm font-semibold ${
                        isRunning ? "text-warn" :
                        isPaused ? "text-muted" :
                        "text-ok"
                      }`}>
                        {formatDuration(isRunning ? getElapsedMs(a) : elapsed)}
                      </span>
                      <span className="text-xs text-muted">
                        {isRunning ? "Running" : isPaused ? "Paused" : "Total time"}
                      </span>
                    </div>
                  )}

                  {/* Work Photos */}
                  {hasPhotos && (
                    <div className="mb-3 space-y-2">
                      {beforePhotos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted mb-1">Before Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {beforePhotos.map((id) => (
                              <button key={id} onClick={() => setPreviewImage(getImageUrl(id))}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors">
                                <img src={getImageUrl(id)} alt="Before" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {afterPhotos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted mb-1">After Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {afterPhotos.map((id) => (
                              <button key={id} onClick={() => setPreviewImage(getImageUrl(id))}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors">
                                <img src={getImageUrl(id)} alt="After" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {!isCompleted && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-edge-light">
                      {/* Pending: Start Work */}
                      {isPending && (
                        <>
                          <button onClick={() => handleStart(task)}
                            disabled={updatingId === a.lineItemId}
                            className="flex items-center gap-1.5 px-4 py-2 bg-warn text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                            <Play className="w-3.5 h-3.5" />
                            {updatingId === a.lineItemId ? "..." : "Start Work"}
                          </button>
                          {/* Before photos upload */}
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover cursor-pointer border border-edge">
                            <Camera className="w-3.5 h-3.5" />
                            {uploadingId === a.lineItemId ? "Uploading..." : "Before Photos"}
                            <input type="file" accept="image/*" multiple capture="environment" className="hidden"
                              onChange={(e) => handlePhotoUpload(task, "before", e.target.files)}
                              disabled={uploadingId === a.lineItemId} />
                          </label>
                        </>
                      )}

                      {/* Running: Pause + Complete + Photo buttons */}
                      {isRunning && (
                        <>
                          <button onClick={() => handlePause(task)}
                            disabled={updatingId === a.lineItemId}
                            className="flex items-center gap-1.5 px-4 py-2 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover disabled:opacity-50 border border-edge">
                            <Pause className="w-3.5 h-3.5" />
                            {updatingId === a.lineItemId ? "..." : "Pause"}
                          </button>
                          <button onClick={() => handleComplete(task)}
                            disabled={updatingId === a.lineItemId}
                            className="flex items-center gap-1.5 px-4 py-2 bg-ok text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                            <Square className="w-3.5 h-3.5" />
                            {updatingId === a.lineItemId ? "..." : "Complete"}
                          </button>
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover cursor-pointer border border-edge">
                            <Camera className="w-3.5 h-3.5" />
                            {uploadingId === a.lineItemId ? "Uploading..." : "Before Photos"}
                            <input type="file" accept="image/*" multiple capture="environment" className="hidden"
                              onChange={(e) => handlePhotoUpload(task, "before", e.target.files)}
                              disabled={uploadingId === a.lineItemId} />
                          </label>
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover cursor-pointer border border-edge">
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingId === a.lineItemId ? "Uploading..." : "After Photos"}
                            <input type="file" accept="image/*" multiple capture="environment" className="hidden"
                              onChange={(e) => handlePhotoUpload(task, "after", e.target.files)}
                              disabled={uploadingId === a.lineItemId} />
                          </label>
                        </>
                      )}

                      {/* Paused: Resume + Complete + Photo buttons */}
                      {isPaused && (
                        <>
                          <button onClick={() => handleResume(task)}
                            disabled={updatingId === a.lineItemId}
                            className="flex items-center gap-1.5 px-4 py-2 bg-warn text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                            <Play className="w-3.5 h-3.5" />
                            {updatingId === a.lineItemId ? "..." : "Resume"}
                          </button>
                          <button onClick={() => handleComplete(task)}
                            disabled={updatingId === a.lineItemId}
                            className="flex items-center gap-1.5 px-4 py-2 bg-ok text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                            <Square className="w-3.5 h-3.5" />
                            {updatingId === a.lineItemId ? "..." : "Complete"}
                          </button>
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover cursor-pointer border border-edge">
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingId === a.lineItemId ? "Uploading..." : "After Photos"}
                            <input type="file" accept="image/*" multiple capture="environment" className="hidden"
                              onChange={(e) => handlePhotoUpload(task, "after", e.target.files)}
                              disabled={uploadingId === a.lineItemId} />
                          </label>
                        </>
                      )}

                      <button onClick={() => router.push(`/dashboard/orders/${task.orderId}`)}
                        className="px-4 py-2 text-xs font-medium text-secondary border border-edge rounded-lg hover:bg-hover">
                        View Order
                      </button>
                    </div>
                  )}

                  {/* Completed: View Order + Upload After Photos */}
                  {isCompleted && (
                    <div className="flex gap-2 pt-3 border-t border-edge-light">
                      <label className="flex items-center gap-1.5 px-4 py-2 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover cursor-pointer border border-edge">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingId === a.lineItemId ? "Uploading..." : "After Photos"}
                        <input type="file" accept="image/*" multiple capture="environment" className="hidden"
                          onChange={(e) => handlePhotoUpload(task, "after", e.target.files)}
                          disabled={uploadingId === a.lineItemId} />
                      </label>
                      <button onClick={() => router.push(`/dashboard/orders/${task.orderId}`)}
                        className="px-4 py-2 text-xs font-medium text-secondary border border-edge rounded-lg hover:bg-hover">
                        View Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
