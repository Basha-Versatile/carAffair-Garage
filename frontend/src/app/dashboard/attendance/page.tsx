"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getTodayAttendance, getAbsentees, getAttendanceSummary,
  getStaffAttendance,
  type Attendance, type AttendanceSummary,
} from "@/lib/api-attendance";
import { getImageUrl } from "@/lib/api-orders";
import {
  Users, Loader2, CheckCircle2, XCircle, Clock,
  UserCheck, UserX, Timer, Calendar, ChevronLeft, ChevronRight,
} from "lucide-react";

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMinutes(mins?: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function AttendanceAdminPage() {
  const router = useRouter();
  const [todayRecords, setTodayRecords] = useState<Attendance[]>([]);
  const [absentees, setAbsentees] = useState<{ id: string; name: string }[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"today" | "absentees">("today");

  // Monthly calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    Promise.all([
      getTodayAttendance(),
      getAbsentees(),
      getAttendanceSummary(
        startOfWeek.toISOString().split("T")[0],
        endOfWeek.toISOString().split("T")[0]
      ),
    ])
      .then(([records, absent, sum]) => {
        setTodayRecords(records);
        setAbsentees(absent);
        setSummary(sum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const checkedInCount = todayRecords.filter(r => r.status === "checked_in").length;
  const checkedOutCount = todayRecords.filter(r => r.status === "checked_out").length;

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
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-base font-semibold text-foreground">Attendance</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-ok" />
                <span className="text-xs text-muted">Checked In</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{checkedInCount}</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted">Checked Out</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{checkedOutCount}</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-4 h-4 text-red-500" />
                <span className="text-xs text-muted">Absent Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{absentees.length}</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-warn" />
                <span className="text-xs text-muted">Avg Hours (Week)</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {summary ? formatMinutes(summary.avgWorkMinutes) : "—"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-background rounded-xl border border-edge overflow-hidden">
            <div className="border-b border-edge flex">
              <button
                onClick={() => setTab("today")}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === "today"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}>
                Today&apos;s Attendance
                <span className="ml-1.5 text-xs bg-hover text-muted px-1.5 py-0.5 rounded-full">
                  {todayRecords.length}
                </span>
              </button>
              <button
                onClick={() => setTab("absentees")}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === "absentees"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}>
                Absentees
                <span className="ml-1.5 text-xs bg-hover text-muted px-1.5 py-0.5 rounded-full">
                  {absentees.length}
                </span>
              </button>
            </div>

            <div className="p-4">
              {tab === "today" ? (
                todayRecords.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">No attendance records today</p>
                ) : (
                  <div className="space-y-2">
                    {todayRecords.map((record) => (
                      <div key={record.id}
                        onClick={() => router.push(`/dashboard/attendance/employee/${record.staffId}`)}
                        className="flex items-center justify-between px-4 py-3 bg-dim rounded-lg cursor-pointer hover:bg-hover transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            record.status === "checked_in" ? "bg-ok animate-pulse" : "bg-muted"
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{record.staffName}</p>
                            <p className="text-xs text-muted">
                              In: {formatTime(record.checkinTime)}
                              {record.checkoutTime && ` — Out: ${formatTime(record.checkoutTime)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              record.status === "checked_in"
                                ? "bg-ok/10 text-ok"
                                : "bg-dim text-muted"
                            }`}>
                              {record.status === "checked_in" ? "Working" : "Done"}
                            </span>
                            {record.totalWorkMinutes != null && record.totalWorkMinutes > 0 && (
                              <p className="text-xs text-muted mt-1">{formatMinutes(record.totalWorkMinutes)}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                absentees.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-8 h-8 text-ok mx-auto mb-2" />
                    <p className="text-sm text-muted">All staff have checked in today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {absentees.map((staff) => (
                      <div key={staff.id}
                        onClick={() => router.push(`/dashboard/attendance/employee/${staff.id}`)}
                        className="flex items-center justify-between px-4 py-3 bg-dim rounded-lg cursor-pointer hover:bg-hover transition-colors">
                        <div className="flex items-center gap-3">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-sm font-medium text-foreground">{staff.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
