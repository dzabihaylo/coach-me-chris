"use client";

import { useState } from "react";

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MirrorResult | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDrill = async () => {
    setStarted(true);
    setLoading(true);
    setError(null);
    const starter = "We've been looking at your platform for a few months now, but honestly we're pretty comfortable with our current setup. The switching costs would be substantial.";
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
      setMessages([{ role: "assistant", content: parsed.counterpartResponse || starter }]);
      setResult(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill");
      setMessages([{ role: "assistant", content: starter }]);
    }
    setLoading(false);
  };

  const sendMirror = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get response");
    }
    setLoading(false);
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setStarted(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-2">Mirroring Drill</h3>
        <p className="text-gray-400 text-sm">
          Repeat the last 2-3 words of what the counterpart says. This encourages
          them to elaborate. Use a slight upward inflection.
        </p>
        <div className="mt-2 text-xs text-gray-500">
          Example: They say "...our budget is very tight right now" → You say:
          <span className="text-emerald-400 italic"> "Very tight right now?"</span>
        </div>
      </div>

      {score.total > 0 && (
        <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-3">
          <span className="text-sm text-gray-400">Score:</span>
          <span className="text-emerald-400 font-bold">
            {score.correct}/{score.total}
          </span>
          <span className="text-gray-500 text-sm">
            ({Math.round((score.correct / score.total) * 100)}% accuracy)
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startDrill}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Start Mirroring Drill
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  m.role === "assistant"
                    ? "bg-gray-700 text-gray-200 border-l-2 border-blue-500"
                    : "bg-gray-800 text-gray-300 border-l-2 border-emerald-500 ml-8"
                }`}
              >
                <span className="text-xs text-gray-500 block mb-1">
                  {m.role === "assistant" ? "Counterpart" : "You"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-400 animate-pulse">
                Counterpart thinking...
              </div>
            )}
          </div>

          {result && result.feedback && (
            <div
              className={`rounded-lg p-3 text-sm border ${
                result.mirrorCorrect
                  ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-300"
                  : result.mirrorCorrect === false
                    ? "bg-red-900/20 border-red-700/40 text-red-300"
                    : "bg-gray-800 border-gray-600 text-gray-400"
              }`}
            >
              {result.mirrorCorrect === true && "✓ "}{result.mirrorCorrect === false && "✗ "}
              {result.feedback}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMirror()}
              placeholder='Mirror last 2-3 words with "?"...'
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={sendMirror}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Mirror
            </button>
            <button
              onClick={reset}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 rounded-lg text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
