import { z } from "zod";
import { PIPELINE_STAGES } from "@/lib/constants/roles";

export const createCandidateSchema = z.object({
  jobId: z.string().uuid(),
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
});

export const interviewFeedbackSchema = z.object({
  rating: z.number().int().min(1, "Califica del 1 al 5").max(5),
  notes: z
    .string()
    .min(10, "Escribe al menos 10 caracteres en tus notas")
    .max(2000),
});

export const updateStageSchema = z.object({
  stage: z.enum(PIPELINE_STAGES),
  confirmed: z.boolean().optional(),
  feedback: interviewFeedbackSchema.optional(),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type InterviewFeedbackInput = z.infer<typeof interviewFeedbackSchema>;
