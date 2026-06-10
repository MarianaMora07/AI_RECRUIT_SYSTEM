import { z } from "zod";
import { JOB_STATUSES } from "@/lib/constants/roles";

export const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  requirements: z.string().min(10).max(5000),
  status: z.enum(JOB_STATUSES).default("draft"),
});

export const updateJobSchema = createJobSchema.partial();

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
