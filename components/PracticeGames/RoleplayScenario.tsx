"use client";

import { useState } from "react";

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scenario");
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get response");
    }
    setLoading(false);
  };

  const getHint = () => {
    setShowHint(true);
    setHintIdx((h) => (h + 1) % HINTS.length);
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setStarted(false);
    setShowHint(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-2">Role-Play Scenario</h3>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            You&apos;re selling enterprise software to{" "}
            <span className="text-white">Alex Chen, VP of Operations</span> at a
            500-person logistics company. They use a competitor ($180K/year) and
            are skeptical.
          </p>
          <p className="text-xs text-gray-500">
            Hint: There&apos;s a black swan hidden in this scenario. Find it.
          </p>
        </div>
      </div>

      {showHint && (
        <div className="bg-indigo-900/30 border border-indigo-600/40 rounded-lg p-3 text-sm text-indigo-300">
          💡 {HINTS[(hintIdx - 1 + HINTS.length) % HINTS.length]}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startScenario}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Start Role-Play
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  m.role === "assistant"
                    ? "bg-gray-700 text-gray-200 border-l-2 border-indigo-500"
                    : "bg-gray-800 text-gray-300 border-l-2 border-emerald-500 ml-8"
                }`}
              >
                <span className="text-xs text-gray-500 block mb-1">
                  {m.role === "assistant" ? "Alex Chen (Buyer)" : "You (Seller)"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-400 animate-pulse">
                Alex is thinking...
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Your response..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={getHint}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              💡 Hint
            </button>
            <button
              onClick={reset}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
