"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getOrders, updateAssignmentStatus,
  type Order, type ServiceAssignment,
} from "@/lib/api-orders";
import { getUser } from "@/lib/auth";
import {
  ClipboardList, Loader2, CheckCircle2, Clock, Wrench, Car,
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

export default function MyTasksPage() {
  const router = useRouter();
  const user = getUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Extract tasks assigned to current user
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

  async function handleStatusUpdate(task: TaskItem, newStatus: string) {
    setUpdatingId(task.assignment.lineItemId);
    try {
      await updateAssignmentStatus(task.orderId, task.assignment.lineItemId, newStatus);
      // Reload orders to refresh data
      const updated = await getOrders();
      setOrders(updated);
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
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
            {filtered.map((task) => (
              <div key={`${task.orderId}-${task.assignment.lineItemId}`}
                className="bg-background rounded-xl border border-edge p-5">
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
                    task.assignment.status === "completed" ? "bg-ok/10 text-ok" :
                    task.assignment.status === "in_progress" ? "bg-warn/10 text-warn" :
                    "bg-dim text-muted"
                  }`}>
                    {task.assignment.status === "in_progress" ? "In Progress" :
                     task.assignment.status.charAt(0).toUpperCase() + task.assignment.status.slice(1)}
                  </span>
                </div>

                {/* Actions */}
                {task.assignment.status !== "completed" && (
                  <div className="flex gap-2 pt-3 border-t border-edge-light">
                    {task.assignment.status === "pending" && (
                      <button onClick={() => handleStatusUpdate(task, "in_progress")}
                        disabled={updatingId === task.assignment.lineItemId}
                        className="flex items-center gap-1.5 px-4 py-2 bg-warn text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                        <Wrench className="w-3.5 h-3.5" />
                        {updatingId === task.assignment.lineItemId ? "..." : "Start Work"}
                      </button>
                    )}
                    {task.assignment.status === "in_progress" && (
                      <button onClick={() => handleStatusUpdate(task, "completed")}
                        disabled={updatingId === task.assignment.lineItemId}
                        className="flex items-center gap-1.5 px-4 py-2 bg-ok text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {updatingId === task.assignment.lineItemId ? "..." : "Mark Complete"}
                      </button>
                    )}
                    <button onClick={() => router.push(`/dashboard/orders/${task.orderId}`)}
                      className="px-4 py-2 text-xs font-medium text-secondary border border-edge rounded-lg hover:bg-hover">
                      View Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
