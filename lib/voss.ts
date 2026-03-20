export const VOSS_DIMENSIONS = [
  { key: "tacticalEmpathy", label: "Tactical Empathy", abbr: "TE" },
  { key: "mirroring", label: "Mirroring", abbr: "MR" },
  { key: "labeling", label: "Labeling", abbr: "LB" },
  { key: "calibratedQuestions", label: "Calibrated Questions", abbr: "CQ" },
  { key: "thatsRight", label: "Getting to 'That's Right'", abbr: "TR" },
  { key: "usingNo", label: "Using 'No'", abbr: "UN" },
  { key: "accusationAudit", label: "Accusation Audit", abbr: "AA" },
  { key: "lossFraming", label: "Loss Framing", abbr: "LF" },
  { key: "ackermanBargaining", label: "Ackerman Bargaining", abbr: "AB" },
  { key: "blackSwanDiscovery", label: "Black Swan Discovery", abbr: "BS" },
] as const;

export type VossDimensionKey = (typeof VOSS_DIMENSIONS)[number]["key"];

export interface DimensionScore {
  score: number;
  evidence: string;
  specificMoments: string[];
}

export interface ReviewFeedback {
  highlights: { moment: string; technique: string; why: string }[];
  topOpportunity: {
    technique: string;
    moment: string;
    alternativeLanguage: string;
    why: string;
  };
  dimensionDetails: Record<VossDimensionKey, DimensionScore>;
  executiveSummary: string;
}
