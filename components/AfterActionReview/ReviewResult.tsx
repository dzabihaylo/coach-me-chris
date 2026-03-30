"use client";

import ScoreBar from "@/components/shared/ScoreBar";
import { VOSS_DIMENSIONS } from "@/lib/voss";
import type { ReviewFeedback } from "@/lib/voss";

interface ReviewResultProps {
  feedback: ReviewFeedback & { overallScore: number };
  title: string;
}

export default function ReviewResult({ feedback, title }: ReviewResultProps) {
  const overall = feedback.overallScore || 0;
  const overallColor =
    overall >= 7.5 ? "text-emerald-400" : overall >= 5 ? "text-amber-400" : "text-red-400";
  const ringColor =
    overall >= 7.5 ? "stroke-emerald-500" : overall >= 5 ? "stroke-amber-500" : "stroke-red-500";

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (overall / 10) * circumference;

  return (
    <div className="space-y-6">
      {/* Header with score ring */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
              <circle
                cx="48" cy="48" r="40" fill="none"
                className={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ animation: "score-fill 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold tabular-nums ${overallColor}`}>
                {overall.toFixed(1)}
              </span>
              <span className="text-[var(--text-faint)] text-[10px]">/ 10</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-[var(--text-primary)] font-bold text-lg">{title}</h3>
            <p className="text-[var(--text-muted)] text-sm mt-2 leading-relaxed">
              {feedback.executiveSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Top Opportunity */}
      {feedback.topOpportunity && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-amber-300 font-semibold text-sm">Top Coaching Opportunity</h3>
            <span className="text-[10px] bg-amber-500/15 text-amber-300 rounded-full px-2.5 py-0.5 font-medium">
              {feedback.topOpportunity.technique}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-3">
            <span className="text-[var(--text-faint)]">Moment: </span>
            &ldquo;{feedback.topOpportunity.moment}&rdquo;
          </p>
          <div className="bg-[var(--bg-primary)]/50 rounded-xl p-4 border border-amber-500/10">
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-1.5">What you could have said</p>
            <p className="text-[var(--text-primary)] text-sm italic">{feedback.topOpportunity.alternativeLanguage}</p>
          </div>
          <p className="text-[var(--text-muted)] text-sm mt-3">{feedback.topOpportunity.why}</p>
        </div>
      )}

      {/* Highlights */}
      {feedback.highlights && feedback.highlights.length > 0 && (
        <div>
          <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            What You Did Well
          </h3>
          <div className="space-y-2">
            {feedback.highlights.map((h, i) => (
              <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 rounded-full px-2.5 py-0.5 font-medium">
                  {h.technique}
                </span>
                <p className="text-[var(--text-secondary)] text-sm italic mt-2">&ldquo;{h.moment}&rdquo;</p>
                <p className="text-[var(--text-faint)] text-xs mt-1.5">{h.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Scores */}
      <div>
        <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-4">
          Voss Dimension Scores
        </h3>
        <div className="grid gap-3">
          {VOSS_DIMENSIONS.map((dim) => {
            const detail = feedback.dimensionDetails?.[dim.key];
            const score = detail?.score ?? 0;
            return (
              <div key={dim.key} className="glass rounded-xl p-4">
                <ScoreBar score={score} label={dim.label} abbr={dim.label} size="md" />
                {detail?.evidence && (
                  <p className="text-[var(--text-faint)] text-xs mt-2.5 leading-relaxed">{detail.evidence}</p>
                )}
                {detail?.specificMoments && detail.specificMoments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {detail.specificMoments.map((m, i) => (
                      <p key={i} className="text-[var(--text-faint)] text-xs italic pl-3 border-l-2 border-[var(--border-default)]">
                        &ldquo;{m}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
