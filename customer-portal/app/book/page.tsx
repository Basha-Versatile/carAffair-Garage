"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { publicPost } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
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
      case 1: return rcFetched && brand !== "";
      case 2: return selectedDate !== null && selectedTime !== null;
      case 3: return name.trim() !== "" && phone.trim().length >= 10 && email.trim() !== "";
      default: return true;
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
    "w-full px-4 py-3 rounded-lg form-input text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm transition-all duration-200 outline-none";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0f0f0f]">
      <Navbar />

      <main className="flex-1">
        {/* Banner Header with Breadcrumbs — white in light, dark in dark mode */}
        <div className="relative bg-white dark:bg-[#0f0f0f] py-14 sm:py-20 overflow-hidden border-b border-gray-100 dark:border-white/5">
          {/* Decorative background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[rgba(204,0,0,0.04)] dark:bg-[rgba(204,0,0,0.06)] blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[rgba(15,34,71,0.04)] dark:bg-[rgba(15,34,71,0.1)] blur-3xl -translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <nav className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-white/40 mb-5">
              <Link href="/" className="hover:text-gray-800 dark:hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-[#CC0000] font-medium">Booking</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-montserrat)]">
              Book a Service
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-3 max-w-md mx-auto">
              Schedule your vehicle service in just a few steps
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 -mt-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                const Icon = stepIcons[idx];
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#CC0000] text-white"
                          : isActive
                            ? "bg-[#CC0000] text-white ring-2 ring-[rgba(204,0,0,0.2)]"
                            : "bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-500"
                      }`}>
                        {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-semibold transition-colors ${
                        isActive || isCompleted ? "text-[#CC0000]" : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {label}
                      </span>
                    </div>
                    {idx < stepLabels.length - 1 && (
                      <div className="flex-1 mx-2 sm:mx-4">
                        <div className={`h-0.5 rounded-full transition-all duration-500 ${
                          step > stepNum ? "bg-[#CC0000]" : "bg-gray-200 dark:bg-[#2a2a2a]"
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
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 pb-10 sm:pb-16">
          <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-5 sm:p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={confirmed ? "success" : step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >

            {/* Step 1: Vehicle Number */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[rgba(204,0,0,0.08)] mb-3">
                    <Car className="h-6 w-6 text-[#CC0000]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)] mb-1">Vehicle Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enter your vehicle registration number to get started</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      <Car className="h-3.5 w-3.5 text-[#CC0000]" />
                      Registration Number <span className="text-[#CC0000]">*</span>
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
                        className="btn-primary !py-3 !px-5 !text-sm !rounded-lg disabled:opacity-40 w-full sm:w-auto"
                      >
                        {rcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {rcLoading ? "Fetching..." : "Fetch Details"}
                      </button>
                    </div>
                    {rcError && (
                      <p className="flex items-center gap-1.5 text-xs mt-2 status-error px-3 py-2 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {rcError}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Details display */}
                  {rcFetched && brand && rcData && (
                    <div className="animate-scale-in space-y-3">
                      <div className="flex items-center gap-2.5 p-3 rounded-lg status-success">
                        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-green-500 text-white shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-semibold">Vehicle details fetched successfully!</p>
                      </div>

                      <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#171717]">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[rgba(204,0,0,0.08)] shrink-0">
                              <Car className="h-5 w-5 text-[#CC0000]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-bold text-gray-900 dark:text-gray-100">{brand} {model}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{regNumber} {fuelType && `· ${fuelType}`} {year && `· ${year}`}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          {ownerName && (
                            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                              <User className="h-3.5 w-3.5 text-[#CC0000] shrink-0" />
                              <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Owner</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ownerName}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {[
                              { label: "Brand", value: brand },
                              { label: "Model", value: model },
                              { label: "Fuel", value: fuelType || "—", icon: Fuel },
                              ...(year ? [{ label: "Year", value: year, icon: Calendar }] : []),
                              ...(rcData.color ? [{ label: "Color", value: rcData.color }] : []),
                              ...(rcData.bodyType ? [{ label: "Body Type", value: rcData.bodyType }] : []),
                            ].map((item) => (
                              <div key={item.label} className="rounded-lg bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] p-3">
                                <div className="flex items-center gap-1 mb-0.5">
                                  {item.icon && <item.icon className="h-2.5 w-2.5 text-[#CC0000]" />}
                                  <p className="text-[10px] text-[#CC0000] uppercase tracking-wider font-semibold">{item.label}</p>
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[rgba(204,0,0,0.08)] mb-3">
                    <CalendarDays className="h-6 w-6 text-[#CC0000]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)] mb-1">Pick Date & Time</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred appointment schedule</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <CalendarDays className="h-3.5 w-3.5 text-[#CC0000]" />
                        Preferred Date <span className="text-[#CC0000]">*</span>
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

                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <Clock className="h-3.5 w-3.5 text-[#CC0000]" />
                        Preferred Time <span className="text-[#CC0000]">*</span>
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

                  {selectedDate && selectedTime && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg status-success animate-scale-in">
                      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-green-500 text-white shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-semibold">
                        {selectedDateDisplay} at {selectedTimeDisplay}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Customer Details */}
            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[rgba(204,0,0,0.08)] mb-3">
                    <User className="h-6 w-6 text-[#CC0000]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)] mb-1">Your Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">We need your contact info to confirm the appointment</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <User className="h-3.5 w-3.5 text-[#CC0000]" /> Full Name <span className="text-[#CC0000]">*</span>
                      </label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputBase} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <Phone className="h-3.5 w-3.5 text-[#CC0000]" /> Phone Number <span className="text-[#CC0000]">*</span>
                      </label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit phone number" maxLength={10} className={inputBase} />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      <Mail className="h-3.5 w-3.5 text-[#CC0000]" /> Email Address <span className="text-[#CC0000]">*</span>
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputBase} />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Booking confirmation will be sent to this email</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      <MessageSquare className="h-3.5 w-3.5 text-[#CC0000]" /> What do you need help with?
                    </label>
                    <textarea
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      placeholder="Describe the issue or service you need..."
                      rows={3}
                      className={inputBase + " resize-none"}
                    />
                  </div>

                  {/* Pickup & Drop */}
                  <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[rgba(204,0,0,0.08)] shrink-0">
                        <Truck className="h-5 w-5 text-[#CC0000]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pickup & Drop</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">We&apos;ll pick up and deliver your vehicle</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPickDrop(!pickDrop)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${pickDrop ? "bg-[#CC0000]" : "bg-gray-200 dark:bg-[#2a2a2a]"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${pickDrop ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {step === 4 && !confirmed && (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[rgba(204,0,0,0.08)] mb-3">
                    <Shield className="h-6 w-6 text-[#CC0000]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)] mb-1">Review & Confirm</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Please verify your booking details before submitting</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] p-4">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-2">Vehicle</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[rgba(204,0,0,0.08)] shrink-0">
                          <Car className="h-5 w-5 text-[#CC0000]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{brand} {model}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{regNumber} {fuelType && `\u00B7 ${fuelType}`} {year && `\u00B7 ${year}`}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] p-4">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-2">Appointment</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[rgba(204,0,0,0.08)] shrink-0">
                          <CalendarDays className="h-5 w-5 text-[#CC0000]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{selectedDateDisplay}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">at {selectedTimeDisplay}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] p-4">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-2">Contact Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-[#CC0000] shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 font-semibold truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-[#CC0000] shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 font-semibold">{phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-[#CC0000] shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 font-semibold truncate">{email}</span>
                      </div>
                      {pickDrop && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-3.5 w-3.5 text-[#CC0000] shrink-0" />
                          <span className="text-[#CC0000] font-semibold">Pickup & Drop</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {customerMessage && (
                    <div className="rounded-lg bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] p-4">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Message</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{customerMessage}</p>
                    </div>
                  )}

                  {submitError && (
                    <div className="status-error rounded-lg p-3">
                      <p className="text-xs">{submitError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="btn-primary w-full !rounded-lg !py-3.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {submitting ? "Submitting..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            )}

            {/* Success */}
            {confirmed && (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center mb-5 shadow-lg">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)] mb-2">Booking Submitted!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
                  We will confirm availability within 2 hours. A confirmation will be sent to{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{email}</span>.
                </p>
                <div className="inline-block bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-6 py-3 mb-6">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Booking ID</p>
                  <p className="text-xl font-bold text-[#CC0000]">{bookingIdFromApi}</p>
                </div>
                <div>
                  <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#CC0000] hover:underline transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                  </Link>
                </div>
              </div>
            )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {!confirmed && step <= 4 && (
            <div className="flex justify-between mt-5">
              {step > 1 ? (
                <button onClick={handleBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] transition-all">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : <div />}
              {step < 4 && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn-primary !py-2.5 !px-6 !rounded-lg !text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-4 w-4" />
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
