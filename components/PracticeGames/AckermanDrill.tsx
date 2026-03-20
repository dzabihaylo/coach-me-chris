"use client";

import { useState } from "react";

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
  const [offerInput, setOfferInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AckermanResult | null>(null);
  const [offerStep, setOfferStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill");
    }
    setLoading(false);
  };

  const makeOffer = async (price?: number) => {
    const offerPrice = price ?? parseInt(offerInput.replace(/[^0-9]/g, ""));
    if (!offerPrice || isNaN(offerPrice)) return;

    const userMsg = `I'd like to offer $${offerPrice.toLocaleString()}.`;
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setOfferInput("");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get response");
    }
    setLoading(false);
  };

  const reset = () => {
    setMessages([]);
    setOfferInput("");
    setResult(null);
    setOfferStep(0);
    setStarted(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-2">Ackerman Bargaining Drill</h3>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            Scenario: You&apos;re buying enterprise software.{" "}
            <span className="text-white">Asking price: ${ASKING.toLocaleString()}</span>. Your{" "}
            <span className="text-emerald-400">target: ${TARGET.toLocaleString()}</span>.
          </p>
          <p className="text-xs text-gray-500">
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
            className={`rounded-lg p-2 text-center border text-xs ${
              i < offerStep
                ? "border-gray-600 bg-gray-800/30 text-gray-600"
                : i === offerStep
                  ? "border-pink-500 bg-pink-900/20 text-pink-300"
                  : "border-gray-700 bg-gray-800/20 text-gray-500"
            }`}
          >
            <div className="font-bold">${a.price.toLocaleString()}</div>
            <div>{a.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {!started ? (
        <button
          onClick={startDrill}
          className="w-full bg-pink-600 hover:bg-pink-500 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Start Ackerman Drill
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  m.role === "assistant"
                    ? "bg-gray-700 text-gray-200 border-l-2 border-pink-500"
                    : "bg-gray-800 text-gray-300 border-l-2 border-emerald-500 ml-8"
                }`}
              >
                <span className="text-xs text-gray-500 block mb-1">
                  {m.role === "assistant" ? "Seller" : "You"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-400 animate-pulse">
                Seller thinking...
              </div>
            )}
          </div>

          {result?.feedback && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-300">
              <span className="text-pink-400 font-semibold text-xs block mb-1">
                Coach:
              </span>
              {result.feedback}
              {result.tip && (
                <p className="text-gray-400 text-xs mt-1 italic">{result.tip}</p>
              )}
            </div>
          )}

          {/* Quick offer buttons */}
          <div className="flex flex-wrap gap-2">
            {ANCHORS.map((a, i) => (
              <button
                key={i}
                onClick={() => makeOffer(a.price)}
                disabled={loading}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                  i === offerStep
                    ? "border-pink-500 bg-pink-900/30 text-pink-300 hover:bg-pink-900/50"
                    : "border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                Offer ${a.price.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={offerInput}
              onChange={(e) => setOfferInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && makeOffer()}
              placeholder="Custom offer amount..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-pink-500"
              disabled={loading}
            />
            <button
              onClick={() => makeOffer()}
              disabled={loading || !offerInput}
              className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-600 text-white px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Make Offer
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
