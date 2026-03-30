"use client";

interface ScoreBarProps {
  score: number;
  label: string;
  abbr?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

function getColor(score: number) {
  if (score >= 7.5) return "bg-emerald-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
}

function getTextColor(score: number) {
  if (score >= 7.5) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

export default function ScoreBar({
  score,
  label,
  abbr,
  showValue = true,
  size = "md",
}: ScoreBarProps) {
  const pct = Math.min(100, (score / 10) * 100);
  const heightClass = size === "sm" ? "h-1" : size === "lg" ? "h-2.5" : "h-1.5";

  return (
    <div className="w-full group">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-[var(--text-muted)] font-medium group-hover:text-[var(--text-secondary)] transition-colors">
          {abbr || label}
        </span>
        {showValue && (
          <span className={`text-xs font-semibold tabular-nums ${getTextColor(score)}`}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
      <div className={`w-full bg-[var(--bg-elevated)] rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-700 ease-out ${getColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
