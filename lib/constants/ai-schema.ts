import { z } from "zod";

export const aiResponseSchema = z.object({
  summary: z.string().min(1),
  classification: z.enum(["Junior", "Mid", "Senior", "Lead"]),
  suggestions: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  fitScore: z.number().min(0).max(100),
  experienceYears: z.number().min(0).max(50).optional(),
  matchedSkills: z.array(z.string()).optional(),
  missingSkills: z.array(z.string()).optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;

export const AI_JSON_KEYS = [
  "summary",
  "classification",
  "suggestions",
  "riskLevel",
  "fitScore",
  "experienceYears",
  "matchedSkills",
  "missingSkills",
] as const;
