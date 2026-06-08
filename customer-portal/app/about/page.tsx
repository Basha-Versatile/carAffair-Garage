"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  Star,
  Clock,
  Heart,
  CheckCircle2,
  Target,
  Eye,
} from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { useCountUp } from "@/hooks/useCountUp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const stats = [
  { label: "Partner Garages", value: 500, suffix: "+" },
  { label: "Services Completed", value: 10000, suffix: "+" },
  { label: "Happy Customers", value: 50000, suffix: "+" },
  { label: "Customer Rating", value: 4.9, suffix: "★", isDecimal: true },
];

const values = [
  {
    icon: Shield,
    title: "Transparency",
    description:
      "No hidden charges, no surprises. Every service comes with upfront pricing and real-time updates so you always know what's happening with your car.",
  },
  {
    icon: Star,
    title: "Quality",
    description:
      "We partner only with verified, highly-rated garages that meet our strict quality standards. Your car deserves the best, and we deliver it.",
  },
  {
    icon: Clock,
    title: "Convenience",
    description:
      "Book a service in 60 seconds. Choose your time, pick your garage, and we handle the rest — from reminders to post-service follow-ups.",
  },
  {
    icon: Heart,
    title: "Trust",
    description:
      "Every service backed by a 90-day warranty. We stand behind our partner garages and ensure your complete satisfaction.",
  },
];

function StatCounter({
  value,
  suffix,
  label,
  isDecimal,
}: {
  value: number;
  suffix: string;
  label: string;
  isDecimal?: boolean;
}) {
  const { ref, count } = useCountUp(isDecimal ? Math.floor(value * 10) : value, 2000);
  return (
    <div ref={ref} className="text-center group/stat">
      <div className="relative inline-block mb-3">
        <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto transition-all duration-500 group-hover/stat:border-[rgba(204,0,0,0.5)] group-hover/stat:shadow-[0_0_24px_-4px_rgba(204,0,0,0.3)]">
          <div className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-montserrat)]">
            {isDecimal ? (count / 10).toFixed(1) : count.toLocaleString()}
            {suffix}
          </div>
        </div>
      </div>
      <div className="text-white/60 text-sm">{label}</div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
    <Navbar />
    <main>
      {/* Hero Banner */}
      <section className="bg-gray-50 dark:bg-[#1A1A1A] py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll type="fadeUp">
            <span className="section-tag">Who We Are</span>
          </AnimateOnScroll>
          <AnimateOnScroll type="fadeUp" delay={0.1}>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-montserrat)] leading-tight">
              About Car Affair
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll type="fadeUp" delay={0.2}>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 dark:text-white/50">
              <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-600 dark:text-white/80">About Us</span>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 sm:py-32 bg-white dark:bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimateOnScroll type="fadeLeft">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80"
                  alt="Car Affair workshop"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </AnimateOnScroll>

            <div>
              <AnimateOnScroll type="fadeRight">
                <span className="section-tag">Our Story</span>
              </AnimateOnScroll>
              <AnimateOnScroll type="fadeRight" delay={0.1}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)] leading-tight">
                  Driven by Trust,
                  <br />
                  Powered by Technology
                </h2>
              </AnimateOnScroll>
              <AnimateOnScroll type="fadeRight" delay={0.2}>
                <p className="mt-6 text-gray-500 dark:text-gray-400 leading-relaxed">
                  Car Affair was born from a simple frustration — finding a
                  reliable mechanic shouldn&apos;t feel like a gamble. Too many car
                  owners have experienced the anxiety of not knowing if they&apos;re
                  being charged fairly, or if the work done on their car is
                  actually necessary.
                </p>
                <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">
                  We set out to change that. By combining technology with a
                  network of verified, trusted garages, we&apos;ve created a platform
                  where transparency isn&apos;t just a promise — it&apos;s built into
                  every interaction. From upfront pricing to real-time service
                  tracking, we put you in control of your car care experience.
                </p>
              </AnimateOnScroll>
              <AnimateOnScroll type="fadeRight" delay={0.3}>
                <div className="mt-8 space-y-3">
                  {[
                    "Verified & rated partner garages across India",
                    "Transparent pricing with no hidden charges",
                    "90-day service warranty on every job",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#CC0000] mt-0.5 shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 sm:py-32 bg-gray-50 dark:bg-[#171717]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll type="fadeUp">
            <div className="text-center mb-12">
              <span className="section-tag">What Drives Us</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)]">
                Mission & Vision
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-8">
            <AnimateOnScroll type="fadeLeft" delay={0.1}>
              <div className="card p-8 sm:p-10 h-full group/mission">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-[var(--crank-red)] text-white shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)] mb-6 transition-transform duration-500 group-hover/mission:scale-110 group-hover/mission:rotate-6">
                  <Target className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)]">
                  Our Mission
                </h3>
                <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
                  To make car care transparent, affordable, and accessible for
                  every car owner in India. We believe that maintaining your
                  vehicle should be as simple as booking a cab — no stress, no
                  surprises, just quality service you can trust.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll type="fadeRight" delay={0.1}>
              <div className="card p-8 sm:p-10 h-full group/vision">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-[var(--crank-red)] text-white shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)] mb-6 transition-transform duration-500 group-hover/vision:scale-110 group-hover/vision:-rotate-6">
                  <Eye className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)]">
                  Our Vision
                </h3>
                <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
                  To become India&apos;s most trusted auto-care platform — a name
                  synonymous with quality, transparency, and customer
                  satisfaction. We envision a future where every car owner has
                  access to premium garage services, regardless of where they
                  live.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-24 sm:py-32 bg-[var(--crank-black)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll type="fadeUp">
            <div className="text-center mb-14">
              <span className="section-tag">By the Numbers</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-montserrat)]">
                Our Impact So Far
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {stats.map((stat, i) => (
              <AnimateOnScroll key={stat.label} type="scaleIn" delay={i * 0.1}>
                <StatCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  isDecimal={stat.isDecimal}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 sm:py-32 bg-white dark:bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll type="fadeUp">
            <div className="text-center mb-14">
              <span className="section-tag">Our Values</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)]">
                What We Stand For
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <AnimateOnScroll key={value.title} type="scaleIn" delay={i * 0.1}>
                <div className="card p-8 text-center h-full group/value">
                  <div className="icon-ring flex items-center justify-center h-14 w-14 rounded-full bg-[#CC0000] text-white shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)] mx-auto mb-5 transition-transform duration-500 group-hover/value:scale-110 group-hover/value:-translate-y-1">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-[family-name:var(--font-montserrat)]">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 bg-[var(--crank-black)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#CC0000]/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <AnimateOnScroll type="fadeUp">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[family-name:var(--font-montserrat)] leading-tight">
              Experience the
              <br />
              <span className="gradient-text-animated">Car Affair</span>{" "}
              Difference
            </h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">
              Join thousands of car owners who trust us for transparent,
              quality auto care.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/book" className="btn-primary text-base !py-3.5 !px-8">
                Book a Service
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/partner"
                className="btn-outline !border-white/20 !text-white hover:!bg-white/10 text-base !py-3.5 !px-8"
              >
                Partner With Us
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
