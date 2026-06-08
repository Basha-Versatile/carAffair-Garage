"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { publicPost } from "@/lib/api";
import {
  Building2,
  User,
  Phone,
  Mail,
  MessageSquare,
  Users,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Headphones,
  Monitor,
  Zap,
} from "lucide-react";

const benefits = [
  { icon: Monitor, text: "Live walkthrough of the entire platform" },
  { icon: Headphones, text: "One-on-one session with our product expert" },
  { icon: Calendar, text: "Flexible scheduling — pick your time slot" },
  { icon: Zap, text: "Get answers to all your questions in real time" },
];

const inputBase =
  "w-full px-4 py-2.5 rounded-lg border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-[var(--crank-red)]/20 focus:border-[var(--crank-red)]";
const inputBorder = "border-[var(--border-color)]";
const inputError = "border-red-500";
const labelBase = "flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] mb-1.5";

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [name, setName] = useState("");
  const [garageName, setGarageName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [message, setMessage] = useState("");

  const isFieldInvalid = (value: string) => {
    if (!attempted) return false;
    return value.trim() === "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setSubmitError("");

    if (!name.trim() || !phone.trim() || !email.trim()) {
      return;
    }

    if (phone.trim().length !== 10 || !/^\d{10}$/.test(phone.trim())) {
      setSubmitError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await publicPost("/api/demo-requests", {
        name: name.trim(),
        garageName: garageName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        staffCount: staffCount || undefined,
        message: message.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit request. Please try again."
      );
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
    <div className="relative min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />

      <main className="flex-1 pt-[72px]">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)]">
          {/* Left Panel */}
          <div className="relative lg:w-[45%] xl:w-[42%] bg-[var(--crank-black)] text-white px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20 xl:px-16 flex flex-col justify-center overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--crank-red)]/5 rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[var(--crank-red)]/5 rounded-full" />

            <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="section-tag text-white/60 mb-4">Book a Demo</p>
                <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-5xl font-bold leading-tight font-[family-name:var(--font-montserrat)]">
                  See Car Affair
                  <br />
                  <span className="text-[var(--crank-red)]">in Action</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-base sm:text-lg text-white/60 leading-relaxed"
              >
                Get a personalized walkthrough of our platform. Our team will show you how Car Affair can work for your garage.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-10 space-y-5"
              >
                {benefits.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-white/5 border border-white/10">
                        <Icon className="h-5 w-5 text-[var(--crank-red)]" />
                      </div>
                      <span className="text-sm sm:text-base text-white/75">{item.text}</span>
                    </div>
                  );
                })}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-[var(--crank-red)]" />
                  <span className="text-sm font-semibold text-white">No commitment required</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  The demo is completely free. See the platform, ask questions, and decide if it&apos;s right for your garage.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Form */}
          <div className="flex-1 px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20 bg-[var(--bg-secondary)] overflow-y-auto">
            <div className="max-w-xl mx-auto lg:mx-0">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]"
              >
                Book a Free Demo
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base"
              >
                Fill in your details and we&apos;ll schedule a personalized demo for you.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-6"
              >
                {/* Name */}
                <div>
                  <label htmlFor="name" className={labelBase}>
                    <User className="h-4 w-4 text-[var(--text-tertiary)]" />
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className={`${inputBase} ${isFieldInvalid(name) ? inputError : inputBorder}`}
                  />
                  {isFieldInvalid(name) && (
                    <p className="mt-1 text-xs text-red-500">Name is required.</p>
                  )}
                </div>

                {/* Garage Name */}
                <div>
                  <label htmlFor="garageName" className={labelBase}>
                    <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
                    Garage Name
                  </label>
                  <input
                    id="garageName"
                    type="text"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="e.g., AutoCare Garage"
                    className={`${inputBase} ${inputBorder}`}
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="demoPhone" className={labelBase}>
                      <Phone className="h-4 w-4 text-[var(--text-tertiary)]" />
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-secondary)] font-medium">
                        +91
                      </span>
                      <input
                        id="demoPhone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        maxLength={10}
                        className={`flex-1 px-4 py-2.5 rounded-r-lg border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-[var(--crank-red)]/20 focus:border-[var(--crank-red)] ${
                          isFieldInvalid(phone) ? inputError : inputBorder
                        }`}
                      />
                    </div>
                    {isFieldInvalid(phone) && (
                      <p className="mt-1 text-xs text-red-500">Phone is required.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="demoEmail" className={labelBase}>
                      <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="demoEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${inputBase} ${isFieldInvalid(email) ? inputError : inputBorder}`}
                    />
                    {isFieldInvalid(email) && (
                      <p className="mt-1 text-xs text-red-500">Email is required.</p>
                    )}
                  </div>
                </div>

                {/* Staff Count */}
                <div>
                  <label htmlFor="staffCount" className={labelBase}>
                    <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
                    Number of Staff Members
                  </label>
                  <select
                    id="staffCount"
                    value={staffCount}
                    onChange={(e) => setStaffCount(e.target.value)}
                    className={`${inputBase} ${inputBorder} cursor-pointer`}
                  >
                    <option value="">Select range...</option>
                    <option value="1-5">1 - 5</option>
                    <option value="6-15">6 - 15</option>
                    <option value="16-50">16 - 50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className={labelBase}>
                    <MessageSquare className="h-4 w-4 text-[var(--text-tertiary)]" />
                    Anything specific you want to see?
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., I'm interested in invoice management and staff tracking..."
                    rows={3}
                    className={`${inputBase} ${inputBorder} resize-none`}
                  />
                </div>

                {submitError && (
                  <p className="text-sm text-red-500 text-center">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200 ${
                    submitting
                      ? "bg-[var(--crank-red)]/70 text-white cursor-not-allowed"
                      : "bg-[var(--crank-red)] text-white hover:bg-[var(--crank-red-dark)] active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Spinner />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Book My Demo
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </motion.form>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative mx-4 w-full max-w-md bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-xl p-8 sm:p-10 text-center"
            >
              <div className="mx-auto mb-6 flex items-center justify-center h-20 w-20 rounded-full bg-[var(--crank-red)]/10">
                <svg
                  className="h-10 w-10 text-[var(--crank-red)]"
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

              <h3 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
                Demo Request Received!
              </h3>
              <p className="mt-3 text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                Thank you for your interest! Our team will reach out within 24 hours to schedule your personalized demo.
              </p>

              <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[var(--crank-red)] text-white text-base font-semibold rounded-lg transition-all duration-200 hover:bg-[var(--crank-red-dark)] active:scale-[0.98]"
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
