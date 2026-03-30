"use client";

import { useState, useRef } from "react";
import { Upload, Mic, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onTranscriptReady: (data: { transcript: string; durationMinutes: number; speakerCount: number }) => void;
}

type Stage = "idle" | "processing" | "done" | "error";

export default function RecordingUpload({ onTranscriptReady }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(""); setStage("processing");
    setProgress(`Transcribing ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Upload failed"); }
      const data = await res.json();
      if (!data.transcript || data.transcript.trim().length < 10) throw new Error("Transcription returned no usable text.");
      setStage("done");
      setProgress(`${data.wordCount} words, ${data.speakerCount} speaker${data.speakerCount !== 1 ? "s" : ""}, ${data.durationMinutes}min`);
      onTranscriptReady({ transcript: data.transcript, durationMinutes: data.durationMinutes, speakerCount: data.speakerCount });
    } catch (e) { setStage("error"); setError(e instanceof Error ? e.message : "Transcription failed"); }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg,.mov" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {stage === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-[var(--border-default)] hover:border-emerald-500/40 rounded-2xl p-8 text-center cursor-pointer group"
        >
          <div className="flex justify-center gap-3 text-[var(--text-faint)] group-hover:text-[var(--text-muted)] mb-3">
            <Upload size={20} />
            <Mic size={20} />
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">Upload a call recording</p>
          <p className="text-[var(--text-faint)] text-xs mt-1">MP3, WAV, M4A, MP4, WebM — up to 200MB</p>
        </div>
      )}

      {stage === "processing" && (
        <div className="glass rounded-2xl p-8 text-center">
          <Loader2 size={22} className="text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm font-medium">{progress}</p>
          <p className="text-[var(--text-faint)] text-xs mt-1">This may take a minute for long recordings</p>
        </div>
      )}

      {stage === "done" && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm">{progress}</p>
        </div>
      )}

      {stage === "error" && (
        <div className="space-y-2">
          <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button onClick={() => { setStage("idle"); setError(""); }} className="text-xs text-[var(--text-faint)] hover:text-[var(--text-secondary)]">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
