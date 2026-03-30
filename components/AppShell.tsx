"use client";

import { useState } from "react";
import { Mic, ClipboardList, Gamepad2, TrendingUp, Settings } from "lucide-react";
import LiveCoachingPanel from "@/components/LiveCoaching/LiveCoachingPanel";
import AfterActionPage from "@/components/AfterActionReview/AfterActionPage";
import PracticeGamesPage from "@/components/PracticeGames/PracticeGamesPage";
import ProgressPage from "@/components/Dashboard/ProgressPage";
import SettingsPage from "@/components/Settings/SettingsPage";
import UserMenu from "@/components/UserMenu";

type Tab = "live" | "review" | "practice" | "progress" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Mic }[] = [
  { id: "live", label: "Live", icon: Mic },
  { id: "review", label: "Review", icon: ClipboardList },
  { id: "practice", label: "Practice", icon: Gamepad2 },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  isAdmin?: boolean;
}

export default function AppShell({ user, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("live");

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-900/30">
              C
            </div>
            <div>
              <h1 className="text-[var(--text-primary)] font-semibold text-[15px] leading-none">
                Coach Chris
              </h1>
              <p className="text-[var(--text-faint)] text-[10px] mt-0.5">
                Negotiation coaching
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <a
                href="/admin"
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-medium uppercase tracking-wider"
              >
                Admin
              </a>
            )}
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all ${
                    isActive
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 py-8 animate-fade-up">
        {activeTab === "live" && <LiveCoachingPanel />}
        {activeTab === "review" && <AfterActionPage />}
        {activeTab === "practice" && <PracticeGamesPage />}
        {activeTab === "progress" && <ProgressPage />}
        {activeTab === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
