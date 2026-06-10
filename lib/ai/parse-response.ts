import { aiResponseSchema, type AiResponse } from "@/lib/constants/ai-schema";
import { logger } from "@/lib/logger";

const CLASSIFICATION_MAP: Record<string, AiResponse["classification"]> = {
  junior: "Junior",
  mid: "Mid",
  middle: "Mid",
  semi: "Mid",
  "semi-senior": "Mid",
  "semi senior": "Mid",
  senior: "Senior",
  lead: "Lead",
  líder: "Lead",
  lider: "Lead",
};

const RISK_MAP: Record<string, AiResponse["riskLevel"]> = {
  low: "low",
  bajo: "low",
  baja: "low",
  medium: "medium",
  medio: "medium",
  media: "medium",
  moderado: "medium",
  high: "high",
  alto: "high",
  alta: "high",
  elevado: "high",
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const block = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (block?.[1]) return JSON.parse(block[1].trim());
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("INVALID_AI_JSON");
  }
}

function normalizeClassification(
  value: unknown
): AiResponse["classification"] | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (CLASSIFICATION_MAP[key]) return CLASSIFICATION_MAP[key];
  const direct = ["Junior", "Mid", "Senior", "Lead"].find(
    (c) => c.toLowerCase() === key
  );
  return (direct as AiResponse["classification"]) ?? null;
}

function normalizeRisk(value: unknown): AiResponse["riskLevel"] | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return RISK_MAP[key] ?? null;
}

function normalizeFitScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace("%", "").trim());
    if (Number.isFinite(parsed)) {
      return Math.min(100, Math.max(0, Math.round(parsed)));
    }
  }
  return null;
}

function normalizeExperienceYears(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(50, Math.max(0, Math.round(value * 10) / 10));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.min(50, Math.max(0, Math.round(parsed * 10) / 10));
    }
  }
  return undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  return items.length > 0 ? items : undefined;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

function fallbackFitScore(
  classification: AiResponse["classification"]
): number {
  switch (classification) {
    case "Lead":
      return 90;
    case "Senior":
      return 75;
    case "Mid":
      return 55;
    default:
      return 35;
  }
}

export function parseAiResponse(raw: string): AiResponse {
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("INVALID_AI_JSON");
  }

  const obj = parsed as Record<string, unknown>;
  const classification = normalizeClassification(
    obj.classification ?? obj.clasificacion ?? obj.seniority ?? obj.nivel
  );

  const normalized = {
    summary: pickString(obj, ["summary", "resumen", "overview"]),
    classification,
    suggestions: pickString(obj, [
      "suggestions",
      "sugerencia",
      "sugerencias",
      "recommendation",
      "recomendacion",
    ]),
    riskLevel: normalizeRisk(
      obj.riskLevel ?? obj.risk_level ?? obj.riesgo ?? obj.risk
    ),
    fitScore: normalizeFitScore(
      obj.fitScore ?? obj.fit_score ?? obj.score ?? obj.affinity ?? obj.encaje
    ),
    experienceYears: normalizeExperienceYears(
      obj.experienceYears ??
        obj.experience_years ??
        obj.yearsExperience ??
        obj.anos_experiencia
    ),
    matchedSkills: normalizeStringArray(
      obj.matchedSkills ?? obj.matched_skills ?? obj.skillsMatched
    ),
    missingSkills: normalizeStringArray(
      obj.missingSkills ?? obj.missing_skills ?? obj.skillGaps ?? obj.brechas
    ),
  };

  const withFitScore = {
    ...normalized,
    classification: normalized.classification ?? "Mid",
    fitScore:
      normalized.fitScore ??
      fallbackFitScore(normalized.classification ?? "Mid"),
    riskLevel: normalized.riskLevel ?? "medium",
  };

  const validated = aiResponseSchema.safeParse(withFitScore);
  if (validated.success) return validated.data;

  logger.warn("AI schema normalization failed", {
    issues: validated.error.flatten(),
    received: obj,
  });

  if (!normalized.summary) {
    throw new Error("INVALID_AI_SCHEMA");
  }

  return {
    summary: normalized.summary,
    classification: withFitScore.classification,
    suggestions:
      normalized.suggestions ||
      "Revisar manualmente el perfil del candidato para una evaluación completa.",
    riskLevel: withFitScore.riskLevel,
    fitScore: withFitScore.fitScore,
    experienceYears: normalized.experienceYears,
    matchedSkills: normalized.matchedSkills,
    missingSkills: normalized.missingSkills,
  };
}
