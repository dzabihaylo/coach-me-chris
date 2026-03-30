"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, X, Key } from "lucide-react";

interface GranolaMeeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  durationMinutes: number | null;
  hasTranscript: boolean;
}

interface Props {
  onImport: (data: {
    title: string; callDate: string; transcriptText: string;
    durationMinutes?: number; granolaId: string;
  }) => void;
  onCancel: () => void;
}

export default function GranolaPicker({ onImport, onCancel }: Props) {
  const [meetings, setMeetings] = useState<GranolaMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  async function fetchMeetings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/granola");
      const data = await res.json();
      if (data.needsApiKey) { setNeedsApiKey(true); setMeetings([]); }
      else { setNeedsApiKey(false); setMeetings(data.meetings ?? []); if (data.error) setError(data.error); }
    } catch { setError("Failed to load meetings"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchMeetings(); }, []);

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingKey(true); setError("");
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ granolaApiKey: apiKeyInput.trim() }) });
      if (!res.ok) throw new Error("Failed to save");
      setApiKeyInput("");
      await fetchMeetings();
    } catch { setError("Failed to save API key"); }
    finally { setSavingKey(false); }
  }

  async function handleSelect(meeting: GranolaMeeting) {
    setImporting(meeting.id); setError("");
    try {
      const res = await fetch("/api/granola", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meetingId: meeting.id }) });
      const data = await res.json();
      if (!res.ok || !data.transcript) { setError(data.error || "No transcript available."); setImporting(null); return; }
      onImport({ title: data.title, callDate: new Date(data.date).toISOString().split("T")[0], transcriptText: data.transcript, durationMinutes: data.durationMinutes ?? undefined, granolaId: data.id });
    } catch { setError("Failed to fetch meeting details"); setImporting(null); }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[var(--text-primary)] font-semibold">Import from Granola</h3>
        <button onClick={onCancel} className="text-[var(--text-faint)] hover:text-[var(--text-secondary)]">
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-[var(--text-faint)] text-sm py-10 text-center animate-pulse">Loading Granola meetings...</div>
      ) : needsApiKey ? (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Key size={16} className="text-[var(--text-muted)]" />
            <h4 className="text-[var(--text-secondary)] font-medium text-sm">Connect your Granola account</h4>
          </div>
          <p className="text-[var(--text-faint)] text-xs mb-4 leading-relaxed">
            Add your Granola API key to import meetings. Open Granola → Settings → API → Create new key.
          </p>
          <form onSubmit={handleSaveKey} className="flex gap-2">
            <input
              type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="grn_..."
              className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
            />
            <button type="submit" disabled={savingKey || !apiKeyInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              {savingKey ? "Saving..." : "Connect"}
            </button>
          </form>
        </div>
      ) : meetings.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm mb-1">No meetings found in the last 30 days.</p>
          <p className="text-[var(--text-faint)] text-xs">Granola only returns meetings with completed transcripts.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-2">
            Last 30 days ({meetings.length} meetings)
          </p>
          {meetings.map((m) => (
            <button
              key={m.id} onClick={() => handleSelect(m)} disabled={importing === m.id}
              className="w-full glass hover:bg-[var(--bg-card-hover)] rounded-xl p-4 flex items-center justify-between text-left disabled:opacity-50 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[var(--text-primary)] text-sm font-medium truncate group-hover:text-white">{m.title}</p>
                <p className="text-[var(--text-faint)] text-xs mt-0.5">
                  {format(new Date(m.date), "MMM d, yyyy · h:mm a")}
                  {m.participants.length > 0 && ` · ${m.participants.slice(0, 3).join(", ")}${m.participants.length > 3 ? ` +${m.participants.length - 3}` : ""}`}
                </p>
              </div>
              <Download size={15} className={importing === m.id ? "text-emerald-400 animate-pulse" : "text-[var(--text-faint)]"} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
