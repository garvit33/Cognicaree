import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CogniCare — AI-Powered Asynchronous Clinic",
  description:
    "CogniCare intelligently triages patient inquiries, extracts symptoms, and drafts medically-appropriate responses so doctors can deliver faster, better care.",
  keywords: ["healthcare", "AI triage", "telemedicine", "patient portal", "doctor dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <div className="gradient-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
