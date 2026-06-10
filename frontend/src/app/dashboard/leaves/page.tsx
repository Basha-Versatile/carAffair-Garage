"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getLeaves, getMyLeaves, applyLeave, approveLeave, rejectLeave,
  getMyBalance, getLeaveCalendar,
  type LeaveRequest, type LeaveBalance,
} from "@/lib/api-leaves";
import { isGarageOwner, isSuperAdmin, isGarageStaff, getUser, canManage } from "@/lib/auth";
import {
  CalendarDays, Loader2, Plus, Check, X, Clock,
  ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";

const LEAVE_TYPES = ["casual", "sick", "earned", "unpaid"];

function badge(status: string) {
  switch (status) {
    case "approved":
      return "bg-ok/10 text-ok border-ok/20";
    case "rejected":
      return "bg-danger/10 text-danger border-danger/20";
    default:
      return "bg-warn/10 text-warn border-warn/20";
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LeavesPage() {
  const user = getUser();
  const isAdmin = isGarageOwner() || isSuperAdmin();
  const isStaff = isGarageStaff();

  // Tabs
  const [view, setView] = useState<"my" | "all" | "calendar">(isAdmin ? "all" : "my");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Data
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [calendarLeaves, setCalendarLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Apply modal
  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [applyError, setApplyError] = useState("");
  const [applying, setApplying] = useState(false);

  // Reject modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (view === "all") {
      setLoading(true);
      getLeaves(statusFilter)
        .then(setAllLeaves)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [view, statusFilter]);

  useEffect(() => {
    if (view === "calendar") {
      const [y, m] = calMonth.split("-").map(Number);
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const end = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
      setLoading(true);
      getLeaveCalendar(start, end)
        .then(setCalendarLeaves)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [view, calMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const [my, bal] = await Promise.all([
        getMyLeaves(),
        getMyBalance(),
      ]);
      setMyLeaves(my);
      setBalance(bal);
      if (isAdmin) {
        const all = await getLeaves("pending");
        setAllLeaves(all);
      }
    } catch {}
    setLoading(false);
  }

  async function handleApply() {
    setApplyError("");
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()) {
      setApplyError("All fields are required.");
      return;
    }
    setApplying(true);
    try {
      await applyLeave(applyForm.leaveType, applyForm.startDate, applyForm.endDate, applyForm.reason);
      setShowApply(false);
      setApplyForm({ leaveType: "casual", startDate: "", endDate: "", reason: "" });
      loadData();
    } catch (e: any) {
      setApplyError(e?.message || "Failed to apply");
    }
    setApplying(false);
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await approveLeave(id);
      setAllLeaves((prev) => prev.filter((l) => l.id !== id));
      loadData();
    } catch {}
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try {
      await rejectLeave(rejectId, rejectNote);
      setAllLeaves((prev) => prev.filter((l) => l.id !== rejectId));
      setRejectId(null);
      setRejectNote("");
      loadData();
    } catch {}
    setActionLoading(null);
  }

  // Calendar helpers
  const calDays = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const totalDays = new Date(y, m, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    return days;
  }, [calMonth]);

  const leavesByDate = useMemo(() => {
    const map: Record<string, LeaveRequest[]> = {};
    for (const l of calendarLeaves) {
      if (l.status !== "approved") continue;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(l);
      }
    }
    return map;
  }, [calendarLeaves]);

  function prevMonth() {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function nextMonth() {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const calMonthLabel = (() => {
    const [y, m] = calMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });
  })();

  if (loading && myLeaves.length === 0 && allLeaves.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-foreground">Leave Management</h1>
        </div>
        <button
          onClick={() => setShowApply(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Balance Cards */}
          {balance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Casual Leave", total: balance.casualTotal, used: balance.casualUsed, color: "text-primary" },
                { label: "Sick Leave", total: balance.sickTotal, used: balance.sickUsed, color: "text-warn" },
                { label: "Earned Leave", total: balance.earnedTotal, used: balance.earnedUsed, color: "text-ok" },
                {
                  label: "Total Available",
                  total: balance.casualTotal + balance.sickTotal + balance.earnedTotal,
                  used: balance.casualUsed + balance.sickUsed + balance.earnedUsed,
                  color: "text-foreground",
                },
              ].map((b) => (
                <div key={b.label} className="bg-background rounded-xl border border-edge p-4">
                  <p className="text-xs text-muted mb-1">{b.label}</p>
                  <p className={`text-2xl font-bold ${b.color}`}>
                    {b.total - b.used}
                    <span className="text-sm font-normal text-muted">/{b.total}</span>
                  </p>
                  <p className="text-xs text-muted mt-1">{b.used} used</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-background rounded-lg border border-edge p-1">
            {isStaff && (
              <button
                onClick={() => setView("my")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  view === "my" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                My Leaves
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setView("all")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  view === "all" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                All Requests
              </button>
            )}
            <button
              onClick={() => setView("calendar")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                view === "calendar" ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Calendar
            </button>
          </div>

          {/* ═══ MY LEAVES TAB ═══ */}
          {view === "my" && (
            <div className="space-y-3">
              {myLeaves.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                  No leave requests yet. Click "Apply Leave" to submit a new request.
                </div>
              ) : (
                myLeaves.map((l) => (
                  <div key={l.id} className="bg-background rounded-xl border border-edge p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {capitalize(l.leaveType)} Leave
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${badge(l.status)}`}>
                          {capitalize(l.status)}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{l.days} day{l.days !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {l.startDate} to {l.endDate}
                    </p>
                    <p className="text-sm text-muted mt-1">{l.reason}</p>
                    {l.rejectionNote && (
                      <p className="text-xs text-danger mt-2">
                        Rejected: {l.rejectionNote}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ ALL REQUESTS TAB (Admin) ═══ */}
          {view === "all" && isAdmin && (
            <div className="space-y-3">
              {/* Status filter */}
              <div className="flex gap-2">
                {["pending", "approved", "rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      statusFilter === s
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-muted border-edge hover:border-primary/30"
                    }`}
                  >
                    {capitalize(s)}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : allLeaves.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                  No {statusFilter} leave requests.
                </div>
              ) : (
                allLeaves.map((l) => (
                  <div key={l.id} className="bg-background rounded-xl border border-edge p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{l.staffName}</span>
                        <span className="text-xs text-muted">{capitalize(l.leaveType)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${badge(l.status)}`}>
                          {capitalize(l.status)}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{l.days} day{l.days !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {l.startDate} to {l.endDate}
                    </p>
                    <p className="text-sm text-muted mt-1">{l.reason}</p>

                    {l.status === "pending" && canManage("LEAVES") && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(l.id)}
                          disabled={actionLoading === l.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ok/10 text-ok text-xs font-medium border border-ok/20 hover:bg-ok/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === l.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(l.id)}
                          disabled={actionLoading === l.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium border border-danger/20 hover:bg-danger/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}

                    {l.rejectionNote && (
                      <p className="text-xs text-danger mt-2">Note: {l.rejectionNote}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ CALENDAR TAB ═══ */}
          {view === "calendar" && (
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4 text-muted" />
                </button>
                <span className="text-sm font-semibold text-foreground">{calMonthLabel}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4 text-muted" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs text-muted font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} className="h-16" />;
                    }
                    const [y, m] = calMonth.split("-").map(Number);
                    const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const leaves = leavesByDate[dateKey] || [];
                    const isToday = dateKey === new Date().toISOString().split("T")[0];

                    return (
                      <div
                        key={day}
                        className={`h-16 rounded-lg border p-1 text-xs ${
                          isToday ? "border-primary bg-primary/5" : "border-edge"
                        } ${leaves.length > 0 ? "bg-warn/5" : ""}`}
                      >
                        <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                          {day}
                        </span>
                        {leaves.slice(0, 2).map((l, li) => (
                          <div key={li} className="truncate text-[10px] text-warn leading-tight mt-0.5">
                            {l.staffName?.split(" ")[0]}
                          </div>
                        ))}
                        {leaves.length > 2 && (
                          <div className="text-[10px] text-muted">+{leaves.length - 2} more</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ APPLY LEAVE MODAL ═══ */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-2xl border border-edge w-full max-w-md mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Apply for Leave</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Leave Type</label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-edge bg-background text-sm text-foreground"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{capitalize(t)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-edge bg-background text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-edge bg-background text-sm text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">Reason</label>
                <textarea
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-edge bg-background text-sm text-foreground resize-none"
                  placeholder="Reason for leave..."
                />
              </div>

              {applyError && (
                <div className="flex items-center gap-2 text-danger text-xs">
                  <AlertCircle className="w-3.5 h-3.5" /> {applyError}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowApply(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-edge text-sm text-muted hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {applying ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REJECT MODAL ═══ */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-2xl border border-edge w-full max-w-sm mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground mb-3">Reject Leave</h2>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-edge bg-background text-sm text-foreground resize-none"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRejectId(null); setRejectNote(""); }}
                className="flex-1 px-4 py-2 rounded-lg border border-edge text-sm text-muted hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
