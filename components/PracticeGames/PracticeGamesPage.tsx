"use client";

import { useState } from "react";
import MirrorDrill from "./MirrorDrill";
import AckermanDrill from "./AckermanDrill";
import CalibratedQuestionBuilder from "./CalibratedQuestionBuilder";
import RoleplayScenario from "./RoleplayScenario";

type Drill = "mirror" | "ackerman" | "calibrated" | "roleplay";

const DRILLS: {
  id: Drill;
  label: string;
  icon: string;
  desc: string;
  color: string;
}[] = [
  {
    id: "mirror",
    label: "Mirroring Drill",
    icon: "🔄",
    desc: "Repeat last 2-3 words to unlock more",
    color: "border-blue-600 hover:bg-blue-900/20",
  },
  {
    id: "ackerman",
    label: "Ackerman Bargaining",
    icon: "📉",
    desc: "65% → 85% → 95% → 100% concession ladder",
    color: "border-pink-600 hover:bg-pink-900/20",
  },
  {
    id: "calibrated",
    label: "Calibrated Questions",
    icon: "❓",
    desc: "Rewrite yes/no into How/What questions",
    color: "border-cyan-600 hover:bg-cyan-900/20",
  },
  {
    id: "roleplay",
    label: "Role-Play Scenario",
    icon: "🎭",
    desc: "Full negotiation sim with a skeptical buyer",
    color: "border-indigo-600 hover:bg-indigo-900/20",
  },
];

export default function PracticeGamesPage() {
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-300 font-semibold mb-1">Practice Games</h2>
        <p className="text-gray-500 text-sm">
          Interactive drills to sharpen specific Voss techniques.
        </p>
      </div>

      {/* Drill selector */}
      <div className="grid grid-cols-2 gap-3">
        {DRILLS.map((drill) => (
          <button
            key={drill.id}
            onClick={() => setActiveDrill(drill.id)}
            className={`text-left bg-gray-800/50 border rounded-xl p-4 transition-colors ${drill.color} ${
              activeDrill === drill.id
                ? "ring-2 ring-emerald-500"
                : ""
            }`}
          >
            <div className="text-2xl mb-2">{drill.icon}</div>
            <div className="text-white font-semibold text-sm">{drill.label}</div>
            <div className="text-gray-400 text-xs mt-1">{drill.desc}</div>
          </button>
        ))}
      </div>

      {/* Active drill */}
      {activeDrill && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-5">
          {activeDrill === "mirror" && <MirrorDrill />}
          {activeDrill === "ackerman" && <AckermanDrill />}
          {activeDrill === "calibrated" && <CalibratedQuestionBuilder />}
          {activeDrill === "roleplay" && <RoleplayScenario />}
        </div>
      )}

      {!activeDrill && (
        <div className="text-center text-gray-600 text-sm py-4">
          Select a drill above to start practicing.
        </div>
      )}
    </div>
  );
}
