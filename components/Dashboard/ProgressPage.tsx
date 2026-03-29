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
    id: string;
    title: string;
    callDate: string;
    overallScore: number;
    tacticalEmpathy: number;
    mirroring: number;
    labeling: number;
    calibratedQuestions: number;
    thatsRight: number;
    usingNo: number;
    accusationAudit: number;
    lossFraming: number;
    ackermanBargaining: number;
    blackSwanDiscovery: number;
  }[];
  practiceSessions: {
    id: string;
    drillType: string;
    score: number;
    rounds: number;
    createdAt: string;
  }[];
  totalPracticeSessions: number;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 animate-pulse">
        Loading progress...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-300 font-semibold mb-1">Your Progress</h2>
        <p className="text-gray-500 text-sm">
          Track improvement across calls and practice sessions.
        </p>
      </div>

      <ProgressChart data={data} />

      {data.totalCalls > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-gray-300 font-semibold mb-4 text-sm">
            Dimension Averages (All Calls)
          </h3>
          <div className="grid gap-3">
            {VOSS_DIMENSIONS.map((d) => (
              <ScoreBar
                key={d.key}
                score={data.dimensionAverages[d.key] || 0}
                label={d.label}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      {data.practiceSessions.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-gray-300 font-semibold mb-4 text-sm">
            Recent Practice Sessions
          </h3>
          <div className="space-y-2">
            {data.practiceSessions.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm bg-gray-700/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 capitalize">{s.drillType}</span>
                  <span className="text-gray-600 text-xs">
                    {s.rounds} rounds
                  </span>
                </div>
                <span className="text-emerald-400 font-medium">
                  {s.score.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
