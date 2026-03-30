"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut } from "lucide-react";

interface Profile {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  hasGranolaKey: boolean;
  granolaKeyPrefix: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [granolaKey, setGranolaKey] = useState("");
  const [showGranolaInput, setShowGranolaInput] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error();
      const data: Profile = await res.json();
      setProfile(data);
      setName(data.name ?? "");
    } catch { setError("Failed to load settings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveName = async () => {
    setSavingName(true); setNameSaved(false);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() || null }) });
      if (!res.ok) throw new Error();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch { setError("Failed to save name"); }
    finally { setSavingName(false); }
  };

  const saveGranolaKey = async () => {
    setSavingKey(true); setKeySaved(false);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ granolaApiKey: granolaKey.trim() || null }) });
      if (!res.ok) throw new Error();
      setKeySaved(true); setShowGranolaInput(false); setGranolaKey("");
      setTimeout(() => setKeySaved(false), 2000);
      fetchProfile();
    } catch { setError("Failed to save API key"); }
    finally { setSavingKey(false); }
  };

  const clearGranolaKey = async () => {
    setSavingKey(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ granolaApiKey: null }) });
      if (!res.ok) throw new Error();
      setShowGranolaInput(false); setGranolaKey(""); fetchProfile();
    } catch { setError("Failed to clear API key"); }
    finally { setSavingKey(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !profile) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>;
  }

  if (!profile) return null;

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5 max-w-2xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 text-xs ml-3">Dismiss</button>
        </div>
      )}

      {/* Profile */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-5">Profile</h2>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg shadow-emerald-900/30">
            {(profile.name ?? profile.email ?? "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[var(--text-secondary)] text-sm">{profile.email}</p>
            <p className="text-[var(--text-faint)] text-xs mt-0.5">Member since {memberSince}</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium">Display Name</span>
            <div className="flex gap-2 mt-1.5">
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name" maxLength={100}
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
              />
              <button onClick={saveName} disabled={savingName || name === (profile.name ?? "")}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium">
                {savingName ? "..." : nameSaved ? "Saved" : "Save"}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium">Email</span>
            <input type="email" value={profile.email} disabled
              className="mt-1.5 w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-faint)] cursor-not-allowed" />
          </label>
        </div>
      </section>

      {/* Integrations */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-1.5">Integrations</h2>
        <p className="text-[var(--text-faint)] text-xs mb-5">Connect external services to enhance coaching.</p>

        <div className="bg-[var(--bg-elevated)] rounded-xl p-5 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[var(--text-primary)] text-sm font-medium">Granola</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
              profile.hasGranolaKey ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-card)] text-[var(--text-faint)]"
            }`}>
              {profile.hasGranolaKey ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="text-[var(--text-faint)] text-xs mb-4 leading-relaxed">
            Import meeting transcripts from Granola.{" "}
            <a href="https://granola.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Get your API key
            </a>
          </p>

          {profile.hasGranolaKey && !showGranolaInput && (
            <div className="flex items-center gap-3">
              <code className="text-xs text-[var(--text-faint)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg font-mono">{profile.granolaKeyPrefix}</code>
              <button onClick={() => setShowGranolaInput(true)} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Update</button>
              <button onClick={clearGranolaKey} disabled={savingKey} className="text-xs text-red-500 hover:text-red-400 font-medium">Remove</button>
            </div>
          )}

          {(!profile.hasGranolaKey || showGranolaInput) && (
            <div className="flex gap-2">
              <input type="password" value={granolaKey} onChange={(e) => setGranolaKey(e.target.value)} placeholder="Paste your Granola API key"
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]" />
              <button onClick={saveGranolaKey} disabled={savingKey || !granolaKey.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
                {savingKey ? "..." : keySaved ? "Saved" : "Save"}
              </button>
              {showGranolaInput && (
                <button onClick={() => { setShowGranolaInput(false); setGranolaKey(""); }}
                  className="border border-[var(--border-default)] px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Account */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-4">Account</h2>
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)] text-sm">Member since</span>
            <span className="text-[var(--text-secondary)] text-sm">{memberSince}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[var(--text-muted)] text-sm">Session</span>
            <button
              onClick={() => { import("next-auth/react").then((m) => m.signOut({ callbackUrl: "/auth/signin" })); }}
              className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1.5"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
