"use client";

interface NudgeBadgeProps {
  nudge: string;
  technique?: string | null;
  onDismiss?: () => void;
  className?: string;
}

const TECHNIQUE_COLORS: Record<string, string> = {
  labeling: "border-purple-500 bg-purple-900/40",
  mirroring: "border-blue-500 bg-blue-900/40",
  calibratedQuestions: "border-cyan-500 bg-cyan-900/40",
  tacticalEmpathy: "border-teal-500 bg-teal-900/40",
  thatsRight: "border-emerald-500 bg-emerald-900/40",
  usingNo: "border-amber-500 bg-amber-900/40",
  accusationAudit: "border-orange-500 bg-orange-900/40",
  lossFraming: "border-red-500 bg-red-900/40",
  ackermanBargaining: "border-pink-500 bg-pink-900/40",
  blackSwanDiscovery: "border-indigo-500 bg-indigo-900/40",
};

export default function NudgeBadge({
  nudge,
  technique,
  onDismiss,
  className = "",
}: NudgeBadgeProps) {
  const colorClass =
    (technique && TECHNIQUE_COLORS[technique]) ||
    "border-emerald-500 bg-emerald-900/40";

  return (
    <div
      className={`border rounded-lg px-4 py-3 flex items-center gap-3 ${colorClass} ${className}`}
    >
      <span className="text-2xl">💡</span>
      <span className="text-white font-semibold text-lg flex-1">{nudge}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white text-sm ml-2"
        >
          ✕
        </button>
      )}
    </div>
  );
}
