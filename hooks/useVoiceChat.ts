"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceChatOptions {
  /** Called with final transcript when user finishes speaking */
  onSpeechResult: (transcript: string) => void;
  /** Preferred TTS voice name substring (e.g. "Daniel", "Samantha") */
  voiceHint?: string;
  /** TTS speech rate (default 1.0) */
  rate?: number;
}

interface UseVoiceChatReturn {
  /** Whether the browser supports speech recognition */
  speechSupported: boolean;
  /** Whether the browser supports TTS */
  ttsSupported: boolean;
  /** Whether the mic is actively listening */
  isListening: boolean;
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Interim transcript (what user is saying right now) */
  interimText: string;
  /** Start listening for speech */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Speak text aloud via TTS */
  speak: (text: string) => Promise<void>;
  /** Stop TTS mid-speech */
  stopSpeaking: () => void;
  /** Toggle mic on/off */
  toggleListening: () => void;
}

export function useVoiceChat({
  onSpeechResult,
  voiceHint = "Daniel",
  rate = 0.95,
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const onSpeechResultRef = useRef(onSpeechResult);
  onSpeechResultRef.current = onSpeechResult;

  // Track if we intentionally stopped (vs browser stopping on its own)
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
    setTtsSupported("speechSynthesis" in window);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      manualStopRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
    }

    const recognition = new SR();
    recognition.continuous = false; // Single utterance for push-to-talk feel
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      if (finalTranscript.trim()) {
        onSpeechResultRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText("");
    };

    manualStopRef.current = false;

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setSpeechSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!("speechSynthesis" in window)) {
          resolve();
          return;
        }

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1.0;

        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.includes(voiceHint) && v.lang.startsWith("en")
        );
        const englishVoice = voices.find((v) => v.lang.startsWith("en"));
        if (preferred) {
          utterance.voice = preferred;
        } else if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [rate, voiceHint]
  );

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* */
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speechSupported,
    ttsSupported,
    isListening,
    isSpeaking,
    interimText,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleListening,
  };
}
