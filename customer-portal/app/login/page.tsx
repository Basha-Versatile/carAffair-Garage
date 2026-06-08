"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { publicPost } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import {
  Phone,
  ShieldCheck,
  Wrench,
  User,
  Building2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"customer" | "partner">("customer");

  // OTP flow state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");

  // Reset flow when tab changes
  useEffect(() => {
    setPhoneNumber("");
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setResendTimer(0);
    setVerifying(false);
    setError("");
  }, [activeTab]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (phoneNumber.trim().length < 10) return;
    setSendingOtp(true);
    setError("");
    try {
      const role = activeTab === "customer" ? "customer" : "vendor";
      await publicPost("/api/auth/send-otp", { phone: phoneNumber, role });
      setOtpSent(true);
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    try {
      const role = activeTab === "customer" ? "customer" : "vendor";
      await publicPost("/api/auth/send-otp", { phone: phoneNumber, role });
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    const nextInput = document.getElementById(`otp-${focusIndex}`);
    nextInput?.focus();
  };

  const handleVerifyOtp = async () => {
    if (otp.join("").length < 6) return;
    setVerifying(true);
    setError("");
    try {
      const role = activeTab === "customer" ? "customer" : "vendor";
      const data = await publicPost<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        name: string;
        phone: string;
        role: string;
      }>("/api/auth/verify-otp", { phone: phoneNumber, otp: otp.join(""), role });

      if (!data?.userId || !data?.accessToken) {
        setError("Login failed. Unexpected response from server. Please try again.");
        return;
      }

      setAuth({
        user: { id: data.userId, name: data.name || "", phone: data.phone || phoneNumber, role: (data.role as "customer" | "vendor") || role },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || "",
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setResendTimer(0);
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const Spinner = () => (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[var(--crank-black)] pt-28 pb-14">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="section-tag text-white/60 mb-3">Account Access</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-montserrat)]">
            Login to Your Account
          </h1>
          <p className="mt-3 text-white/50 text-sm max-w-md mx-auto">
            Access your bookings, service history, and more
          </p>
        </div>
      </section>

      <main className="flex-1 flex items-start justify-center px-4 py-12 sm:py-16 bg-[var(--bg-secondary)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md -mt-8"
        >
          {/* Card */}
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === "customer"
                    ? "text-[var(--crank-red)] border-b-2 border-[var(--crank-red)] bg-[var(--crank-red)]/5"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <User className="h-4 w-4" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("partner")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === "partner"
                    ? "text-[var(--crank-red)] border-b-2 border-[var(--crank-red)] bg-[var(--crank-red)]/5"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Vendor
              </button>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-xl bg-[var(--crank-red)] text-white mb-4">
                  {activeTab === "customer" ? (
                    <User className="h-7 w-7" />
                  ) : (
                    <Building2 className="h-7 w-7" />
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
                  {activeTab === "customer" ? "Welcome Back" : "Vendor Login"}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {activeTab === "customer"
                    ? "Login to manage your bookings and service history"
                    : "Login to your vendor dashboard"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {/* Phone Input Phase */}
                {!otpSent && (
                  <motion.div
                    key="phone-phase"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="loginPhone"
                        className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] mb-1.5"
                      >
                        <Phone className="h-4 w-4 text-[var(--text-tertiary)]" />
                        Phone Number
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] font-medium">
                          +91
                        </span>
                        <input
                          id="loginPhone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 10) setPhoneNumber(val);
                          }}
                          placeholder="Enter your mobile number"
                          maxLength={10}
                          className="form-input flex-1 !rounded-l-none !rounded-r-lg"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendOtp();
                          }}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phoneNumber.trim().length < 10 || sendingOtp}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        phoneNumber.trim().length >= 10 && !sendingOtp
                          ? "btn-primary !w-full justify-center"
                          : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border-color)]"
                      }`}
                    >
                      {sendingOtp ? (
                        <>
                          <Spinner />
                          Sending...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Send OTP
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-[var(--text-tertiary)] leading-relaxed">
                      We will send a 6-digit verification code to your phone number via SMS.
                    </p>
                  </motion.div>
                )}

                {/* OTP Verification Phase */}
                {otpSent && (
                  <motion.div
                    key="otp-phase"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <button
                      type="button"
                      onClick={handleBackToPhone}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--crank-red)] transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change number
                    </button>

                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-1">
                        OTP sent to{" "}
                        <span className="font-semibold text-[var(--text-primary)]">
                          +91 {phoneNumber}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Enter the 6-digit code below
                      </p>
                    </div>

                    {/* OTP Input Boxes */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold rounded-lg border-2 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-200 outline-none ${
                            digit
                              ? "border-[var(--crank-red)] bg-[var(--crank-red)]/5"
                              : "border-[var(--border-color)] focus:border-[var(--crank-red)] focus:ring-2 focus:ring-[var(--crank-red)]/20"
                          }`}
                        />
                      ))}
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* Verify Button */}
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={!isOtpComplete || verifying}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        isOtpComplete && !verifying
                          ? "btn-primary !w-full justify-center"
                          : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border-color)]"
                      }`}
                    >
                      {verifying ? (
                        <>
                          <Spinner />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify & Login
                        </>
                      )}
                    </button>

                    {/* Resend */}
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Resend OTP in{" "}
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {resendTimer}s
                          </span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs text-[var(--crank-red)] font-medium hover:text-[var(--crank-red)]/80 transition-colors cursor-pointer underline underline-offset-2"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Below Card Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-[var(--text-tertiary)] mb-3">New here?</p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--crank-red)] hover:text-[var(--crank-red-dark)] transition-colors"
              >
                <Wrench className="h-4 w-4" />
                Book a Service
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <span className="w-px h-4 bg-[var(--border-color)]" />
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--crank-red)] hover:text-[var(--crank-red-dark)] transition-colors"
              >
                <Building2 className="h-4 w-4" />
                Become a Vendor
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
