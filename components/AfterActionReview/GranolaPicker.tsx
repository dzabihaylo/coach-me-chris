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
    title: string;
    callDate: string;
    transcriptText: string;
    durationMinutes?: number;
    granolaId: string;
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
      if (data.needsApiKey) {
        setNeedsApiKey(true);
        setMeetings([]);
      } else {
        setNeedsApiKey(false);
        setMeetings(data.meetings ?? []);
        if (data.error) setError(data.error);
      }
    } catch {
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granolaApiKey: apiKeyInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setApiKeyInput("");
      await fetchMeetings();
    } catch {
      setError("Failed to save API key");
    } finally {
      setSavingKey(false);
    }
  }

  async function handleSelect(meeting: GranolaMeeting) {
    setImporting(meeting.id);
    setError("");

    try {
      const res = await fetch("/api/granola", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      const data = await res.json();

      if (!res.ok || !data.transcript) {
        setError(data.error || "No transcript available for this meeting.");
        setImporting(null);
        return;
      }

      onImport({
        title: data.title,
        callDate: new Date(data.date).toISOString().split("T")[0],
        transcriptText: data.transcript,
        durationMinutes: data.durationMinutes ?? undefined,
        granolaId: data.id,
      });
    } catch {
      setError("Failed to fetch meeting details");
      setImporting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-300 font-semibold">Import from Granola</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm py-8 text-center animate-pulse">
          Loading Granola meetings...
        </div>
      ) : needsApiKey ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-gray-400" />
            <h4 className="text-gray-300 font-medium text-sm">Connect your Granola account</h4>
          </div>
          <p className="text-gray-500 text-xs mb-4">
            To import meetings, add your Granola API key. Open Granola →
            Settings → API → Create new key. Requires a Business or Enterprise plan.
          </p>
          <form onSubmit={handleSaveKey} className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="grn_..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={savingKey || !apiKeyInput.trim()}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {savingKey ? "Saving..." : "Connect"}
            </button>
          </form>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-gray-800/50 border border-dashed border-gray-600 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">No meetings found in the last 30 days.</p>
          <p className="text-gray-600 text-xs">
            Granola only returns meetings with completed transcripts.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Last 30 days ({meetings.length} meetings)
          </p>
          {meetings.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              disabled={importing === m.id}
              className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-emerald-700 rounded-lg p-3 flex items-center justify-between text-left transition-colors disabled:opacity-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">
                  {m.title}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {format(new Date(m.date), "MMM d, yyyy · h:mm a")}
                  {m.participants.length > 0 &&
                    ` · ${m.participants.slice(0, 3).join(", ")}${m.participants.length > 3 ? ` +${m.participants.length - 3}` : ""}`}
                </p>
              </div>
              <Download
                size={16}
                className={
                  importing === m.id
                    ? "text-emerald-400 animate-pulse"
                    : "text-gray-600"
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
