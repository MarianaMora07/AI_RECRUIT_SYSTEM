import { z } from "zod";

export const OFFER_STATUSES = ["draft", "pending_approval", "approved"] as const;

export const preOfferSchema = z.object({
  base_salary: z.number().positive("El salario debe ser mayor a 0").optional().nullable(),
  bonus: z.string().max(500).optional().nullable(),
  proposed_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)")
    .optional()
    .nullable(),
  internal_approval_notes: z.string().max(2000).optional().nullable(),
  status: z.enum(OFFER_STATUSES).optional(),
});

export type PreOfferInput = z.infer<typeof preOfferSchema>;
