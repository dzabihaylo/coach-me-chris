"use client";

import { useState } from "react";

interface CalibratedResult {
  original: string;
  alternatives: { question: string; why: string }[];
  bestPick: number;
}

const EXAMPLE_QUESTIONS = [
  "Can you give us a discount?",
  "Is this decision yours to make?",
  "Will you be ready to sign by Friday?",
  "Are you happy with the current solution?",
  "Can we get started next quarter?",
];

export default function CalibratedQuestionBuilder() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibratedResult | null>(null);
  const [history, setHistory] = useState<CalibratedResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const convert = async (question?: string) => {
    const q = question || input;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drillType: "calibrated", messages: [], userInput: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const parsed: CalibratedResult = data.result;
      parsed.original = q;
      setResult(parsed);
      setHistory((h) => [parsed, ...h.slice(0, 9)]);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to convert question");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-default)]">
        <h3 className="text-[var(--text-primary)] font-semibold mb-2">
          Calibrated Question Builder
        </h3>
        <p className="text-[var(--text-muted)] text-sm">
          Enter a yes/no question and get it rewritten as calibrated "How" and
          "What" questions that give your counterpart the illusion of control
          while keeping you in the driver&apos;s seat.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && convert()}
            placeholder='Type a yes/no question...'
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
          />
          <button
            onClick={() => convert()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? "..." : "Convert"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => convert(q)}
              className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] rounded-full px-3 py-1 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {loading && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 animate-pulse text-[var(--text-muted)] text-sm">
          Rewriting...
        </div>
      )}

      {result && (
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-default)] space-y-4">
          <div>
            <span className="text-xs text-red-400 font-semibold">Original (yes/no)</span>
            <p className="text-[var(--text-secondary)] italic mt-1">&ldquo;{result.original}&rdquo;</p>
          </div>

          <div className="space-y-3">
            <span className="text-xs text-cyan-400 font-semibold">
              Calibrated Alternatives
            </span>
            {result.alternatives?.map((alt, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 border ${
                  i === result.bestPick
                    ? "border-cyan-500 bg-cyan-900/20"
                    : "border-[var(--border-default)] bg-[var(--bg-elevated)]"
                }`}
              >
                <div className="flex items-start gap-2">
                  {i === result.bestPick && (
                    <span className="text-cyan-400 text-xs font-bold shrink-0 mt-0.5">
                      BEST
                    </span>
                  )}
                  <div>
                    <p className="text-[var(--text-primary)] font-medium text-sm">
                      &ldquo;{alt.question}&rdquo;
                    </p>
                    <p className="text-[var(--text-muted)] text-xs mt-1">{alt.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h4 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-2">
            Previous Conversions
          </h4>
          <div className="space-y-1">
            {history.slice(1).map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-[var(--text-faint)] bg-[var(--bg-card)]/30 rounded px-3 py-1.5"
              >
                <span className="text-red-400 line-through">{h.original}</span>
                <span className="text-[var(--text-faint)]">→</span>
                <span className="text-cyan-400">
                  {h.alternatives?.[h.bestPick]?.question}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
