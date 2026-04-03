"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Loader2,
  Inbox,
  User,
} from "lucide-react";

interface TriageItem {
  id: string;
  inquiry_id: string;
  urgency_level: string;
  symptoms_json: string[];
  ai_draft_response: string;
  doctor_approved: boolean;
  created_at: string;
  inquiry: {
    id: string;
    raw_text: string;
    status: string;
    patient: {
      full_name: string;
    };
  };
}

export default function DoctorPage() {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Routine">("all");

  // ---------- Fetch ----------
  const fetchItems = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/inquiries");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.triages || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => fetchItems(), 15000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  // ---------- Approve ----------
  const handleApprove = async (triageId: string, draftResponse?: string) => {
    setApprovingId(triageId);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triageId,
          ...(draftResponse && { updatedDraft: draftResponse }),
        }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      await fetchItems();
      setEditingId(null);
      setExpandedId(null);
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setApprovingId(null);
    }
  };

  // ---------- Helpers ----------
  const getUrgencyBadge = (level: string) => {
    const lower = level.toLowerCase();
    const cls = lower === "high" ? "badge-high" : lower === "medium" ? "badge-medium" : "badge-routine";
    const Icon = lower === "high" ? AlertTriangle : lower === "medium" ? Clock : CheckCircle2;
    return (
      <span className={`badge ${cls}`}>
        <Icon className="w-3 h-3" /> {level}
      </span>
    );
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredItems = filter === "all" ? items : items.filter((i) => i.urgency_level === filter);
  const pendingCount = items.filter((i) => !i.doctor_approved).length;
  const highCount = items.filter((i) => i.urgency_level === "High" && !i.doctor_approved).length;

  // ---------- UI ----------
  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <nav className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-surface-200/10 transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-surface-200/60" />
            </button>
          </Link>
          <Activity className="w-7 h-7 text-accent-400" />
          <h1 className="text-xl font-bold text-surface-100">Doctor Dashboard</h1>
        </div>
        <button
          onClick={() => fetchItems(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-sm"
          id="refresh-dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </nav>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="glass-card-light p-4 text-center">
          <p className="text-2xl font-bold text-surface-100">{items.length}</p>
          <p className="text-xs text-surface-200/50">Total Inquiries</p>
        </div>
        <div className="glass-card-light p-4 text-center">
          <p className="text-2xl font-bold text-warning-400">{pendingCount}</p>
          <p className="text-xs text-surface-200/50">Pending Review</p>
        </div>
        <div className="glass-card-light p-4 text-center">
          <p className="text-2xl font-bold text-danger-400">{highCount}</p>
          <p className="text-xs text-surface-200/50">High Urgency</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        {(["all", "High", "Medium", "Routine"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "text-surface-200/50 hover:text-surface-200/80 hover:bg-surface-200/5"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-fade-in-up">
          <Inbox className="w-16 h-16 text-surface-200/20 mb-4" />
          <h2 className="text-lg font-semibold text-surface-200/40 mb-1">No inquiries yet</h2>
          <p className="text-sm text-surface-200/25">
            Patient submissions will appear here in real-time.
          </p>
        </div>
      ) : (
        /* Inquiry Cards */
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;
            const isApproving = approvingId === item.id;

            return (
              <div
                key={item.id}
                className={`glass-card overflow-hidden transition-all duration-300 ${
                  item.doctor_approved ? "opacity-60" : ""
                } ${
                  item.urgency_level === "High" && !item.doctor_approved
                    ? "border-danger-500/30"
                    : ""
                }`}
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-200/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-surface-100">
                          {item.inquiry?.patient?.full_name || "Unknown Patient"}
                        </h3>
                        {getUrgencyBadge(item.urgency_level)}
                        {item.doctor_approved && (
                          <span className="badge bg-success-400/10 text-success-400 border-success-400/30">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-200/50 line-clamp-1">
                        {item.inquiry?.raw_text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-surface-200/30">
                      {timeAgo(item.created_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-surface-200/30" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-200/30" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-surface-200/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                      {/* Left: Patient Message & Symptoms */}
                      <div>
                        <h4 className="text-xs font-semibold text-surface-200/40 uppercase tracking-wider mb-2">
                          Patient Message
                        </h4>
                        <p className="text-sm text-surface-200/70 leading-relaxed mb-5 p-3 rounded-lg bg-surface-950/50">
                          {item.inquiry?.raw_text}
                        </p>

                        <h4 className="text-xs font-semibold text-surface-200/40 uppercase tracking-wider mb-2">
                          Extracted Symptoms
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(item.symptoms_json || []).map((symptom, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full text-xs bg-primary-500/10 text-primary-300 border border-primary-500/20"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: AI Draft & Actions */}
                      <div>
                        <h4 className="text-xs font-semibold text-surface-200/40 uppercase tracking-wider mb-2">
                          AI Drafted Response
                        </h4>

                        {isEditing ? (
                          <textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={6}
                            className="textarea-glass text-sm mb-4"
                          />
                        ) : (
                          <p className="text-sm text-surface-200/70 leading-relaxed p-3 rounded-lg bg-surface-950/50 mb-4">
                            {item.ai_draft_response}
                          </p>
                        )}

                        {!item.doctor_approved && (
                          <div className="flex gap-3">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id, editDraft)}
                                  disabled={isApproving}
                                  className="btn-success flex-1 flex items-center justify-center gap-2 text-sm"
                                >
                                  {isApproving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                  Save & Approve
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="btn-secondary text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  disabled={isApproving}
                                  className="btn-success flex-1 flex items-center justify-center gap-2 text-sm"
                                >
                                  {isApproving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                  Approve & Send
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditDraft(item.ai_draft_response);
                                  }}
                                  className="btn-secondary flex items-center gap-2 text-sm"
                                >
                                  <Edit3 className="w-4 h-4" /> Edit
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
