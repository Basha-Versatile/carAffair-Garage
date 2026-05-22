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
  FileText,
  MapPin,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const benefits = [
  "Get discovered by thousands of car owners",
  "Manage bookings & invoices digitally",
  "Access inventory and billing tools",
  "Track service reminders automatically",
  "Dedicated support team for your garage",
];

export default function RegisterGaragePage() {
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [garageName, setGarageName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");

  const isFieldInvalid = (value: string) => {
    if (!attempted) return false;
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
      !email.trim()
    ) {
      return;
    }

    if (phone.trim().length !== 10 || !/^\d{10}$/.test(phone.trim())) {
      setSubmitError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await publicPost("/api/garage-registrations", {
        name: garageName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim() || undefined,
        address: address.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit registration. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background page-gradient">
      <Navbar />

      <main className="relative z-10 flex-1 pt-16">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          {/* Left Info Panel */}
          <div className="relative lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-[#E63946] to-[#9B1B24] text-white px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20 xl:px-16 flex flex-col justify-center overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 -right-16 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-5xl font-bold leading-tight tracking-tight animate-slide-up">
                Register Your
                <br />
                Garage
              </h1>
              <p className="mt-4 text-base sm:text-lg text-red-100 leading-relaxed animate-slide-up [animation-delay:100ms]">
                Join Car Affair and grow your business with our digital garage
                management platform.
              </p>

              <ul className="mt-8 space-y-4 animate-slide-up [animation-delay:200ms]">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-red-300 shrink-0" />
                    <span className="text-sm sm:text-base text-red-50 leading-snug">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex gap-4 animate-slide-up [animation-delay:300ms]">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
                  <div className="text-2xl sm:text-3xl font-bold">500+</div>
                  <div className="text-sm text-red-200 mt-1">
                    Registered Garages
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
                  <div className="text-2xl sm:text-3xl font-bold">50,000+</div>
                  <div className="text-sm text-red-200 mt-1">
                    Customers Served
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 animate-slide-up [animation-delay:400ms]">
                <p className="text-sm sm:text-base italic text-red-100 leading-relaxed">
                  &ldquo;Car Affair helped us digitize our entire garage
                  operations in just one week.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center text-sm font-semibold">
                    SK
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Suresh Kumar
                    </div>
                    <div className="text-xs text-red-200">
                      Kumar Auto Works
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="flex-1 px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-xl mx-auto lg:mx-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight animate-fade-in">
                Register Your Garage
              </h2>
              <p className="mt-2 text-secondary text-sm sm:text-base animate-fade-in [animation-delay:100ms]">
                Fill in the details below and our team will review your request.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-6 animate-fade-in [animation-delay:200ms]"
              >
                {/* Garage Name */}
                <div>
                  <label
                    htmlFor="garageName"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <Building2 className="h-4 w-4 text-muted" />
                    Garage Name <span className="text-red-500">*</span>
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

                {/* GST Number */}
                <div>
                  <label
                    htmlFor="gstNumber"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <FileText className="h-4 w-4 text-muted" />
                    GST Number
                  </label>
                  <input
                    id="gstNumber"
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g., 29ABCDE1234F1Z5"
                    className="w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                  >
                    <MapPin className="h-4 w-4 text-muted" />
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Complete garage address"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                {/* Submit Error */}
                {submitError && (
                  <p className="text-sm text-red-500 text-center">
                    {submitError}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] ${
                    submitting
                      ? "bg-primary/70 text-white cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-hover cursor-pointer"
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Registration
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Login Link */}
                <p className="text-center text-sm text-muted">
                  Already registered?{" "}
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
          <div className="relative mx-4 w-full max-w-md glass-card-premium rounded-2xl p-8 sm:p-10 text-center animate-scale-in">
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
              Registration Submitted!
            </h3>
            <p className="mt-3 text-secondary text-sm sm:text-base leading-relaxed">
              Thank you for registering. Our team will review your request and
              notify you via email within 24-48 hours.
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
