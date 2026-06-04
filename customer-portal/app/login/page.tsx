"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AtmosphericBackground from "@/components/AtmosphericBackground";
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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

    // Auto-focus next input
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
    // Focus the input after the last pasted digit
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

      // Guard: ensure required auth fields are present before proceeding
      if (!data?.userId || !data?.accessToken) {
        setError("Login failed. Unexpected response from server. Please try again.");
        return;
      }

      setAuth({
        user: { id: data.userId, name: data.name || "", phone: data.phone || phoneNumber, role: (data.role as "customer" | "vendor") || role },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || "",
      });
      // Redirect based on role
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

  /* Spinner SVG reusable */
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
    <div className="relative min-h-screen flex flex-col grain">
      <AtmosphericBackground />
      <Navbar />

      <main className="flex-1 pt-24 flex items-center justify-center px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Card */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === "customer"
                    ? "text-red-500 border-b-2 border-red-500 bg-red-500/10"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-glass)]"
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
                    ? "text-red-500 border-b-2 border-red-500 bg-red-500/10"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-glass)]"
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
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white mb-4 shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)]">
                  {activeTab === "customer" ? (
                    <User className="h-7 w-7" />
                  ) : (
                    <Building2 className="h-7 w-7" />
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                  {activeTab === "customer" ? "Welcome Back" : "Vendor Login"}
                </h1>
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
                        <Phone className="h-4 w-4 text-[var(--text-muted)]" />
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
                          className="flex-1 px-4 py-3 rounded-r-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
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
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        phoneNumber.trim().length >= 10 && !sendingOtp
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(220,38,38,0.6)] active:scale-[0.98] cursor-pointer"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
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

                    <p className="text-center text-xs text-[var(--text-muted)] leading-relaxed">
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
                    {/* Back to phone */}
                    <button
                      type="button"
                      onClick={handleBackToPhone}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
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
                      <p className="text-xs text-[var(--text-muted)]">
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
                          className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold rounded-xl border-2 bg-[var(--bg-glass)] text-[var(--text-primary)] transition-all duration-200 outline-none ${
                            digit
                              ? "border-red-500 bg-red-500/10 shadow-[0_0_12px_-3px_rgba(220,38,38,0.3)]"
                              : "border-[var(--border-color)] focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
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
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        isOtpComplete && !verifying
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_14px_36px_-10px_rgba(220,38,38,0.6)] active:scale-[0.98] cursor-pointer"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
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
                        <p className="text-xs text-[var(--text-muted)]">
                          Resend OTP in{" "}
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {resendTimer}s
                          </span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs text-red-500 font-medium hover:text-red-400 transition-colors cursor-pointer underline underline-offset-2"
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
            <p className="text-sm text-[var(--text-muted)] mb-3">New here?</p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
              >
                <Wrench className="h-4 w-4" />
                Book a Service
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <span className="w-px h-4 bg-[var(--border-color)]" />
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
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
