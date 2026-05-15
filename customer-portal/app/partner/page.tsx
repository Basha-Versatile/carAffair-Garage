"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pt-16">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          {/* Left Info Panel */}
          <div className="relative lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-primary to-green-800 text-white px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20 xl:px-16 flex flex-col justify-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 -right-16 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-5xl font-bold leading-tight tracking-tight animate-slide-up">
                Partner With
                <br />
                Car Affair
              </h1>
              <p className="mt-4 text-base sm:text-lg text-green-100 leading-relaxed animate-slide-up [animation-delay:100ms]">
                Join our growing network of trusted garages and take your
                business to the next level.
              </p>

              {/* Benefits List */}
              <ul className="mt-8 space-y-4 animate-slide-up [animation-delay:200ms]">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-300 shrink-0" />
                    <span className="text-sm sm:text-base text-green-50 leading-snug">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="mt-10 flex gap-8 animate-slide-up [animation-delay:300ms]">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold">500+</div>
                  <div className="text-sm text-green-200 mt-1">
                    Partner Garages
                  </div>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <div className="text-2xl sm:text-3xl font-bold">10,000+</div>
                  <div className="text-sm text-green-200 mt-1">
                    Monthly Bookings
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-10 border-l-2 border-green-300/50 pl-5 animate-slide-up [animation-delay:400ms]">
                <p className="text-sm sm:text-base italic text-green-100 leading-relaxed">
                  &ldquo;Car Affair helped us grow our customer base by 3x in
                  just 6 months.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-green-600 flex items-center justify-center text-sm font-semibold">
                    RK
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Rajesh Kumar
                    </div>
                    <div className="text-xs text-green-200">
                      AutoCare Garage
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="flex-1 px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20 bg-background overflow-y-auto">
            <div className="max-w-xl mx-auto lg:mx-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight animate-fade-in">
                Register Your Garage
              </h2>
              <p className="mt-2 text-secondary text-sm sm:text-base animate-fade-in [animation-delay:100ms]">
                Fill in the details below and our team will get in touch.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-6 animate-fade-in [animation-delay:200ms]"
              >
                {/* Garage/Company Name */}
                <div>
                  <label
                    htmlFor="garageName"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Building2 className="h-4 w-4 text-muted" />
                    Garage/Company Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="garageName"
                    type="text"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="e.g., AutoCare Garage"
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                      isFieldInvalid(garageName)
                        ? "border-red-500"
                        : "border-edge"
                    }`}
                  />
                  {isFieldInvalid(garageName) && (
                    <p className="mt-1 text-xs text-red-500">
                      Garage name is required.
                    </p>
                  )}
                </div>

                {/* Owner Name */}
                <div>
                  <label
                    htmlFor="ownerName"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <User className="h-4 w-4 text-muted" />
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Full name"
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                      isFieldInvalid(ownerName)
                        ? "border-red-500"
                        : "border-edge"
                    }`}
                  />
                  {isFieldInvalid(ownerName) && (
                    <p className="mt-1 text-xs text-red-500">
                      Owner name is required.
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Phone className="h-4 w-4 text-muted" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-edge bg-dim text-sm text-secondary font-medium">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className={`flex-1 px-4 py-2.5 rounded-r-lg border bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                        isFieldInvalid(phone)
                          ? "border-red-500"
                          : "border-edge"
                      }`}
                    />
                  </div>
                  {isFieldInvalid(phone) && (
                    <p className="mt-1 text-xs text-red-500">
                      Phone number is required.
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Mail className="h-4 w-4 text-muted" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="garage@example.com"
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                      isFieldInvalid(email)
                        ? "border-red-500"
                        : "border-edge"
                    }`}
                  />
                  {isFieldInvalid(email) && (
                    <p className="mt-1 text-xs text-red-500">
                      Email address is required.
                    </p>
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <label
                    htmlFor="experience"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Clock className="h-4 w-4 text-muted" />
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
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                      isFieldInvalid(experience)
                        ? "border-red-500"
                        : "border-edge"
                    }`}
                  />
                  {isFieldInvalid(experience) && (
                    <p className="mt-1 text-xs text-red-500">
                      Years of experience is required.
                    </p>
                  )}
                </div>

                {/* Specialties */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-3">
                    <Wrench className="h-4 w-4 text-muted" />
                    Specialties <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {specialtyOptions.map((specialty) => {
                      const checked = specialties.includes(specialty);
                      return (
                        <label
                          key={specialty}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors duration-200 select-none ${
                            checked
                              ? "border-primary bg-primary-light text-primary font-medium"
                              : "border-edge bg-background text-secondary hover:bg-hover"
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
                                ? "bg-primary border-primary text-white"
                                : "border-muted bg-background"
                            }`}
                          >
                            {checked && (
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
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
                    <p className="mt-1.5 text-xs text-red-500">
                      Please select at least one specialty.
                    </p>
                  )}
                </div>

                {/* Service Area / Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <MapPin className="h-4 w-4 text-muted" />
                    Service Area / Location{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Banjara Hills, Hyderabad"
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                      isFieldInvalid(location)
                        ? "border-red-500"
                        : "border-edge"
                    }`}
                  />
                  {isFieldInvalid(location) && (
                    <p className="mt-1 text-xs text-red-500">
                      Service area is required.
                    </p>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  <label
                    htmlFor="fullAddress"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <MapPin className="h-4 w-4 text-muted" />
                    Full Address
                  </label>
                  <textarea
                    id="fullAddress"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Complete workshop address"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                {/* Number of Bays/Lifts */}
                <div>
                  <label
                    htmlFor="bays"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Building2 className="h-4 w-4 text-muted" />
                    Number of Bays/Lifts
                  </label>
                  <input
                    id="bays"
                    type="number"
                    min="0"
                    value={bays}
                    onChange={(e) => setBays(e.target.value)}
                    placeholder="e.g., 4"
                    className="w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label
                    htmlFor="certifications"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Award className="h-4 w-4 text-muted" />
                    Any Certifications
                  </label>
                  <input
                    id="certifications"
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="e.g., Maruti Authorized, Bosch Car Service"
                    className="w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                          ? "bg-primary border-primary text-white"
                          : isFieldInvalid(agreedTerms)
                          ? "border-red-500 bg-background"
                          : "border-edge bg-background group-hover:border-muted"
                      }`}
                    >
                      {agreedTerms && (
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
                          : "text-secondary"
                      }`}
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary underline underline-offset-2 hover:text-primary-hover"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/partner-agreement"
                        className="text-primary underline underline-offset-2 hover:text-primary-hover"
                      >
                        Partner Agreement
                      </Link>
                    </span>
                  </label>
                  {isFieldInvalid(agreedTerms) && (
                    <p className="mt-1 text-xs text-red-500">
                      You must agree to the terms to continue.
                    </p>
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
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] ${
                    submitting ? "bg-primary/70 text-white cursor-not-allowed" : "bg-primary text-white hover:bg-primary-hover cursor-pointer"
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
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
                <p className="text-center text-sm text-muted">
                  Already a partner?{" "}
                  <Link
                    href="/login"
                    className="text-primary font-medium hover:text-primary-hover underline underline-offset-2"
                  >
                    Login here
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Overlay/Modal */}
      {submitted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative mx-4 w-full max-w-md bg-background rounded-2xl shadow-2xl p-8 sm:p-10 text-center animate-scale-in">
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
                  className="animate-[circle-draw_0.6s_ease-out_forwards]"
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
              Application Submitted!
            </h3>
            <p className="mt-3 text-secondary text-sm sm:text-base leading-relaxed">
              Thank you for registering. Our team will review your application
              and get back to you within 24-48 hours.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white text-base font-semibold rounded-lg transition-all duration-200 hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
