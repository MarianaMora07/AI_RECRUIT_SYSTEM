export interface CandidateScore {
  summary?: string;
  classification?: string;
  suggestions?: string;
  risk_level?: string;
  fit_score?: number;
  skills?: {
    experienceYears?: number | null;
    matched?: string[];
    missing?: string[];
  };
}

export function getCandidateScore(
  scores?: CandidateScore[] | CandidateScore | null
): CandidateScore | undefined {
  if (!scores) return undefined;
  if (Array.isArray(scores)) return scores[0];
  return scores;
}
