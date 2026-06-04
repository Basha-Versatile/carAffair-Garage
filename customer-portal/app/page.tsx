"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Thermometer,
  CircleDot,
  Paintbrush,
  Zap,
  Clock,
  ClipboardList,
  Calendar,
  Cog,
  Car,
  ShieldCheck,
  IndianRupee,
  Package,
  Truck,
  ArrowRight,
  Phone,
  Star,
  Users,
  Building2,
  Sparkles,
  Quote,
  ChevronDown,
  MapPinned,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const services = [
  {
    title: "General Service",
    icon: Wrench,
    description:
      "Complete car service including oil change, filter replacement, and multi-point inspection",
    price: "From ₹2,999",
  },
  {
    title: "AC Service & Repair",
    icon: Thermometer,
    description:
      "AC gas refill, compressor repair, cooling coil service, and complete AC checkup",
    price: "From ₹1,499",
  },
  {
    title: "Wheel & Tyre Care",
    icon: CircleDot,
    description:
      "Wheel alignment, balancing, tyre replacement, and puncture repair",
    price: "From ₹499",
  },
  {
    title: "Denting & Painting",
    icon: Paintbrush,
    description:
      "Scratch removal, full body paint, panel beating, and rust treatment",
    price: "From ₹2,499",
  },
  {
    title: "Battery Service",
    icon: Zap,
    description:
      "Battery testing, replacement, jump start, and charging system check",
    price: "From ₹299",
  },
  {
    title: "Periodic Maintenance",
    icon: Clock,
    description:
      "Scheduled maintenance as per manufacturer recommendations",
    price: "From ₹3,999",
  },
];

const steps = [
  {
    number: 1,
    title: "Choose Service",
    icon: ClipboardList,
    description: "Select the service your car needs",
  },
  {
    number: 2,
    title: "Pick a Slot",
    icon: Calendar,
    description: "Choose a convenient date and time",
  },
  {
    number: 3,
    title: "We Service",
    icon: Cog,
    description: "Our certified mechanics take care of your car",
  },
  {
    number: 4,
    title: "Drive Happy",
    icon: Car,
    description: "Get your car back in perfect condition",
  },
];

const whyUs = [
  {
    title: "Certified Garages",
    icon: ShieldCheck,
    description:
      "All vendor garages are verified and certified for quality",
  },
  {
    title: "Transparent Pricing",
    icon: IndianRupee,
    description:
      "No hidden charges. See the price before you book",
  },
  {
    title: "Genuine Parts",
    icon: Package,
    description:
      "We use only genuine OEM and OES spare parts",
  },
  {
    title: "Pick & Drop",
    icon: Truck,
    description:
      "Free pick up and drop service for your convenience",
  },
];

const trustStats = [
  { label: "Garages", value: "500+", icon: Building2 },
  { label: "Services Done", value: "10,000+", icon: Star },
  { label: "Happy Customers", value: "50,000+", icon: Users },
];

const testimonials = [
  { name: 'Rajesh Kumar', role: 'BMW 3 Series · Owner', quote: 'They sent photos of every scratch before starting work and called before doing anything extra. Most transparent workshop I have ever used.', rating: 5 },
  { name: 'Priya Sharma', role: 'Audi A4 · Owner', quote: 'Pickup at 9 AM, car back by 6 PM, full digital invoice on WhatsApp. Best service experience in 12 years of driving.', rating: 5 },
  { name: 'Amit Patel', role: 'Toyota Fortuner · Owner', quote: 'I could decline the items I did not want from the quote — that alone saved me ₹6,000. I will not go anywhere else.', rating: 5 },
  { name: 'Sneha Reddy', role: 'Hyundai Creta · Owner', quote: 'My car came back cleaner than I left it. The pickup driver was on time, and the WhatsApp updates were almost too good.', rating: 5 },
];

const partners = [
  { label: 'HDFC ERGO', kind: 'Insurance' },
  { label: 'ICICI Lombard', kind: 'Insurance' },
  { label: 'Bajaj Allianz', kind: 'Insurance' },
  { label: 'Tata AIG', kind: 'Insurance' },
  { label: 'Bosch', kind: 'Parts' },
  { label: '3M', kind: 'Coatings' },
  { label: 'Mobil 1', kind: 'Lubricants' },
  { label: 'Castrol', kind: 'Lubricants' },
];

const coverageZones = [
  'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Hitech City', 'Gachibowli', 'Kondapur',
  'Manikonda', 'Begumpet', 'Somajiguda', 'Punjagutta', 'Ameerpet', 'SR Nagar',
  'Kukatpally', 'Miyapur', 'Tellapur', 'Nallagandla',
];

const faqs = [
  { q: 'How is Car Affair different from a regular workshop?', a: 'You get a digital paper trail of everything — timestamped photos, an itemised quote you can edit, real-time WhatsApp updates, and a GST-compliant invoice. Every job has a named advisor and named technician accountable for it.' },
  { q: 'Do you service all car brands?', a: 'Yes. Our technicians are trained on Indian, European, Japanese, and Korean brands — from Maruti and Hyundai to BMW, Mercedes, Audi, and Porsche. We use OEM-grade parts for every brand.' },
  { q: 'Is pickup & drop really free?', a: 'Yes, anywhere within Hyderabad city limits. Outside the city we charge a small distance fee that is shown to you before you confirm the booking.' },
  { q: 'What if I find a problem after the service?', a: 'Every service comes with a 90-day warranty on both labour and the parts we installed. If something goes wrong, we fix it free of cost — pickup included.' },
  { q: 'How long does a typical service take?', a: 'A periodic service is usually a same-day turnaround. Major repairs and detailing jobs take 1–3 days, and you get a clear ETA before we start.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-5 text-left cursor-pointer">
        <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col grain">
      <AtmosphericBackground />
      <Navbar />

      <main className="relative flex-1">
        <div className="px-4 sm:px-8 pt-6 pb-12 space-y-6 max-w-7xl mx-auto">
          {/* ======================================================== */}
          {/*  HERO SECTION                                             */}
          {/* ======================================================== */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-panel relative overflow-hidden p-8 sm:p-12 lg:p-16"
          >
            {/* Background glow orbs */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-red-500/15 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-red-700/15 rounded-full blur-3xl" />
            </div>

            <div className="text-center max-w-4xl mx-auto">
              {/* Trust badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 glass-card px-4 py-2 !rounded-full text-xs font-medium text-red-500 border border-red-500/25 mb-8"
                style={{ transform: "none" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Trusted by 50,000+ car owners across Hyderabad
              </motion.div>

              {/* Headline */}
              <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-[var(--text-primary)]">
                Premium care.
                <br />
                <span className="gradient-text">Zero surprises.</span>
              </h1>

              <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed">
                Book trusted car service &amp; maintenance from certified garages
                near you. Transparent pricing, genuine parts, and hassle-free
                experience.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/book"
                  className="sheen inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all duration-200 active:scale-[0.97]"
                >
                  Book a Service
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl text-base font-semibold glass-card text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] transition-all duration-200"
                  style={{ transform: "none" }}
                >
                  See how it works
                </a>
              </div>

              {/* Trust Stats */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {trustStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="glass-card flex flex-col items-center gap-2 p-5 !rounded-2xl"
                      style={{ transform: "none" }}
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10">
                        <Icon className="h-5 w-5 text-red-500" />
                      </div>
                      <span className="text-2xl sm:text-3xl font-bold gradient-text">
                        {stat.value}
                      </span>
                      <span className="text-sm text-[var(--text-tertiary)] font-medium">
                        {stat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ======================================================== */}
          {/*  SERVICES SECTION                                         */}
          {/* ======================================================== */}
          <section id="services" className="glass-panel p-8 sm:p-12">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                What we offer
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                Our Services
              </h2>
              <p className="mt-4 text-base text-[var(--text-secondary)] leading-relaxed">
                From routine maintenance to major repairs, we have got you covered
                with a wide range of car care services.
              </p>
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    custom={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <Link href="/book" className="block group">
                      <div className="glass-card p-7 sheen h-full">
                        {/* Icon */}
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 mb-5 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                          <Icon className="h-7 w-7 text-red-500" />
                        </div>

                        {/* Title + Price */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {service.title}
                          </h3>
                          <span className="glass-card px-2.5 py-1 !rounded-full text-[11px] font-medium text-red-500 whitespace-nowrap" style={{ transform: "none" }}>
                            {service.price}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
                          {service.description}
                        </p>

                        {/* Book Now link */}
                        <span className="inline-flex items-center text-sm font-semibold text-red-500 transition-colors duration-200 group-hover:text-red-400">
                          Book Now
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/*  HOW IT WORKS SECTION                                     */}
          {/* ======================================================== */}
          <section className="glass-panel p-8 sm:p-12">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                Simple process
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                How It Works
              </h2>
              <p className="mt-4 text-base text-[var(--text-secondary)] leading-relaxed">
                Getting your car serviced is as easy as 1-2-3-4. No hassle, no
                surprises.
              </p>
            </div>

            {/* Steps */}
            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {/* Connecting line (desktop only) */}
              <div
                className="hidden lg:block absolute top-16 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
                aria-hidden="true"
              />

              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    custom={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="relative flex flex-col items-center text-center"
                  >
                    {/* Icon circle */}
                    <div className="relative mb-6">
                      <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-red-600 to-red-700 shadow-[0_18px_40px_-12px_rgba(220,38,38,0.6)] text-white">
                        <Icon className="h-8 w-8" />
                      </div>
                      {/* Step number badge */}
                      <span className="absolute -top-2 -right-2 glass-card flex items-center justify-center h-7 w-7 !rounded-full text-[10px] font-bold text-red-500" style={{ transform: "none" }}>
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[220px]">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/*  WHY CHOOSE US SECTION                                    */}
          {/* ======================================================== */}
          <section className="glass-panel p-8 sm:p-12">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                Our promise
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                Why Car Affair?
              </h2>
              <p className="mt-4 text-base text-[var(--text-secondary)] leading-relaxed">
                We are committed to making car care simple, transparent, and
                reliable for every car owner.
              </p>
            </div>

            {/* Feature Cards 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {whyUs.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    custom={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="flex items-start gap-5 glass-card p-7"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20">
                      <Icon className="h-7 w-7 text-red-500" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/*  COVERAGE & PARTNERS                                      */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="glass-panel p-8 sm:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPinned className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Free pickup zones</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">Across all of Hyderabad.</h2>
                </div>
              </div>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed mb-6">
                Free doorstep pickup &amp; drop in 16+ neighbourhoods. Outside-zone pickup available with a transparent distance fee.
              </p>
              <div className="flex flex-wrap gap-2">
                {coverageZones.map((z) => (
                  <span key={z} className="px-3 py-1.5 rounded-full glass-card text-xs text-[var(--text-secondary)]" style={{ transform: "none" }}>
                    {z}
                  </span>
                ))}
              </div>
            </section>

            <section className="glass-panel p-8 sm:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/25 to-red-700/15 ring-1 ring-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Trusted partners</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">Insurance &amp; OEM-grade parts.</h2>
                </div>
              </div>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed mb-6">
                Cashless insurance partners and OEM-grade parts &amp; lubricants from the brands you already trust.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {partners.map((p) => (
                  <div key={p.label} className="glass-card p-4 flex items-center justify-between" style={{ transform: "none" }}>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{p.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{p.kind}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ======================================================== */}
          {/*  TESTIMONIALS                                             */}
          {/* ======================================================== */}
          <section className="glass-panel p-8 sm:p-12">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                Loved by owners
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                What our customers say.
              </h2>
              <div className="flex items-center justify-center gap-1 mt-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                ))}
                <span className="ml-2 text-sm font-semibold text-[var(--text-primary)]">4.9 / 5</span>
                <span className="text-sm text-[var(--text-tertiary)]">&middot; based on 2,400+ reviews</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {testimonials.map((t, idx) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="relative glass-card p-6 flex flex-col"
                >
                  <Quote className="absolute top-5 right-5 h-8 w-8 text-red-500/15" />
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 pt-4 border-t border-[var(--border-glass)] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ======================================================== */}
          {/*  FAQ                                                      */}
          {/* ======================================================== */}
          <section className="max-w-4xl mx-auto w-full">
            <div className="glass-panel p-8 sm:p-12">
              <div className="text-center mb-10">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                  Common questions
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  Everything you might be wondering.
                </h2>
              </div>
              <div className="space-y-3">
                {faqs.map((f) => (
                  <FaqItem key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/*  CTA SECTION                                              */}
          {/* ======================================================== */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-panel relative overflow-hidden p-8 sm:p-14"
          >
            {/* Background glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-[-10%] w-[40%] h-[60%] bg-red-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-[-5%] w-[30%] h-[50%] bg-red-700/10 rounded-full blur-3xl" />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                  Ready to give your car
                  <br className="hidden sm:block" />
                  <span className="gradient-text"> the care it deserves?</span>
                </h2>
                <p className="mt-5 text-lg text-[var(--text-secondary)]">
                  Join thousands of happy customers who trust Car Affair for their
                  car care needs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <Link
                  href="/book"
                  className="sheen inline-flex items-center justify-center gap-2 h-14 px-10 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_18px_40px_-14px_rgba(220,38,38,0.7)] transition-all duration-200 active:scale-[0.97]"
                >
                  Book Now
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl glass-card" style={{ transform: "none" }}>
                    <Phone className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs text-[var(--text-tertiary)] font-medium">
                      Call Us
                    </span>
                    <a
                      href="tel:+919000000000"
                      className="text-lg font-semibold text-[var(--text-primary)] hover:text-red-500 transition-colors"
                    >
                      +91 90000 00000
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
