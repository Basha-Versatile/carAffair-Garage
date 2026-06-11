import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Car Affair — Car Service & Maintenance Booking",
  description:
    "Book car service, maintenance, and repair appointments online. Trusted garages, transparent pricing, and hassle-free experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
