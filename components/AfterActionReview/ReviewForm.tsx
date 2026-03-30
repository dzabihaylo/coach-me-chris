"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import RecordingUpload from "./RecordingUpload";

interface ReviewFormProps {
  onSubmit: (data: {
    title: string;
    callDate: string;
    transcriptText: string;
    durationMinutes?: number;
  }) => void;
  isLoading: boolean;
  prefill?: {
    title: string;
    callDate: string;
    transcriptText: string;
    durationMinutes?: number;
  };
}

export default function ReviewForm({ onSubmit, isLoading, prefill }: ReviewFormProps) {
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [callDate, setCallDate] = useState(prefill?.callDate ?? new Date().toISOString().split("T")[0]);
  const [transcriptText, setTranscriptText] = useState(prefill?.transcriptText ?? "");
  const [duration, setDuration] = useState(prefill?.durationMinutes?.toString() ?? "");

  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title);
      setCallDate(prefill.callDate);
      setTranscriptText(prefill.transcriptText);
      if (prefill.durationMinutes) setDuration(prefill.durationMinutes.toString());
    }
  }, [prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcriptText.trim()) return;
    onSubmit({
      title: title || "Untitled Call",
      callDate,
      transcriptText,
      durationMinutes: duration ? parseInt(duration) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {prefill && (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
          Imported from Granola. Review the transcript below and click Analyze.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-1.5 block">
            Call Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Acme Corp QBR"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-1.5 block">
            Call Date
          </label>
          <input
            type="date"
            value={callDate}
            onChange={(e) => setCallDate(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </div>
      </div>

      {!prefill && (
        <RecordingUpload
          onTranscriptReady={({ transcript, durationMinutes }) => {
            setTranscriptText(transcript);
            if (durationMinutes) setDuration(durationMinutes.toString());
          }}
        />
      )}

      <div>
        <label className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-1.5 block">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="45"
          className="w-28 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
        />
      </div>

      <div>
        <label className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-1.5 block">
          Transcript *
        </label>
        <textarea
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          placeholder="Paste your call transcript here..."
          required
          className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] h-48 resize-none font-mono leading-relaxed"
        />
        <p className="text-[var(--text-faint)] text-xs mt-1.5">
          {transcriptText.length.toLocaleString()} chars — aim for 300+ for quality analysis
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !transcriptText.trim()}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-900/25 disabled:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Analyzing call...
          </span>
        ) : (
          "Analyze Call"
        )}
      </button>
    </form>
  );
}
