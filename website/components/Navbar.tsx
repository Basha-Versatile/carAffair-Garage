"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Register Garage", href: "/register-garage" },
  { label: "Book a Demo", href: "/demo" },
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
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.3)] border-b border-white/[0.06]"
            : "bg-[#111111]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--crank-red)] text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_24px_-4px_rgba(204,0,0,0.6)] shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)]">
                <Wrench className="h-5 w-5 transition-transform duration-500 group-hover:rotate-[-20deg]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold tracking-tight text-white font-[family-name:var(--font-montserrat)]">
                  Car Affair
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] -mt-0.5">
                  Garage Management
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "px-4 py-2 text-[14px] font-medium transition-colors duration-200 uppercase tracking-wider",
                      isActive
                        ? "text-[var(--crank-red)]"
                        : "text-white/70 hover:text-[var(--crank-red)]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-3">
              <ThemeToggle />
              <Link href="/register-garage" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--crank-red)] text-white text-sm font-bold uppercase tracking-wider rounded hover:bg-[var(--crank-red-dark)] transition-all duration-300 shadow-[0_4px_16px_-4px_rgba(204,0,0,0.5)]">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

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

        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-white/10",
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-0"
          )}
        >
          <div className="px-4 pb-5 pt-2 space-y-1 bg-[#0a0a0a]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                className="flex items-center px-4 py-3 text-base font-medium text-white/70 rounded-lg transition-colors duration-200 hover:text-[var(--crank-red)] hover:bg-white/5"
                onClick={(e) => {
                  handleNavClick(e, link.href);
                  setMobileMenuOpen(false);
                }}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-white/50">Theme</span>
                <ThemeToggle />
              </div>
              <Link
                href="/register-garage"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--crank-red)] text-white text-sm font-bold rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
