"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Car,
  Phone,
  Mail,
  MapPin,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  ArrowLeft,
  User,
  CalendarDays,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────── */

type MainTab = "REQUESTED" | "CONFIRMED";
type ConfirmedSub = "overdue" | "upcoming";
type CalendarView = "month" | "week" | "day" | "list";

/* ── Demo data (static, UI-only) ──────────────────── */

interface Appointment {
  id: string;
  vehicleNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  status: "requested" | "confirmed";
  isOverdue?: boolean;
  pickupDrop?: boolean;
}

const DEMO_APPOINTMENTS: Appointment[] = [];

/* ── Helpers ───────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Main Page ─────────────────────────────────────── */

export default function AppointmentsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("REQUESTED");
  const [confirmedSub, setConfirmedSub] = useState<ConfirmedSub>("upcoming");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");

  // Calendar navigation
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const requestedCount = DEMO_APPOINTMENTS.filter(
    (a) => a.status === "requested"
  ).length;
  const confirmedCount = DEMO_APPOINTMENTS.filter(
    (a) => a.status === "confirmed"
  ).length;

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  /* ── Calendar View ────────────────────── */

  if (showCalendar) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalendar(false)}
              className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">
              Calendar View
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Calendar nav */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-edge">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-semibold text-foreground min-w-[160px] text-center">
                  {MONTH_NAMES[calMonth]} {calYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 border border-edge rounded-lg p-0.5">
                {(["month", "week", "day", "list"] as CalendarView[]).map(
                  (v) => (
                    <button
                      key={v}
                      onClick={() => setCalendarView(v)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                        calendarView === v
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-hover"
                      }`}
                    >
                      {v}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Calendar grid */}
            {calendarView === "month" && (
              <MonthGrid
                year={calYear}
                month={calMonth}
                today={today}
                appointments={DEMO_APPOINTMENTS}
              />
            )}

            {calendarView === "week" && (
              <WeekView today={today} appointments={DEMO_APPOINTMENTS} />
            )}

            {calendarView === "day" && (
              <DayView today={today} appointments={DEMO_APPOINTMENTS} />
            )}

            {calendarView === "list" && (
              <ListView appointments={DEMO_APPOINTMENTS} />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Book Appointment Form ────────────── */

  if (showBookForm) {
    return (
      <BookAppointmentForm onClose={() => setShowBookForm(false)} />
    );
  }

  /* ── Main appointments list ───────────── */

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">
            Appointments
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-secondary border border-edge rounded-lg hover:bg-hover transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar View
          </button>
          <button
            onClick={() => setShowBookForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Main tabs */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1 border border-edge rounded-lg p-0.5 w-fit">
            <button
              onClick={() => setMainTab("REQUESTED")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mainTab === "REQUESTED"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground hover:bg-hover"
              }`}
            >
              Requested
              {requestedCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    mainTab === "REQUESTED"
                      ? "bg-white/20 text-white"
                      : "bg-warn-light text-warn"
                  }`}
                >
                  {requestedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMainTab("CONFIRMED")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mainTab === "CONFIRMED"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground hover:bg-hover"
              }`}
            >
              Confirmed
              {confirmedCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    mainTab === "CONFIRMED"
                      ? "bg-white/20 text-white"
                      : "bg-ok-light text-ok"
                  }`}
                >
                  {confirmedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Confirmed sub-tabs */}
        {mainTab === "CONFIRMED" && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmedSub("overdue")}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  confirmedSub === "overdue"
                    ? "border-bad text-bad bg-bad-light"
                    : "border-edge text-secondary hover:bg-hover"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue
                </span>
              </button>
              <button
                onClick={() => setConfirmedSub("upcoming")}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  confirmedSub === "upcoming"
                    ? "border-ok text-ok bg-ok-light"
                    : "border-edge text-secondary hover:bg-hover"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Upcoming
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-8">
          {mainTab === "REQUESTED" ? (
            <EmptyState
              icon={Clock}
              title="No Appointments found"
              subtitle="No requested appointments at this time."
            />
          ) : confirmedSub === "overdue" ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Overdue Confirmed Appointments"
              subtitle="You have no overdue confirmed appointments."
            />
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No Upcoming Confirmed Appointments"
              subtitle="You have no upcoming confirmed appointments."
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ──────────────────────────────────── */

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-muted" />
      </div>
      <p className="text-foreground font-medium mb-1">{title}</p>
      <p className="text-muted text-sm">{subtitle}</p>
    </div>
  );
}

/* ── Month Grid ───────────────────────────────────── */

function MonthGrid({
  year,
  month,
  today,
  appointments,
}: {
  year: number;
  month: number;
  today: Date;
  appointments: Appointment[];
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // Get appointments for a specific day
  const getApptsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((a) => a.date === dateStr);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          const dayAppts = day ? getApptsForDay(day) : [];
          return (
            <div
              key={i}
              className={`min-h-[80px] border border-edge-light rounded-md p-1.5 ${
                day ? "bg-background hover:bg-hover/50 transition-colors" : "bg-dim/30"
              }`}
            >
              {day && (
                <>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                      isToday(day)
                        ? "bg-warn text-white"
                        : "text-secondary"
                    }`}
                  >
                    {day}
                  </span>
                  {dayAppts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayAppts.map((a) => (
                        <div
                          key={a.id}
                          className="text-[10px] bg-primary-light text-primary px-1 py-0.5 rounded truncate"
                        >
                          {a.time} {a.customerName}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week View ────────────────────────────────────── */

function WeekView({
  today,
  appointments,
}: {
  today: Date;
  appointments: Appointment[];
}) {
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  return (
    <div className="p-4 overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-px mb-2">
          <div className="text-xs text-muted py-2" />
          {days.map((d, i) => {
            const isToday =
              d.toDateString() === today.toDateString();
            return (
              <div key={i} className="text-center py-2">
                <p className="text-xs text-muted">
                  {DAY_NAMES[d.getDay()]}
                </p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 gap-px">
            <div className="text-xs text-muted py-3 pr-2 text-right">
              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
            </div>
            {days.map((_, di) => (
              <div
                key={di}
                className="border border-edge-light min-h-[48px] bg-background hover:bg-hover/30 transition-colors"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Day View ─────────────────────────────────────── */

function DayView({
  today,
  appointments,
}: {
  today: Date;
  appointments: Appointment[];
}) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-foreground">
          {today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-0">
        {hours.map((hour) => (
          <div key={hour} className="flex gap-3">
            <div className="w-16 text-xs text-muted py-3 text-right shrink-0">
              {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`}
            </div>
            <div className="flex-1 border-t border-edge-light min-h-[48px] hover:bg-hover/30 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── List View ────────────────────────────────────── */

function ListView({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
          <CalendarDays className="w-8 h-8 text-muted" />
        </div>
        <p className="text-foreground font-medium mb-1">
          No appointments scheduled
        </p>
        <p className="text-muted text-sm">
          Appointments will appear here when booked.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-edge">
      {appointments.map((a) => (
        <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-hover transition-colors">
          <div className="w-16 text-center">
            <p className="text-xs text-muted">{a.date}</p>
            <p className="text-sm font-medium text-foreground">{a.time}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {a.customerName}
            </p>
            <p className="text-xs text-muted">{a.vehicleNumber}</p>
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              a.status === "confirmed"
                ? "bg-ok-light text-ok"
                : "bg-warn-light text-warn"
            }`}
          >
            {a.status === "confirmed" ? "Confirmed" : "Requested"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Book Appointment Form (2-step wizard, UI only) ── */

function BookAppointmentForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [pickupDrop, setPickupDrop] = useState(false);

  // Form fields (UI only, no submission)
  const [vehicleReg, setVehicleReg] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            Book Appointment
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Step indicator */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1
                    ? "bg-primary text-white"
                    : "bg-hover text-muted"
                }`}
              >
                1
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= 1 ? "text-foreground" : "text-muted"
                }`}
              >
                Customer & Vehicle
              </span>
            </div>
            <div className="w-12 h-px bg-edge" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2
                    ? "bg-primary text-white"
                    : "bg-hover text-muted"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= 2 ? "text-foreground" : "text-muted"
                }`}
              >
                Schedule
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 max-w-xl mx-auto w-full">
          <div className="bg-background rounded-lg border border-edge p-6">
            {step === 1 ? (
              <div className="space-y-4">
                {/* Vehicle Registration */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Vehicle Registration No.
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vehicleReg}
                      onChange={(e) =>
                        setVehicleReg(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. MH 01 AB 1234"
                      className="w-full px-3 py-2.5 pr-10 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Customer Name <span className="text-bad">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2.5 pl-10 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Mobile Number <span className="text-bad">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) =>
                        setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="Enter mobile number"
                      className="w-full px-3 py-2.5 pl-10 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2.5 pl-10 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address"
                      className="w-full px-3 py-2.5 pl-10 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Pickup & Drop Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Pickup & Drop Required
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Enable if the vehicle needs pickup and drop service
                    </p>
                  </div>
                  <button
                    onClick={() => setPickupDrop(!pickupDrop)}
                    className="transition-colors"
                  >
                    {pickupDrop ? (
                      <ToggleRight className="w-10 h-10 text-primary" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-muted" />
                    )}
                  </button>
                </div>

                {/* Next button */}
                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors mt-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Appointment Date */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Appointment Date <span className="text-bad">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2.5 pl-10 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Appointment Time */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Appointment Time <span className="text-bad">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2.5 pl-10 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes for this appointment..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Summary */}
                {(customerName || vehicleReg) && (
                  <div className="bg-dim rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      Summary
                    </p>
                    {customerName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-muted" />
                        <span className="text-foreground">{customerName}</span>
                      </div>
                    )}
                    {vehicleReg && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-3.5 h-3.5 text-muted" />
                        <span className="text-foreground font-mono">
                          {vehicleReg}
                        </span>
                      </div>
                    )}
                    {mobile && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        <span className="text-foreground">{mobile}</span>
                      </div>
                    )}
                    {pickupDrop && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-3.5 h-3.5 text-muted" />
                        <span className="text-ok text-xs font-medium">
                          Pickup & Drop
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-secondary border border-edge rounded-lg hover:bg-hover transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      // UI only — no actual submission
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Book Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
