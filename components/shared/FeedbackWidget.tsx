"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";

interface FeedbackWidgetProps {
  context: string;
  sessionId?: string;
  onDismiss?: () => void;
}

export default function FeedbackWidget({ context, sessionId, onDismiss }: FeedbackWidgetProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null, context, sessionId }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-4 text-center animate-fade-up">
        <p className="text-emerald-400 text-sm font-medium">Thanks for the feedback</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium">
          How was this session?
        </span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-[var(--text-faint)] hover:text-[var(--text-muted)] text-xs">
            Skip
          </button>
        )}
      </div>

      {/* Star rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoveredRating(n)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5"
          >
            <Star
              size={22}
              className={`transition-colors ${
                n <= (hoveredRating || rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-[var(--text-faint)]"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-[var(--text-muted)] text-xs ml-2 self-center">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      {rating > 0 && (
        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="What could be better? (optional)"
            maxLength={2000}
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
          >
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
