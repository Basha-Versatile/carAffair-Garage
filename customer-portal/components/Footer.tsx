"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Phone, Mail, MapPin, ArrowRight } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "#services" },
  { label: "Book Service", href: "/book" },
];

const services = [
  { label: "General Service", href: "/book" },
  { label: "AC Service", href: "/book" },
  { label: "Wheel Care", href: "/book" },
  { label: "Denting & Painting", href: "/book" },
  { label: "Battery", href: "/book" },
  { label: "Insurance Claims", href: "/book" },
];

const contactInfo = [
  { icon: Phone, text: "+91 90000 00000", href: "tel:+919000000000" },
  { icon: Mail, text: "support@caraffair.in", href: "mailto:support@caraffair.in" },
  { icon: MapPin, text: "Hyderabad, Telangana, India", href: undefined },
];

export default function Footer() {
  const pathname = usePathname();
  const isBookPage = pathname === "/book";

  return (
    <footer>
      {/* Booking CTA Strip — hidden on /book page */}
      {!isBookPage && <div className="bg-(--crank-red) relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-montserrat)]">
              Ready to Book Your Service?
            </h3>
            <p className="text-white/75 text-sm mt-1">
              Get transparent pricing, certified mechanics, and a 90-day warranty on every service.
            </p>
          </div>
          <Link
            href="/book"
            className="btn-white rounded-lg! shrink-0 py-3.5! px-8! group/book"
          >
            Book Now
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/book:translate-x-1" />
          </Link>
        </div>
      </div>}

      {/* Main Footer */}
      <div className="bg-[var(--bg-dark)] text-white/80">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--crank-red)] text-white shadow-[0_4px_12px_-2px_rgba(204,0,0,0.4)]">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold text-white font-[family-name:var(--font-montserrat)]">
                    Car Affair
                  </span>
                  <span className="text-[10px] text-white/50 uppercase tracking-[0.15em] -mt-0.5">
                    Auto Care
                  </span>
                </div>
              </Link>
              <p className="mt-5 text-sm leading-relaxed text-white/60 max-w-xs">
                Your trusted car care partner. We connect you with verified
                garages for transparent, hassle-free servicing and repairs.
              </p>

              {/* Social Icons */}
              <div className="mt-6 flex items-center gap-3">
                {[
                  {
                    label: "Facebook",
                    path: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
                  },
                  {
                    label: "Instagram",
                    path: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
                  },
                  {
                    label: "Twitter",
                    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
                  },
                  {
                    label: "YouTube",
                    path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="social-icon flex items-center justify-center w-9 h-9 rounded-full bg-(--crank-red)/15 text-(--crank-red) hover:bg-(--crank-red) hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="footer-link text-sm text-white/55"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Services */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-5">
                Services
              </h3>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.label}>
                    <Link
                      href={service.href}
                      className="footer-link text-sm text-white/55"
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-5">
                Contact Us
              </h3>
              <ul className="space-y-4">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <span className="flex items-start gap-3">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--crank-red)]/10 shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-[var(--crank-red)]" />
                      </span>
                      <span className="text-sm text-white/55">{item.text}</span>
                    </span>
                  );

                  return (
                    <li key={item.text}>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="transition-colors duration-200 hover:text-[var(--crank-red)]"
                        >
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/40">
              &copy; 2026 Car Affair. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-white/40 transition-colors duration-200 hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-white/40 transition-colors duration-200 hover:text-white"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
