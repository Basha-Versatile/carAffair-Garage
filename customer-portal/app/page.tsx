"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  ChevronDown,
  ArrowRight,
  Phone,
  Star,
  Users,
  Building2,
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
  },
  {
    title: "AC Service & Repair",
    icon: Thermometer,
    description:
      "AC gas refill, compressor repair, cooling coil service, and complete AC checkup",
  },
  {
    title: "Wheel & Tyre Care",
    icon: CircleDot,
    description:
      "Wheel alignment, balancing, tyre replacement, and puncture repair",
  },
  {
    title: "Denting & Painting",
    icon: Paintbrush,
    description:
      "Scratch removal, full body paint, panel beating, and rust treatment",
  },
  {
    title: "Battery Service",
    icon: Zap,
    description:
      "Battery testing, replacement, jump start, and charging system check",
  },
  {
    title: "Periodic Maintenance",
    icon: Clock,
    description:
      "Scheduled maintenance as per manufacturer recommendations",
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
  { label: "Services", value: "10,000+", icon: Star },
  { label: "Happy Customers", value: "50,000+", icon: Users },
];

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E63946] to-[#9B1B24]">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute top-1/4 right-0 translate-x-1/2 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/3 translate-y-1/3 h-72 w-72 rounded-full bg-white/[0.07]" />
          <div className="absolute top-10 right-1/4 h-40 w-40 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-1/4 left-10 h-56 w-56 rounded-full bg-white/[0.03]" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center pt-20 pb-28">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight animate-fade-in">
            Your Car Deserves
            <br />
            The Best Care
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-red-50/90 leading-relaxed animate-slide-up [animation-delay:0.15s]">
            Book trusted car service &amp; maintenance from certified garages
            near you. Transparent pricing, genuine parts, and hassle-free
            experience.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:0.3s]">
            <Link
              href="/book"
              className="btn-glow inline-flex items-center justify-center h-14 px-8 rounded-full bg-white text-[#E63946] font-semibold text-lg shadow-lg shadow-red-900/20 transition-all duration-200 hover:bg-red-50 hover:shadow-xl hover:scale-105 active:scale-[0.98]"
            >
              Book a Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Trust Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 animate-scale-in [animation-delay:0.5s]">
            {trustStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-2 rounded-xl p-4 bg-white/10 backdrop-blur-sm border border-white/10"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/15 mb-1">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-sm text-white/70 font-medium">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll-down indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce-slow">
          <a
            href="#services"
            aria-label="Scroll to services"
            className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <span className="text-xs font-medium tracking-wider uppercase">
              Explore
            </span>
            <ChevronDown className="h-6 w-6" />
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SERVICES SECTION                                             */}
      {/* ============================================================ */}
      <section id="services" className="py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-14 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Our Services
            </h2>
            <p className="mt-4 text-lg text-secondary leading-relaxed">
              From routine maintenance to major repairs, we have got you covered
              with a wide range of car care services.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="group relative bg-card-bg glass-card-premium border border-edge rounded-xl p-6 lg:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up border-revolve"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary-light text-primary mb-5 transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-7 w-7 icon-shift-up" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-secondary leading-relaxed mb-5">
                    {service.description}
                  </p>

                  {/* Book Now link */}
                  <Link
                    href="/book"
                    className="inline-flex items-center text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover group-hover:underline"
                  >
                    Book Now
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS SECTION                                         */}
      {/* ============================================================ */}
      <section className="py-20 lg:py-28 bg-dim section-gradient-top">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-14 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-secondary leading-relaxed">
              Getting your car serviced is as easy as 1-2-3-4. No hassle, no
              surprises.
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
            {/* Connecting line (desktop only) */}
            <div
              className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-edge"
              aria-hidden="true"
            />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative flex flex-col items-center text-center glass-card-premium rounded-xl p-6 animate-slide-up"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                >
                  {/* Number badge */}
                  <div className="relative z-10 flex items-center justify-center h-28 w-28 mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full bg-primary/10" />
                    {/* Inner circle */}
                    <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-background border-2 border-primary shadow-sm">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    {/* Step number */}
                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold shadow-md">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-secondary leading-relaxed max-w-[220px]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WHY CHOOSE US SECTION                                        */}
      {/* ============================================================ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-14 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Why Car Affair?
            </h2>
            <p className="mt-4 text-lg text-secondary leading-relaxed">
              We are committed to making car care simple, transparent, and
              reliable for every car owner.
            </p>
          </div>

          {/* Feature Cards 2x2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {whyUs.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-5 p-6 lg:p-8 rounded-xl bg-card-bg glass-card-premium border border-edge border-l-4 border-l-primary transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-slide-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-primary-light text-primary">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA BANNER SECTION                                           */}
      {/* ============================================================ */}
      <section className="relative py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-[#E63946] to-[#9B1B24]">
        {/* Subtle pattern overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight animate-fade-in">
            Ready to give your car
            <br className="hidden sm:block" /> the care it deserves?
          </h2>

          <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto animate-slide-up [animation-delay:0.15s]">
            Join thousands of happy customers who trust Car Affair for their car
            care needs.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 animate-scale-in [animation-delay:0.3s]">
            <Link
              href="/book"
              className="btn-glow inline-flex items-center justify-center h-14 px-10 rounded-full bg-white text-[#E63946] font-semibold text-lg shadow-lg shadow-red-900/20 transition-all duration-200 hover:bg-red-50 hover:shadow-xl hover:scale-105 active:scale-[0.98]"
            >
              Book Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <div className="flex items-center gap-3 text-white/90">
              <div className="flex items-center justify-center h-11 w-11 rounded-full bg-white/15">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-xs text-white/60 font-medium">
                  Call Us
                </span>
                <a
                  href="tel:+919000000000"
                  className="text-lg font-semibold text-white hover:underline"
                >
                  +91 90000 00000
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <Footer />
    </>
  );
}
