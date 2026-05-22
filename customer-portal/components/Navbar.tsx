"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Menu, X, ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Book Now", href: "/book" },
  { label: "Register Garage", href: "/register-garage" },
  { label: "Become a Vendor", href: "/partner" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Only use transparent navbar on the homepage hero; inner pages always show solid navbar
  const showTransparent = isHome && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/90 backdrop-blur-xl shadow-sm border-b border-edge"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="Car Affair Home"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-white transition-transform duration-200 group-hover:scale-105">
              <Wrench className="h-5 w-5" />
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${showTransparent ? "text-white" : "text-foreground"}`}>
              Car{" "}
              <span className={`transition-colors duration-300 ${showTransparent ? "text-white" : "text-primary"}`}>Affair</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 hover:text-primary ${
                  showTransparent
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-secondary hover:bg-primary-light"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors duration-200 ${
                showTransparent
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-secondary hover:bg-hover hover:text-foreground"
              }`}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Link
              href="/login"
              className={`inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 active:scale-[0.97] ${
                showTransparent
                  ? "text-white border border-white/40 hover:bg-white/10 hover:border-white/60"
                  : "text-primary border border-primary hover:bg-primary-light hover:border-primary-hover"
              }`}
            >
              Login
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg transition-all duration-200 hover:bg-primary-hover shadow-sm hover:shadow-md active:scale-[0.97] btn-glow"
            >
              Book Now
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={`inline-flex md:hidden items-center justify-center h-10 w-10 rounded-lg transition-colors duration-200 ${
              showTransparent
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-secondary hover:bg-hover hover:text-foreground"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        className={`absolute top-16 left-0 right-0 z-50 bg-background border-b border-edge shadow-lg transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {/* Mobile Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-secondary rounded-lg transition-colors duration-200 hover:text-primary hover:bg-primary-light"
          >
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-muted" />
            ) : (
              <Moon className="h-5 w-5 text-muted" />
            )}
          </button>

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center justify-between px-4 py-3 text-base font-medium text-secondary rounded-lg transition-colors duration-200 hover:text-primary hover:bg-primary-light"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}

          <div className="pt-3 mt-2 border-t border-edge space-y-2">
            <Link
              href="/login"
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-primary border border-primary rounded-lg transition-all duration-200 hover:bg-primary-light active:scale-[0.98]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/book"
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg transition-all duration-200 hover:bg-primary-hover active:scale-[0.98]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Book Now
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
