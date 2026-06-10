import { z } from "zod";
import { PIPELINE_STAGES } from "@/lib/constants/roles";

export const createCandidateSchema = z.object({
  jobId: z.string().uuid(),
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum(PIPELINE_STAGES),
  confirmed: z.boolean().optional(),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
