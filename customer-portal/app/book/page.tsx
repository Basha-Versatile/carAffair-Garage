"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { publicPost } from "@/lib/api";
import {
  Wrench,
  Wind,
  CircleDot,
  Paintbrush,
  Battery,
  CalendarClock,
  ChevronRight,
  ChevronLeft,
  Check,
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Truck,
  Home,
  ArrowLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static data                                                       */
/* ------------------------------------------------------------------ */

const services = [
  {
    id: "general",
    title: "General Service",
    description: "Complete car checkup with oil change, filter replacement, and fluid top-up",
    icon: Wrench,
    price: "2,499 - 4,999",
  },
  {
    id: "ac",
    title: "AC Service & Repair",
    description: "AC gas top-up, cooling check, vent cleaning, and compressor inspection",
    icon: Wind,
    price: "1,499 - 5,499",
  },
  {
    id: "wheel",
    title: "Wheel & Tyre Care",
    description: "Wheel alignment, balancing, tyre rotation, and puncture repair",
    icon: CircleDot,
    price: "999 - 3,999",
  },
  {
    id: "denting",
    title: "Denting & Painting",
    description: "Scratch removal, dent repair, panel painting, and full body polish",
    icon: Paintbrush,
    price: "2,999 - 14,999",
  },
  {
    id: "battery",
    title: "Battery Service",
    description: "Battery health check, replacement, terminal cleaning, and jump start",
    icon: Battery,
    price: "499 - 6,999",
  },
  {
    id: "periodic",
    title: "Periodic Maintenance",
    description: "Scheduled maintenance as per manufacturer guidelines with genuine parts",
    icon: CalendarClock,
    price: "3,499 - 8,999",
  },
];

const brands = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata",
  "Honda",
  "Toyota",
  "Mahindra",
  "Kia",
  "Volkswagen",
  "Skoda",
  "BMW",
  "Mercedes",
  "Audi",
];

const fuelTypes = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];

const timeSlots = {
  Morning: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"],
  Afternoon: ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"],
  Evening: ["4:00 PM", "5:00 PM", "6:00 PM"],
};

const stepLabels = [
  "Service",
  "Vehicle",
  "Date & Time",
  "Details",
  "Confirm",
];

/* ------------------------------------------------------------------ */
/*  Helper: next 7 days                                               */
/* ------------------------------------------------------------------ */

function getNext7Days(): { date: Date; dayName: string; dateStr: string; label: string }[] {
  const days: { date: Date; dayName: string; dateStr: string; label: string }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dayName: dayNames[d.getDay()],
      dateStr: d.toISOString().split("T")[0],
      label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
    });
  }
  return days;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BookServicePage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedService, setSelectedService] = useState("");

  // Step 2
  const [regNumber, setRegNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [year, setYear] = useState("");

  // Step 3
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Step 4
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [concerns, setConcerns] = useState("");
  const [pickDrop, setPickDrop] = useState(false);

  // Step 5
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingIdFromApi, setBookingIdFromApi] = useState("");

  const next7Days = useMemo(() => getNext7Days(), []);

  /* Validation per step */
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedService !== "";
      case 2:
        return regNumber.trim() !== "" && brand !== "" && model.trim() !== "" && fuelType !== "" && year.trim() !== "";
      case 3:
        return selectedDate !== "" && selectedTime !== "";
      case 4:
        return name.trim() !== "" && phone.trim().length >= 10;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await publicPost<{ bookingId: string }>("/api/bookings", {
        service: selectedService,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        address: address || undefined,
        vehicleRegNumber: regNumber,
        vehicleBrand: brand,
        vehicleModel: model,
        vehicleFuelType: fuelType,
        vehicleYear: year,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        concerns: concerns || undefined,
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

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const selectedDateObj = next7Days.find((d) => d.dateStr === selectedDate);

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const inputClasses =
    "w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const selectClasses =
    "w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer";

  return (
    <div className="flex flex-col min-h-screen bg-background page-gradient">
      <Navbar />

      <main className="relative z-10 flex-1 pt-16">
        {/* Breadcrumb + Header */}
        <div className="bg-dim/80 backdrop-blur-sm border-b border-edge">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <nav className="flex items-center gap-2 text-sm text-muted mb-3">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Book a Service</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Book a Service
            </h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="glass-bg border-b border-edge">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;

                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-sm font-semibold transition-all duration-300 ${
                          isCompleted
                            ? "bg-primary text-white"
                            : isActive
                            ? "bg-primary text-white ring-4 ring-primary/20"
                            : "bg-dim border-2 border-edge text-muted"
                        }`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                      </div>
                      <span
                        className={`text-xs font-medium hidden sm:block transition-colors ${
                          isActive || isCompleted ? "text-primary" : "text-muted"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < stepLabels.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors duration-300 ${
                          step > stepNum ? "bg-primary" : "bg-edge"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* ---- Step 1: Select Service ---- */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                Select a Service
              </h2>
              <p className="text-sm text-secondary mb-6">
                Choose the type of service your car needs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedService === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.id)}
                      className={`relative flex flex-col items-start p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer group hover:shadow-lg hover:-translate-y-1 glass-card-premium ${
                        isSelected
                          ? "border-primary bg-primary-light shadow-sm"
                          : "border-edge bg-background hover:border-primary/40"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div
                        className={`flex items-center justify-center h-11 w-11 rounded-lg mb-3 transition-colors ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-dim text-primary group-hover:bg-primary-light"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {service.title}
                      </h3>
                      <p className="text-xs text-secondary leading-relaxed">
                        {service.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Step 2: Vehicle Details ---- */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                Vehicle Details
              </h2>
              <p className="text-sm text-secondary mb-6">
                Tell us about your vehicle so we can serve you better.
              </p>

              <div className="max-w-lg space-y-5">
                {/* Registration Number */}
                <div>
                  <label htmlFor="regNumber" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Car className="h-4 w-4 text-muted" />
                    Vehicle Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="regNumber"
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    placeholder="e.g., TS 09 AB 1234"
                    className={inputClasses}
                  />
                </div>

                {/* Brand */}
                <div>
                  <label htmlFor="brand" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Car className="h-4 w-4 text-muted" />
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label htmlFor="model" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Car className="h-4 w-4 text-muted" />
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., Swift, Creta, Nexon"
                    className={inputClasses}
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <label htmlFor="fuelType" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <CircleDot className="h-4 w-4 text-muted" />
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="fuelType"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">Select Fuel Type</option>
                      {fuelTypes.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label htmlFor="year" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <CalendarClock className="h-4 w-4 text-muted" />
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="year"
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g., 2022"
                    maxLength={4}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- Step 3: Pick Date & Time ---- */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                Pick Date & Time
              </h2>
              <p className="text-sm text-secondary mb-6">
                Choose a convenient date and time slot for your service.
              </p>

              {/* Date Cards */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-muted" />
                  Select Date
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
                  {next7Days.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-edge bg-background text-foreground hover:border-primary/40 hover:bg-primary-light"
                        }`}
                      >
                        <span className={`text-xs font-medium ${isSelected ? "text-white/70" : "text-muted"}`}>
                          {day.dayName}
                        </span>
                        <span className="text-lg font-bold mt-0.5">{day.date.getDate()}</span>
                        <span className={`text-xs ${isSelected ? "text-white/70" : "text-secondary"}`}>
                          {day.label.split(" ")[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted" />
                  Select Time Slot
                </h3>
                <div className="space-y-5">
                  {Object.entries(timeSlots).map(([period, slots]) => (
                    <div key={period}>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                        {period}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary text-white shadow-sm"
                                  : "border-edge bg-background text-foreground hover:border-primary/40 hover:bg-primary-light"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- Step 4: Your Details ---- */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                Your Details
              </h2>
              <p className="text-sm text-secondary mb-6">
                Provide your contact information so we can reach you.
              </p>

              <div className="max-w-lg space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="customerName" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <User className="h-4 w-4 text-muted" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClasses}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="customerPhone" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Phone className="h-4 w-4 text-muted" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-edge bg-dim text-sm text-secondary font-medium">
                      +91
                    </span>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="flex-1 px-4 py-2.5 rounded-r-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="customerEmail" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Mail className="h-4 w-4 text-muted" />
                    Email Address <span className="text-muted text-xs">(optional)</span>
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClasses}
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="customerAddress" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <MapPin className="h-4 w-4 text-muted" />
                    Address / Location
                  </label>
                  <textarea
                    id="customerAddress"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Your address or locality"
                    rows={2}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                {/* Concerns */}
                <div>
                  <label htmlFor="concerns" className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <MessageSquare className="h-4 w-4 text-muted" />
                    Any specific concerns?
                  </label>
                  <textarea
                    id="concerns"
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    placeholder="e.g., strange noise from engine, AC not cooling, etc."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                {/* Pick & Drop Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-edge bg-dim">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-light text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Pick & Drop Service
                      </p>
                      <p className="text-xs text-muted">
                        We will pick up and deliver your car
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pickDrop}
                    onClick={() => setPickDrop(!pickDrop)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      pickDrop ? "bg-primary" : "bg-edge"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        pickDrop ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- Step 5: Confirmation ---- */}
          {step === 5 && !confirmed && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                Review & Confirm
              </h2>
              <p className="text-sm text-secondary mb-6">
                Please review your booking details before confirming.
              </p>

              <div className="max-w-2xl space-y-4">
                {/* Service */}
                <div className="rounded-xl glass-card-premium p-5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
                    Service
                  </h3>
                  <div className="flex items-center gap-3">
                    {selectedServiceData && (
                      <>
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-light text-primary">
                          <selectedServiceData.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {selectedServiceData.title}
                          </p>
                          <p className="text-xs text-secondary">
                            {selectedServiceData.description}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Vehicle */}
                <div className="rounded-xl glass-card-premium p-5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
                    Vehicle
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted text-xs">Registration</span>
                      <p className="font-medium text-foreground">{regNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted text-xs">Brand & Model</span>
                      <p className="font-medium text-foreground">
                        {brand} {model}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted text-xs">Fuel Type</span>
                      <p className="font-medium text-foreground">{fuelType}</p>
                    </div>
                    <div>
                      <span className="text-muted text-xs">Year</span>
                      <p className="font-medium text-foreground">{year}</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="rounded-xl glass-card-premium p-5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
                    Date & Time
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {selectedDateObj
                          ? `${selectedDateObj.dayName}, ${selectedDateObj.label}`
                          : selectedDate}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-edge" />
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{selectedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="rounded-xl glass-card-premium p-5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted text-xs">Name</span>
                      <p className="font-medium text-foreground">{name}</p>
                    </div>
                    <div>
                      <span className="text-muted text-xs">Phone</span>
                      <p className="font-medium text-foreground">+91 {phone}</p>
                    </div>
                    {email && (
                      <div>
                        <span className="text-muted text-xs">Email</span>
                        <p className="font-medium text-foreground">{email}</p>
                      </div>
                    )}
                    {address && (
                      <div>
                        <span className="text-muted text-xs">Address</span>
                        <p className="font-medium text-foreground">{address}</p>
                      </div>
                    )}
                    {concerns && (
                      <div className="col-span-2">
                        <span className="text-muted text-xs">Concerns</span>
                        <p className="font-medium text-foreground">{concerns}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted text-xs">Pick & Drop</span>
                      <p className="font-medium text-foreground">
                        {pickDrop ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estimated Price */}
                <div className="rounded-xl border-2 border-primary/30 bg-primary-light p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
                        Estimated Price
                      </h3>
                      <p className="text-xs text-secondary">
                        Final price will be confirmed after inspection
                      </p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {selectedServiceData ? `\u20B9${selectedServiceData.price}` : "\u20B92,499 - 4,999"}
                    </p>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer ${
                    submitting ? "bg-primary/70 text-white cursor-not-allowed" : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Confirm Booking
                    </>
                  )}
                </button>

                {submitError && (
                  <p className="text-sm text-red-500 text-center mt-3">{submitError}</p>
                )}
              </div>
            </div>
          )}

          {/* ---- Navigation Buttons (Steps 1-4) ---- */}
          {step < 5 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-edge">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  step === 1
                    ? "text-muted cursor-not-allowed"
                    : "text-secondary border border-edge hover:bg-hover hover:text-foreground cursor-pointer"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  canProceed()
                    ? "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                    : "bg-edge text-muted cursor-not-allowed"
                }`}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ---- Step 5 Back button only ---- */}
          {step === 5 && !confirmed && (
            <div className="flex items-center mt-6 pt-6 border-t border-edge max-w-2xl">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-secondary border border-edge hover:bg-hover hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      {confirmed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative mx-4 w-full max-w-md glass-card-premium rounded-2xl p-8 sm:p-10 text-center animate-scale-in">
            {/* Animated Checkmark */}
            <div className="mx-auto mb-6 flex items-center justify-center h-20 w-20 rounded-full bg-primary-light">
              <svg
                className="h-10 w-10 text-primary"
                viewBox="0 0 52 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="26"
                  cy="26"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  style={{
                    strokeDasharray: 151,
                    strokeDashoffset: 151,
                    animation: "circle-draw 0.6s ease-out forwards",
                  }}
                />
                <path
                  d="M15 27l7 7 15-15"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{
                    strokeDasharray: 40,
                    strokeDashoffset: 40,
                    animation: "check-draw 0.4s ease-out 0.5s forwards",
                  }}
                />
              </svg>
              <style>{`
                @keyframes circle-draw {
                  to { stroke-dashoffset: 0; }
                }
                @keyframes check-draw {
                  to { stroke-dashoffset: 0; }
                }
              `}</style>
            </div>

            <h3 className="text-2xl font-bold text-foreground">
              Booking Confirmed!
            </h3>
            <p className="mt-3 text-secondary text-sm sm:text-base leading-relaxed">
              You will receive a confirmation shortly.
            </p>

            <div className="mt-5 px-4 py-3 rounded-lg bg-dim border border-edge">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">
                Booking ID
              </p>
              <p className="text-lg font-bold text-primary font-mono tracking-wider">
                {bookingIdFromApi || "Pending"}
              </p>
            </div>

            <div className="mt-4 px-4 py-3 rounded-lg bg-dim border border-edge text-left">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted">Service</span>
                  <p className="font-medium text-foreground">{selectedServiceData?.title}</p>
                </div>
                <div>
                  <span className="text-muted">Vehicle</span>
                  <p className="font-medium text-foreground">{brand} {model}</p>
                </div>
                <div>
                  <span className="text-muted">Date</span>
                  <p className="font-medium text-foreground">
                    {selectedDateObj ? `${selectedDateObj.dayName}, ${selectedDateObj.label}` : selectedDate}
                  </p>
                </div>
                <div>
                  <span className="text-muted">Time</span>
                  <p className="font-medium text-foreground">{selectedTime}</p>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white text-base font-semibold rounded-lg transition-all duration-200 hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
