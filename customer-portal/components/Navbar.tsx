"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, Menu, X, ChevronRight, ArrowRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Book Now", href: "/book" },
  { label: "Register Garage", href: "/register-garage" },
  { label: "Become a Vendor", href: "/partner" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

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
    <div className="sticky top-0 z-50">
      {/* Main Nav — floating glass capsule */}
      <header
        className={cn(
          "px-4 sm:px-8 transition-all duration-300",
          scrolled ? "pt-2 pb-2" : "pt-3 pb-3"
        )}
      >
        <nav
          className={cn(
            "max-w-7xl mx-auto glass-panel transition-all duration-300",
            scrolled ? "!rounded-2xl" : "!rounded-3xl"
          )}
        >
          <div className="relative h-[68px] flex items-center justify-between px-5 sm:px-7">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-[0_6px_20px_-6px_rgba(220,38,38,0.6)] transition-transform duration-200 group-hover:scale-105">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Car{" "}
                <span className="gradient-text">Affair</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href === "#services" && isHome);
                return (
                  <Link
                    key={link.label}
                    href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                      isActive
                        ? "text-[var(--text-primary)] bg-[var(--bg-tertiary)]/70 backdrop-blur"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-full glass-card hover:bg-[var(--bg-glass-hover)] text-[var(--text-primary)] transition-all duration-200 active:scale-[0.97] !transform-none hover:!transform-none"
                style={{ transform: "none" }}
              >
                Login
              </Link>
              <Link
                href="/book"
                className="group sheen inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition-all duration-200 active:scale-[0.97]"
              >
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="inline-flex md:hidden items-center justify-center h-10 w-10 rounded-xl glass-card text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              style={{ transform: "none" }}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
              mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-5 pb-5 pt-2 border-t border-[var(--border-glass)] space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                  className="flex items-center justify-between px-4 py-3 text-base font-medium text-[var(--text-secondary)] rounded-xl transition-colors duration-200 hover:text-red-500 hover:bg-red-500/10"
                  onClick={(e) => {
                    handleNavClick(e, link.href);
                    setMobileMenuOpen(false);
                  }}
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                </Link>
              ))}

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-base font-medium text-[var(--text-secondary)]">
                  Theme
                </span>
                <ThemeToggle />
              </div>

              <div className="pt-3 mt-2 border-t border-[var(--border-glass)] space-y-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-500 border border-red-500/30 rounded-xl transition-all duration-200 hover:bg-red-500/10 active:scale-[0.98]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/book"
                  className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)] transition-all duration-200 hover:from-red-500 hover:to-red-600 active:scale-[0.98]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Now
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-0 z-[-1] bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
