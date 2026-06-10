"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, Menu, X, Phone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "#services" },
  { label: "Book Now", href: "/book" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  // On the homepage, navbar is transparent/dark at the top (over the black carousel)
  // and transitions to white (light) / dark (dark mode) once the user scrolls.
  const isHomeTop = isHome && !scrolled;

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("#")) return;
      e.preventDefault();
      setMobileMenuOpen(false);
      if (isHome) {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push("/" + href);
      }
    },
    [isHome, router],
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Top Bar */}
      <div className={cn(
        "hidden lg:block border-b transition-colors duration-500",
        isHomeTop
          ? "bg-[#0a0a0a] border-white/10"
          : "bg-white dark:bg-[#111111] border-gray-100 dark:border-white/6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-10 text-xs">
          <div className="flex items-center gap-6">
            <a href="tel:+919000000000" className={cn(
              "flex items-center gap-1.5 transition-colors",
              isHomeTop ? "text-white/60 hover:text-white" : "text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
            )}>
              <Phone className="h-3 w-3" />
              +91 90000 00000
            </a>
            <span className={isHomeTop ? "text-white/20" : "text-gray-200 dark:text-white/20"}>|</span>
            <span className={isHomeTop ? "text-white/50" : "text-gray-400 dark:text-white/50"}>Mon - Sat: 9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={isHomeTop ? "text-white/50" : "text-gray-400 dark:text-white/50"}>Trusted Auto Care</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isHomeTop
            ? "bg-[#0a0a0a]"
            : scrolled
              ? "bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)] border-b border-gray-100 dark:border-white/6"
              : "bg-white dark:bg-[#111111]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--crank-red)] text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_24px_-4px_rgba(204,0,0,0.6)] shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)]">
                <Wrench className="h-5 w-5 transition-transform duration-500 group-hover:rotate-[-20deg]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className={cn(
                  "text-lg font-bold tracking-tight font-[family-name:var(--font-montserrat)] transition-colors duration-500",
                  isHomeTop ? "text-white" : "text-gray-900 dark:text-white"
                )}>
                  Car Affair
                </span>
                <span className={cn(
                  "text-[10px] uppercase tracking-[0.15em] -mt-0.5 transition-colors duration-500",
                  isHomeTop ? "text-white/40" : "text-gray-400 dark:text-white/40"
                )}>
                  Auto Care
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href === "/" && isHome && pathname === "/");
                return (
                  <Link
                    key={link.label}
                    href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "px-4 py-2 text-[14px] font-medium transition-colors duration-300 uppercase tracking-wider",
                      isActive
                        ? "text-[var(--crank-red)]"
                        : isHomeTop
                          ? "text-white/75 hover:text-white"
                          : "text-gray-600 dark:text-white/70 hover:text-[var(--crank-red)]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              <ThemeToggle />
              <Link href="/book" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--crank-red)] text-white text-sm font-bold uppercase tracking-wider rounded hover:bg-[var(--crank-red-dark)] transition-all duration-300 shadow-[0_4px_16px_-4px_rgba(204,0,0,0.5)]">
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="inline-flex lg:hidden items-center justify-center h-10 w-10 rounded bg-[var(--crank-red)] text-white transition-colors duration-200 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 dark:border-white/10",
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-0"
          )}
        >
          <div className="px-4 pb-5 pt-2 space-y-1 bg-white dark:bg-[#0a0a0a]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                className="flex items-center px-4 py-3 text-base font-medium text-gray-600 dark:text-white/70 rounded-lg transition-colors duration-200 hover:text-[var(--crank-red)] hover:bg-gray-50 dark:hover:bg-white/5"
                onClick={(e) => {
                  handleNavClick(e, link.href);
                  setMobileMenuOpen(false);
                }}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-gray-500 dark:text-white/50">Theme</span>
                <ThemeToggle />
              </div>
              <Link
                href="/login"
                className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-[var(--crank-red)] border border-[rgba(204,0,0,0.3)] rounded-lg transition-all duration-200 hover:bg-[rgba(204,0,0,0.05)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/book"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--crank-red)] text-white text-sm font-bold rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Spacer for fixed navbar — on homepage the hero goes full-screen behind the nav */}
      {!isHome && <div className="h-18" />}
    </>
  );
}
