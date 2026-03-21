"use client";

import { useState } from "react";
import LiveCoachingPanel from "@/components/LiveCoaching/LiveCoachingPanel";
import AfterActionPage from "@/components/AfterActionReview/AfterActionPage";
import PracticeGamesPage from "@/components/PracticeGames/PracticeGamesPage";
import ProgressPage from "@/components/Dashboard/ProgressPage";
import UserMenu from "@/components/UserMenu";

type Tab = "live" | "review" | "practice" | "progress";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "live", label: "Live Coaching", icon: "🎙" },
  { id: "review", label: "After-Action Review", icon: "📋" },
  { id: "practice", label: "Practice Games", icon: "🎮" },
  { id: "progress", label: "Progress", icon: "📈" },
];

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function AppShell({ user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("live");

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0f1117]/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤝</div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                Coach Me
              </h1>
              <p className="text-gray-500 text-xs">
                Never Split the Difference — live coaching
              </p>
            </div>
          </div>
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="border-b border-gray-800 bg-[#0f1117]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "live" && <LiveCoachingPanel />}
        {activeTab === "review" && <AfterActionPage />}
        {activeTab === "practice" && <PracticeGamesPage />}
        {activeTab === "progress" && <ProgressPage />}
      </main>
    </div>
  );
}
