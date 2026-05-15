"use client";

import { useState, useEffect } from "react";
import { getServiceReminders, ServiceReminder } from "@/lib/api-inventory";
import {
  Clock,
  Phone,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  ChevronRight,
  Gauge,
} from "lucide-react";

type TabKey = "due" | "overdue" | "done";

const STATUS_CONFIG: Record<
  TabKey,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    icon: typeof Clock;
  }
> = {
  due: { label: "Due", badgeBg: "bg-warn-light", badgeText: "text-warn", icon: Clock },
  overdue: { label: "Overdue", badgeBg: "bg-bad-light", badgeText: "text-bad", icon: AlertTriangle },
  done: { label: "Done", badgeBg: "bg-ok-light", badgeText: "text-ok", icon: CheckCircle2 },
};

export default function ServiceRemindersPage() {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("due");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getServiceReminders()
      .then((data) => setReminders(data || []))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load service reminders");
      })
      .finally(() => setLoading(false));
  }, []);

  const safeReminders = reminders || [];

  const counts: Record<TabKey, number> = {
    due: safeReminders.filter((r) => r.status === "due").length,
    overdue: safeReminders.filter((r) => r.status === "overdue").length,
    done: safeReminders.filter((r) => r.status === "done").length,
  };

  const query = search.toLowerCase();
  const filtered = safeReminders
    .filter((r) => r.status === activeTab)
    .filter(
      (r) =>
        (r.customerName ?? "").toLowerCase().includes(query) ||
        (r.vehicleNumber ?? "").toLowerCase().includes(query) ||
        (r.customerPhone ?? "").includes(query)
    );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Service Reminders</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">
            {safeReminders.length}
          </span>
        </div>
        <p className="text-xs text-muted mt-0.5">
          Track upcoming, overdue, and completed service reminders for your customers.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-2">
              {(["due", "overdue", "done"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "text-secondary hover:bg-hover"
                  }`}
                >
                  {STATUS_CONFIG[tab].label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === tab
                        ? "bg-white/20 text-white"
                        : "bg-hover text-muted"
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-6 pb-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer name, vehicle number, phone"
                  className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
                  <Bell className="w-8 h-8 text-muted" />
                </div>
                <p className="text-muted text-sm">
                  {search
                    ? "No reminders match your search."
                    : `No ${STATUS_CONFIG[activeTab].label.toLowerCase()} reminders.`}
                </p>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((reminder, idx) => (
                    <ReminderCard key={reminder.id} reminder={reminder} index={idx} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReminderCard({ reminder, index }: { reminder: ServiceReminder; index: number }) {
  const config = STATUS_CONFIG[reminder.status];
  const StatusIcon = config.icon;

  return (
    <div
      className="bg-background border border-edge rounded-xl p-4 hover:shadow-md transition-shadow animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Status + Service Type */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </span>
        <span className="text-xs font-medium text-primary bg-primary-light px-2.5 py-1 rounded-full">
          {reminder.serviceType}
        </span>
      </div>

      {/* Customer Info */}
      <div className="mb-3">
        <p className="text-sm font-bold text-foreground">{reminder.customerName || "Unknown"}</p>
        <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
          <Phone className="w-3 h-3" />
          {reminder.customerPhone || "-"}
        </div>
      </div>

      {/* Vehicle */}
      <div className="flex items-center gap-1.5 text-xs text-secondary mb-3">
        <Car className="w-3.5 h-3.5 text-muted" />
        <span className="font-medium">{reminder.vehicleNumber || "-"}</span>
        <span className="text-muted">-</span>
        <span className="text-muted">{reminder.vehicleName || "-"}</span>
      </div>

      {/* Dates + KMs */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-secondary">
          <Calendar className="w-3.5 h-3.5 text-muted" />
          <span>Due: {reminder.dueDate || "-"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last Service: {reminder.lastServiceDate || "-"}</span>
        </div>
        {reminder.kmsDue && (
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <Gauge className="w-3.5 h-3.5 text-muted" />
            <span>{reminder.kmsDue.toLocaleString()} km due</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {reminder.notes && (
        <p className="text-xs italic text-muted mb-3 leading-relaxed">
          {reminder.notes}
        </p>
      )}

      {/* Action */}
      {reminder.status !== "done" && (
        <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary border border-edge rounded-lg px-3 py-2 hover:bg-hover transition-colors">
          <Bell className="w-3.5 h-3.5" />
          Send Reminder
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
