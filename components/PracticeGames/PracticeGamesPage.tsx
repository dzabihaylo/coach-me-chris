"use client";

import { useState } from "react";
import { Repeat, TrendingDown, HelpCircle, Theater } from "lucide-react";
import MirrorDrill from "./MirrorDrill";
import AckermanDrill from "./AckermanDrill";
import CalibratedQuestionBuilder from "./CalibratedQuestionBuilder";
import RoleplayScenario from "./RoleplayScenario";

type Drill = "mirror" | "ackerman" | "calibrated" | "roleplay";

const DRILLS: {
  id: Drill;
  label: string;
  icon: typeof Repeat;
  desc: string;
  accent: string;
  bg: string;
}[] = [
  {
    id: "mirror",
    label: "Mirroring",
    icon: Repeat,
    desc: "Repeat last 2-3 words to unlock more",
    accent: "text-blue-400",
    bg: "hover:bg-blue-500/5 border-blue-500/20",
  },
  {
    id: "ackerman",
    label: "Price Defense",
    icon: TrendingDown,
    desc: "Defend your price against a buyer grinding you down",
    accent: "text-pink-400",
    bg: "hover:bg-pink-500/5 border-pink-500/20",
  },
  {
    id: "calibrated",
    label: "Calibrated Qs",
    icon: HelpCircle,
    desc: "Rewrite yes/no into How/What questions",
    accent: "text-cyan-400",
    bg: "hover:bg-cyan-500/5 border-cyan-500/20",
  },
  {
    id: "roleplay",
    label: "Role-Play",
    icon: Theater,
    desc: "Full negotiation sim with a skeptical buyer",
    accent: "text-indigo-400",
    bg: "hover:bg-indigo-500/5 border-indigo-500/20",
  },
];

export default function PracticeGamesPage() {
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[var(--text-primary)] font-semibold text-lg">Practice</h2>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">
          Sharpen specific Voss techniques with interactive drills.
        </p>
      </div>

      {/* Drill selector */}
      <div className="grid grid-cols-2 gap-3">
        {DRILLS.map((drill) => {
          const Icon = drill.icon;
          const isActive = activeDrill === drill.id;
          return (
            <button
              key={drill.id}
              onClick={() => setActiveDrill(drill.id)}
              className={`text-left glass rounded-xl p-4 transition-all group ${drill.bg} ${
                isActive ? "ring-1 ring-emerald-500/50 bg-emerald-500/5" : ""
              }`}
            >
              <Icon size={20} className={`${drill.accent} mb-2.5 opacity-80`} />
              <div className="text-[var(--text-primary)] font-semibold text-sm">{drill.label}</div>
              <div className="text-[var(--text-faint)] text-xs mt-1 leading-relaxed">{drill.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Active drill */}
      {activeDrill && (
        <div className="glass rounded-2xl p-6 animate-fade-up">
          {activeDrill === "mirror" && <MirrorDrill />}
          {activeDrill === "ackerman" && <AckermanDrill />}
          {activeDrill === "calibrated" && <CalibratedQuestionBuilder />}
          {activeDrill === "roleplay" && <RoleplayScenario />}
        </div>
      )}

      {!activeDrill && (
        <div className="text-center text-[var(--text-faint)] text-sm py-6">
          Select a drill above to start practicing.
        </div>
      )}
    </div>
  );
}
