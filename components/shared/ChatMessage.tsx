"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  label: string;
  accentColor: string;
  speak: (text: string) => Promise<void>;
  ttsSupported: boolean;
}

export default function ChatMessage({
  role,
  content,
  label,
  accentColor,
  speak,
  ttsSupported,
}: ChatMessageProps) {
  const [playing, setPlaying] = useState(false);

  const handleSpeak = async () => {
    setPlaying(true);
    await speak(content);
    setPlaying(false);
  };

  const borderColor = role === "assistant" ? `border-${accentColor}-500` : "border-emerald-500";

  return (
    <div
      className={`rounded-xl p-3 text-sm ${
        role === "assistant"
          ? `bg-[var(--bg-elevated)] text-[var(--text-primary)] border-l-2 ${borderColor}`
          : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-l-2 border-emerald-500 ml-8"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium">
          {label}
        </span>
        {role === "assistant" && ttsSupported && (
          <button
            onClick={handleSpeak}
            disabled={playing}
            className="text-[var(--text-faint)] hover:text-[var(--text-muted)] disabled:opacity-40 p-0.5"
            title="Listen"
          >
            <Volume2 size={13} className={playing ? "animate-pulse" : ""} />
          </button>
        )}
      </div>
      {content}
    </div>
  );
}
