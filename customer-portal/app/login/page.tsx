"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  return (
    <div className="flex flex-col min-h-screen bg-dim page-gradient">
      <Navbar />

      <main className="flex-1 pt-16 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="relative z-10 w-full max-w-md animate-scale-in">
          {/* Card */}
          <div className="glass-card-premium rounded-2xl overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-edge">
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === "customer"
                    ? "text-primary border-b-2 border-primary bg-primary-light/50"
                    : "text-muted hover:text-secondary hover:bg-hover"
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
                    ? "text-primary border-b-2 border-primary bg-primary-light/50"
                    : "text-muted hover:text-secondary hover:bg-hover"
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
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-light text-primary mb-4">
                  {activeTab === "customer" ? (
                    <User className="h-7 w-7" />
                  ) : (
                    <Building2 className="h-7 w-7" />
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {activeTab === "customer" ? "Welcome Back" : "Vendor Login"}
                </h1>
                <p className="mt-2 text-sm text-secondary">
                  {activeTab === "customer"
                    ? "Login to manage your bookings and service history"
                    : "Login to your vendor dashboard"}
                </p>
              </div>

              {/* Phone Input Phase */}
              {!otpSent && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label
                      htmlFor="loginPhone"
                      className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5"
                    >
                      <Phone className="h-4 w-4 text-muted" />
                      Phone Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-edge bg-dim text-sm text-secondary font-medium">
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
                        className="flex-1 px-4 py-3 rounded-r-lg border border-edge bg-background text-foreground placeholder:text-muted text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendOtp();
                        }}
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneNumber.trim().length < 10 || sendingOtp}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      phoneNumber.trim().length >= 10 && !sendingOtp
                        ? "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                        : "bg-edge text-muted cursor-not-allowed"
                    }`}
                  >
                    {sendingOtp ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-current"
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Send OTP
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-muted leading-relaxed">
                    We will send a 6-digit verification code to your phone number via SMS.
                  </p>
                </div>
              )}

              {/* OTP Verification Phase */}
              {otpSent && (
                <div className="space-y-5 animate-fade-in">
                  {/* Back to phone */}
                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change number
                  </button>

                  <div>
                    <p className="text-sm text-secondary mb-1">
                      OTP sent to{" "}
                      <span className="font-semibold text-foreground">
                        +91 {phoneNumber}
                      </span>
                    </p>
                    <p className="text-xs text-muted">
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
                        className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold rounded-lg border-2 bg-background text-foreground transition-all duration-200 outline-none ${
                          digit
                            ? "border-primary bg-primary-light/50"
                            : "border-edge focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                    ))}
                  </div>

                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                  {/* Verify Button */}
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!isOtpComplete || verifying}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      isOtpComplete && !verifying
                        ? "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                        : "bg-edge text-muted cursor-not-allowed"
                    }`}
                  >
                    {verifying ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-current"
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
                      <p className="text-xs text-muted">
                        Resend OTP in{" "}
                        <span className="font-semibold text-secondary">
                          {resendTimer}s
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs text-primary font-medium hover:text-primary-hover transition-colors cursor-pointer underline underline-offset-2"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Below Card Links */}
          <div className="mt-6 text-center animate-fade-in [animation-delay:200ms]">
            <p className="text-sm text-muted mb-3">New here?</p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <Wrench className="h-4 w-4" />
                Book a Service
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <span className="w-px h-4 bg-edge" />
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <Building2 className="h-4 w-4" />
                Become a Vendor
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
