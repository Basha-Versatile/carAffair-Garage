"use client";

import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
    <Navbar />
    <main>
      {/* Hero Banner */}
      <section className="bg-[var(--crank-black)] py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll type="fadeUp">
            <span className="section-tag">Legal</span>
          </AnimateOnScroll>
          <AnimateOnScroll type="fadeUp" delay={0.1}>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-[family-name:var(--font-montserrat)] leading-tight">
              Terms & Conditions
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll type="fadeUp" delay={0.2}>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-white/80">Terms & Conditions</span>
            </div>
            <p className="mt-2 text-white/40 text-sm">
              Last updated: June 2026
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 sm:py-32 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll type="fadeUp">
            <div className="prose-content">
              <p>
                Welcome to Car Affair. By accessing or using our website, mobile
                application, or any of our services, you agree to be bound by
                these Terms and Conditions. Please read them carefully before
                using our platform.
              </p>

              <h3>1. Acceptance of Terms</h3>
              <p>
                By registering an account, booking a service, or otherwise using
                the Car Affair platform, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions.
                If you do not agree with any part of these terms, you must not
                use our services.
              </p>

              <h3>2. Services Description</h3>
              <p>
                Car Affair is an online platform that connects car owners with
                verified automobile service centres (partner garages) across
                India. Our services include but are not limited to:
              </p>
              <ul>
                <li>
                  Online booking for car servicing, repairs, and maintenance
                </li>
                <li>
                  Price comparison and transparent quotation from partner garages
                </li>
                <li>Real-time service tracking and status updates</li>
                <li>
                  Customer reviews and ratings for partner garages
                </li>
                <li>
                  Service history management and reminders
                </li>
              </ul>
              <p>
                Car Affair acts as an intermediary platform and does not directly
                perform any automobile repair or maintenance services.
              </p>

              <h3>3. User Accounts</h3>
              <p>
                To use certain features of our platform, you must create an
                account. You are responsible for maintaining the confidentiality
                of your account credentials and for all activities that occur
                under your account. You agree to provide accurate and complete
                information during registration and to keep your account
                information up to date.
              </p>

              <h3>4. Booking & Cancellation Policy</h3>
              <p>
                When you book a service through Car Affair, you enter into a
                service agreement with the selected partner garage. The
                following policies apply:
              </p>
              <ul>
                <li>
                  <strong>Booking Confirmation:</strong> A booking is confirmed
                  once you receive a confirmation notification via SMS, email,
                  or in-app notification.
                </li>
                <li>
                  <strong>Free Cancellation:</strong> You may cancel a confirmed
                  booking free of charge up to 4 hours before the scheduled
                  service time.
                </li>
                <li>
                  <strong>Late Cancellation:</strong> Cancellations made less
                  than 4 hours before the scheduled service time may incur a
                  cancellation fee of up to 10% of the estimated service cost.
                </li>
                <li>
                  <strong>No-Show:</strong> Failure to show up for a confirmed
                  booking without prior cancellation may result in a no-show fee.
                </li>
              </ul>

              <h3>5. Payment Terms</h3>
              <p>
                Payment for services is made directly to the partner garage
                upon completion of the service. Car Affair may facilitate
                online payments through secure third-party payment processors.
                All prices displayed on the platform are estimates and the final
                amount may vary based on the actual work performed, which will
                be communicated to you before proceeding.
              </p>

              <h3>6. Warranties & Guarantees</h3>
              <p>
                All services booked through Car Affair come with a{" "}
                <strong>90-day service warranty</strong>. This warranty covers:
              </p>
              <ul>
                <li>
                  Defects in workmanship related to the specific service
                  performed
                </li>
                <li>
                  Parts replaced during the service (subject to manufacturer
                  warranty terms)
                </li>
                <li>
                  Re-inspection and correction of any issues arising from the
                  original service
                </li>
              </ul>
              <p>
                The warranty does not cover damage caused by accidents,
                misuse, unauthorized modifications, or normal wear and tear.
                To claim the warranty, contact our support team within the
                warranty period with your booking reference.
              </p>

              <h3>7. Limitation of Liability</h3>
              <p>
                Car Affair acts as a platform connecting customers with partner
                garages. While we carefully vet and monitor our partners, we
                shall not be held liable for:
              </p>
              <ul>
                <li>
                  Any damage to your vehicle caused by the partner garage&apos;s
                  negligence beyond the scope of the warranty
                </li>
                <li>
                  Delays in service delivery by partner garages
                </li>
                <li>
                  Any indirect, incidental, or consequential damages arising
                  from the use of our platform
                </li>
              </ul>
              <p>
                Our total liability to you for any claim arising out of or
                relating to these terms shall not exceed the amount paid by you
                for the specific service in question.
              </p>

              <h3>8. Intellectual Property</h3>
              <p>
                All content on the Car Affair platform — including text,
                graphics, logos, icons, images, and software — is the property
                of Car Affair or its content suppliers and is protected by
                Indian and international copyright laws. You may not reproduce,
                distribute, modify, or create derivative works from any content
                without our prior written consent.
              </p>

              <h3>9. Privacy</h3>
              <p>
                Your privacy is important to us. Our collection and use of
                personal information is governed by our{" "}
                <Link href="/privacy" className="text-[var(--crank-red)] underline hover:no-underline">
                  Privacy Policy
                </Link>
                , which forms an integral part of these Terms and Conditions.
              </p>

              <h3>10. Prohibited Conduct</h3>
              <p>You agree not to:</p>
              <ul>
                <li>
                  Use the platform for any unlawful purpose or in violation of
                  any applicable law
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the
                  platform or its systems
                </li>
                <li>
                  Interfere with or disrupt the integrity or performance of the
                  platform
                </li>
                <li>
                  Submit false or misleading information, reviews, or ratings
                </li>
                <li>
                  Use automated tools to scrape, mine, or extract data from the
                  platform
                </li>
              </ul>

              <h3>11. Governing Law</h3>
              <p>
                These Terms and Conditions shall be governed by and construed
                in accordance with the laws of India. Any disputes arising out
                of or relating to these terms shall be subject to the exclusive
                jurisdiction of the courts in Hyderabad, Telangana.
              </p>

              <h3>12. Changes to Terms</h3>
              <p>
                We reserve the right to modify these Terms and Conditions at
                any time. Changes will be effective immediately upon posting on
                the platform. Your continued use of the platform after any
                changes constitutes acceptance of the new terms. We encourage
                you to review these terms periodically.
              </p>

              <h3>13. Contact Information</h3>
              <p>
                If you have any questions about these Terms and Conditions,
                please contact us:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong> support@caraffair.in
                </li>
                <li>
                  <strong>Phone:</strong> +91 90000 00000
                </li>
                <li>
                  <strong>Address:</strong> Hyderabad, Telangana, India
                </li>
              </ul>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
