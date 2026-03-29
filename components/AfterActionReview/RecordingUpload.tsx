"use client";

import { useState, useRef } from "react";
import { Upload, Mic, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onTranscriptReady: (data: {
    transcript: string;
    durationMinutes: number;
    speakerCount: number;
  }) => void;
}

type Stage = "idle" | "processing" | "done" | "error";

export default function RecordingUpload({ onTranscriptReady }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setStage("processing");
    setProgress(`Uploading and transcribing ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();

      if (!data.transcript || data.transcript.trim().length < 10) {
        throw new Error("Transcription returned no usable text. The audio may be too short or unclear.");
      }

      setStage("done");
      setProgress(
        `Transcribed: ${data.wordCount} words, ${data.speakerCount} speaker${data.speakerCount !== 1 ? "s" : ""}, ${data.durationMinutes}min`
      );

      onTranscriptReady({
        transcript: data.transcript,
        durationMinutes: data.durationMinutes,
        speakerCount: data.speakerCount,
      });
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Transcription failed");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg,.mov"
        className="hidden"
        onChange={handleInputChange}
      />

      {stage === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-600 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2 text-gray-500">
              <Upload size={20} />
              <Mic size={20} />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Upload a call recording
            </p>
            <p className="text-gray-600 text-xs">
              MP3, WAV, M4A, MP4, WebM — up to 200MB
            </p>
            <p className="text-gray-600 text-xs">
              Drop a file here or click to browse
            </p>
          </div>
        </div>
      )}

      {stage === "processing" && (
        <div className="border border-gray-700 rounded-xl p-6 text-center">
          <Loader2 size={24} className="text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-300 text-sm font-medium">{progress}</p>
          <p className="text-gray-600 text-xs mt-1">
            Transcribing with speaker detection — this may take a minute for long recordings
          </p>
        </div>
      )}

      {stage === "done" && (
        <div className="border border-emerald-800/50 bg-emerald-900/10 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm">{progress}</p>
        </div>
      )}

      {stage === "error" && (
        <div className="space-y-2">
          <div className="border border-red-800/50 bg-red-900/10 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={() => { setStage("idle"); setError(""); }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
