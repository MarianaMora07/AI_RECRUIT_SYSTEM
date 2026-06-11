import type { CandidateCardData } from "@/components/candidates/CandidateCard";

export function getAffinityScore(
  candidate: Pick<CandidateCardData, "similarity_pct" | "scores">
): number {
  if (candidate.similarity_pct != null) {
    return Number(candidate.similarity_pct);
  }
  const scores = candidate.scores;
  if (!scores) return 0;
  const score = Array.isArray(scores) ? scores[0] : scores;
  return Number(score?.fit_score ?? 0);
}

export function sortCandidatesByAffinity<T extends Pick<CandidateCardData, "similarity_pct" | "scores">>(
  candidates: T[]
): T[] {
  return [...candidates].sort(
    (a, b) => getAffinityScore(b) - getAffinityScore(a)
  );
}

export type AffinityTier = "high" | "medium" | "low";

export function getAffinityTier(score: number): AffinityTier {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export const AFFINITY_TIER_LABELS: Record<AffinityTier, string> = {
  high: "Alta afinidad",
  medium: "Afinidad media",
  low: "Por evaluar",
};

export function groupCandidatesByAffinityTier<T extends Pick<CandidateCardData, "similarity_pct" | "scores">>(
  candidates: T[]
): Array<{ tier: AffinityTier; label: string; items: T[] }> {
  const sorted = sortCandidatesByAffinity(candidates);
  const groups: Record<AffinityTier, T[]> = {
    high: [],
    medium: [],
    low: [],
  };

  for (const candidate of sorted) {
    groups[getAffinityTier(getAffinityScore(candidate))].push(candidate);
  }

  return (["high", "medium", "low"] as const)
    .filter((tier) => groups[tier].length > 0)
    .map((tier) => ({
      tier,
      label: AFFINITY_TIER_LABELS[tier],
      items: groups[tier],
    }));
}
