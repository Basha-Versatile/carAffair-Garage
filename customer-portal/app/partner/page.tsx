"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { publicPost } from "@/lib/api";
import {
  Building2,
  User,
  Phone,
  Mail,
  Clock,
  MapPin,
  Award,
  CheckCircle2,
  Wrench,
  ChevronRight,
} from "lucide-react";

const specialtyOptions = [
  "General Service",
  "AC Service",
  "Wheel & Tyre",
  "Denting & Painting",
  "Battery",
  "Electrical",
  "Engine Work",
  "Body Work",
];

const benefits = [
  "Get discovered by thousands of car owners",
  "Manage appointments and jobs easily",
  "Grow your business with digital presence",
  "Access to inventory and billing tools",
  "Dedicated support team",
];

/* shared input classes */
const inputBase =
  "w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-glass)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50";
const inputBorder = "border-[var(--border-color)]";
const inputError = "border-red-500";
const labelBase = "flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] mb-1.5";

export default function PartnerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [garageName, setGarageName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [bays, setBays] = useState("");
  const [certifications, setCertifications] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const isFieldInvalid = (value: string | string[] | boolean) => {
    if (!attempted) return false;
    if (typeof value === "boolean") return !value;
    if (Array.isArray(value)) return value.length === 0;
    return value.trim() === "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setSubmitError("");

    if (
      !garageName.trim() ||
      !ownerName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !experience.trim() ||
      specialties.length === 0 ||
      !location.trim() ||
      !agreedTerms
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await publicPost("/api/vendors/register", {
        garageName: garageName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        experience: parseInt(experience) || 0,
        specialties,
        location: location.trim(),
        fullAddress: fullAddress.trim() || undefined,
        bays: bays ? parseInt(bays) : undefined,
        certifications: certifications.trim() || undefined,
      });
      // Guard: publicPost resolves means success=true; treat any falsy data gracefully
      if (result === undefined || result === null) {
        // API returned success but empty data — still treat as submitted
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="relative min-h-screen flex flex-col grain">
      <AtmosphericBackground />
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 flex-1 pt-16">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          {/* Left Info Panel */}
          <div className="relative lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-red-600 to-red-900 text-white px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20 xl:px-16 flex flex-col justify-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 -right-16 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-5xl font-bold leading-tight tracking-tight"
              >
                Become a Vendor With
                <br />
                Car Affair
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-base sm:text-lg text-red-100 leading-relaxed"
              >
                Join our growing network of trusted garages and take your
                business to the next level.
              </motion.p>

              {/* Benefits List */}
              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 space-y-4"
              >
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-red-300 shrink-0" />
                    <span className="text-sm sm:text-base text-red-50 leading-snug">
                      {benefit}
                    </span>
                  </li>
                ))}
              </motion.ul>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex gap-4"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
                  <div className="text-2xl sm:text-3xl font-bold">500+</div>
                  <div className="text-sm text-red-200 mt-1">
                    Partner Garages
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
                  <div className="text-2xl sm:text-3xl font-bold">10,000+</div>
                  <div className="text-sm text-red-200 mt-1">
                    Monthly Bookings
                  </div>
                </div>
              </motion.div>

              {/* Testimonial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"
              >
                <p className="text-sm sm:text-base italic text-red-100 leading-relaxed">
                  &ldquo;Car Affair helped us grow our customer base by 3x in
                  just 6 months.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center text-sm font-semibold">
                    RK
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Rajesh Kumar
                    </div>
                    <div className="text-xs text-red-200">
                      AutoCare Garage
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="flex-1 px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20 bg-[var(--bg-primary)]/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-xl mx-auto lg:mx-0">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight"
              >
                Register Your Garage
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base"
              >
                Fill in the details below and our team will get in touch.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-6"
              >
                {/* Garage/Company Name */}
                <div>
                  <label htmlFor="garageName" className={labelBase}>
                    <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
                    Garage/Company Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="garageName"
                    type="text"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="e.g., AutoCare Garage"
                    className={`${inputBase} ${isFieldInvalid(garageName) ? inputError : inputBorder}`}
                  />
                  {isFieldInvalid(garageName) && (
                    <p className="mt-1 text-xs text-red-500">Garage name is required.</p>
                  )}
                </div>

                {/* Owner Name */}
                <div>
                  <label htmlFor="ownerName" className={labelBase}>
                    <User className="h-4 w-4 text-[var(--text-muted)]" />
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Full name"
                    className={`${inputBase} ${isFieldInvalid(ownerName) ? inputError : inputBorder}`}
                  />
                  {isFieldInvalid(ownerName) && (
                    <p className="mt-1 text-xs text-red-500">Owner name is required.</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className={labelBase}>
                    <Phone className="h-4 w-4 text-[var(--text-muted)]" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] font-medium">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className={`flex-1 px-4 py-2.5 rounded-r-xl border bg-[var(--bg-glass)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 ${
                        isFieldInvalid(phone) ? inputError : inputBorder
                      }`}
                    />
                  </div>
                  {isFieldInvalid(phone) && (
                    <p className="mt-1 text-xs text-red-500">Phone number is required.</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className={labelBase}>
                    <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="garage@example.com"
                    className={`${inputBase} ${isFieldInvalid(email) ? inputError : inputBorder}`}
                  />
                  {isFieldInvalid(email) && (
                    <p className="mt-1 text-xs text-red-500">Email address is required.</p>
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <label htmlFor="experience" className={labelBase}>
                    <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                    Years of Experience{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="experience"
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g., 5"
                    className={`${inputBase} ${isFieldInvalid(experience) ? inputError : inputBorder}`}
                  />
                  {isFieldInvalid(experience) && (
                    <p className="mt-1 text-xs text-red-500">Years of experience is required.</p>
                  )}
                </div>

                {/* Specialties */}
                <div>
                  <label className={`${labelBase} mb-3`}>
                    <Wrench className="h-4 w-4 text-[var(--text-muted)]" />
                    Specialties <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {specialtyOptions.map((specialty) => {
                      const checked = specialties.includes(specialty);
                      return (
                        <label
                          key={specialty}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-all duration-200 select-none ${
                            checked
                              ? "border-red-500 bg-red-500/10 text-red-500 font-medium"
                              : `${inputBorder} bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]`
                          } ${
                            isFieldInvalid(specialties) && !checked
                              ? "border-red-300"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSpecialty(specialty)}
                            className="sr-only"
                          />
                          <span
                            className={`flex items-center justify-center h-4 w-4 rounded border shrink-0 transition-colors duration-200 ${
                              checked
                                ? "bg-red-500 border-red-500 text-white"
                                : "border-[var(--text-muted)] bg-[var(--bg-glass)]"
                            }`}
                          >
                            {checked && (
                              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </span>
                          {specialty}
                        </label>
                      );
                    })}
                  </div>
                  {isFieldInvalid(specialties) && (
                    <p className="mt-1.5 text-xs text-red-500">Please select at least one specialty.</p>
                  )}
                </div>

                {/* Service Area / Location */}
                <div>
                  <label htmlFor="location" className={labelBase}>
                    <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                    Service Area / Location{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Banjara Hills, Hyderabad"
                    className={`${inputBase} ${isFieldInvalid(location) ? inputError : inputBorder}`}
                  />
                  {isFieldInvalid(location) && (
                    <p className="mt-1 text-xs text-red-500">Service area is required.</p>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  <label htmlFor="fullAddress" className={labelBase}>
                    <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                    Full Address
                  </label>
                  <textarea
                    id="fullAddress"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Complete workshop address"
                    rows={3}
                    className={`${inputBase} ${inputBorder} resize-none`}
                  />
                </div>

                {/* Number of Bays/Lifts */}
                <div>
                  <label htmlFor="bays" className={labelBase}>
                    <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
                    Number of Bays/Lifts
                  </label>
                  <input
                    id="bays"
                    type="number"
                    min="0"
                    value={bays}
                    onChange={(e) => setBays(e.target.value)}
                    placeholder="e.g., 4"
                    className={`${inputBase} ${inputBorder}`}
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label htmlFor="certifications" className={labelBase}>
                    <Award className="h-4 w-4 text-[var(--text-muted)]" />
                    Any Certifications
                  </label>
                  <input
                    id="certifications"
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="e.g., Maruti Authorized, Bosch Car Service"
                    className={`${inputBase} ${inputBorder}`}
                  />
                </div>

                {/* Terms Checkbox */}
                <div>
                  <label
                    className={`flex items-start gap-3 cursor-pointer select-none group ${
                      isFieldInvalid(agreedTerms) ? "text-red-500" : ""
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center h-5 w-5 mt-0.5 rounded border shrink-0 transition-colors duration-200 ${
                        agreedTerms
                          ? "bg-red-500 border-red-500 text-white"
                          : isFieldInvalid(agreedTerms)
                          ? "border-red-500 bg-[var(--bg-glass)]"
                          : "border-[var(--border-color)] bg-[var(--bg-glass)] group-hover:border-[var(--text-muted)]"
                      }`}
                    >
                      {agreedTerms && (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`text-sm leading-snug ${
                        isFieldInvalid(agreedTerms)
                          ? "text-red-500"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      I agree to the{" "}
                      <Link href="/terms" className="text-red-500 underline underline-offset-2 hover:text-red-400">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/partner-agreement" className="text-red-500 underline underline-offset-2 hover:text-red-400">
                        Vendor Agreement
                      </Link>
                    </span>
                  </label>
                  {isFieldInvalid(agreedTerms) && (
                    <p className="mt-1 text-xs text-red-500">You must agree to the terms to continue.</p>
                  )}
                </div>

                {/* Submit Error */}
                {submitError && (
                  <p className="text-sm text-red-500 text-center">{submitError}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl transition-all duration-200 ${
                    submitting
                      ? "bg-red-600/70 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(220,38,38,0.6)] active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Spinner />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Login Link */}
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Already a vendor?{" "}
                  <Link href="/login" className="text-red-500 font-medium hover:text-red-400 underline underline-offset-2">
                    Login here
                  </Link>
                </p>
              </motion.form>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Overlay/Modal */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative mx-4 w-full max-w-md glass-panel rounded-2xl p-8 sm:p-10 text-center"
            >
              {/* Animated Checkmark */}
              <div className="mx-auto mb-6 flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10">
                <svg
                  className="h-10 w-10 text-red-500"
                  viewBox="0 0 52 52"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="26" cy="26" r="24"
                    stroke="currentColor" strokeWidth="3" fill="none"
                    style={{ strokeDasharray: 151, strokeDashoffset: 151, animation: "circle-draw 0.6s ease-out forwards" }}
                  />
                  <path
                    d="M15 27l7 7 15-15"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                    style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "check-draw 0.4s ease-out 0.5s forwards" }}
                  />
                </svg>
                <style>{`
                  @keyframes circle-draw { to { stroke-dashoffset: 0; } }
                  @keyframes check-draw { to { stroke-dashoffset: 0; } }
                `}</style>
              </div>

              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                Application Submitted!
              </h3>
              <p className="mt-3 text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                Thank you for registering. Our team will review your application
                and get back to you within 24-48 hours.
              </p>

              <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-base font-semibold rounded-xl transition-all duration-200 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(220,38,38,0.6)] active:scale-[0.98]"
              >
                Back to Home
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
