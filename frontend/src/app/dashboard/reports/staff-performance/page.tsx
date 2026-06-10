"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getStaffPerformance, type StaffPerformance } from "@/lib/api-performance";
import {
  BarChart3, Loader2, Users, Clock, CheckCircle2,
  CalendarDays, TrendingUp, Download,
} from "lucide-react";
import { DateRangeFilter, type DateRange } from "@/components/DateRangeFilter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function formatMs(ms: number) {
  if (!ms) return "0m";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatMinutes(mins: number) {
  if (!mins) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function StaffPerformancePage() {
  const router = useRouter();
  const [data, setData] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { startDate, endDate } = useMemo(() => {
    if (dateRange === "custom" && customFrom && customTo) {
      return { startDate: customFrom, endDate: customTo };
    }
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    if (dateRange === "today") return { startDate: end, endDate: end };
    if (dateRange === "7d") { now.setDate(now.getDate() - 7); return { startDate: now.toISOString().split("T")[0], endDate: end }; }
    if (dateRange === "90d") { now.setDate(now.getDate() - 90); return { startDate: now.toISOString().split("T")[0], endDate: end }; }
    if (dateRange === "all") return { startDate: "2020-01-01", endDate: end };
    now.setDate(now.getDate() - 30);
    return { startDate: now.toISOString().split("T")[0], endDate: end };
  }, [dateRange, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    getStaffPerformance(startDate, endDate)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // Summary stats
  const totals = useMemo(() => {
    const totalTasks = data.reduce((s, d) => s + d.tasksCompleted, 0);
    const totalHours = Math.round(data.reduce((s, d) => s + d.totalWorkMinutes, 0) / 60);
    const avgAttendance = data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.attendanceRate, 0) / data.length)
      : 0;
    const totalLeaves = data.reduce((s, d) => s + d.leaveDaysTaken, 0);
    return { totalTasks, totalHours, avgAttendance, totalLeaves };
  }, [data]);

  // Chart data
  const taskChartData = useMemo(
    () => data.map((d) => ({
      name: d.staffName.split(" ")[0],
      tasks: d.tasksCompleted,
    })),
    [data]
  );

  const hoursChartData = useMemo(
    () => data.map((d) => ({
      name: d.staffName.split(" ")[0],
      hours: Math.round(d.totalWorkMinutes / 60 * 10) / 10,
    })),
    [data]
  );

  function exportCsv() {
    const headers = [
      "Staff Name", "Role", "Tasks Completed", "Avg Task Time",
      "Days Present", "Total Work Hours", "Attendance %", "Leave Days",
    ];
    const rows = data.map((d) => [
      d.staffName, d.role, d.tasksCompleted, formatMs(d.avgTaskTimeMs),
      d.daysPresent, Math.round(d.totalWorkMinutes / 60 * 10) / 10,
      d.attendanceRate + "%", d.leaveDaysTaken,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-performance-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && data.length === 0) {
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
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-foreground">Staff Performance</h1>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-edge text-sm text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Date range filter */}
          <div className="flex items-center justify-end">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              customFrom={customFrom}
              customTo={customTo}
              onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
            />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted">Total Tasks</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totals.totalTasks}</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warn" />
                <span className="text-xs text-muted">Total Hours</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totals.totalHours}h</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-ok" />
                <span className="text-xs text-muted">Avg Attendance</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totals.avgAttendance}%</p>
            </div>
            <div className="bg-background rounded-xl border border-edge p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-danger" />
                <span className="text-xs text-muted">Total Leaves</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totals.totalLeaves}</p>
            </div>
          </div>

          {/* Charts */}
          {data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tasks chart */}
              <div className="bg-background rounded-xl border border-edge p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Tasks Completed</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted)" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-background)",
                          border: "1px solid var(--color-edge)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="tasks" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hours chart */}
              <div className="bg-background rounded-xl border border-edge p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Work Hours</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hoursChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-background)",
                          border: "1px solid var(--color-edge)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-background rounded-xl border border-edge overflow-hidden">
            <div className="px-4 py-3 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">Staff Comparison</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                No performance data available for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge bg-surface/50">
                      <th className="text-left px-4 py-2.5 text-xs text-muted font-medium">#</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted font-medium">Staff</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted font-medium">Role</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted font-medium">Tasks</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted font-medium">Avg Time</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted font-medium">Days Present</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted font-medium">Work Hours</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted font-medium">Attendance</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted font-medium">Leaves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={d.staffId} onClick={() => router.push(`/dashboard/attendance/employee/${d.staffId}`)}
                        className="border-b border-edge last:border-0 hover:bg-surface/30 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-muted">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-primary hover:underline">{d.staffName}</td>
                        <td className="px-4 py-3 text-muted">{d.role}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{d.tasksCompleted}</td>
                        <td className="px-4 py-3 text-right text-muted">{formatMs(d.avgTaskTimeMs)}</td>
                        <td className="px-4 py-3 text-right text-foreground">{d.daysPresent}</td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatMinutes(d.totalWorkMinutes)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={d.attendanceRate >= 80 ? "text-ok" : d.attendanceRate >= 60 ? "text-warn" : "text-danger"}>
                            {d.attendanceRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted">{d.leaveDaysTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
