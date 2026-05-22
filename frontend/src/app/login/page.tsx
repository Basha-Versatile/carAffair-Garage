"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAuth, isLoggedIn, getFirstPermittedRoute } from "@/lib/auth";
import { publicPost } from "@/lib/api";
import { Wrench, Phone, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (isLoggedIn()) router.replace("/dashboard"); }, [router]);
  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  async function handleSendOtp() {
    setError("");
    if (phone.length < 10) { setError("Please enter a valid 10-digit mobile number"); return; }
    setSendingOtp(true);
    try {
      await publicPost("/api/auth/send-otp", { phone, role: "garage_admin" });
      setStep("otp");
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp]; next[index] = value; setOtp(next); setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  async function handleVerifyOtp() {
    if (otp.join("").length < 6) { setError("Please enter the 6-digit OTP"); return; }
    setVerifying(true);
    try {
      const data = await publicPost<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        name: string;
        phone: string;
        role: string;
        garageId: string | null;
        garageName: string;
        permissions?: string[];
        garageRoleId?: string;
        staffTitle?: string;
      }>("/api/auth/verify-otp", { phone, otp: otp.join(""), role: "garage_admin" });
      setAuth({
        user: {
          id: data.userId,
          name: data.name,
          phone: data.phone,
          role: data.role,
          garageId: data.garageId,
          garageName: data.garageName,
          permissions: data.permissions,
          garageRoleId: data.garageRoleId,
          staffTitle: data.staffTitle,
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace(getFirstPermittedRoute());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  }

  function handleResend() { setOtp(["", "", "", "", "", ""]); setCountdown(30); otpRefs.current[0]?.focus(); }

  const inputCls = "w-full px-3.5 py-2.5 border border-edge rounded-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const btnCls = "w-full bg-primary text-white py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-primary items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full border-3 border-white" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full border-3 border-white" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full border-3 border-white" />
        </div>
        <div className="text-center text-white z-10 px-10">
          <div className="flex items-center justify-center mb-5">
            <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-sm">
              <Wrench className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Car Affair</h1>
          <p className="text-lg text-green-100 mb-1">Garage Management System</p>
          <p className="text-sm text-green-200/80 max-w-xs mx-auto leading-relaxed">
            Manage your garage operations, customers, inventory, and service orders all in one place.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-dim">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center bg-primary p-3 rounded-xl mb-3">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Car Affair</h1>
          </div>

          <div className="bg-background rounded-xl shadow-md border border-edge p-7">
            {step === "phone" ? (
              <>
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center bg-primary-light p-2.5 rounded-full mb-3">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
                  <p className="text-sm text-muted mt-1">Enter your mobile number to continue</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">Mobile Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3.5 rounded-l-md border border-r-0 border-edge bg-dim text-muted text-sm font-medium">+91</span>
                      <input type="tel" maxLength={10} value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        placeholder="Enter 10-digit number"
                        className="flex-1 px-3.5 py-2.5 border border-edge rounded-r-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base tracking-wide"
                        autoFocus />
                    </div>
                  </div>
                  {error && <p className="text-sm text-bad">{error}</p>}
                  <button onClick={handleSendOtp} disabled={sendingOtp} className={btnCls}>
                    {sendingOtp ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center bg-ok-light p-2.5 rounded-full mb-3">
                    <ShieldCheck className="w-5 h-5 text-ok" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Verify OTP</h2>
                  <p className="text-sm text-muted mt-1">
                    Enter the code sent to <span className="font-medium text-secondary">+91 {phone}</span>
                  </p>
                </div>
                <div className="space-y-5">
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, i) => (
                      <input key={i} ref={(el) => { otpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-12 text-center text-xl font-semibold border-2 border-edge rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" />
                    ))}
                  </div>
                  {error && <p className="text-sm text-bad text-center">{error}</p>}
                  <button onClick={handleVerifyOtp} disabled={verifying} className={btnCls}>
                    {verifying ? "Verifying..." : "Verify & Login"}
                  </button>
                  <div className="text-center">
                    {countdown > 0
                      ? <p className="text-sm text-muted">Resend OTP in <span className="font-medium text-secondary">{countdown}s</span></p>
                      : <button onClick={handleResend} className="text-sm text-primary font-medium hover:underline">Resend OTP</button>}
                  </div>
                  <button onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="w-full text-sm text-muted hover:text-secondary py-1.5 transition-colors">
                    &larr; Change mobile number
                  </button>
                </div>
              </>
            )}
          </div>
          <p className="text-center text-xs text-muted mt-5">By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}
