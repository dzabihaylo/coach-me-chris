"use client";

import { useState, useEffect } from "react";
import ReviewForm from "./ReviewForm";
import ReviewResult from "./ReviewResult";
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

export default function AfterActionPage() {
  const [view, setView] = useState<"list" | "new" | "result">("list");
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FullFeedback | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [selectedReview, setSelectedReview] = useState<{ id: string; title: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const res = await fetch("/api/review");
    const data = await res.json();
    setReviews(data.reviews || []);
  };

  const handleSubmit = async (formData: {
    title: string;
    callDate: string;
    transcriptText: string;
    durationMinutes?: number;
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
      }
    } catch {
      alert("Analysis failed. Check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewDetail = async (id: string, title: string) => {
    setLoadingDetail(true);
    setSelectedReview({ id, title });
    const res = await fetch(`/api/review/${id}`);
    const data = await res.json();
    if (data.review) {
      const feedback = JSON.parse(data.review.feedbackJson);
      setCurrentFeedback(feedback);
      setCurrentTitle(title);
      setView("result");
    }
    setLoadingDetail(false);
  };

  const scoreColor = (s: number) =>
    s >= 7.5 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";

  return (
    <div>
      {/* Nav buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              view === "list"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setView("new")}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              view === "new"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            + New Review
          </button>
          {view === "result" && (
            <button
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-700 text-white"
            >
              Result: {currentTitle}
            </button>
          )}
        </div>
      </div>

      {view === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-300 font-semibold">Past Reviews</h2>
            <button
              onClick={() => setView("new")}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Analyze New Call
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-gray-800/50 border border-dashed border-gray-600 rounded-xl p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No calls analyzed yet.</p>
              <p className="text-sm">Paste a transcript to get your first after-action review.</p>
              <button
                onClick={() => setView("new")}
                className="mt-4 bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
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
                  className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl p-4 flex items-center justify-between text-left transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{r.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {format(new Date(r.callDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${scoreColor(r.overallScore)}`}>
                      {r.overallScore.toFixed(1)}
                    </p>
                    <p className="text-gray-600 text-xs">/ 10</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loadingDetail && (
            <div className="text-center text-gray-400 text-sm py-4 animate-pulse">
              Loading review...
            </div>
          )}
        </div>
      )}

      {view === "new" && (
        <div>
          <h2 className="text-gray-300 font-semibold mb-4">
            Analyze a Call
          </h2>
          <ReviewForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      )}

      {view === "result" && currentFeedback && (
        <ReviewResult feedback={currentFeedback} title={currentTitle} />
      )}
    </div>
  );
}
