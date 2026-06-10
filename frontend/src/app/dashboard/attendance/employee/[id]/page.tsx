"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getStaffAttendance,
  type Attendance,
} from "@/lib/api-attendance";
import { getStaffPerformance, type StaffPerformance } from "@/lib/api-performance";
import { getImageUrl } from "@/lib/api-orders";
import {
  ArrowLeft, Loader2, CalendarDays, Clock, TrendingUp,
  Timer, CheckCircle2, UserCheck, Camera, ChevronLeft, ChevronRight,
} from "lucide-react";

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMinutes(mins?: number) {
  if (!mins) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatMs(ms: number) {
  if (!ms) return "—";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [records, setRecords] = useState<Attendance[]>([]);
  const [perf, setPerf] = useState<StaffPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { startDate, endDate } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const last = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    return { startDate: start, endDate: end };
  }, [month]);

  useEffect(() => {
    if (!staffId) return;
    setLoading(true);
    Promise.all([
      getStaffAttendance(staffId, startDate, endDate),
      getStaffPerformance(startDate, endDate),
    ])
      .then(([att, perfData]) => {
        setRecords(att);
        const match = perfData.find((p) => p.staffId === staffId);
        setPerf(match || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [staffId, startDate, endDate]);

  const staffName = records[0]?.staffName || perf?.staffName || "Employee";

  const stats = useMemo(() => {
    const present = records.filter(
      (a) => a.status === "checked_in" || a.status === "checked_out"
    );
    const checkedOut = records.filter((a) => a.status === "checked_out");
    const totalMins = checkedOut.reduce((s, a) => s + (a.totalWorkMinutes || 0), 0);
    const avgMins = checkedOut.length > 0 ? Math.round(totalMins / checkedOut.length) : 0;
    const onTime = records.filter((a) => {
      if (!a.checkinTime) return false;
      const hour = new Date(a.checkinTime).getHours();
      return hour < 10;
    }).length;
    const uniformDays = records.filter((a) => a.inUniform).length;

    return {
      daysPresent: present.length,
      totalHours: Math.floor(totalMins / 60),
      totalMins: totalMins % 60,
      avgHours: Math.floor(avgMins / 60),
      avgMins: avgMins % 60,
      onTime,
      uniformDays,
    };
  }, [records]);

  function changeMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString([], {
      month: "long",
      year: "numeric",
    });
  })();

  if (loading && records.length === 0) {
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
        <button
          onClick={() => router.back()}
          className="p-1 rounded hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-foreground">{staffName}</h1>
          <p className="text-xs text-muted">
            {perf?.role || "Staff"} &middot; Employee Report
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-lg border border-edge hover:bg-hover transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted" />
            </button>
            <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-lg border border-edge hover:bg-hover transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted" />
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background rounded-xl border border-edge p-4 text-center">
              <CalendarDays className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-foreground">{stats.daysPresent}</p>
              <p className="text-[11px] text-muted">Days Present</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4 text-center">
              <Clock className="w-5 h-5 text-ok mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-foreground">
                {stats.totalHours}h {stats.totalMins}m
              </p>
              <p className="text-[11px] text-muted">Total Hours</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4 text-center">
              <Timer className="w-5 h-5 text-warn mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-foreground">
                {stats.avgHours}h {stats.avgMins}m
              </p>
              <p className="text-[11px] text-muted">Avg / Day</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4 text-center">
              <UserCheck className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-foreground">{stats.onTime}</p>
              <p className="text-[11px] text-muted">On Time (&lt;10am)</p>
            </div>
          </div>

          {/* Performance Card */}
          {perf && (
            <div className="bg-background rounded-xl border border-edge p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Task Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted">Tasks Completed</p>
                  <p className="text-lg font-bold text-foreground">{perf.tasksCompleted}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Avg Task Time</p>
                  <p className="text-lg font-bold text-foreground">{formatMs(perf.avgTaskTimeMs)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Attendance Rate</p>
                  <p className={`text-lg font-bold ${perf.attendanceRate >= 80 ? "text-ok" : perf.attendanceRate >= 60 ? "text-warn" : "text-red-500"}`}>
                    {perf.attendanceRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Leave Days</p>
                  <p className="text-lg font-bold text-foreground">{perf.leaveDaysTaken}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Log */}
          <div className="bg-background rounded-xl border border-edge overflow-hidden">
            <div className="px-5 py-3 border-b border-edge flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-secondary">Attendance Log</h3>
              <span className="text-xs bg-hover text-muted px-1.5 py-0.5 rounded-full ml-auto">
                {records.length} records
              </span>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted">
                No attendance records for this month.
              </div>
            ) : (
              <div className="divide-y divide-edge">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-surface/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          r.status === "checked_in"
                            ? "bg-ok animate-pulse"
                            : r.status === "checked_out"
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(r.date)}
                        </p>
                        <p className="text-xs text-muted">
                          In: {formatTime(r.checkinTime)}
                          {r.checkoutTime && ` — Out: ${formatTime(r.checkoutTime)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Selfie thumbnails */}
                      {r.checkinPhotoId && (
                        <button
                          onClick={() => setPreviewImage(getImageUrl(r.checkinPhotoId!))}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors"
                          title="Check-in selfie"
                        >
                          <img
                            src={getImageUrl(r.checkinPhotoId)}
                            alt="In"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
                      {r.checkoutPhotoId && (
                        <button
                          onClick={() => setPreviewImage(getImageUrl(r.checkoutPhotoId!))}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors"
                          title="Check-out selfie"
                        >
                          <img
                            src={getImageUrl(r.checkoutPhotoId)}
                            alt="Out"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}

                      {!r.inUniform && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-warn/10 text-warn">
                          No Uniform
                        </span>
                      )}
                      {r.totalWorkMinutes != null && r.totalWorkMinutes > 0 ? (
                        <span className="text-sm font-semibold text-foreground min-w-[60px] text-right">
                          {formatMinutes(r.totalWorkMinutes)}
                        </span>
                      ) : r.status === "checked_in" ? (
                        <span className="text-xs font-medium text-ok px-2 py-0.5 rounded-full bg-ok/10">
                          Active
                        </span>
                      ) : (
                        <span className="text-sm text-muted min-w-[60px] text-right">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
