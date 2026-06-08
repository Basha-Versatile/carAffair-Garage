"use client";

import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll type="fadeUp" delay={0.2}>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-white/80">Privacy Policy</span>
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
                At Car Affair, we take your privacy seriously. This Privacy
                Policy explains how we collect, use, disclose, and safeguard
                your information when you use our website, mobile application,
                and services. Please read this policy carefully to understand
                our practices regarding your personal data.
              </p>

              <h3>1. Information We Collect</h3>
              <p>
                We collect information that you provide directly to us, as well
                as information that is automatically collected when you use our
                platform:
              </p>
              <ul>
                <li>
                  <strong>Personal Information:</strong> Name, phone number,
                  email address, and postal address provided during
                  registration or booking
                </li>
                <li>
                  <strong>Vehicle Information:</strong> Car make, model, year,
                  registration number, and service history
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment method details
                  processed through our secure third-party payment providers
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, features used,
                  search queries, booking history, and interaction patterns
                </li>
                <li>
                  <strong>Device Information:</strong> IP address, browser type,
                  operating system, device identifiers, and location data (with
                  your consent)
                </li>
              </ul>

              <h3>2. How We Use Your Information</h3>
              <p>
                We use the information we collect for the following purposes:
              </p>
              <ul>
                <li>
                  To create and manage your account on our platform
                </li>
                <li>
                  To process your service bookings and connect you with partner
                  garages
                </li>
                <li>
                  To send booking confirmations, service updates, and reminders
                </li>
                <li>
                  To provide customer support and respond to your inquiries
                </li>
                <li>
                  To personalize your experience and recommend relevant services
                </li>
                <li>
                  To send promotional communications (with your consent)
                </li>
                <li>
                  To improve our platform, services, and user experience
                </li>
                <li>
                  To detect and prevent fraud, abuse, and security threats
                </li>
                <li>
                  To comply with legal obligations and enforce our terms
                </li>
              </ul>

              <h3>3. Information Sharing</h3>
              <p>
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul>
                <li>
                  <strong>Partner Garages:</strong> We share relevant booking
                  and vehicle information with the partner garage you select to
                  facilitate your service
                </li>
                <li>
                  <strong>Service Providers:</strong> We may share information
                  with third-party service providers who assist us in operating
                  the platform (e.g., payment processors, SMS providers,
                  analytics services)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose
                  information when required by law, court order, or government
                  regulation
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger,
                  acquisition, or sale of assets, your information may be
                  transferred as part of the transaction
                </li>
              </ul>

              <h3>4. Data Security</h3>
              <p>
                We implement industry-standard security measures to protect
                your personal information, including:
              </p>
              <ul>
                <li>
                  SSL/TLS encryption for data transmission
                </li>
                <li>
                  Encrypted storage of sensitive data at rest
                </li>
                <li>
                  Regular security audits and vulnerability assessments
                </li>
                <li>
                  Access controls and authentication mechanisms for our systems
                </li>
                <li>
                  Employee training on data protection and privacy practices
                </li>
              </ul>
              <p>
                While we strive to protect your information, no method of
                electronic transmission or storage is 100% secure. We cannot
                guarantee absolute security of your data.
              </p>

              <h3>5. Cookies & Tracking Technologies</h3>
              <p>
                We use cookies and similar tracking technologies to enhance
                your experience on our platform. These include:
              </p>
              <ul>
                <li>
                  <strong>Essential Cookies:</strong> Required for the platform
                  to function properly (e.g., session management,
                  authentication)
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how
                  users interact with our platform to improve performance
                </li>
                <li>
                  <strong>Preference Cookies:</strong> Remember your settings
                  and preferences for a personalized experience
                </li>
              </ul>
              <p>
                You can manage your cookie preferences through your browser
                settings. Disabling certain cookies may affect the functionality
                of our platform.
              </p>

              <h3>6. Your Rights</h3>
              <p>
                You have the following rights regarding your personal
                information:
              </p>
              <ul>
                <li>
                  <strong>Access:</strong> Request a copy of the personal
                  information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information, subject to legal retention requirements
                </li>
                <li>
                  <strong>Portability:</strong> Request your data in a
                  structured, machine-readable format
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from promotional
                  communications at any time
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Withdraw previously given
                  consent for specific processing activities
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us using the
                information provided below. We will respond to your request
                within 30 days.
              </p>

              <h3>7. Data Retention</h3>
              <p>
                We retain your personal information for as long as your account
                is active or as needed to provide you services. We may retain
                certain information for longer periods as required by law or for
                legitimate business purposes, such as resolving disputes and
                enforcing our agreements.
              </p>

              <h3>8. Children&apos;s Privacy</h3>
              <p>
                Our platform is not intended for use by individuals under the
                age of 18. We do not knowingly collect personal information
                from children. If we become aware that we have inadvertently
                collected information from a child, we will take steps to
                delete it promptly.
              </p>

              <h3>9. Changes to This Policy</h3>
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or applicable laws. We will notify you
                of any material changes by posting the updated policy on our
                platform and updating the &quot;Last updated&quot; date. Your
                continued use of the platform after any changes constitutes
                acceptance of the revised policy.
              </p>

              <h3>10. Contact Us</h3>
              <p>
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please contact us:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong> privacy@caraffair.in
                </li>
                <li>
                  <strong>Phone:</strong> +91 90000 00000
                </li>
                <li>
                  <strong>Address:</strong> Hyderabad, Telangana, India
                </li>
              </ul>
              <p>
                For a complete overview of your rights and obligations, please
                also review our{" "}
                <Link href="/terms" className="text-[var(--crank-red)] underline hover:no-underline">
                  Terms & Conditions
                </Link>
                .
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
