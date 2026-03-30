"use client";

import { useState, useEffect } from "react";
import ProgressChart from "./ProgressChart";
import ScoreBar from "@/components/shared/ScoreBar";
import { VOSS_DIMENSIONS } from "@/lib/voss";

interface ProgressData {
  totalCalls: number;
  avgOverall: number;
  dimensionAverages: Record<string, number>;
  weakest: { key: string; score: number };
  callHistory: {
    id: string; title: string; callDate: string; overallScore: number;
    tacticalEmpathy: number; mirroring: number; labeling: number;
    calibratedQuestions: number; thatsRight: number; usingNo: number;
    accusationAudit: number; lossFraming: number; ackermanBargaining: number;
    blackSwanDiscovery: number;
  }[];
  practiceSessions: {
    id: string; drillType: string; score: number; rounds: number; createdAt: string;
  }[];
  totalPracticeSessions: number;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setData(d))
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[var(--text-primary)] font-semibold text-lg">Progress</h2>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Track your improvement across calls and practice.</p>
      </div>

      <ProgressChart data={data} />

      {data.totalCalls > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-4">
            Dimension Averages
          </h3>
          <div className="grid gap-3">
            {VOSS_DIMENSIONS.map((d) => (
              <ScoreBar key={d.key} score={data.dimensionAverages[d.key] || 0} label={d.label} size="md" />
            ))}
          </div>
        </div>
      )}

      {data.practiceSessions.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-4">
            Recent Practice
          </h3>
          <div className="space-y-1.5">
            {data.practiceSessions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm bg-[var(--bg-elevated)] rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-secondary)] capitalize text-sm">{s.drillType}</span>
                  <span className="text-[var(--text-faint)] text-xs">{s.rounds} rounds</span>
                </div>
                <span className="text-emerald-400 font-semibold tabular-nums">{s.score.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
