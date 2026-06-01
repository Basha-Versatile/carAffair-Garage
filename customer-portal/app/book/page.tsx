"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { publicPost } from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Car,
  User,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Truck,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  Calendar,
  Fuel,
  CalendarDays,
  Shield,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RcLookupResponse {
  ownerName: string | null;
  mobileNumber: string | null;
  address: string | null;
  makerDescription: string | null;
  makerModel: string | null;
  fuelType: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  manufacturingDate: string | null;
  registrationDate: string | null;
  color: string | null;
  bodyType: string | null;
  vehicleCategory: string | null;
  rcStatus: string | null;
  insuranceCompany: string | null;
  insuranceUpto: string | null;
  financer: string | null;
  matchedBrandName: string | null;
  matchedModelName: string | null;
  matchedFuelType: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const stepLabels = ["Vehicle", "Date & Time", "Details", "Confirm"];
const stepIcons = [Car, CalendarDays, User, Check];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateDisplay(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatDateForApi(date: Date | null) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime12h(date: Date | null) {
  if (!date) return "";
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BookServicePage() {
  const [step, setStep] = useState(1);

  // Step 1: Vehicle
  const [regNumber, setRegNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [year, setYear] = useState("");
  const [rcLoading, setRcLoading] = useState(false);
  const [rcError, setRcError] = useState("");
  const [rcFetched, setRcFetched] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [rcData, setRcData] = useState<RcLookupResponse | null>(null);

  // Step 2: Date & Time
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  // Step 3: Details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [pickDrop, setPickDrop] = useState(false);

  // Step 4: Confirm
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingIdFromApi, setBookingIdFromApi] = useState("");

  const minDate = useMemo(() => getTomorrow(), []);

  // RC Lookup
  const handleRcLookup = async () => {
    if (!regNumber.trim()) return;
    setRcLoading(true);
    setRcError("");
    try {
      const result = await publicPost<RcLookupResponse>("/api/public/rc-lookup", {
        registrationNumber: regNumber.trim(),
      });
      setRcFetched(true);
      setRcData(result);
      const brandVal = result.matchedBrandName || result.makerDescription || "";
      const modelVal = result.matchedModelName || result.makerModel || "";
      const fuelVal = result.matchedFuelType || result.fuelType || "";
      if (brandVal) setBrand(brandVal);
      if (modelVal) setModel(modelVal);
      if (fuelVal) setFuelType(fuelVal);
      if (result.ownerName) { setOwnerName(result.ownerName); setName(result.ownerName); }
      if (result.mobileNumber) { setOwnerPhone(result.mobileNumber); setPhone(result.mobileNumber); }
      if (result.manufacturingDate) {
        const yearMatch = result.manufacturingDate.match(/\d{4}/);
        if (yearMatch) setYear(yearMatch[0]);
      }
    } catch {
      setRcError("Could not fetch vehicle details. Please check the number and try again.");
    } finally {
      setRcLoading(false);
    }
  };

  // Validation
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return rcFetched && brand !== "";
      case 2:
        return selectedDate !== null && selectedTime !== null;
      case 3:
        return name.trim() !== "" && phone.trim().length >= 10 && email.trim() !== "";
      default:
        return true;
    }
  };

  const handleNext = () => { if (canProceed() && step < 4) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await publicPost<{ bookingId: string }>("/api/bookings", {
        service: "General Service",
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        vehicleRegNumber: regNumber,
        vehicleBrand: brand,
        vehicleModel: model,
        vehicleFuelType: fuelType,
        vehicleYear: year || undefined,
        preferredDate: formatDateForApi(selectedDate),
        preferredTime: formatTime12h(selectedTime),
        customerMessage: customerMessage || undefined,
        concerns: customerMessage || undefined,
        pickDrop,
      });
      setBookingIdFromApi(result?.bookingId || "Pending");
      setConfirmed(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDateDisplay = formatDateDisplay(selectedDate);
  const selectedTimeDisplay = formatTime12h(selectedTime);

  const inputBase =
    "w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />

      {/* Background with gradient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-primary/[0.04] blur-[80px] sm:blur-[100px] translate-x-[20%] -translate-y-[20%]" />
        <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-primary/[0.03] blur-[60px] sm:blur-[80px] -translate-x-[20%] translate-y-[20%]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30vw] h-[30vw] max-w-[350px] max-h-[350px] rounded-full bg-accent/[0.02] blur-[60px] sm:blur-[80px]" />
      </div>

      <main className="relative z-10 flex-1 pt-16 w-full">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 text-center">
            <nav className="flex items-center justify-center gap-1.5 text-xs text-muted mb-2 sm:mb-3">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Book a Service</span>
            </nav>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-1.5 sm:mb-2">
              Book a Service
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-sm mx-auto">
              Schedule your vehicle service in just a few steps
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="relative mx-auto max-w-3xl px-3 sm:px-6 lg:px-8 -mt-1 mb-4 sm:mb-6">
          <div className="glass-card-premium rounded-lg sm:rounded-xl p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                const Icon = stepIcons[idx];
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex items-center justify-center h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-500 ${
                        isCompleted
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : isActive
                            ? "bg-primary text-white ring-2 ring-primary/20 shadow-md shadow-primary/20"
                            : "bg-white/60 dark:bg-white/5 border border-edge/50 text-muted"
                      }`}>
                        {isCompleted ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Icon className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </div>
                      <span className={`text-[9px] sm:text-xs font-semibold transition-colors duration-300 ${
                        isActive || isCompleted ? "text-primary" : "text-muted"
                      }`}>
                        {label}
                      </span>
                    </div>
                    {idx < stepLabels.length - 1 && (
                      <div className="flex-1 mx-1 sm:mx-3">
                        <div className={`h-0.5 rounded-full transition-all duration-500 ${
                          step > stepNum
                            ? "bg-gradient-to-r from-primary to-primary/70"
                            : "bg-edge/30"
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-3xl px-3 sm:px-6 lg:px-8 pb-6 sm:pb-10">
          <div className="glass-card-premium rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 lg:p-8">

            {/* ─── Step 1: Vehicle Number ─── */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 mb-2 sm:mb-3">
                    <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">Vehicle Details</h2>
                  <p className="text-xs sm:text-sm text-secondary">Enter your vehicle registration number to get started</p>
                </div>

                <div className="w-full space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                      <Car className="h-3.5 w-3.5 text-primary" />
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={regNumber}
                        onChange={(e) => { setRegNumber(e.target.value.toUpperCase()); setRcFetched(false); setRcError(""); setBrand(""); setModel(""); setFuelType(""); setYear(""); setRcData(null); }}
                        placeholder="e.g., TS 09 AB 1234"
                        className={inputBase + " flex-1 font-mono tracking-wider"}
                      />
                      <button
                        onClick={handleRcLookup}
                        disabled={rcLoading || !regNumber.trim()}
                        className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover disabled:opacity-40 flex items-center justify-center gap-1.5 whitespace-nowrap transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                      >
                        {rcLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                        {rcLoading ? "Fetching..." : "Fetch Details"}
                      </button>
                    </div>
                    {rcError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {rcError}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Details — glassmorphic display */}
                  {rcFetched && brand && rcData && (
                    <div className="animate-scale-in space-y-3">
                      {/* Success banner */}
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200/50 dark:border-green-500/20">
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-green-500 text-white shrink-0 shadow-sm shadow-green-500/30">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">Vehicle details fetched successfully!</p>
                      </div>

                      {/* Vehicle detail card */}
                      <div className="rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-md shadow-sm overflow-hidden">
                        {/* Vehicle header with reg + owner */}
                        <div className="px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-white/15 dark:border-white/10 bg-gradient-to-r from-primary/[0.06] to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 shrink-0">
                              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-base font-bold text-foreground">{brand} {model}</p>
                              <p className="text-[10px] sm:text-xs text-muted">{regNumber} {fuelType && `· ${fuelType}`} {year && `· ${year}`}</p>
                            </div>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="p-3.5 sm:p-4">
                          {ownerName && (
                            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/10 dark:border-white/5">
                              <User className="h-3.5 w-3.5 text-primary shrink-0" />
                              <div>
                                <p className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider font-semibold">Owner</p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">{ownerName}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                            <div className="rounded-lg border border-white/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-2.5 sm:p-3">
                              <p className="text-[9px] sm:text-[10px] text-primary/70 uppercase tracking-wider font-semibold mb-0.5">Brand</p>
                              <p className="text-xs sm:text-sm font-bold text-foreground">{brand}</p>
                            </div>
                            <div className="rounded-lg border border-white/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-2.5 sm:p-3">
                              <p className="text-[9px] sm:text-[10px] text-primary/70 uppercase tracking-wider font-semibold mb-0.5">Model</p>
                              <p className="text-xs sm:text-sm font-bold text-foreground">{model}</p>
                            </div>
                            <div className="rounded-lg border border-white/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-2.5 sm:p-3">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Fuel className="h-2.5 w-2.5 text-primary/70" />
                                <p className="text-[9px] sm:text-[10px] text-primary/70 uppercase tracking-wider font-semibold">Fuel</p>
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-foreground">{fuelType || "—"}</p>
                            </div>
                            {year && (
                              <div className="rounded-lg border border-white/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-2.5 sm:p-3">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Calendar className="h-2.5 w-2.5 text-primary/70" />
                                  <p className="text-[9px] sm:text-[10px] text-primary/70 uppercase tracking-wider font-semibold">Year</p>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-foreground">{year}</p>
                              </div>
                            )}
                            {rcData.color && (
                              <div className="rounded-lg border border-white/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-2.5 sm:p-3">
                                <p className="text-[9px] sm:text-[10px] text-primary/70 uppercase tracking-wider font-semibold mb-0.5">Color</p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">{rcData.color}</p>
                              </div>
                            )}
                            {rcData.bodyType && (
                              <div className="rounded-lg border border-white/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-2.5 sm:p-3">
                                <p className="text-[9px] sm:text-[10px] text-primary/70 uppercase tracking-wider font-semibold mb-0.5">Body Type</p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">{rcData.bodyType}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 2: Date & Time ─── */}
            {step === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 mb-2 sm:mb-3">
                    <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">Pick Date & Time</h2>
                  <p className="text-xs sm:text-sm text-secondary">Choose your preferred appointment schedule</p>
                </div>

                <div className="w-full space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Date Picker */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <div className="book-datepicker">
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date: Date | null) => setSelectedDate(date)}
                          minDate={minDate}
                          dateFormat="EEEE, d MMMM yyyy"
                          placeholderText="Tap to select a date"
                          className={inputBase + " cursor-pointer w-full!"}
                          wrapperClassName="w-full"
                          popperPlacement="bottom-start"
                        />
                      </div>
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        Preferred Time <span className="text-red-500">*</span>
                      </label>
                      <div className="book-datepicker">
                        <DatePicker
                          selected={selectedTime}
                          onChange={(date: Date | null) => setSelectedTime(date)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={30}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          placeholderText="Tap to select a time"
                          className={inputBase + " cursor-pointer w-full!"}
                          wrapperClassName="w-full"
                          popperPlacement="bottom-start"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedDate && selectedTime && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200/50 dark:border-green-500/20 animate-scale-in">
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-green-500 text-white shrink-0 shadow-sm shadow-green-500/30">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs sm:text-sm text-green-800 dark:text-green-300 font-semibold">
                        {selectedDateDisplay} at {selectedTimeDisplay}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 3: Customer Details ─── */}
            {step === 3 && (
              <div className="animate-fade-in">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 mb-2 sm:mb-3">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">Your Details</h2>
                  <p className="text-xs sm:text-sm text-secondary">We need your contact info to confirm the appointment</p>
                </div>

                <div className="w-full space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                        <User className="h-3.5 w-3.5 text-primary" /> Full Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputBase} />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                        <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit phone number" maxLength={10} className={inputBase} />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Email Address <span className="text-red-500">*</span>
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputBase} />
                    <p className="text-[10px] sm:text-xs text-muted mt-1 ml-0.5">Booking confirmation will be sent to this email</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" /> What do you need help with?
                    </label>
                    <textarea
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      placeholder="Describe the issue or service you need — e.g., AC not cooling, oil change, brake noise..."
                      rows={3}
                      className={inputBase + " resize-none"}
                    />
                  </div>

                  {/* Pickup & Drop */}
                  <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">Pickup & Drop</p>
                        <p className="text-[10px] sm:text-xs text-muted truncate">We&apos;ll pick up and deliver your vehicle</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPickDrop(!pickDrop)}
                      className={`relative w-10 h-5 sm:w-11 sm:h-6 rounded-full transition-all duration-300 shrink-0 ${pickDrop ? "bg-primary shadow-sm shadow-primary/30" : "bg-edge/50"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow transition-all duration-300 ${pickDrop ? "left-[calc(100%-1.125rem)] sm:left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 4: Review & Confirm ─── */}
            {step === 4 && !confirmed && (
              <div className="animate-fade-in">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 mb-2 sm:mb-3">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">Review & Confirm</h2>
                  <p className="text-xs sm:text-sm text-secondary">Please verify your booking details before submitting</p>
                </div>

                <div className="w-full space-y-2.5 sm:space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                    {/* Vehicle Card */}
                    <div className="rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm p-3 sm:p-4">
                      <p className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Vehicle</p>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 shrink-0">
                          <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-bold text-foreground truncate">{brand} {model}</p>
                          <p className="text-[10px] sm:text-xs text-muted truncate">{regNumber} {fuelType && `\u00B7 ${fuelType}`} {year && `\u00B7 ${year}`}</p>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Card */}
                    <div className="rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm p-3 sm:p-4">
                      <p className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Appointment</p>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 shrink-0">
                          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-bold text-foreground truncate">{selectedDateDisplay}</p>
                          <p className="text-[10px] sm:text-xs text-muted">at {selectedTimeDisplay}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Card */}
                  <div className="rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm p-3 sm:p-4">
                    <p className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Contact Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-semibold truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-semibold">{phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-semibold truncate">{email}</span>
                      </div>
                      {pickDrop && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-primary font-semibold">Pickup & Drop</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  {customerMessage && (
                    <div className="rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm p-3 sm:p-4">
                      <p className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Your Message</p>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">{customerMessage}</p>
                    </div>
                  )}

                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
                      <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full py-3 bg-primary text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:bg-primary-hover disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {submitting ? "Submitting..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            )}

            {/* ─── Success ─── */}
            {confirmed && (
              <div className="animate-scale-in text-center py-5 sm:py-8">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-3 sm:mb-5 shadow-lg shadow-green-500/30">
                  <Check className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1.5 sm:mb-2">Booking Submitted!</h2>
                <p className="text-xs sm:text-sm text-secondary mb-4 sm:mb-5 max-w-xs mx-auto leading-relaxed">
                  We will confirm availability within 2 hours. A confirmation will be sent to{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                </p>
                <div className="inline-block rounded-xl border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-sm px-5 py-2.5 sm:px-6 sm:py-3 mb-4 sm:mb-6">
                  <p className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider font-semibold mb-0.5">Booking ID</p>
                  <p className="text-lg sm:text-xl font-bold text-primary">{bookingIdFromApi}</p>
                </div>
                <div>
                  <Link href="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ─── Navigation Buttons ─── */}
          {!confirmed && step <= 4 && (
            <div className="flex justify-between mt-3 sm:mt-5">
              {step > 1 ? (
                <button onClick={handleBack} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-secondary hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300">
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back
                </button>
              ) : <div />}
              {step < 4 && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
