"use client";

import { useState, useCallback } from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import VoiceControls from "@/components/shared/VoiceControls";

interface AckermanResult {
  sellerResponse: string;
  sellerCurrentPrice: number;
  feedback: string;
  tip: string;
}

const TARGET = 80000;
const ASKING = 100000;
const ANCHORS = [
  { label: "65% anchor", price: 65000, note: "Your first offer — anchor very low" },
  { label: "85% move", price: 85000, note: "Big concession after they push back" },
  { label: "95% nudge", price: 95000, note: "Smaller step, showing resistance" },
  { label: "Final offer", price: 80000, note: "Exact target with odd number + non-monetary item" },
];

export default function AckermanDrill() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AckermanResult | null>(null);
  const [offerStep, setOfferStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOffer = useCallback(
    async (userMsg: string, currentMessages: typeof messages) => {
      if (!userMsg.trim() || loading) return;
      const newMessages = [...currentMessages, { role: "user" as const, content: userMsg }];
      setMessages(newMessages);
      setTextInput("");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drillType: "ackerman", messages: newMessages, userInput: null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API error");
        const parsed: AckermanResult = data.result;
        setMessages([...newMessages, { role: "assistant", content: parsed.sellerResponse }]);
        setResult(parsed);
        setOfferStep((s) => Math.min(s + 1, ANCHORS.length - 1));

        // Speak seller response
        await voice.speak(parsed.sellerResponse);
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
      sendOffer(transcript, messages);
    },
    voiceHint: "Daniel",
    rate: 0.95,
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
          drillType: "ackerman",
          messages: [],
          userInput: `The scenario is starting. You are the seller asking $${ASKING.toLocaleString()}. Open with your pitch.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const parsed: AckermanResult = data.result;
      setMessages([{ role: "assistant", content: parsed.sellerResponse }]);
      setResult(parsed);

      await voice.speak(parsed.sellerResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill");
    }
    setLoading(false);
  };

  const makeQuickOffer = (price: number) => {
    sendOffer(`I'd like to offer $${price.toLocaleString()}.`, messages);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      sendOffer(textInput, messages);
    }
  };

  const reset = () => {
    voice.stopSpeaking();
    voice.stopListening();
    setMessages([]);
    setTextInput("");
    setResult(null);
    setOfferStep(0);
    setStarted(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-default)]">
        <h3 className="text-[var(--text-primary)] font-semibold mb-2">Ackerman Bargaining Drill</h3>
        <div className="text-sm text-[var(--text-muted)] space-y-1">
          <p>
            Scenario: You&apos;re buying enterprise software.{" "}
            <span className="text-[var(--text-primary)]">Asking price: ${ASKING.toLocaleString()}</span>. Your{" "}
            <span className="text-emerald-400">target: ${TARGET.toLocaleString()}</span>.
          </p>
          <p className="text-xs text-[var(--text-faint)]">
            Strategy: 65% → 85% → 95% → 100% (each concession smaller, add odd
            numbers + non-monetary items at end)
          </p>
        </div>
      </div>

      {/* Offer ladder */}
      <div className="grid grid-cols-4 gap-2">
        {ANCHORS.map((a, i) => (
          <div
            key={i}
            className={`rounded-xl p-2 text-center border text-xs ${
              i < offerStep
                ? "border-[var(--border-default)] bg-[var(--bg-card)]/30 text-[var(--text-faint)]"
                : i === offerStep
                  ? "border-pink-500 bg-pink-900/20 text-pink-300"
                  : "border-[var(--border-default)] bg-[var(--bg-card)]/20 text-[var(--text-faint)]"
            }`}
          >
            <div className="font-bold">${a.price.toLocaleString()}</div>
            <div>{a.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startDrill}
          className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-colors"
        >
          Start Ackerman Drill
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm ${
                  m.role === "assistant"
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-l-2 border-pink-500"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-l-2 border-emerald-500 ml-8"
                }`}
              >
                <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium block mb-1">
                  {m.role === "assistant" ? "Seller" : "You"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-sm text-[var(--text-muted)] animate-pulse">
                Seller thinking...
              </div>
            )}
          </div>

          {result?.feedback && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-3 text-sm text-[var(--text-secondary)]">
              <span className="text-pink-400 font-semibold text-xs block mb-1">Coach:</span>
              {result.feedback}
              {result.tip && (
                <p className="text-[var(--text-muted)] text-xs mt-1 italic">{result.tip}</p>
              )}
            </div>
          )}

          {/* Quick offer buttons */}
          <div className="flex flex-wrap gap-2">
            {ANCHORS.map((a, i) => (
              <button
                key={i}
                onClick={() => makeQuickOffer(a.price)}
                disabled={loading}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50 ${
                  i === offerStep
                    ? "border-pink-500 bg-pink-900/30 text-pink-300 hover:bg-pink-900/50"
                    : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/80"
                }`}
              >
                Offer ${a.price.toLocaleString()}
              </button>
            ))}
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
            textPlaceholder="Make your offer..."
            disabled={loading}
            accentColor="pink"
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
