import type { PipelineStage } from "@/lib/constants/roles";

/** Días máximos permitidos en cada etapa antes de incumplir SLA */
export const STAGE_SLA_DAYS: Record<PipelineStage, number> = {
  applied: 2,
  evaluation: 5,
  interview: 7,
  interview_approved: 3,
  hired: 0,
  rejected: 0,
};

export const STAGE_SLA_LABELS: Record<PipelineStage, string> = {
  applied: "2 días en Postulado",
  evaluation: "5 días en Evaluación",
  interview: "7 días en Entrevista",
  interview_approved: "3 días tras aprobación",
  hired: "Cerrado",
  rejected: "Cerrado",
};
