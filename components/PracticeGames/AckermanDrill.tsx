"use client";

import { useState, useCallback } from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import VoiceControls from "@/components/shared/VoiceControls";

interface DrillResult {
  buyerResponse: string;
  buyerCurrentOffer: number;
  feedback: string;
  tip: string;
}

const YOUR_PRICE = 150000;

export default function AckermanDrill() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrillResult | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoach, setShowCoach] = useState(false);

  const sendResponse = useCallback(
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
        const parsed: DrillResult = data.result;
        setMessages([...newMessages, { role: "assistant", content: parsed.buyerResponse }]);
        setResult(parsed);
        setShowCoach(false);

        await voice.speak(parsed.buyerResponse);
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
      sendResponse(transcript, messages);
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
          userInput: `The scenario is starting. You are the buyer. The seller (me) is offering consulting services at $${YOUR_PRICE.toLocaleString()}. Open as the buyer — express interest but immediately push back on price. Use an Ackerman anchor.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const parsed: DrillResult = data.result;
      setMessages([{ role: "assistant", content: parsed.buyerResponse }]);
      setResult(parsed);

      await voice.speak(parsed.buyerResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill");
    }
    setLoading(false);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      sendResponse(textInput, messages);
    }
  };

  const reset = () => {
    voice.stopSpeaking();
    voice.stopListening();
    setMessages([]);
    setTextInput("");
    setResult(null);
    setStarted(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-default)]">
        <h3 className="text-[var(--text-primary)] font-semibold mb-2">Price Defense Drill</h3>
        <div className="text-sm text-[var(--text-muted)] space-y-1">
          <p>
            You&apos;re selling consulting services at{" "}
            <span className="text-emerald-400 font-semibold">${YOUR_PRICE.toLocaleString()}</span>.
            The buyer will use Ackerman tactics to grind you down.
          </p>
          <p className="text-xs text-[var(--text-faint)]">
            Defend your price using Voss techniques: label their concerns, ask calibrated questions,
            frame in terms of loss, and anchor on value — not price.
          </p>
        </div>
      </div>

      {/* Buyer's current offer indicator — hidden until coach is revealed */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startDrill}
          className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-colors"
        >
          Start Price Defense Drill
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
                  {m.role === "assistant" ? "Buyer" : "You (Seller)"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-sm text-[var(--text-muted)] animate-pulse">
                Buyer thinking...
              </div>
            )}
          </div>

          {result?.feedback && (
            showCoach ? (
              <div className="space-y-2 animate-fade-up">
                {result.buyerCurrentOffer > 0 && (
                  <div className="flex items-center gap-3 bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium">Buyer&apos;s offer</span>
                    <span className="text-pink-400 font-bold tabular-nums">${result.buyerCurrentOffer.toLocaleString()}</span>
                    <span className="text-[var(--text-faint)] text-xs">vs your ${YOUR_PRICE.toLocaleString()}</span>
                    <span className={`text-xs font-medium ml-auto ${
                      result.buyerCurrentOffer >= YOUR_PRICE * 0.9 ? "text-emerald-400" :
                      result.buyerCurrentOffer >= YOUR_PRICE * 0.75 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {Math.round((result.buyerCurrentOffer / YOUR_PRICE) * 100)}% of ask
                    </span>
                  </div>
                )}
                <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-pink-400 font-semibold text-xs">Coach:</span>
                    <button onClick={() => setShowCoach(false)} className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)]">Hide</button>
                  </div>
                  {result.feedback}
                  {result.tip && (
                    <p className="text-[var(--text-muted)] text-xs mt-1 italic">{result.tip}</p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCoach(true)}
                className="text-xs text-[var(--text-faint)] hover:text-pink-400 transition-colors"
              >
                Show coach feedback
              </button>
            )
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
            textPlaceholder="Defend your price..."
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
