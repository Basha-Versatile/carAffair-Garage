"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Wrench,
  ArrowRight,
  ClipboardList,
  FileText,
  Users,
  BarChart3,
  Package,
  Bell,
  ShieldCheck,
  Smartphone,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  IndianRupee,
  Check,
  Calendar,
  Car,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: ClipboardList,
    title: "Job Card Management",
    description: "Create, track, and manage job cards with service history, technician assignment, and real-time status updates.",
  },
  {
    icon: FileText,
    title: "Invoice & Estimates",
    description: "Generate GST-compliant invoices and professional estimates. Send directly to customers via email with PDF attachments.",
  },
  {
    icon: Users,
    title: "Customer Portal",
    description: "Branded customer booking portal where car owners can book services, view history, and track live updates.",
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description: "Manage parts and consumables with stock alerts, barcode scanning, and purchase tracking for your garage.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Revenue reports, staff performance, service trends, and business insights with date filters and visual charts.",
  },
  {
    icon: Bell,
    title: "Notifications & Reminders",
    description: "Automated service reminders, booking confirmations, work updates, and payment notifications for your customers.",
  },
  {
    icon: ShieldCheck,
    title: "Roles & Permissions",
    description: "Admin, Manager, Service Advisor, and Technician roles. Control who sees what with granular permissions.",
  },
  {
    icon: Smartphone,
    title: "Staff Mobile App",
    description: "Technicians check-in/out, receive task assignments, upload before/after photos, and track work time — all from mobile.",
  },
  {
    icon: Clock,
    title: "Work Tracking",
    description: "Real-time work tracking with timer, before/after photos, and automatic customer notifications on job progress.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "4,999",
    period: "/month",
    description: "Perfect for small garages just getting started with digital management.",
    features: [
      "Up to 3 staff members",
      "Job card management",
      "Basic invoicing",
      "Customer booking portal",
      "Email notifications",
      "Basic reports",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "9,999",
    period: "/month",
    description: "For growing garages that need advanced tools and analytics.",
    features: [
      "Up to 15 staff members",
      "Everything in Starter",
      "GST-compliant invoicing",
      "Inventory management",
      "Staff tracking & attendance",
      "Advanced analytics dashboard",
      "Customer mobile notifications",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For multi-location garages and franchise networks.",
    features: [
      "Unlimited staff members",
      "Everything in Professional",
      "Multi-location management",
      "Custom integrations",
      "Dedicated account manager",
      "White-label options",
      "SLA guarantee",
      "On-site training",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, Kumar Auto Works",
    initials: "RK",
    text: "Car Affair completely transformed how we run our garage. Invoicing, job tracking, and customer communication — everything is seamless now.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Manager, AutoCare Hub",
    initials: "PS",
    text: "The staff tracking feature alone saved us 3 hours daily. We can see exactly who is working on what, and customers love the live updates.",
    rating: 5,
  },
  {
    name: "Mohammed Irfan",
    role: "Owner, Irfan Motors",
    initials: "MI",
    text: "We switched from paper-based billing to Car Affair and our revenue tracking improved dramatically. The GST invoicing is a lifesaver.",
    rating: 5,
  },
];

const steps = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Register Your Garage",
    description: "Sign up in minutes with your garage details. Our team reviews and activates your account within 24 hours.",
  },
  {
    step: "02",
    icon: Wrench,
    title: "Set Up Your Workshop",
    description: "Add your staff, services, pricing, and inventory. Configure roles and permissions for your team.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Go Live",
    description: "Start accepting bookings, managing jobs, and sending invoices. Your customers get a dedicated booking portal.",
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const stat1 = useCountUp(500, 2000);
  const stat2 = useCountUp(50000, 2500);
  const stat3 = useCountUp(98, 2000);

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative bg-[var(--crank-black)] overflow-hidden">
          {/* Decorative */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--crank-red)]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-[var(--crank-red)]/5 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[var(--crank-red)]/3 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40">
            <div className="max-w-3xl mx-auto text-center">
              <AnimateOnScroll type="fadeUp">
                <p className="section-tag text-white/60 justify-center mb-6">
                  Garage Management Platform
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll type="fadeUp" delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight font-[family-name:var(--font-montserrat)]">
                  Run Your Garage{" "}
                  <span className="gradient-text-animated">Smarter</span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll type="fadeUp" delay={0.2}>
                <p className="mt-6 text-lg sm:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
                  The complete software platform for automotive workshops. Manage bookings, track jobs, send invoices, and delight your customers — all from one dashboard.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll type="fadeUp" delay={0.3}>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register-garage" className="btn-primary text-base px-8 py-4">
                    Register Your Garage
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/demo" className="btn-outline border-white/20 text-white hover:border-[var(--crank-red)] hover:text-[var(--crank-red)] text-base px-8 py-4">
                    Book a Demo
                  </Link>
                </div>
              </AnimateOnScroll>

              {/* Stats */}
              <AnimateOnScroll type="fadeUp" delay={0.4}>
                <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16">
                  <div ref={stat1.ref} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-montserrat)]">
                      {stat1.count}+
                    </div>
                    <div className="text-sm text-white/50 mt-1">Garages</div>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div ref={stat2.ref} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-montserrat)]">
                      {stat2.count.toLocaleString()}+
                    </div>
                    <div className="text-sm text-white/50 mt-1">Jobs Managed</div>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div ref={stat3.ref} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-montserrat)]">
                      {stat3.count}%
                    </div>
                    <div className="text-sm text-white/50 mt-1">Satisfaction</div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES ═══════════════════════ */}
        <section id="features" className="py-20 sm:py-28 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimateOnScroll type="fadeUp">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="section-tag justify-center mb-4">Platform Features</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-montserrat)]">
                  Everything You Need to{" "}
                  <span className="gradient-text">Run Your Garage</span>
                </h2>
                <p className="mt-4 text-[var(--text-secondary)] text-lg">
                  From booking to billing, our platform covers every aspect of garage management.
                </p>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <AnimateOnScroll key={feature.title} type="fadeUp" delay={idx * 0.05}>
                    <div className="card p-6 sm:p-8 h-full">
                      <div className="icon-ring inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--crank-red)]/10 mb-4">
                        <Icon className="h-6 w-6 text-[var(--crank-red)]" />
                      </div>
                      <h3 className="text-lg font-bold font-[family-name:var(--font-montserrat)] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section className="py-20 sm:py-28 section-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimateOnScroll type="fadeUp">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="section-tag justify-center mb-4">How It Works</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-montserrat)]">
                  Get Started in{" "}
                  <span className="gradient-text">3 Simple Steps</span>
                </h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <AnimateOnScroll key={s.step} type="fadeUp" delay={idx * 0.15}>
                    <div className="relative text-center">
                      <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-[var(--crank-red)] text-white mb-6 shadow-[0_8px_24px_-4px_rgba(204,0,0,0.4)]">
                        <Icon className="h-9 w-9" />
                      </div>
                      <div className="absolute -top-2 -right-2 md:right-auto md:-top-3 md:left-1/2 md:ml-8 bg-[var(--bg-primary)] border-2 border-[var(--crank-red)] text-[var(--crank-red)] font-bold text-sm h-8 w-8 rounded-full flex items-center justify-center">
                        {s.step}
                      </div>
                      <h3 className="text-xl font-bold font-[family-name:var(--font-montserrat)] mb-3">
                        {s.title}
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
                        {s.description}
                      </p>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ PRICING ═══════════════════════ */}
        <section id="pricing" className="py-20 sm:py-28 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimateOnScroll type="fadeUp">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="section-tag justify-center mb-4">Pricing</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-montserrat)]">
                  Simple, Transparent{" "}
                  <span className="gradient-text">Pricing</span>
                </h2>
                <p className="mt-4 text-[var(--text-secondary)] text-lg">
                  Choose the plan that fits your garage. No hidden fees, cancel anytime.
                </p>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {plans.map((plan, idx) => (
                <AnimateOnScroll key={plan.name} type="fadeUp" delay={idx * 0.1}>
                  <div
                    className={`relative rounded-2xl p-8 h-full flex flex-col ${
                      plan.popular
                        ? "bg-[var(--crank-black)] text-white border-2 border-[var(--crank-red)] shadow-[0_8px_32px_-8px_rgba(204,0,0,0.3)]"
                        : "card"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--crank-red)] text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className={`text-lg font-bold font-[family-name:var(--font-montserrat)] ${plan.popular ? "text-white" : ""}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm mt-1 ${plan.popular ? "text-white/60" : "text-[var(--text-secondary)]"}`}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        {plan.price !== "Custom" && (
                          <IndianRupee className={`h-5 w-5 ${plan.popular ? "text-white" : "text-[var(--text-primary)]"}`} />
                        )}
                        <span className={`text-4xl font-bold font-[family-name:var(--font-montserrat)] ${plan.popular ? "text-white" : ""}`}>
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className={`text-sm ${plan.popular ? "text-white/50" : "text-[var(--text-tertiary)]"}`}>
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 shrink-0 mt-0.5 ${plan.popular ? "text-[var(--crank-red)]" : "text-[var(--crank-red)]"}`} />
                          <span className={`text-sm ${plan.popular ? "text-white/80" : "text-[var(--text-secondary)]"}`}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.name === "Enterprise" ? "/demo" : "/register-garage"}
                      className={`w-full text-center py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        plan.popular
                          ? "bg-[var(--crank-red)] text-white hover:bg-[var(--crank-red-dark)]"
                          : "border-2 border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--crank-red)] hover:text-[var(--crank-red)]"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
        <section className="py-20 sm:py-28 section-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimateOnScroll type="fadeUp">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="section-tag text-white/60 justify-center mb-4">Testimonials</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[family-name:var(--font-montserrat)]">
                  Loved by Garage Owners
                </h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <AnimateOnScroll key={t.name} type="fadeUp" delay={idx * 0.1}>
                  <div className="bg-[var(--bg-dark-secondary)] border border-white/[0.06] rounded-2xl p-8 h-full flex flex-col">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed flex-1 italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--crank-red)] flex items-center justify-center text-sm font-bold text-white">
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-white/50">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ WHY US ═══════════════════════ */}
        <section className="py-20 sm:py-28 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <AnimateOnScroll type="fadeLeft">
                <div>
                  <p className="section-tag mb-4">Why Car Affair</p>
                  <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-montserrat)] mb-6">
                    Built by People Who{" "}
                    <span className="gradient-text">Understand Garages</span>
                  </h2>
                  <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8">
                    We spent months in real garages understanding the pain points. Car Affair is not just software — it&apos;s a partner that grows with your business.
                  </p>

                  <div className="space-y-4">
                    {[
                      "No technical setup required — we handle everything",
                      "Dedicated onboarding support for your team",
                      "Regular updates with new features every month",
                      "Indian GST compliance built-in from day one",
                      "Works on any device — desktop, tablet, or phone",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[var(--crank-red)] shrink-0 mt-0.5" />
                        <span className="text-[var(--text-secondary)]">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <Link href="/register-garage" className="btn-primary">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll type="fadeRight">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Calendar, label: "Smart Scheduling", value: "Auto-assign" },
                    { icon: Car, label: "Vehicle Tracking", value: "Real-time" },
                    { icon: IndianRupee, label: "Revenue Growth", value: "35% avg" },
                    { icon: Clock, label: "Time Saved", value: "3hrs/day" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="card p-6 text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--crank-red)]/10 mb-3">
                          <Icon className="h-6 w-6 text-[var(--crank-red)]" />
                        </div>
                        <div className="text-2xl font-bold font-[family-name:var(--font-montserrat)]">
                          {item.value}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">
                          {item.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
        <section className="py-20 sm:py-28 section-dark relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--crank-red)]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--crank-red)]/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <AnimateOnScroll type="fadeUp">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[family-name:var(--font-montserrat)]">
                Ready to Transform{" "}
                <span className="gradient-text-animated">Your Garage?</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto">
                Join hundreds of garage owners who are already using Car Affair to streamline their operations and grow their business.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register-garage" className="btn-primary text-base px-8 py-4">
                  Register Your Garage
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/demo" className="btn-outline border-white/20 text-white hover:border-[var(--crank-red)] hover:text-[var(--crank-red)] text-base px-8 py-4">
                  Schedule a Demo
                </Link>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
