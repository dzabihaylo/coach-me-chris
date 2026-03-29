"use client";

import { useState, useEffect } from "react";
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
  const [callDate, setCallDate] = useState(
    prefill?.callDate ?? new Date().toISOString().split("T")[0]
  );
  const [transcriptText, setTranscriptText] = useState(prefill?.transcriptText ?? "");
  const [duration, setDuration] = useState(
    prefill?.durationMinutes?.toString() ?? ""
  );

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {prefill && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg px-3 py-2 text-emerald-400 text-sm">
          Imported from Granola. Review the transcript below and click Analyze.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Call Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Acme Corp QBR"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Call Date</label>
          <input
            type="date"
            value={callDate}
            onChange={(e) => setCallDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Recording upload */}
      {!prefill && (
        <RecordingUpload
          onTranscriptReady={({ transcript, durationMinutes }) => {
            setTranscriptText(transcript);
            if (durationMinutes) setDuration(durationMinutes.toString());
          }}
        />
      )}

      <div>
        <label className="text-xs text-gray-400 mb-1 block">
          Duration (minutes, optional)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="45"
          className="w-32 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">
          Transcript *
        </label>
        <textarea
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          placeholder="Paste your call transcript here..."
          required
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 h-48 resize-none font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          {transcriptText.length} chars — aim for 300+ for quality analysis
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !transcriptText.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing call...
          </span>
        ) : (
          "Analyze Call"
        )}
      </button>
    </form>
  );
}
