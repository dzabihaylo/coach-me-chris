"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { VOSS_DIMENSIONS } from "@/lib/voss";
import { format } from "date-fns";

interface CallHistory {
  id: string; title: string; callDate: string; overallScore: number;
  tacticalEmpathy: number; mirroring: number; labeling: number;
  calibratedQuestions: number; thatsRight: number; usingNo: number;
  accusationAudit: number; lossFraming: number; ackermanBargaining: number;
  blackSwanDiscovery: number;
}

interface ProgressData {
  totalCalls: number; avgOverall: number;
  dimensionAverages: Record<string, number>;
  weakest: { key: string; score: number };
  callHistory: CallHistory[];
  totalPracticeSessions: number;
}

export default function ProgressChart({ data }: { data: ProgressData }) {
  const trendData = data.callHistory.map((r) => ({
    date: format(new Date(r.callDate), "MMM d"),
    score: r.overallScore,
    title: r.title,
  }));

  const radarData = VOSS_DIMENSIONS.map((d) => ({
    subject: d.abbr,
    score: data.dimensionAverages[d.key] || 0,
    fullMark: 10,
  }));

  const weakestDim = VOSS_DIMENSIONS.find((d) => d.key === data.weakest?.key);

  const avgColor =
    data.avgOverall >= 7.5 ? "text-emerald-400" : data.avgOverall >= 5 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{data.totalCalls}</div>
          <div className="text-[var(--text-faint)] text-xs mt-1.5 font-medium">Calls Reviewed</div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className={`text-3xl font-bold tabular-nums ${avgColor}`}>{data.avgOverall.toFixed(1)}</div>
          <div className="text-[var(--text-faint)] text-xs mt-1.5 font-medium">Avg Score</div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-blue-400 tabular-nums">{data.totalPracticeSessions}</div>
          <div className="text-[var(--text-faint)] text-xs mt-1.5 font-medium">Practice Sessions</div>
        </div>
      </div>

      {data.totalCalls === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-[var(--text-muted)] font-medium">No calls reviewed yet.</p>
          <p className="text-[var(--text-faint)] text-sm mt-1">Submit your first call in the Review tab.</p>
        </div>
      ) : (
        <>
          {trendData.length > 1 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-4">
                Score Trend
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="var(--text-faint)" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} stroke="var(--text-faint)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "12px", fontSize: "12px" }}
                    labelStyle={{ color: "var(--text-muted)" }}
                    itemStyle={{ color: "#34D399" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#34D399" strokeWidth={2} dot={{ fill: "#34D399", r: 3.5 }} activeDot={{ r: 5.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-4">
              Skills Radar
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="#34D399" fill="#34D399" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {weakestDim && data.weakest.score < 7 && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-amber-300 font-semibold text-sm">Focus: {weakestDim.label}</span>
                <span className="text-amber-400 font-bold text-sm tabular-nums">{data.weakest.score.toFixed(1)}/10</span>
              </div>
              <p className="text-[var(--text-faint)] text-xs leading-relaxed">
                Your lowest-scoring dimension. Head to Practice to drill this technique.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
