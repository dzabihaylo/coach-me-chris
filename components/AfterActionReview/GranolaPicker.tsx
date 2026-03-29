"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Check, X } from "lucide-react";

interface GranolaMeeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  durationMinutes: number | null;
  hasTranscript: boolean;
  reviewId: string | null;
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

  useEffect(() => {
    fetch("/api/granola")
      .then((r) => r.json())
      .then((data) => setMeetings(data.meetings ?? []))
      .catch(() => setError("Failed to load meetings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(meeting: GranolaMeeting) {
    if (!meeting.hasTranscript) {
      setError(
        `"${meeting.title}" has no transcript yet. Sync it first using Claude: "sync the transcript for my ${meeting.title} meeting"`
      );
      return;
    }
    if (meeting.reviewId) {
      setError("This meeting has already been reviewed.");
      return;
    }

    setImporting(meeting.id);
    setError("");

    try {
      const res = await fetch("/api/granola", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      const data = await res.json();

      if (!data.transcript) {
        setError("Transcript is empty. Sync it first using Claude.");
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

  const readyMeetings = meetings.filter((m) => m.hasTranscript && !m.reviewId);
  const otherMeetings = meetings.filter((m) => !m.hasTranscript || m.reviewId);

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
      ) : meetings.length === 0 ? (
        <div className="bg-gray-800/50 border border-dashed border-gray-600 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">No meetings synced yet.</p>
          <p className="text-gray-600 text-xs">
            Ask Claude: &quot;Sync my recent Granola meetings into Coach Me
            Chris&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {readyMeetings.length > 0 && (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Ready to analyze
              </p>
              {readyMeetings.map((m) => (
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
                      {m.durationMinutes && ` · ${m.durationMinutes}m`}
                      {m.participants.length > 0 &&
                        ` · ${m.participants.length} participants`}
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
            </>
          )}

          {otherMeetings.length > 0 && (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-4">
                {readyMeetings.length > 0
                  ? "Already reviewed or missing transcript"
                  : "Missing transcript"}
              </p>
              {otherMeetings.map((m) => (
                <div
                  key={m.id}
                  className="w-full bg-gray-800/50 border border-gray-800 rounded-lg p-3 flex items-center justify-between opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-400 text-sm truncate">{m.title}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {format(new Date(m.date), "MMM d · h:mm a")}
                      {m.reviewId && " · already reviewed"}
                      {!m.hasTranscript && " · no transcript"}
                    </p>
                  </div>
                  {m.reviewId ? (
                    <Check size={16} className="text-emerald-700" />
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
