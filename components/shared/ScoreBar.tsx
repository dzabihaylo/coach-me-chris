"use client";

interface ScoreBarProps {
  score: number;
  label: string;
  abbr?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

function getColor(score: number) {
  if (score >= 7.5) return "bg-emerald-400";
  if (score >= 5) return "bg-amber-400";
  return "bg-red-400";
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
  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400 font-medium">{abbr || label}</span>
        {showValue && (
          <span className={`text-xs font-bold ${getTextColor(score)}`}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
      <div className={`w-full bg-gray-700 rounded-full ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
