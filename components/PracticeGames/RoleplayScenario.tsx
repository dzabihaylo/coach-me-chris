"use client";

import { useState, useCallback } from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import VoiceControls from "@/components/shared/VoiceControls";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const HINTS = [
  'Try: "It seems like switching costs are a real concern."',
  'Mirror: repeat their last 3 words with a slight upward tone.',
  'Ask: "How has your team handled transitions like this before?"',
  'Run an accusation audit: "I know this might sound like more risk..."',
  'Look for the black swan: there may be a deadline they haven\'t mentioned.',
  'Ask: "What would need to be true for this to work?"',
  'Use "No"-oriented: "Would it be ridiculous to explore this together?"',
];

export default function RoleplayScenario() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (input: string, currentMessages: Message[]) => {
      if (!input.trim() || loading) return;
      const userMessage: Message = { role: "user", content: input };
      const newMessages = [...currentMessages, userMessage];
      setMessages(newMessages);
      setTextInput("");
      setLoading(true);
      setShowHint(false);
      setError(null);

      try {
        const res = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drillType: "roleplay", messages: newMessages, userInput: null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API error");
        const response: string = data.result?.counterpartResponse || data.result || "...";
        setMessages([...newMessages, { role: "assistant", content: response }]);

        // Speak Alex's response
        await voice.speak(response);
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
      sendMessage(transcript, messages);
    },
    voiceHint: "Daniel",
    rate: 0.95,
  });

  const startScenario = async () => {
    setStarted(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: "roleplay",
          messages: [],
          userInput: "The vendor has just connected to the call. Give your opening 2-3 sentence response as the skeptical buyer Alex Chen.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const response: string = data.result?.counterpartResponse || "Hello, I appreciate you reaching out...";
      setMessages([{ role: "assistant", content: response }]);

      await voice.speak(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scenario");
    }
    setLoading(false);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      sendMessage(textInput, messages);
    }
  };

  const getHint = () => {
    setShowHint(true);
    setHintIdx((h) => (h + 1) % HINTS.length);
  };

  const reset = () => {
    voice.stopSpeaking();
    voice.stopListening();
    setMessages([]);
    setTextInput("");
    setStarted(false);
    setShowHint(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-default)]">
        <h3 className="text-[var(--text-primary)] font-semibold mb-2">Role-Play Scenario</h3>
        <div className="text-sm text-[var(--text-muted)] space-y-1">
          <p>
            You&apos;re selling enterprise software to{" "}
            <span className="text-[var(--text-primary)]">Alex Chen, VP of Operations</span> at a
            500-person logistics company. They use a competitor ($180K/year) and
            are skeptical.
          </p>
          <p className="text-xs text-[var(--text-faint)]">
            Hint: There&apos;s a black swan hidden in this scenario. Find it.
          </p>
        </div>
      </div>

      {showHint && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-sm text-indigo-300">
          {HINTS[(hintIdx - 1 + HINTS.length) % HINTS.length]}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startScenario}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-colors"
        >
          Start Role-Play
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm ${
                  m.role === "assistant"
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-l-2 border-indigo-500"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-l-2 border-emerald-500 ml-8"
                }`}
              >
                <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium block mb-1">
                  {m.role === "assistant" ? "Alex Chen (Buyer)" : "You (Seller)"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-sm text-[var(--text-muted)] animate-pulse">
                Alex is thinking...
              </div>
            )}
          </div>

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
            textPlaceholder="Your response..."
            disabled={loading}
            accentColor="indigo"
          />

          <div className="flex gap-2">
            <button
              onClick={getHint}
              className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] px-3 py-1.5 rounded-xl transition-colors"
            >
              Hint
            </button>
            <button
              onClick={reset}
              className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] px-3 py-1.5 rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
