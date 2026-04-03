"use client";

import Link from "next/link";
import {
  Activity,
  Stethoscope,
  UserRound,
  ArrowRight,
  Shield,
  Zap,
  Brain,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      {/* ===== Hero ===== */}
      <section className="text-center max-w-3xl mx-auto animate-fade-in-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Activity className="w-10 h-10 text-primary-400" strokeWidth={2.5} />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">
            CogniCare
          </h1>
        </div>

        <p className="text-lg md:text-xl text-surface-200/80 max-w-2xl mx-auto leading-relaxed mb-4">
          The <span className="text-primary-300 font-semibold">AI-Powered Asynchronous Clinic</span>.
          Patients describe their symptoms in seconds. Our AI triages, extracts
          key data, and drafts a response — so doctors just review &amp; send.
        </p>

        <p className="text-sm text-surface-200/50 mb-12">
          Voice-to-text · Instant Triage · One-click Approval
        </p>

        {/* ===== Role Cards ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Patient Card */}
          <Link href="/patient" id="patient-portal-link">
            <div className="glass-card p-8 group cursor-pointer transition-all duration-300 hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-500/20 transition-colors">
                <UserRound className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-surface-100 mb-2">
                Patient Portal
              </h2>
              <p className="text-sm text-surface-200/60 mb-4">
                Describe your symptoms via text or voice. Get a response from
                your doctor faster than ever.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-400 group-hover:gap-2 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Doctor Card */}
          <Link href="/doctor" id="doctor-dashboard-link">
            <div className="glass-card p-8 group cursor-pointer transition-all duration-300 hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-500/10 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-500/20 transition-colors">
                <Stethoscope className="w-8 h-8 text-accent-400" />
              </div>
              <h2 className="text-xl font-bold text-surface-100 mb-2">
                Doctor Dashboard
              </h2>
              <p className="text-sm text-surface-200/60 mb-4">
                Review AI-triaged inquiries, edit drafts, and approve responses
                in seconds — not hours.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-400 group-hover:gap-2 transition-all">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ===== Feature Highlights ===== */}
      <section className="mt-20 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
        {[
          {
            icon: <Zap className="w-6 h-6 text-warning-400" />,
            title: "Instant Triage",
            desc: "AI automatically classifies urgency as High, Medium, or Routine the moment a patient submits.",
          },
          {
            icon: <Brain className="w-6 h-6 text-accent-400" />,
            title: "Smart Symptom Extraction",
            desc: "Converts patient narratives into clean, structured symptom lists with timelines.",
          },
          {
            icon: <Shield className="w-6 h-6 text-success-400" />,
            title: "Human-in-the-Loop",
            desc: "AI never messages patients directly. Every response is reviewed and approved by a real doctor.",
          },
        ].map((feat) => (
          <div
            key={feat.title}
            className="glass-card-light p-6 text-center"
          >
            <div className="flex justify-center mb-3">{feat.icon}</div>
            <h3 className="text-base font-bold text-surface-100 mb-1">
              {feat.title}
            </h3>
            <p className="text-xs text-surface-200/50 leading-relaxed">
              {feat.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ===== Footer ===== */}
      <footer className="mt-20 text-center text-xs text-surface-200/30">
        © {new Date().getFullYear()} CogniCare · Built for better healthcare
      </footer>
    </main>
  );
}
