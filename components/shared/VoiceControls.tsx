"use client";

import { Mic, Square, Send } from "lucide-react";

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  interimText: string;
  speechSupported: boolean;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  textInput: string;
  onTextInputChange: (value: string) => void;
  onTextSubmit: () => void;
  textPlaceholder?: string;
  disabled?: boolean;
  accentColor?: string;
}

export default function VoiceControls({
  isListening,
  isSpeaking,
  interimText,
  speechSupported,
  onToggleListening,
  onStopSpeaking,
  textInput,
  onTextInputChange,
  onTextSubmit,
  textPlaceholder = "Type your response...",
  disabled = false,
}: VoiceControlsProps) {
  return (
    <div className="space-y-3">
      {/* Interim speech display */}
      {interimText && (
        <div className="text-sm text-emerald-400/80 italic bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-2.5 animate-fade-in">
          {interimText}...
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl px-4 py-2.5 border border-[var(--border-subtle)]">
          <div className="flex gap-[3px] items-end h-4">
            {[60, 100, 40, 80, 55].map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-emerald-400 animate-pulse"
                style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
          <span className="flex-1">Speaking...</span>
          <button
            onClick={onStopSpeaking}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text-secondary)] font-medium"
          >
            Skip
          </button>
        </div>
      )}

      {/* Voice + text controls */}
      <div className="flex items-center gap-2.5">
        {speechSupported && (
          <button
            onClick={onToggleListening}
            disabled={disabled || isSpeaking}
            className={`relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isListening
                ? "bg-emerald-600 shadow-lg shadow-emerald-900/40 scale-105"
                : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)]"
            }`}
            title={isListening ? "Stop listening" : "Push to talk"}
          >
            {isListening ? (
              <Square size={14} className="text-white" fill="white" />
            ) : (
              <Mic size={16} className="text-[var(--text-muted)]" />
            )}
            {isListening && (
              <span className="absolute inset-0 rounded-xl bg-emerald-500 opacity-25 animate-ping" />
            )}
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onTextSubmit();
              }
            }}
            placeholder={textPlaceholder}
            disabled={disabled || isSpeaking}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] disabled:opacity-40"
          />
          <button
            onClick={onTextSubmit}
            disabled={disabled || !textInput.trim() || isSpeaking}
            className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-default)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-muted)] w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
