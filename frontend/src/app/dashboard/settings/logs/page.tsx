"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  getActivityLogs,
  type ActivityLog,
  type ActivityLogPage,
} from "@/lib/api-logs";
import { getStaffMembers, type StaffMember } from "@/lib/api-staff";
import { getUser } from "@/lib/auth";

const ACTIONS = ["CREATE", "UPDATE", "DELETE"] as const;
const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
};
const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  UPDATE: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const ENTITY_TYPES = [
  "ORDER",
  "INVOICE",
  "VEHICLE",
  "CUSTOMER",
  "PART",
  "STOCK_IN",
  "COUNTER_SALE",
  "PART_PURCHASE",
  "EXPENSE",
  "BOOKING",
  "VENDOR",
  "PURCHASE_ORDER",
  "STAFF",
  "ROLE",
  "TAG",
  "SERVICE",
  "SERVICE_CATEGORY",
  "TAX_PROFILE",
  "REMINDER",
  "FEEDBACK",
] as const;
const ENTITY_LABELS: Record<string, string> = {
  ORDER: "Order",
  INVOICE: "Invoice",
  VEHICLE: "Vehicle",
  CUSTOMER: "Customer",
  PART: "Part",
  STOCK_IN: "Stock In",
  COUNTER_SALE: "Counter Sale",
  PART_PURCHASE: "Part Purchase",
  EXPENSE: "Expense",
  BOOKING: "Booking",
  VENDOR: "Vendor",
  PURCHASE_ORDER: "Purchase Order",
  STAFF: "Staff",
  ROLE: "Role",
  TAG: "Tag",
  SERVICE: "Service",
  SERVICE_CATEGORY: "Service Category",
  TAX_PROFILE: "Tax Profile",
  REMINDER: "Reminder",
  FEEDBACK: "Feedback",
};

const ROLE_LABELS: Record<string, string> = {
  garage_admin: "Owner",
  garage_staff: "Staff",
  super_admin: "Super Admin",
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function ActivityLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Staff list for user dropdown
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  useEffect(() => {
    getStaffMembers().then(setStaffList).catch(() => {});
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError("");
    getActivityLogs({
      page,
      size: PAGE_SIZE,
      action: actionFilter || undefined,
      entityType: entityFilter || undefined,
      userId: userFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then((data) => setLogs(data))
      .catch((err) => setError(err.message || "Failed to load logs"))
      .finally(() => setLoading(false));
  }, [page, actionFilter, entityFilter, userFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterChange() {
    setPage(0);
  }

  function clearFilters() {
    setActionFilter("");
    setEntityFilter("");
    setUserFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }

  const currentUser = getUser();
  const hasFilters = actionFilter || entityFilter || userFilter || dateFrom || dateTo;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Activity Logs</h1>
          <p className="text-xs text-muted mt-0.5">
            View all actions performed by your staff. Logs are automatically deleted after 2 weeks.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-muted ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-background border-b border-edge px-6 py-3 flex flex-wrap items-center gap-2">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            handleFilterChange();
          }}
          className="text-xs border border-edge rounded-lg px-3 py-2 bg-background text-foreground"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            handleFilterChange();
          }}
          className="text-xs border border-edge rounded-lg px-3 py-2 bg-background text-foreground"
        >
          <option value="">All Entities</option>
          {ENTITY_TYPES.map((e) => (
            <option key={e} value={e}>
              {ENTITY_LABELS[e]}
            </option>
          ))}
        </select>

        <select
          value={userFilter}
          onChange={(e) => {
            setUserFilter(e.target.value);
            handleFilterChange();
          }}
          className="text-xs border border-edge rounded-lg px-3 py-2 bg-background text-foreground"
        >
          <option value="">All Users</option>
          {currentUser && (
            <option value={currentUser.id}>
              {currentUser.name || currentUser.phone} (You)
            </option>
          )}
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.phone} {s.staffTitle ? `(${s.staffTitle})` : ""}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            handleFilterChange();
          }}
          className="text-xs border border-edge rounded-lg px-3 py-2 bg-background text-foreground"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            handleFilterChange();
          }}
          className="text-xs border border-edge rounded-lg px-3 py-2 bg-background text-foreground"
          placeholder="To"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline px-2 py-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && !logs ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : logs && logs.content.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <ScrollText className="w-6 h-6 text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No activity logs found</p>
            <p className="text-xs text-muted">
              {hasFilters
                ? "Try adjusting your filters."
                : "Activity logs will appear here once staff perform actions."}
            </p>
          </div>
        ) : logs ? (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-edge bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      User
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Action
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Entity
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted text-right">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.content.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-edge hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* User */}
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-foreground">
                          {log.userName}
                        </div>
                        <div className="text-[11px] text-muted">
                          {log.staffTitle || ROLE_LABELS[log.userRole] || log.userRole}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {ENTITY_LABELS[log.entityType] || log.entityType}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground max-w-md truncate">
                          {log.description}
                        </p>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="text-xs text-foreground">{timeAgo(log.createdAt)}</div>
                        <div className="text-[11px] text-muted">{formatDateTime(log.createdAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-edge bg-background">
                <p className="text-xs text-muted">
                  Showing {logs.number * logs.size + 1}-
                  {Math.min((logs.number + 1) * logs.size, logs.totalElements)} of{" "}
                  {logs.totalElements} logs
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={logs.first}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-foreground px-3 py-1">
                    Page {logs.number + 1} of {logs.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={logs.last}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
