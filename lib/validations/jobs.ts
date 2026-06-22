import { z } from "zod";
import { JOB_STATUSES } from "@/lib/constants/roles";

const workModeSchema = z.enum(["remote", "hybrid", "onsite"]).optional();
const jobPrioritySchema = z.enum(["urgent", "standard"]).optional();

export const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  requirements: z.string().min(10).max(5000),
  status: z.enum(JOB_STATUSES).default("draft"),
  department: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  work_mode: workModeSchema,
  priority: jobPrioritySchema,
});

export const updateJobSchema = createJobSchema.partial();

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
