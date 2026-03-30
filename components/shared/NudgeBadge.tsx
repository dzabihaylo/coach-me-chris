"use client";

interface NudgeBadgeProps {
  nudge: string;
  technique?: string | null;
  onDismiss?: () => void;
  className?: string;
}

const TECHNIQUE_COLORS: Record<string, string> = {
  labeling: "border-purple-500/30 bg-purple-500/8",
  mirroring: "border-blue-500/30 bg-blue-500/8",
  calibratedQuestions: "border-cyan-500/30 bg-cyan-500/8",
  tacticalEmpathy: "border-teal-500/30 bg-teal-500/8",
  thatsRight: "border-emerald-500/30 bg-emerald-500/8",
  usingNo: "border-amber-500/30 bg-amber-500/8",
  accusationAudit: "border-orange-500/30 bg-orange-500/8",
  lossFraming: "border-red-500/30 bg-red-500/8",
  ackermanBargaining: "border-pink-500/30 bg-pink-500/8",
  blackSwanDiscovery: "border-indigo-500/30 bg-indigo-500/8",
};

export default function NudgeBadge({
  nudge,
  technique,
  onDismiss,
  className = "",
}: NudgeBadgeProps) {
  const colorClass =
    (technique && TECHNIQUE_COLORS[technique]) ||
    "border-emerald-500/30 bg-emerald-500/8";

  return (
    <div
      className={`border rounded-2xl px-5 py-4 flex items-center gap-4 animate-fade-up ${colorClass} ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[var(--text-primary)] font-semibold text-lg block">{nudge}</span>
        {technique && (
          <span className="text-[var(--text-muted)] text-xs capitalize">{technique.replace(/([A-Z])/g, " $1").trim()}</span>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
