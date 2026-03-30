"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, MicOff, Clock } from "lucide-react";
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
  const isActiveRef = useRef(false);
  const sessionStartRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SR) setSpeechSupported(false);
    }
    return () => {
      if (coachTimerRef.current) clearInterval(coachTimerRef.current);
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      }
      isActiveRef.current = false;
    };
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
            body: JSON.stringify({ action: "nudge", sessionId, nudge: data.nudge }),
          });
        }
      }
    } catch { /* silent */ }
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
    isActiveRef.current = true;
    sessionStartRef.current = Date.now();
    setStatus("active");
    setElapsedSeconds(0);
    setTranscript("");
    setNudges([]);
    setLatestNudge(null);
    transcriptRef.current = "";

    clockTimerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    coachTimerRef.current = setInterval(() => callCoach(), 25000);

    if (speechSupported) startListening();
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
        if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
      }
      if (final) {
        transcriptRef.current += final;
        setTranscript((t) => t + final);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      if (isActiveRef.current) setTimeout(() => startListening(), 500);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setSpeechSupported(false);
    }
  };

  const endSession = async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (coachTimerRef.current) clearInterval(coachTimerRef.current);
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);

    if (sessionId) {
      await fetch("/api/live-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId, transcript: transcriptRef.current }),
      });
    }

    isActiveRef.current = false;
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
      {/* Call Control Bar */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {status === "active" ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-semibold text-sm tracking-wide">LIVE</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Clock size={14} />
                  <span className="font-mono text-lg tabular-nums">{formatTime(elapsedSeconds)}</span>
                </div>
                {isListening && (
                  <span className="text-emerald-400 text-xs flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Mic on
                  </span>
                )}
                {!isListening && speechSupported && (
                  <span className="text-[var(--text-faint)] text-xs flex items-center gap-1.5">
                    <MicOff size={12} />
                    Mic off
                  </span>
                )}
              </>
            ) : (
              <div>
                <h2 className="text-[var(--text-primary)] font-semibold">Live Coaching</h2>
                <p className="text-[var(--text-muted)] text-sm">Get real-time nudges during your call</p>
              </div>
            )}
          </div>

          {status === "idle" ? (
            <button
              onClick={startSession}
              disabled={isStarting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/25"
            >
              <Phone size={15} />
              {isStarting ? "Starting..." : "Start Call"}
            </button>
          ) : (
            <button
              onClick={endSession}
              className="bg-red-600/90 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
            >
              <PhoneOff size={15} />
              End Call
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Latest Nudge */}
      <div className="min-h-[80px]">
        {latestNudge ? (
          <NudgeBadge
            nudge={latestNudge.nudge}
            technique={latestNudge.technique}
            onDismiss={() => setLatestNudge(null)}
          />
        ) : (
          <div className="border border-dashed border-[var(--border-default)] rounded-2xl px-5 py-8 text-center text-[var(--text-faint)] text-sm">
            {status === "active"
              ? "Listening... coaching nudges will appear here"
              : "Start a call to receive real-time coaching"}
          </div>
        )}
      </div>

      {/* Manual input */}
      {status === "active" && (
        <div>
          <label className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-1.5 block">
            {speechSupported ? "Paste conversation snippets" : "Type conversation (mic unavailable)"}
          </label>
          <div className="flex gap-2">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleManualSubmit();
                }
              }}
              placeholder="Paste what was just said..."
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] resize-none h-16"
            />
            <button
              onClick={handleManualSubmit}
              className="bg-emerald-600/80 hover:bg-emerald-500 text-white px-5 rounded-xl font-medium text-sm"
            >
              Coach
            </button>
          </div>
        </div>
      )}

      {/* Nudge History */}
      {nudges.length > 0 && (
        <div>
          <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-3">
            Nudge History
          </h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {nudges.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 bg-[var(--bg-card)] rounded-xl px-4 py-2.5 border border-[var(--border-subtle)]"
              >
                <span className="text-[11px] text-[var(--text-faint)] font-mono w-10 shrink-0 tabular-nums">
                  {formatTime(Math.floor((n.timestamp.getTime() - sessionStartRef.current) / 1000))}
                </span>
                <span className="text-[var(--text-primary)] text-sm flex-1">{n.nudge}</span>
                {n.technique && (
                  <span className="text-[10px] text-[var(--text-faint)] bg-[var(--bg-elevated)] rounded-full px-2 py-0.5">
                    {n.technique}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div>
          <h3 className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-medium mb-2">
            Live Transcript
          </h3>
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}
