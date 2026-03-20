"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { VOSS_DIMENSIONS } from "@/lib/voss";
import { format } from "date-fns";

interface CallHistory {
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
}

interface ProgressData {
  totalCalls: number;
  avgOverall: number;
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

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-emerald-400">
            {data.totalCalls}
          </div>
          <div className="text-gray-400 text-sm mt-1">Calls Reviewed</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
          <div
            className={`text-3xl font-bold ${
              data.avgOverall >= 7.5
                ? "text-emerald-400"
                : data.avgOverall >= 5
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {data.avgOverall.toFixed(1)}
          </div>
          <div className="text-gray-400 text-sm mt-1">Avg Overall Score</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-blue-400">
            {data.totalPracticeSessions}
          </div>
          <div className="text-gray-400 text-sm mt-1">Practice Sessions</div>
        </div>
      </div>

      {data.totalCalls === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 border border-dashed border-gray-600 text-center text-gray-500">
          <p className="text-lg">No calls reviewed yet.</p>
          <p className="text-sm mt-1">
            Submit your first call in the After-Action Review tab.
          </p>
        </div>
      ) : (
        <>
          {/* Trend line */}
          {trendData.length > 1 && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="text-gray-300 font-semibold mb-4 text-sm">
                Overall Score Trend
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="#6B7280"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#9CA3AF" }}
                    itemStyle={{ color: "#34D399" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#34D399"
                    strokeWidth={2}
                    dot={{ fill: "#34D399", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Radar chart */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-gray-300 font-semibold mb-4 text-sm">
              Voss Skills Radar
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#34D399"
                  fill="#34D399"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weakest dimension callout */}
          {weakestDim && data.weakest.score < 7 && (
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">⚡</span>
                <span className="text-amber-300 font-semibold text-sm">
                  Focus Area: {weakestDim.label}
                </span>
                <span className="text-amber-400 font-bold text-sm">
                  {data.weakest.score.toFixed(1)}/10
                </span>
              </div>
              <p className="text-gray-400 text-xs">
                This is your lowest-scoring dimension across reviewed calls.
                Head to Practice Games to drill this technique.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
