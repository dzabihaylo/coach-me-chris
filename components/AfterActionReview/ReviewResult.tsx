"use client";

import ScoreBar from "@/components/shared/ScoreBar";
import { VOSS_DIMENSIONS } from "@/lib/claude";
import type { ReviewFeedback } from "@/lib/claude";

interface ReviewResultProps {
  feedback: ReviewFeedback & { overallScore: number };
  title: string;
}

export default function ReviewResult({ feedback, title }: ReviewResultProps) {
  const overall = feedback.overallScore || 0;

  const overallColor =
    overall >= 7.5
      ? "text-emerald-400"
      : overall >= 5
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">
              {feedback.executiveSummary}
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className={`text-4xl font-bold ${overallColor}`}>
              {overall.toFixed(1)}
            </div>
            <div className="text-gray-500 text-xs">/ 10</div>
          </div>
        </div>
      </div>

      {/* Top Opportunity */}
      {feedback.topOpportunity && (
        <div className="bg-amber-900/20 border border-amber-600/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400 text-lg">🎯</span>
            <h3 className="text-amber-300 font-bold">
              Top Coaching Opportunity
            </h3>
            <span className="text-xs bg-amber-800/50 text-amber-300 rounded-full px-2 py-0.5">
              {feedback.topOpportunity.technique}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-3">
            <span className="text-gray-500">Moment: </span>
            &ldquo;{feedback.topOpportunity.moment}&rdquo;
          </p>
          <div className="bg-gray-800/60 rounded-lg p-3 border border-amber-700/30">
            <p className="text-xs text-amber-400 mb-1 font-semibold">
              What you could have said:
            </p>
            <p className="text-white text-sm italic">
              {feedback.topOpportunity.alternativeLanguage}
            </p>
          </div>
          <p className="text-gray-400 text-sm mt-3">
            {feedback.topOpportunity.why}
          </p>
        </div>
      )}

      {/* Highlights */}
      {feedback.highlights && feedback.highlights.length > 0 && (
        <div>
          <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
            <span>✓</span> What You Did Well
          </h3>
          <div className="space-y-3">
            {feedback.highlights.map((h, i) => (
              <div
                key={i}
                className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-emerald-800/50 text-emerald-300 rounded-full px-2 py-0.5">
                    {h.technique}
                  </span>
                </div>
                <p className="text-gray-300 text-sm italic mb-1">
                  &ldquo;{h.moment}&rdquo;
                </p>
                <p className="text-gray-400 text-xs">{h.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Scores */}
      <div>
        <h3 className="text-gray-300 font-semibold mb-4">
          Voss Dimension Scores
        </h3>
        <div className="grid gap-4">
          {VOSS_DIMENSIONS.map((dim) => {
            const detail = feedback.dimensionDetails?.[dim.key];
            const score = detail?.score ?? 0;
            return (
              <div key={dim.key} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <ScoreBar
                    score={score}
                    label={dim.label}
                    abbr={dim.label}
                    size="md"
                  />
                </div>
                {detail?.evidence && (
                  <p className="text-gray-400 text-xs mt-2">
                    {detail.evidence}
                  </p>
                )}
                {detail?.specificMoments && detail.specificMoments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {detail.specificMoments.map((m, i) => (
                      <p
                        key={i}
                        className="text-gray-500 text-xs italic pl-2 border-l border-gray-600"
                      >
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
