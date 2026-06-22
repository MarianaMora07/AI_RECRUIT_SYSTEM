import { z } from "zod";
import { PIPELINE_STAGES } from "@/lib/constants/roles";

export const createCandidateSchema = z.object({
  jobId: z.string().uuid(),
  recruiterId: z.string().uuid(),
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
});

export const publicApplySchema = createCandidateSchema;

export const reassignRecruiterSchema = z.object({
  recruiterId: z.string().uuid(),
});

export const jobRecruitersPatchSchema = z.object({
  recruiterIds: z.array(z.string().uuid()),
  reassignments: z.record(z.string().uuid(), z.string().uuid()).optional(),
});

export const interviewFeedbackSchema = z.object({
  rating: z.number().int().min(1, "Califica del 1 al 5").max(5),
  notes: z
    .string()
    .min(10, "Escribe al menos 10 caracteres en tus notas")
    .max(2000),
});

export const updateStageSchema = z
  .object({
    stage: z.enum(PIPELINE_STAGES),
    confirmed: z.boolean().optional(),
    feedback: interviewFeedbackSchema.optional(),
    scheduledAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.stage === "interview" && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indica fecha y hora para la entrevista",
        path: ["scheduledAt"],
      });
    }
  });

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type InterviewFeedbackInput = z.infer<typeof interviewFeedbackSchema>;
