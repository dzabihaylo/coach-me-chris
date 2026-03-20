"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NudgeBadge from "@/components/shared/NudgeBadge";

interface Nudge {
  id: string;
  nudge: string;
  technique: string | null;
  timestamp: Date;
}

export default function LiveCoachingPanel() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [latestNudge, setLatestNudge] = useState<Nudge | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<"idle" | "active" | "paused">("idle");
  const [manualInput, setManualInput] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const coachTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef("");
  const lastCoachCallRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SR) setSpeechSupported(false);
    }
  }, []);

  const callCoach = useCallback(async () => {
    const now = Date.now();
    if (now - lastCoachCallRef.current < 20000) return;
    const recent = transcriptRef.current.slice(-2000);
    if (recent.trim().length < 30) return;

    lastCoachCallRef.current = now;
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: recent }),
      });
      const data = await res.json();
      if (data.nudge) {
        const newNudge: Nudge = {
          id: crypto.randomUUID(),
          nudge: data.nudge,
          technique: data.technique,
          timestamp: new Date(),
        };
        setNudges((prev) => [newNudge, ...prev.slice(0, 19)]);
        setLatestNudge(newNudge);

        if (sessionId) {
          fetch("/api/live-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "nudge",
              sessionId,
              nudge: data.nudge,
            }),
          });
        }
      }
    } catch {
      // silent fail on live coaching nudges
    }
  }, [sessionId]);

  const startSession = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/live-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.sessionId) throw new Error("No session ID returned");
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setIsStarting(false);
      return;
    }
    setIsStarting(false);
    setStatus("active");
    setElapsedSeconds(0);
    setTranscript("");
    setNudges([]);
    setLatestNudge(null);
    transcriptRef.current = "";

    clockTimerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    coachTimerRef.current = setInterval(() => {
      callCoach();
    }, 25000);

    if (speechSupported) {
      startListening();
    }
  };

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        }
      }
      if (final) {
        transcriptRef.current += final;
        setTranscript((t) => t + final);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart if still active
      if (status === "active") {
        setTimeout(() => startListening(), 500);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const endSession = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (coachTimerRef.current) clearInterval(coachTimerRef.current);
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);

    if (sessionId) {
      await fetch("/api/live-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          sessionId,
          transcript: transcriptRef.current,
        }),
      });
    }

    setStatus("idle");
    setIsListening(false);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    transcriptRef.current += manualInput + " ";
    setTranscript((t) => t + manualInput + " ");
    setManualInput("");
    callCoach();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          {status === "active" && (
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-medium text-sm">LIVE</span>
            </div>
          )}
          {status === "active" && (
            <span className="text-gray-300 font-mono text-lg">
              {formatTime(elapsedSeconds)}
            </span>
          )}
          {isListening && (
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
              Mic active
            </span>
          )}
        </div>

        <div className="flex gap-3">
          {status === "idle" ? (
            <button
              onClick={startSession}
              disabled={isStarting}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              {isStarting ? "Starting…" : "Start Call"}
            </button>
          ) : (
            <button
              onClick={endSession}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              End Call
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Latest Nudge — prominent display */}
      <div className="min-h-[80px]">
        {latestNudge ? (
          <NudgeBadge
            nudge={latestNudge.nudge}
            technique={latestNudge.technique}
            onDismiss={() => setLatestNudge(null)}
            className="text-xl"
          />
        ) : (
          <div className="border border-dashed border-gray-600 rounded-lg px-4 py-6 text-center text-gray-500 text-sm">
            {status === "active"
              ? "Listening... coaching nudges will appear here"
              : "Start a call to receive real-time coaching"}
          </div>
        )}
      </div>

      {/* Manual transcript input (fallback if no mic) */}
      {status === "active" && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {speechSupported
              ? "Paste conversation snippets for instant coaching"
              : "Paste conversation (speech recognition not available in this browser)"}
          </label>
          <div className="flex gap-2">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleManualSubmit();
              }}
              placeholder="Paste what was just said..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 resize-none h-16 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleManualSubmit}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 rounded-lg font-medium text-sm transition-colors"
            >
              Coach
            </button>
          </div>
        </div>
      )}

      {/* Nudge History */}
      {nudges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            Nudge History
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {nudges.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2"
              >
                <span className="text-xs text-gray-500 font-mono w-12 shrink-0">
                  {formatTime(Math.floor((n.timestamp.getTime() - (Date.now() - elapsedSeconds * 1000)) / 1000 + elapsedSeconds))}
                </span>
                <span className="text-gray-200 text-sm flex-1">{n.nudge}</span>
                {n.technique && (
                  <span className="text-xs text-gray-500 bg-gray-700 rounded px-2 py-0.5">
                    {n.technique}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live transcript */}
      {transcript && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Live Transcript
          </h3>
          <div className="bg-gray-800/50 rounded-lg p-3 max-h-48 overflow-y-auto text-sm text-gray-300 leading-relaxed">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}
