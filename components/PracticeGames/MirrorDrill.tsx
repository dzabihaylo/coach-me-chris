"use client";

import { useState, useCallback } from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import VoiceControls from "@/components/shared/VoiceControls";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MirrorResult {
  counterpartResponse: string;
  mirrorCorrect: boolean | null;
  feedback: string;
  nextOpportunity: string;
}

export default function MirrorDrill() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MirrorResult | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoach, setShowCoach] = useState(false);

  const sendMirror = useCallback(
    async (input: string, currentMessages: Message[]) => {
      if (!input.trim() || loading) return;
      const userMessage: Message = { role: "user", content: input };
      const newMessages = [...currentMessages, userMessage];
      setMessages(newMessages);
      setTextInput("");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drillType: "mirror", messages: newMessages, userInput: null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API error");
        const parsed: MirrorResult = data.result;
        setScore((s) => ({ correct: s.correct + (parsed.mirrorCorrect ? 1 : 0), total: s.total + 1 }));
        setMessages([...newMessages, { role: "assistant", content: parsed.counterpartResponse }]);
        setResult(parsed);
        setShowCoach(false);

        // Speak the counterpart's response
        await voice.speak(parsed.counterpartResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to get response");
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading]
  );

  const voice = useVoiceChat({
    onSpeechResult: (transcript) => {
      sendMirror(transcript, messages);
    },
    voiceHint: "Samantha",
    rate: 0.9,
  });

  const startDrill = async () => {
    setStarted(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: "mirror",
          messages: [],
          userInput: "Give me your opening statement as the counterpart in a vendor negotiation. Say 1-2 sentences.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const parsed: MirrorResult = data.result;
      const opening = parsed.counterpartResponse || "We've been looking at your platform for a few months now, but honestly we're pretty comfortable with our current setup.";
      setMessages([{ role: "assistant", content: opening }]);
      setResult(parsed);

      // Speak the opening
      await voice.speak(opening);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill");
    }
    setLoading(false);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      sendMirror(textInput, messages);
    }
  };

  const reset = () => {
    voice.stopSpeaking();
    voice.stopListening();
    setMessages([]);
    setTextInput("");
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setStarted(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-default)]">
        <h3 className="text-[var(--text-primary)] font-semibold mb-2">Mirroring Drill</h3>
        <p className="text-[var(--text-muted)] text-sm">
          Repeat the last 2-3 words of what the counterpart says. This encourages
          them to elaborate. Use a slight upward inflection.
        </p>
        <div className="mt-2 text-xs text-[var(--text-faint)]">
          Example: They say &ldquo;...our budget is very tight right now&rdquo; → You say:
          <span className="text-emerald-400 italic"> &ldquo;Very tight right now?&rdquo;</span>
        </div>
      </div>

      {score.total > 0 && (
        <div className="flex items-center gap-4 bg-[var(--bg-card)] rounded-xl p-3">
          <span className="text-sm text-[var(--text-muted)]">Score:</span>
          <span className="text-emerald-400 font-bold">
            {score.correct}/{score.total}
          </span>
          <span className="text-[var(--text-faint)] text-sm">
            ({Math.round((score.correct / score.total) * 100)}% accuracy)
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startDrill}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-colors"
        >
          Start Mirroring Drill
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm ${
                  m.role === "assistant"
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-l-2 border-blue-500"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-l-2 border-emerald-500 ml-8"
                }`}
              >
                <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium block mb-1">
                  {m.role === "assistant" ? "Counterpart" : "You"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-sm text-[var(--text-muted)] animate-pulse">
                Counterpart thinking...
              </div>
            )}
          </div>

          {result && result.feedback && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {result.mirrorCorrect === true && (
                  <span className="text-emerald-400 text-sm font-semibold">✓ Good mirror</span>
                )}
                {result.mirrorCorrect === false && (
                  <span className="text-red-400 text-sm font-semibold">✗ Not quite</span>
                )}
                {!showCoach && (
                  <button
                    onClick={() => setShowCoach(true)}
                    className="text-xs text-[var(--text-faint)] hover:text-blue-400 transition-colors ml-auto"
                  >
                    Show feedback
                  </button>
                )}
              </div>
              {showCoach && (
                <div
                  className={`rounded-xl p-3 text-sm border animate-fade-up ${
                    result.mirrorCorrect
                      ? "bg-emerald-500/8 border-emerald-500/15 text-emerald-300"
                      : result.mirrorCorrect === false
                        ? "bg-red-500/8 border-red-500/15 text-red-300"
                        : "bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-muted)]"
                  }`}
                >
                  {result.feedback}
                  <button onClick={() => setShowCoach(false)} className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] ml-2">Hide</button>
                </div>
              )}
            </div>
          )}

          <VoiceControls
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            interimText={voice.interimText}
            speechSupported={voice.speechSupported}
            onToggleListening={voice.toggleListening}
            onStopSpeaking={voice.stopSpeaking}
            textInput={textInput}
            onTextInputChange={setTextInput}
            onTextSubmit={handleTextSubmit}
            textPlaceholder='Mirror last 2-3 words with "?"...'
            disabled={loading}
            accentColor="blue"
          />

          <button
            onClick={reset}
            className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] px-3 py-1.5 rounded-xl transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
