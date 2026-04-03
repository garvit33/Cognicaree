"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Mic,
  MicOff,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Extend Window for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function PatientPage() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  // ---------- Speech Recognition ----------
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please enable it in your browser settings.");
      }
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError("");
  }, [isRecording]);

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) {
      setError("Please enter your name and describe your symptoms.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // First register the patient (or use existing)
      const patientRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name.trim() }),
      });

      if (!patientRes.ok) throw new Error("Failed to register patient");
      const { patient } = await patientRes.json();

      // Then submit the inquiry
      const intakeRes = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, text: text.trim() }),
      });

      if (!intakeRes.ok) {
        const errData = await intakeRes.json();
        throw new Error(errData.error || "Failed to submit inquiry");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Success State ----------
  if (submitted) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in-up">
          <CheckCircle2 className="w-16 h-16 text-success-400 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-surface-100 mb-2">
            Submitted Successfully!
          </h2>
          <p className="text-surface-200/60 text-sm mb-8 leading-relaxed">
            Your inquiry has been received and is being analyzed by our AI.
            A doctor will review your case and respond shortly.
          </p>
          <Link href="/">
            <button className="btn-secondary">
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </span>
            </button>
          </Link>
        </div>
      </main>
    );
  }

  // ---------- Main Form ----------
  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <nav className="flex items-center gap-3 mb-8 animate-fade-in-up">
        <Link href="/">
          <button className="p-2 rounded-lg hover:bg-surface-200/10 transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-surface-200/60" />
          </button>
        </Link>
        <Activity className="w-7 h-7 text-primary-400" />
        <h1 className="text-xl font-bold text-surface-100">Patient Intake</h1>
      </nav>

      <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-2xl font-bold text-surface-100 mb-1">
          How can we help you today?
        </h2>
        <p className="text-sm text-surface-200/50 mb-8">
          Type your symptoms below, or tap the microphone to dictate them using your voice.
        </p>

        {/* Name Field */}
        <div className="mb-6">
          <label htmlFor="patient-name" className="block text-sm font-medium text-surface-200/70 mb-2">
            Your Full Name
          </label>
          <input
            id="patient-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="textarea-glass !py-3 !resize-none"
          />
        </div>

        {/* Symptoms Field */}
        <div className="mb-6">
          <label htmlFor="patient-symptoms" className="block text-sm font-medium text-surface-200/70 mb-2">
            Describe Your Symptoms
          </label>
          <div className="relative">
            <textarea
              id="patient-symptoms"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I've had a sore throat and mild fever since yesterday evening. I also feel a little dizzy when I stand up..."
              className="textarea-glass pr-14"
            />
            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute bottom-3 right-3 p-3 rounded-xl transition-all duration-300 ${
                isRecording
                  ? "bg-danger-500/20 text-danger-400 shadow-lg shadow-danger-500/20"
                  : "bg-primary-500/10 text-primary-400 hover:bg-primary-500/20"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-xl bg-danger-400/30 animate-pulse-ring" />
              )}
              {isRecording ? (
                <MicOff className="w-5 h-5 relative z-10" />
              ) : (
                <Mic className="w-5 h-5 relative z-10" />
              )}
            </button>
          </div>
          {isRecording && (
            <p className="mt-2 text-xs text-danger-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger-400 animate-pulse" />
              Listening… speak clearly into your microphone
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 mb-6">
            <AlertCircle className="w-4 h-4 text-danger-400 shrink-0 mt-0.5" />
            <p className="text-sm text-danger-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          id="submit-intake"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI…
            </>
          ) : (
            <>
              <Send className="w-5 h-5" /> Submit for Review
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-surface-200/30 mt-6">
        Your data is processed securely. A doctor will always review before any response is sent.
      </p>
    </main>
  );
}
