"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { useCountUp } from "@/hooks/useCountUp";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
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
  Quote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  CheckCircle2,
  Play,
  Droplets,
  Gauge,
  Disc3,
  ShieldPlus,
  Sparkles,
  ScanLine,
  Fuel,
  FileCheck,
  Trophy,
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
    description: "Scheduled maintenance as per manufacturer recommendations",
  },
];

const moreServices = [
  { label: "Car Wash & Detailing", icon: Droplets },
  { label: "Engine Diagnostics", icon: Gauge },
  { label: "Clutch & Transmission", icon: Disc3 },
  { label: "Insurance Claims", icon: ShieldPlus },
  { label: "Car Inspection", icon: ScanLine },
  { label: "Interior Cleaning", icon: Sparkles },
  { label: "Fuel System", icon: Fuel },
  { label: "Roadside Assistance", icon: Truck },
  { label: "Pre-Purchase Check", icon: FileCheck },
  { label: "Custom Modifications", icon: Cog },
];

const steps = [
  {
    number: "01",
    title: "Choose Service",
    icon: ClipboardList,
    description:
      "Select the service your car needs from our comprehensive list",
  },
  {
    number: "02",
    title: "Pick a Slot",
    icon: Calendar,
    description: "Choose a convenient date and time that works for you",
  },
  {
    number: "03",
    title: "We Service",
    icon: Cog,
    description: "Our certified mechanics take care of your car professionally",
  },
  {
    number: "04",
    title: "Drive Happy",
    icon: Car,
    description: "Get your car back in perfect condition, ready to roll",
  },
];

const whyUs = [
  {
    title: "Certified Garages",
    icon: ShieldCheck,
    description:
      "All vendor garages are verified and certified for quality service standards",
  },
  {
    title: "Transparent Pricing",
    icon: IndianRupee,
    description:
      "No hidden charges. See the price breakdown before you book your service",
  },
  {
    title: "Genuine Parts",
    icon: Package,
    description: "We use only genuine OEM and OES spare parts for every repair",
  },
  {
    title: "Pick & Drop",
    icon: Truck,
    description: "Free doorstep pickup and drop service for your convenience",
  },
];

const trustStats = [
  { label: "Expert Team Members", value: 500, suffix: "+", icon: Users },
  { label: "Completed Services", value: 10000, suffix: "+", icon: Star },
  { label: "Happy Customers", value: 50000, suffix: "+", icon: Building2 },
  {
    label: "Average Rating",
    value: 4.9,
    suffix: "★",
    icon: ShieldCheck,
    isDecimal: true,
  },
];

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1600&q=80",
    tag: "Trusted Auto Care",
    heading: "Expert Car Care,",
    highlight: "Trusted Service",
    description:
      "Keep your vehicle running at its best with professional maintenance, repairs, diagnostics, and detailing services. Our certified technicians deliver reliable service, transparent pricing, and quality workmanship for every vehicle.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1600&q=80",
    tag: "Premium Quality",
    heading: "Precision Repairs,",
    highlight: "Lasting Results",
    description:
      "From engine overhauls to minor fixes — our skilled mechanics use genuine OEM parts and advanced diagnostics to keep your car performing at its peak. Every repair backed by our 90-day warranty.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80",
    tag: "Hassle-Free Booking",
    heading: "Your Car Deserves,",
    highlight: "The Best Care",
    description:
      "Book your service in minutes, get free pickup & drop, and track your car's progress in real time. Experience seamless auto care with transparent pricing and no hidden charges.",
  },
];

function StatCounter({
  value,
  suffix,
  label,
  icon: Icon,
  isDecimal,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
  isDecimal?: boolean;
}) {
  const { ref, count } = useCountUp(
    isDecimal ? Math.floor(value * 10) : value,
    2200,
  );
  return (
    <div ref={ref} className="text-center px-4 py-2">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(204,0,0,0.1)] mx-auto mb-3">
        <Icon className="h-5 w-5 text-[var(--crank-red)]" />
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
        {isDecimal ? (count / 10).toFixed(1) : count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-[var(--text-secondary)] mt-1">{label}</div>
    </div>
  );
}

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "BMW 3 Series Owner",
    quote:
      "They sent photos of every scratch before starting work and called before doing anything extra. Most transparent workshop I have ever used.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Audi A4 Owner",
    quote:
      "Pickup at 9 AM, car back by 6 PM, full digital invoice on WhatsApp. Best service experience in 12 years of driving.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Toyota Fortuner Owner",
    quote:
      "I could decline the items I did not want from the quote — that alone saved me ₹6,000. I will not go anywhere else.",
    rating: 5,
  },
  {
    name: "Sneha Reddy",
    role: "Hyundai Creta Owner",
    quote:
      "My car came back cleaner than I left it. The pickup driver was on time, and the WhatsApp updates were almost too good.",
    rating: 5,
  },
];

const partners = [
  { label: "HDFC ERGO", kind: "Insurance" },
  { label: "ICICI Lombard", kind: "Insurance" },
  { label: "Bajaj Allianz", kind: "Insurance" },
  { label: "Tata AIG", kind: "Insurance" },
  { label: "Bosch", kind: "Parts" },
  { label: "3M", kind: "Coatings" },
  { label: "Mobil 1", kind: "Lubricants" },
  { label: "Castrol", kind: "Lubricants" },
];

const coverageZones = [
  "Banjara Hills",
  "Jubilee Hills",
  "Madhapur",
  "Hitech City",
  "Gachibowli",
  "Kondapur",
  "Manikonda",
  "Begumpet",
  "Somajiguda",
  "Punjagutta",
  "Ameerpet",
  "SR Nagar",
  "Kukatpally",
  "Miyapur",
  "Tellapur",
  "Nallagandla",
];

const faqs = [
  {
    q: "How is Car Affair different from a regular workshop?",
    a: "You get a digital paper trail of everything — timestamped photos, an itemised quote you can edit, real-time WhatsApp updates, and a GST-compliant invoice. Every job has a named advisor and named technician accountable for it.",
  },
  {
    q: "Do you service all car brands?",
    a: "Yes. Our technicians are trained on Indian, European, Japanese, and Korean brands — from Maruti and Hyundai to BMW, Mercedes, Audi, and Porsche. We use OEM-grade parts for every brand.",
  },
  {
    q: "Is pickup & drop really free?",
    a: "Yes, anywhere within Hyderabad city limits. Outside the city we charge a small distance fee that is shown to you before you confirm the booking.",
  },
  {
    q: "What if I find a problem after the service?",
    a: "Every service comes with a 90-day warranty on both labour and the parts we installed. If something goes wrong, we fix it free of cost — pickup included.",
  },
  {
    q: "How long does a typical service take?",
    a: "A periodic service is usually a same-day turnaround. Major repairs and detailing jobs take 1–3 days, and you get a clear ETA before we start.",
  },
];

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    alt: "Engine repair in progress",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80",
    alt: "Car detailing service",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80",
    alt: "Professional mechanic at work",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&q=80",
    alt: "Wheel alignment service",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80",
    alt: "Finished car ready for delivery",
    span: "",
  },
];

function FallingText({
  text,
  className,
  redText,
}: {
  text: string;
  className?: string;
  redText?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");
  const redWords = redText ? redText.split(" ") : [];

  return (
    <h2
      ref={ref}
      className={cn("falling-text", animate && "animate", className)}
    >
      {words.map((word, i) => (
        <span key={i}>{word}&nbsp;</span>
      ))}
      {redText && (
        <>
          <br />
          <span
            className="text-[var(--crank-red)]"
            style={{ display: "inline" }}
          >
            {redWords.map((word, i) => (
              <span
                key={`r${i}`}
                style={{ animationDelay: `${(words.length + i) * 0.07}s` }}
              >
                {word}&nbsp;
              </span>
            ))}
          </span>
        </>
      )}
    </h2>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border-color)] last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="font-semibold text-[var(--text-primary)] text-base pr-6 group-hover:text-[var(--crank-red)] transition-colors font-[family-name:var(--font-montserrat)]">
          {q}
        </span>
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${open ? "bg-[var(--crank-red)] text-white rotate-180" : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"}`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
    },
    [currentSlide],
  );

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  }, []);

  /* Auto-play */
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />

      <main className="flex-1">
        {/* ======================================================== */}
        {/*  HERO CAROUSEL — Crank-style: dark bg, gears, float img  */}
        {/* ======================================================== */}
        <section className="relative min-h-[580px] lg:min-h-[700px] flex items-center overflow-hidden bg-black">
          {/* Decorative gear SVGs — visible white outlines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Large gear — left center */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[520px] h-[520px]">
              <svg
                className="w-full h-full text-white/8 hero-gear-spin"
                viewBox="0 0 200 200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M100 10l8 20a70 70 0 0 1 24.5 10.1l21.2-5.4 5.4 13.5-18.3 12a70 70 0 0 1 10.1 24.5l20 8v14.6l-20 8a70 70 0 0 1-10.1 24.5l18.3 12-5.4 13.5-21.2-5.4A70 70 0 0 1 108 170l-8 20H86l-8-20a70 70 0 0 1-24.5-10.1l-21.2 5.4-5.4-13.5 18.3-12A70 70 0 0 1 35.1 115.3l-20-8V92.7l20-8a70 70 0 0 1 10.1-24.5l-18.3-12 5.4-13.5 21.2 5.4A70 70 0 0 1 78 30l8-20h14zM100 65a35 35 0 1 0 0 70 35 35 0 0 0 0-70z" />
              </svg>
            </div>
            {/* Medium gear — top right area */}
            <div className="absolute -right-8 -top-8 w-[320px] h-[320px]">
              <svg
                className="w-full h-full text-white/6 hero-gear-spin-reverse"
                viewBox="0 0 200 200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M100 10l8 20a70 70 0 0 1 24.5 10.1l21.2-5.4 5.4 13.5-18.3 12a70 70 0 0 1 10.1 24.5l20 8v14.6l-20 8a70 70 0 0 1-10.1 24.5l18.3 12-5.4 13.5-21.2-5.4A70 70 0 0 1 108 170l-8 20H86l-8-20a70 70 0 0 1-24.5-10.1l-21.2 5.4-5.4-13.5 18.3-12A70 70 0 0 1 35.1 115.3l-20-8V92.7l20-8a70 70 0 0 1 10.1-24.5l-18.3-12 5.4-13.5 21.2 5.4A70 70 0 0 1 78 30l8-20h14zM100 65a35 35 0 1 0 0 70 35 35 0 0 0 0-70z" />
              </svg>
            </div>
            {/* Small gear — bottom center-left */}
            <div className="absolute left-[28%] -bottom-6 w-[200px] h-[200px]">
              <svg
                className="w-full h-full text-white/5 hero-gear-spin"
                viewBox="0 0 200 200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M100 10l8 20a70 70 0 0 1 24.5 10.1l21.2-5.4 5.4 13.5-18.3 12a70 70 0 0 1 10.1 24.5l20 8v14.6l-20 8a70 70 0 0 1-10.1 24.5l18.3 12-5.4 13.5-21.2-5.4A70 70 0 0 1 108 170l-8 20H86l-8-20a70 70 0 0 1-24.5-10.1l-21.2 5.4-5.4-13.5 18.3-12A70 70 0 0 1 35.1 115.3l-20-8V92.7l20-8a70 70 0 0 1 10.1-24.5l-18.3-12 5.4-13.5 21.2 5.4A70 70 0 0 1 78 30l8-20h14zM100 65a35 35 0 1 0 0 70 35 35 0 0 0 0-70z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 lg:pt-16 pb-24 sm:pb-28 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              {/* Left — Text slides in from LEFT */}
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[rgba(204,0,0,0.4)] text-sm font-semibold text-white/90 mb-8 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[var(--crank-red)] animate-pulse" />
                      {slide.tag}
                    </span>

                    <h1
                      className="text-3xl sm:text-4xl lg:text-[48px] xl:text-[56px] font-black leading-[1.1] font-[family-name:var(--font-montserrat)] tracking-tight"
                      style={{ color: "#ffffff" }}
                    >
                      {slide.heading}
                      <br />
                      <span
                        className="text-[var(--crank-red)]"
                        style={{ color: "var(--crank-red)" }}
                      >
                        {slide.highlight}
                      </span>
                    </h1>

                    <p
                      className="mt-8 text-[17px] leading-relaxed max-w-lg"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {slide.description}
                    </p>

                    <div className="mt-10 flex items-center gap-5">
                      <Link
                        href="/book"
                        className="group/btn inline-flex items-center gap-3 px-9 py-4 border-2 border-[var(--crank-red)] text-white font-bold text-[15px] uppercase tracking-wider rounded-4xl hover:bg-[var(--crank-red)] transition-all duration-300"
                      >
                        Book Now
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Link>
                      <a
                        href="#services"
                        className="group/play flex items-center gap-3 cursor-pointer"
                      >
                        <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[var(--crank-red)] text-[var(--crank-red)] group-hover/play:bg-[var(--crank-red)] group-hover/play:text-white transition-all duration-300">
                          <Play className="h-5 w-5 ml-0.5" />
                        </span>
                        <span className="text-white/50 text-sm font-medium hidden sm:block">
                          Explore
                          <br />
                          Services
                        </span>
                      </a>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right — Image slides in from RIGHT with 3D perspective */}
              <div
                className="relative flex items-center justify-center"
                style={{ perspective: "800px" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 400, rotateY: -15 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: 300, rotateY: 10 }}
                    transition={{
                      duration: 1.5,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    style={{ transformOrigin: "top center" }}
                    className="relative w-full aspect-[4/3] lg:aspect-[5/4] max-w-[560px] mx-auto hero-image-float"
                  >
                    {/* Red accent border — offset behind */}
                    <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl border-2 border-[rgba(204,0,0,0.3)]" />
                    {/* Image container */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)]">
                      <Image
                        src={slide.image}
                        alt={slide.heading}
                        fill
                        priority={currentSlide === 0}
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      {/* Subtle gradient overlay at bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    </div>

                    {/* Floating experience badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.5,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className="absolute -bottom-6 -left-6 bg-[var(--crank-red)] text-white rounded-xl px-5 py-4 shadow-[0_12px_32px_-4px_rgba(204,0,0,0.5)] z-10"
                    >
                      <p className="text-3xl font-extrabold font-[family-name:var(--font-montserrat)] leading-none">
                        500+
                      </p>
                      <p className="text-xs text-white/80 mt-1 font-medium">
                        Certified Garages
                      </p>
                    </motion.div>

                    {/* Rating badge — top left */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.7,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className="absolute -top-4 -left-4 bg-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-10 flex items-center gap-2"
                    >
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 text-[var(--crank-red)] fill-[var(--crank-red)]"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-[var(--crank-black)] font-[family-name:var(--font-montserrat)]">
                        4.9
                      </span>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Decorative dots grid behind image */}
                <div className="absolute -right-6 -bottom-8 w-32 h-32 grid grid-cols-5 gap-2 opacity-20 pointer-events-none">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--crank-red)]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center text-white/40 hover:text-[var(--crank-red)] transition-all duration-300 cursor-pointer group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-8 w-8 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center text-white/40 hover:text-[var(--crank-red)] transition-all duration-300 cursor-pointer group"
            aria-label="Next slide"
          >
            <ChevronRight className="h-8 w-8 group-hover:scale-110 transition-transform" />
          </button>

          {/* Carousel Dots + Counter */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={cn(
                  "rounded-full transition-all duration-500 cursor-pointer",
                  idx === currentSlide
                    ? "w-10 h-3 bg-[var(--crank-red)]"
                    : "w-3 h-3 bg-white/25 hover:bg-white/50",
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 z-20 text-white/30 text-sm font-[family-name:var(--font-montserrat)] font-medium">
            <span className="text-white/80 text-lg font-bold">
              {String(currentSlide + 1).padStart(2, "0")}
            </span>
            <span className="mx-1.5">/</span>
            <span>{String(heroSlides.length).padStart(2, "0")}</span>
          </div>

          {/* Bottom decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[rgba(204,0,0,0.4)] to-transparent" />
        </section>

        {/* ======================================================== */}
        {/*  STATS BAR — White bordered card, overlapping hero       */}
        {/* ======================================================== */}
        <section className="relative z-20 -mt-12 sm:-mt-16 mb-8">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateOnScroll type="fadeUp">
              <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-6 py-8 sm:px-10 sm:py-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[var(--border-color)]">
                  {trustStats.map((stat) => (
                    <StatCounter
                      key={stat.label}
                      value={stat.value}
                      suffix={stat.suffix}
                      label={stat.label}
                      icon={stat.icon}
                      isDecimal={stat.isDecimal}
                    />
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  SERVICES SECTION                                         */}
        {/* ======================================================== */}
        <section id="services" className="py-24 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateOnScroll
              type="fadeUp"
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <span className="section-tag justify-center">Our Services</span>
              <FallingText
                text="Complete Car Care"
                redText="Under One Roof"
                className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] leading-tight"
              />
              <p className="mt-5 text-[var(--text-secondary)] leading-relaxed">
                From routine maintenance to major overhauls — we handle every
                aspect of your car&apos;s health with 50+ services across all
                brands.
              </p>
            </AnimateOnScroll>

            {/* Featured Services — 6 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <AnimateOnScroll
                    key={service.title}
                    type="fadeUp"
                    delay={idx * 0.08}
                  >
                    <Link href="/book" className="block group">
                      <div className="service-card px-7 py-9 h-full">
                        {/* Centered icon in a bordered circle */}
                        <div className="flex justify-center mb-6">
                          <div className="sc-icon-ring flex items-center justify-center h-[72px] w-[72px] rounded-full border-2 border-[rgba(204,0,0,0.25)] bg-[rgba(204,0,0,0.05)] transition-all duration-500">
                            <Icon className="h-7 w-7 text-[var(--crank-red)] transition-colors duration-500" />
                          </div>
                        </div>
                        {/* Title */}
                        <h3 className="sc-title text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] transition-colors duration-500 mb-3">
                          {service.title}
                        </h3>
                        {/* Description */}
                        <p className="sc-desc text-[14px] text-[var(--text-secondary)] leading-relaxed mb-6 transition-colors duration-500">
                          {service.description}
                        </p>
                        {/* Bottom link */}
                        <div className="sc-divider pt-4 border-t border-[var(--border-color)] transition-all duration-500">
                          <span className="sc-link inline-flex items-center text-sm font-semibold text-[var(--crank-red)] transition-colors duration-500">
                            Book Now
                            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </AnimateOnScroll>
                );
              })}
            </div>

            {/* More Services — shows breadth */}
            <AnimateOnScroll type="fadeUp" delay={0.3}>
              <div className="mt-14 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
                      And Much More…
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      We cover 50+ services across every car brand — here are a
                      few more popular ones.
                    </p>
                  </div>
                  <Link
                    href="/book"
                    className="btn-primary !py-3 !px-6 shrink-0"
                  >
                    Book Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3">
                  {moreServices.map((svc, idx) => {
                    const SvcIcon = svc.icon;
                    return (
                      <motion.div
                        key={svc.label}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{
                          delay: idx * 0.05,
                          duration: 0.35,
                          ease: "easeOut",
                        }}
                      >
                        <Link
                          href="/book"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--crank-red)] hover:text-[var(--crank-red)] hover:shadow-[0_4px_12px_rgba(204,0,0,0.1)] transition-all duration-200"
                        >
                          <SvcIcon className="h-4 w-4 text-[var(--crank-red)]" />
                          {svc.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      delay: moreServices.length * 0.05,
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                  >
                    <Link
                      href="/book"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(204,0,0,0.05)] border border-[rgba(204,0,0,0.2)] text-sm font-semibold text-[var(--crank-red)] hover:bg-[var(--crank-red)] hover:text-white hover:border-[var(--crank-red)] transition-all duration-200"
                    >
                      + More Services
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  EXPERT SERVICE — Gradient CTA Card + Image               */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-secondary)] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-stretch">
              {/* Left — Gradient Card */}
              <AnimateOnScroll type="fadeLeft">
                <div className="relative rounded-3xl lg:rounded-r-none overflow-hidden p-10 sm:p-14 h-full bg-gradient-to-br from-[#0d0d1f] via-[#1a1028] to-[var(--crank-red-dark)]">
                  {/* Decorative shapes */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/3 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-10 left-10 w-32 h-32 bg-[rgba(204,0,0,0.1)] rounded-full blur-2xl" />
                  <div className="absolute top-1/2 right-0 w-20 h-20 border border-white/6 rounded-full translate-x-1/2" />

                  <div className="relative z-10 flex flex-col justify-center h-full">
                    <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[var(--crank-red)] mb-6">
                      <span className="w-8 h-[2px] bg-[var(--crank-red)] rounded-full" />
                      Car Repair
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold font-[family-name:var(--font-montserrat)] leading-[1.1]">
                      <span className="text-white">Premium Care.</span>
                      <br />
                      <span className="gradient-text-animated">
                        Zero Surprises.
                      </span>
                    </h2>
                    <p className="mt-6 text-white/55 leading-relaxed max-w-md text-[15px]">
                      Book trusted car service & maintenance from certified
                      garages near you. Transparent pricing, genuine parts, and
                      hassle-free experience every time.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                      <Link
                        href="/book"
                        className="btn-primary !py-4 !px-10 !text-base !rounded-full shadow-[0_8px_32px_-4px_rgba(204,0,0,0.5)]"
                      >
                        Book Now
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                      <a
                        href="tel:+919000000000"
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium py-4"
                      >
                        <Phone className="h-4 w-4" />
                        +91 90000 00000
                      </a>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* Right — Image with Badge */}
              <AnimateOnScroll type="fadeRight" delay={0.15}>
                <div className="relative h-full min-h-[400px] lg:min-h-0 rounded-3xl lg:rounded-l-none overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80"
                    alt="Expert mechanic servicing a car"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Experience Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                    className="absolute bottom-8 left-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-lg)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[var(--crank-red)] flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(204,0,0,0.5)]">
                        <Trophy className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] leading-none">
                          10+
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                          Years Of Experience
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating red accent */}
                  <div className="absolute top-8 right-8 w-16 h-16 border-2 border-[rgba(204,0,0,0.3)] rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-[rgba(204,0,0,0.2)] rounded-full animate-pulse" />
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  HOW IT WORKS                                              */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-dark)]">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateOnScroll
              type="fadeUp"
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <span className="section-tag justify-center">Simple Process</span>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-white font-[family-name:var(--font-montserrat)] leading-tight">
                How It Works
              </h2>
              <p className="mt-5 text-white/55 leading-relaxed">
                Getting your car serviced is as easy as 1-2-3-4. No hassle, no
                surprises, just quality service.
              </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <AnimateOnScroll
                    key={step.title}
                    type="fadeUp"
                    delay={idx * 0.15}
                    className={cn(
                      "relative text-center",
                      idx < steps.length - 1 ? "step-connector" : "",
                    )}
                  >
                    <div className="text-[80px] font-black text-white/5 leading-none font-[family-name:var(--font-montserrat)] mb-[-30px] relative z-0">
                      {step.number}
                    </div>
                    <div className="relative z-10 flex items-center justify-center h-20 w-20 rounded-2xl bg-[var(--crank-red)] mx-auto mb-6 shadow-[0_12px_30px_-8px_rgba(204,0,0,0.5)] group/step hover:scale-110 transition-transform duration-300">
                      <Icon className="h-9 w-9 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-[family-name:var(--font-montserrat)] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed max-w-[220px] mx-auto">
                      {step.description}
                    </p>
                    {idx < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-[100px] -right-4 text-(--crank-red)/30">
                        <ArrowRight className="h-6 w-6" />
                      </div>
                    )}
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  WHY CHOOSE US                                            */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left — Content */}
              <AnimateOnScroll type="fadeLeft">
                <div>
                  <span className="section-tag">Why Choose Us</span>
                  <FallingText
                    text="Your Car Deserves"
                    redText="The Best Care"
                    className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] leading-tight"
                  />
                  <p className="mt-5 text-[var(--text-secondary)] leading-relaxed max-w-lg">
                    We are committed to making car care simple, transparent, and
                    reliable for every car owner in the city.
                  </p>

                  <div className="mt-8 space-y-4">
                    {whyUs.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <AnimateOnScroll
                          key={feature.title}
                          type="fadeUp"
                          delay={idx * 0.1}
                        >
                          <div className="flex items-start gap-4 group">
                            <div className="icon-ring flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[var(--crank-red)] shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)] group-hover:scale-110 transition-transform duration-300">
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
                                {feature.title}
                              </h3>
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-0.5">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </AnimateOnScroll>
                      );
                    })}
                  </div>
                </div>
              </AnimateOnScroll>

              {/* Right — Visual card */}
              <AnimateOnScroll type="fadeRight" delay={0.2}>
                <div className="relative group/warranty">
                  <div className="bg-[var(--bg-dark)] rounded-2xl p-10 text-center transition-all duration-500 group-hover/warranty:shadow-[0_20px_60px_-15px_rgba(204,0,0,0.25)]">
                    <div className="w-24 h-24 rounded-2xl bg-[var(--crank-red)] mx-auto mb-6 flex items-center justify-center transition-transform duration-500 group-hover/warranty:scale-110 group-hover/warranty:rotate-3">
                      <ShieldCheck className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white font-[family-name:var(--font-montserrat)] mb-3">
                      90-Day Warranty
                    </h3>
                    <p className="text-white/55 text-sm leading-relaxed max-w-sm mx-auto mb-8">
                      Every service comes with a 90-day warranty on both labour
                      and the parts we installed. If something goes wrong, we
                      fix it free.
                    </p>
                    <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                      <div>
                        <div className="text-2xl font-bold text-[var(--crank-red)] font-[family-name:var(--font-montserrat)]">
                          500+
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          Garages
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--crank-red)] font-[family-name:var(--font-montserrat)]">
                          10K+
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          Jobs Done
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--crank-red)] font-[family-name:var(--font-montserrat)]">
                          4.9★
                        </div>
                        <div className="text-xs text-white/40 mt-1">Rating</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-[rgba(204,0,0,0.2)] rounded-2xl -z-10 transition-all duration-500 group-hover/warranty:-bottom-5 group-hover/warranty:-right-5 group-hover/warranty:border-[var(--crank-red)]" />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  ABOUT US PREVIEW                                          */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-dark)] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left — Image */}
              <AnimateOnScroll type="fadeLeft">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80"
                    alt="Car Affair workshop"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Overlay badge */}
                  <div className="absolute bottom-6 left-6 bg-[var(--crank-red)] text-white rounded-xl px-5 py-3">
                    <div className="text-2xl font-bold font-[family-name:var(--font-montserrat)]">
                      5+ Years
                    </div>
                    <div className="text-sm text-white/80">of Excellence</div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* Right — Text */}
              <AnimateOnScroll type="fadeRight" delay={0.15}>
                <div>
                  <span className="section-tag text-[var(--crank-red)]">
                    About Car Affair
                  </span>
                  <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-white font-[family-name:var(--font-montserrat)] leading-tight">
                    Driven by Trust,
                    <br />
                    Powered by{" "}
                    <span className="text-[var(--crank-red)]">Technology</span>
                  </h2>
                  <p className="mt-5 text-white/60 leading-relaxed">
                    Car Affair was founded with a simple mission: make car care
                    transparent, digital, and accessible. We connect verified
                    garages with car owners who deserve honest pricing and
                    quality workmanship — all managed through a seamless digital
                    platform.
                  </p>

                  <div className="mt-8 space-y-3">
                    {[
                      "Founded in Hyderabad, serving across Telangana",
                      "Fully digital workflow — from booking to invoice",
                      "90-day warranty on every service we deliver",
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[var(--crank-red)] shrink-0" />
                        <span className="text-white/70 text-[15px]">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/about"
                    className="btn-primary !rounded-lg mt-10 inline-flex"
                  >
                    Learn More About Us
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  TESTIMONIALS                                             */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateOnScroll
              type="fadeUp"
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <span className="section-tag justify-center">Testimonials</span>
              <FallingText
                text="What Our Clients Say"
                className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] leading-tight"
              />
              <div className="flex items-center justify-center gap-1 mt-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-[var(--crank-red)] fill-[var(--crank-red)]"
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-[var(--text-primary)]">
                  4.9 / 5
                </span>
                <span className="text-sm text-[var(--text-tertiary)]">
                  &middot; 2,400+ reviews
                </span>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((t, idx) => (
                <AnimateOnScroll key={t.name} type="scaleIn" delay={idx * 0.1}>
                  <div className="card card-tilt p-6 flex flex-col hover:border-(--crank-red) group h-full">
                    <Quote className="h-8 w-8 text-(--crank-red)/15 mb-2" />
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-[var(--crank-red)] fill-[var(--crank-red)]"
                        />
                      ))}
                    </div>
                    <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--crank-red)] flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform duration-300">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  COVERAGE & PARTNERS MARQUEE                              */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto px-6">
            {/* Coverage */}
            <AnimateOnScroll type="fadeUp">
              <div className="card-flat p-8 sm:p-10 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-[rgba(204,0,0,0.08)] flex items-center justify-center flex-shrink-0">
                    <MapPinned className="h-7 w-7 text-[var(--crank-red)]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--crank-red)]">
                      Free Pickup Zones
                    </span>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
                      Across Hyderabad
                    </h3>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                  Free doorstep pickup & drop in 16+ neighbourhoods.
                  Outside-zone pickup available with a transparent distance fee.
                </p>
                <div className="flex flex-wrap gap-2">
                  {coverageZones.map((z) => (
                    <span
                      key={z}
                      className="zone-pill px-3 py-1.5 rounded-md bg-(--bg-secondary) border border-(--border-color) text-xs text-(--text-secondary) font-medium cursor-default"
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>

            {/* Partners Marquee */}
            <AnimateOnScroll type="fadeUp" delay={0.15}>
              <div className="card-flat p-8 sm:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-[rgba(204,0,0,0.08)] flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-7 w-7 text-[var(--crank-red)]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--crank-red)]">
                      Trusted Partners
                    </span>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)]">
                      Insurance & OEM Parts
                    </h3>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                  Cashless insurance partners and OEM-grade parts & lubricants
                  from the brands you already trust.
                </p>
                {/* Marquee */}
                <div className="overflow-hidden relative">
                  <div className="flex animate-[marquee_20s_linear_infinite] marquee-track gap-4">
                    {[...partners, ...partners, ...partners].map((p, i) => (
                      <div
                        key={`${p.label}-${i}`}
                        className="flex-shrink-0 px-6 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3 hover:border-[var(--crank-red)] transition-colors"
                      >
                        <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
                          {p.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap">
                          {p.kind}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  GALLERY / OUR WORK                                       */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateOnScroll
              type="fadeUp"
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <span className="section-tag justify-center">Our Work</span>
              <FallingText
                text="Inside Our"
                redText="Workshops"
                className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] leading-tight"
              />
              <p className="mt-5 text-[var(--text-secondary)] leading-relaxed">
                A glimpse into the care and craftsmanship that goes into every
                vehicle we service.
              </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-[200px] sm:auto-rows-[220px]">
              {galleryImages.map((img, idx) => (
                <AnimateOnScroll
                  key={img.alt}
                  type="scaleIn"
                  delay={idx * 0.1}
                  className={img.span}
                >
                  <div className="gallery-item relative w-full h-full cursor-pointer">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover rounded-2xl"
                      sizes={
                        img.span
                          ? "(max-width: 640px) 100vw, 66vw"
                          : "(max-width: 640px) 100vw, 33vw"
                      }
                    />
                    <div className="gallery-overlay">
                      <span>{img.alt}</span>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  CTA — Dark banner (separated from footer)                */}
        {/* ======================================================== */}
        <section className="bg-[var(--bg-dark)] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-(--crank-red)/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-(--crank-red)/3 rounded-full blur-[120px]" />
          </div>
          <div className="section-divider" />
          <div className="relative max-w-7xl mx-auto px-6 py-24">
            <AnimateOnScroll type="fadeUp">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="max-w-xl">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight font-[family-name:var(--font-montserrat)]">
                    Ready to give your car
                    <br />
                    <span className="text-[var(--crank-red)]">
                      the care it deserves?
                    </span>
                  </h2>
                  <p className="mt-5 text-lg text-white/55">
                    Join thousands of happy customers who trust Car Affair for
                    their car care needs.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <Link
                    href="/book"
                    className="btn-primary !text-base !py-4 !px-10 !rounded-lg"
                  >
                    Book Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/5 border border-white/10">
                      <Phone className="h-5 w-5 text-[var(--crank-red)]" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs text-white/40 font-medium">
                        Call Us
                      </span>
                      <a
                        href="tel:+919000000000"
                        className="text-lg font-semibold text-white hover:text-[var(--crank-red)] transition-colors"
                      >
                        +91 90000 00000
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ======================================================== */}
        {/*  FAQ                                                      */}
        {/* ======================================================== */}
        <section className="py-24 bg-[var(--bg-primary)]">
          <div className="max-w-4xl mx-auto px-6">
            <AnimateOnScroll type="fadeUp" className="text-center mb-16">
              <span className="section-tag justify-center">FAQ</span>
              <FallingText
                text="Common Questions"
                className="mt-4 text-3xl sm:text-4xl lg:text-[45px] font-bold text-[var(--text-primary)] font-[family-name:var(--font-montserrat)] leading-tight"
              />
            </AnimateOnScroll>
            <AnimateOnScroll type="fadeUp" delay={0.15}>
              <div>
                {faqs.map((f) => (
                  <FaqItem key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
