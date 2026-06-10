"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { setAuth, isLoggedIn, getFirstPermittedRoute } from "@/lib/auth";
import { publicPost } from "@/lib/api";
import {
  Phone, ShieldCheck, ArrowRight,
  Wrench, Cog, Gauge, Fuel, CircleDot, Zap,
} from "lucide-react";

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

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
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
        financialModules?: string[];
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
          financialModules: data.financialModules,
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

  /* ── 3D Tool data ── */
  const tools = [
    { Icon: Wrench, top: "10%", left: "12%", size: 66, tilt: -20, dy: 20, dx: 8, fd: 6, sd: 14, accent: "#dc2626" },
    { Icon: Cog, top: "7%", left: "74%", size: 74, tilt: 12, dy: 24, dx: 10, fd: 7.5, sd: 18, accent: "#ffffff" },
    { Icon: Gauge, top: "76%", left: "15%", size: 60, tilt: 8, dy: 18, dx: 6, fd: 5.5, sd: 16, accent: "#ef4444" },
    { Icon: Fuel, top: "72%", left: "80%", size: 56, tilt: -15, dy: 22, dx: 9, fd: 6.5, sd: 20, accent: "#fca5a5" },
    { Icon: CircleDot, top: "35%", left: "88%", size: 52, tilt: 25, dy: 16, dx: 7, fd: 5, sd: 22, accent: "#dc2626" },
    { Icon: Zap, top: "40%", left: "6%", size: 50, tilt: -30, dy: 19, dx: 8, fd: 7, sd: 12, accent: "#f87171" },
    { Icon: Wrench, top: "20%", left: "52%", size: 42, tilt: 40, dy: 14, dx: 5, fd: 8, sd: 24, accent: "#991b1b" },
    { Icon: Cog, top: "85%", left: "52%", size: 48, tilt: -8, dy: 16, dx: 7, fd: 6, sd: 15, accent: "#ffffff" },
  ] as const;

  /* ── Ring node positions ── */
  const ring1Nodes = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  const ring2Nodes = [0, 60, 120, 180, 240, 300];
  const ring3Nodes = [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336];
  const ring4Nodes = [0, 72, 144, 216, 288];
  const ring5Nodes = [0, 120, 240];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ═══ Left Side — Login Form ═══ */}
      <div className="w-full lg:w-[440px] xl:w-[480px] flex-shrink-0 flex flex-col justify-center px-8 sm:px-10 xl:px-14 py-8 relative z-10">
        <div className="absolute inset-0 bg-[var(--surface-dim)] opacity-80" />
        <div className="absolute inset-0 glass-strong" />

        <div className="relative z-10 w-full max-w-sm mx-auto space-y-5">
          {/* Logo + Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <Image
              src="/logo.png"
              alt="Car Affair"
              width={1024}
              height={200}
              className="h-20 w-auto dark:brightness-0 dark:invert"
              priority
            />
            <div>
              <h2 className="text-2xl font-bold text-[var(--surface-fg)] leading-tight">
                Welcome back
              </h2>
              <p className="text-[var(--text-tertiary)] text-sm mt-1">
                Sign in to manage your garage operations
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center bg-[var(--primary-lt-bg)] p-2.5 rounded-full mb-3">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-sm text-[var(--text-mut)] mt-1">Enter your mobile number to continue</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-sec)] mb-1.5">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-mut)] text-sm font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      placeholder="Enter 10-digit number"
                      className="flex-1 px-3.5 py-2.5 border border-[var(--border-color)] rounded-r-xl text-[var(--surface-fg)] bg-[var(--bg-tertiary)] placeholder:text-[var(--text-mut)] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 text-base tracking-wide transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-full mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--surface-fg)]">Verify OTP</h3>
                  <p className="text-sm text-[var(--text-mut)] mt-1">
                    Enter the code sent to <span className="font-medium text-[var(--text-sec)]">+91 {phone}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <motion.input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-12 text-center text-xl font-semibold border-2 border-[var(--border-color)] rounded-xl text-[var(--surface-fg)] bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 font-medium text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerifyOtp}
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify & Login
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-[var(--text-mut)]">
                      Resend OTP in <span className="font-medium text-[var(--text-sec)]">{countdown}s</span>
                    </p>
                  ) : (
                    <button onClick={handleResend} className="text-sm text-red-500 font-medium hover:text-red-400 transition-colors">
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                  className="w-full text-sm text-[var(--text-mut)] hover:text-[var(--text-sec)] py-1.5 transition-colors"
                >
                  &larr; Change mobile number
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-[11px] text-[var(--text-tertiary)] text-center"
          >
            &copy; 2026 Car Affair. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* ═══ Right Side — 3D Visual Experience ═══ */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ perspective: "1800px" }}>
        {/* Deep black base */}
        <div className="absolute inset-0 bg-black" />

        {/* Layered ambient glows */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0.65, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(220,38,38,0.45) 0%, rgba(220,38,38,0.12) 25%, rgba(220,38,38,0.03) 45%, transparent 65%)" }}
        />
        <motion.div
          animate={{ scale: [1.15, 0.85, 1.15], opacity: [0.08, 0.25, 0.08], rotate: [0, 360] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(185,28,28,0.3) 0%, transparent 55%)" }}
        />
        <motion.div
          animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.04, 0.12, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[35%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 50%)" }}
        />

        {/* 3D Ring 1 — main prominent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotateX: 68, rotateY: [0, 360], rotateZ: [0, 8, 0] }}
            transition={{ rotateY: { duration: 16, repeat: Infinity, ease: "linear" }, rotateZ: { duration: 9, repeat: Infinity, ease: "easeInOut" } }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-[540px] h-[540px] xl:w-[640px] xl:h-[640px] rounded-full"
          >
            <div className="absolute inset-0 rounded-full border-2 border-red-500/30" />
            <div className="absolute inset-[3px] rounded-full border border-red-500/10" />
            <div className="absolute inset-0 rounded-full shadow-[0_0_120px_rgba(220,38,38,0.2),0_0_40px_rgba(220,38,38,0.1),inset_0_0_80px_rgba(220,38,38,0.05)]" />
            {ring1Nodes.map((deg) => (
              <div key={deg} className="absolute" style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(270px) translate(-50%,-50%)` }}>
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_24px_rgba(220,38,38,1),0_0_50px_rgba(220,38,38,0.5),0_0_80px_rgba(220,38,38,0.2)]" />
                <div className="absolute top-1/2 right-full -translate-y-1/2 w-8 h-0.5 bg-gradient-to-l from-red-500/60 to-transparent rounded-full" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3D Ring 2 — inner white */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotateX: 74, rotateY: [360, 0], rotateZ: [-6, 6, -6] }}
            transition={{ rotateY: { duration: 20, repeat: Infinity, ease: "linear" }, rotateZ: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-[400px] h-[400px] xl:w-[470px] xl:h-[470px] rounded-full"
          >
            <div className="absolute inset-0 rounded-full border border-white/[0.12]" />
            <div className="absolute inset-0 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.04),inset_0_0_40px_rgba(255,255,255,0.02)]" />
            {ring2Nodes.map((deg) => (
              <div key={deg} className="absolute" style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(200px) translate(-50%,-50%)` }}>
                <div className="w-2.5 h-2.5 rounded-full bg-white/80 shadow-[0_0_16px_rgba(255,255,255,0.7),0_0_35px_rgba(255,255,255,0.3)]" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3D Ring 3 — outermost orbit */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotateX: 55, rotateY: [0, -360] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-[720px] h-[720px] xl:w-[840px] xl:h-[840px] rounded-full"
          >
            <div className="absolute inset-0 rounded-full border border-red-800/[0.08]" />
            {ring3Nodes.map((deg) => (
              <div key={deg} className="absolute w-1 h-1 rounded-full bg-red-400/20"
                style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(360px) translate(-50%,-50%)` }} />
            ))}
          </motion.div>
        </div>

        {/* 3D Ring 4 — cross-tilted accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotateX: 82, rotateY: [200, 560], rotateZ: [-12, 12, -12] }}
            transition={{ rotateY: { duration: 24, repeat: Infinity, ease: "linear" }, rotateZ: { duration: 16, repeat: Infinity, ease: "easeInOut" } }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-[480px] h-[480px] xl:w-[560px] xl:h-[560px] rounded-full"
          >
            <div className="absolute inset-0 rounded-full border border-red-500/[0.08]" />
            {ring4Nodes.map((deg) => (
              <div key={deg} className="absolute" style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(240px) translate(-50%,-50%)` }}>
                <div className="w-2 h-2 rounded-full bg-red-500/40 shadow-[0_0_12px_rgba(220,38,38,0.5)]" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3D Ring 5 — tiny innermost */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotateX: 60, rotateY: [0, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-[280px] h-[280px] xl:w-[320px] xl:h-[320px] rounded-full"
          >
            <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
            {ring5Nodes.map((deg) => (
              <div key={deg} className="absolute w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(140px) translate(-50%,-50%)` }} />
            ))}
          </motion.div>
        </div>

        {/* ── Scattered 3D Mechanic Tools ── */}
        {tools.map((tool, idx) => {
          const isRed = tool.accent !== "#ffffff";
          return (
            <motion.div
              key={`t3d-${idx}`}
              className="absolute z-[5] pointer-events-none"
              style={{ top: tool.top, left: tool.left, perspective: "800px" }}
              initial={{ opacity: 0, scale: 0.2, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 + idx * 0.15, ease: "easeOut" }}
            >
              <motion.div
                animate={{
                  y: [-tool.dy / 2, tool.dy / 2, -tool.dy / 2],
                  x: [-tool.dx / 2, tool.dx / 2, -tool.dx / 2],
                  rotateY: [0, 360],
                  rotateX: [-10, 10, -10],
                }}
                transition={{
                  y: { duration: tool.fd, repeat: Infinity, ease: "easeInOut" },
                  x: { duration: tool.fd * 1.4, repeat: Infinity, ease: "easeInOut" },
                  rotateY: { duration: tool.sd, repeat: Infinity, ease: "linear" },
                  rotateX: { duration: tool.fd, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 },
                }}
                style={{ transformStyle: "preserve-3d", transform: `rotate(${tool.tilt}deg)` }}
              >
                <div className="relative" style={{ width: tool.size, height: tool.size, transformStyle: "preserve-3d" }}>
                  {/* Floor shadow */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full blur-xl"
                    style={{ width: tool.size * 0.65, height: 8, background: isRed ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.06)" }} />
                  {/* Back face */}
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ transform: "translateZ(-10px)", background: isRed ? "rgba(100,15,15,0.5)" : "rgba(40,40,40,0.5)", border: `1px solid ${isRed ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.03)"}` }} />
                  {/* Mid face */}
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ transform: "translateZ(-5px)", background: isRed ? "rgba(150,20,20,0.3)" : "rgba(60,60,60,0.25)", border: `1px solid ${isRed ? "rgba(220,38,38,0.06)" : "rgba(255,255,255,0.02)"}` }} />
                  {/* Front face — main glass */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden"
                    style={{
                      transform: "translateZ(0px)",
                      background: isRed ? "rgba(220,38,38,0.05)" : "rgba(255,255,255,0.025)",
                      border: `1px solid ${isRed ? "rgba(220,38,38,0.2)" : "rgba(255,255,255,0.1)"}`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `0 0 ${tool.size * 0.8}px ${isRed ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.03)"}, 0 10px 40px rgba(0,0,0,0.35)`,
                    }}>
                    {/* Top highlight */}
                    <div className="absolute inset-x-0 top-0 h-[45%] rounded-t-2xl"
                      style={{ background: `linear-gradient(to bottom, ${isRed ? "rgba(255,120,120,0.1)" : "rgba(255,255,255,0.08)"}, transparent)` }} />
                    {/* Bottom shadow */}
                    <div className="absolute inset-x-0 bottom-0 h-[30%] rounded-b-2xl bg-gradient-to-t from-black/20 to-transparent" />
                    {/* Top edge shine */}
                    <div className="absolute inset-x-3 top-[1px] h-[1px] rounded-full"
                      style={{ background: `linear-gradient(to right, transparent, ${isRed ? "rgba(255,160,160,0.3)" : "rgba(255,255,255,0.2)"}, transparent)` }} />
                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <tool.Icon
                        style={{
                          width: tool.size * 0.5,
                          height: tool.size * 0.5,
                          color: tool.accent,
                          opacity: isRed ? 0.75 : 0.5,
                          filter: `drop-shadow(0 0 10px ${isRed ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.25)"})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Center logo — 3D floating glass */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            animate={{ y: [0, -18, 0], rotateY: [0, 6, -6, 0], rotateX: [0, -4, 4, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-16 rounded-[3rem] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 65%)" }}
            />
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1], scale: [1.05, 0.95, 1.05] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -inset-8 rounded-[2.5rem] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 60%)" }}
            />
            <div className="relative w-48 h-48 xl:w-56 xl:h-56 rounded-[2.2rem] overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-3xl" />
              <div className="absolute inset-0 rounded-[2.2rem] border border-white/[0.12]" />
              <div className="absolute inset-[1px] rounded-[2.1rem] border border-white/[0.04]" />
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-[2.2rem]" />
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent rounded-b-[2.2rem]" />
              <div className="absolute inset-0 rounded-[2.2rem] shadow-[0_0_150px_rgba(220,38,38,0.2),0_0_50px_rgba(220,38,38,0.08),inset_0_0_30px_rgba(220,38,38,0.03)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/logo.png" alt="Car Affair" width={512} height={512} className="w-36 xl:w-44 h-auto brightness-0 invert drop-shadow-[0_0_25px_rgba(220,38,38,0.35)]" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating particles */}
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${1 + (i % 4)}px`,
              height: `${1 + (i % 4)}px`,
              top: `${2 + (i * 2.8) % 96}%`,
              left: `${1 + (i * 2.9) % 98}%`,
              background: i % 5 === 0 ? "rgba(220,38,38,0.8)" : i % 5 === 1 ? "rgba(255,255,255,0.4)" : i % 5 === 2 ? "rgba(220,38,38,0.4)" : i % 5 === 3 ? "rgba(255,200,200,0.25)" : "rgba(255,255,255,0.15)",
            }}
            animate={{
              y: [0, -(35 + i * 5), 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0, 0.9, 0],
              scale: [0, 1 + (i % 3) * 0.3, 0],
            }}
            transition={{
              duration: 3 + (i % 7) * 1,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Light beams */}
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "350%", opacity: [0, 0.06, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 7, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-1/6 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
        />
        <motion.div
          initial={{ x: "250%", opacity: 0 }}
          animate={{ x: "-200%", opacity: [0, 0.04, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 11, ease: "easeInOut", delay: 4 }}
          className="absolute top-0 left-0 w-1/5 h-full skew-x-12 bg-gradient-to-r from-transparent via-red-500/15 to-transparent pointer-events-none"
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      </div>
    </div>
  );
}
