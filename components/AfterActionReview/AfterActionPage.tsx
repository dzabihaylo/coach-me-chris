"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import ReviewForm from "./ReviewForm";
import ReviewResult from "./ReviewResult";
import GranolaPicker from "./GranolaPicker";
import type { ReviewFeedback } from "@/lib/voss";
import { format } from "date-fns";

interface ReviewSummary {
  id: string;
  title: string;
  callDate: string;
  overallScore: number;
}

interface FullFeedback extends ReviewFeedback {
  overallScore: number;
}

function scoreColor(s: number) {
  if (s >= 7.5) return "text-emerald-400";
  if (s >= 5) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(s: number) {
  if (s >= 7.5) return "bg-emerald-500/10";
  if (s >= 5) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export default function AfterActionPage() {
  const [view, setView] = useState<"list" | "new" | "granola" | "result">("list");
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FullFeedback | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    const res = await fetch("/api/review");
    const data = await res.json();
    setReviews(data.reviews || []);
  };

  const [granolaImport, setGranolaImport] = useState<{
    title: string; callDate: string; transcriptText: string;
    durationMinutes?: number; granolaId: string;
  } | null>(null);

  const handleGranolaImport = (data: typeof granolaImport & object) => {
    setGranolaImport(data);
    setView("new");
  };

  const handleSubmit = async (formData: {
    title: string; callDate: string; transcriptText: string; durationMinutes?: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.feedback) {
        setCurrentFeedback(data.feedback);
        setCurrentTitle(formData.title);
        setView("result");
        fetchReviews();
      } else {
        alert(data.error || "Analysis returned no results.");
      }
    } catch {
      alert("Analysis failed. Try again or use a shorter transcript.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewDetail = async (id: string, title: string) => {
    setLoadingDetail(true);
    const res = await fetch(`/api/review/${id}`);
    const data = await res.json();
    if (data.review) {
      try {
        const feedback = JSON.parse(data.review.feedbackJson);
        setCurrentFeedback(feedback);
        setCurrentTitle(title);
        setView("result");
      } catch { alert("Could not load review data."); }
    }
    setLoadingDetail(false);
  };

  return (
    <div>
      {/* Sub-nav */}
      {view !== "list" && (
        <button
          onClick={() => { setView("list"); setGranolaImport(null); }}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm mb-5"
        >
          <ArrowLeft size={14} /> Back to reviews
        </button>
      )}

      {view === "list" && (
        <div className="space-y-5 animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[var(--text-primary)] font-semibold text-lg">After-Action Review</h2>
              <p className="text-[var(--text-muted)] text-sm mt-0.5">Analyze your calls across 10 Voss dimensions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView("granola")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm px-4 py-2 rounded-xl font-medium"
              >
                Import
              </button>
              <button
                onClick={() => setView("new")}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm px-4 py-2 rounded-xl font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-900/20"
              >
                <Plus size={15} /> New Review
              </button>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[var(--text-faint)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] font-medium mb-1">No calls analyzed yet</p>
              <p className="text-[var(--text-faint)] text-sm mb-5">Paste a transcript or upload a recording to get started.</p>
              <button
                onClick={() => setView("new")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium"
              >
                Analyze Your First Call
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <button
                  key={r.id}
                  onClick={() => loadReviewDetail(r.id, r.title)}
                  className="w-full glass hover:bg-[var(--bg-card-hover)] rounded-xl p-4 flex items-center justify-between text-left group"
                >
                  <div className="min-w-0">
                    <p className="text-[var(--text-primary)] font-medium text-sm group-hover:text-white truncate">
                      {r.title}
                    </p>
                    <p className="text-[var(--text-faint)] text-xs mt-0.5">
                      {format(new Date(r.callDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className={`${scoreBg(r.overallScore)} rounded-xl px-3 py-1.5 text-right shrink-0 ml-4`}>
                    <span className={`text-xl font-bold tabular-nums ${scoreColor(r.overallScore)}`}>
                      {r.overallScore.toFixed(1)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loadingDetail && (
            <div className="text-center text-[var(--text-muted)] text-sm py-4 animate-pulse">Loading review...</div>
          )}
        </div>
      )}

      {view === "granola" && (
        <GranolaPicker onImport={handleGranolaImport} onCancel={() => setView("list")} />
      )}

      {view === "new" && (
        <div className="animate-fade-up">
          <h2 className="text-[var(--text-primary)] font-semibold text-lg mb-5">
            {granolaImport ? `Review: ${granolaImport.title}` : "Analyze a Call"}
          </h2>
          <ReviewForm
            onSubmit={(data) => { handleSubmit(data); setGranolaImport(null); }}
            isLoading={isLoading}
            prefill={granolaImport ?? undefined}
          />
        </div>
      )}

      {view === "result" && currentFeedback && (
        <div className="animate-fade-up">
          <ReviewResult feedback={currentFeedback} title={currentTitle} />
        </div>
      )}
    </div>
  );
}
