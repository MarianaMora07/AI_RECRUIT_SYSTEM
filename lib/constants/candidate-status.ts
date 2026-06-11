import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from "@/lib/constants/roles";

/** Etapas visibles para el candidato en orden del proceso. */
export const CANDIDATE_VISIBLE_STAGES = PIPELINE_STAGES.filter(
  (stage) => stage !== "rejected"
);

export interface CandidateStatusInfo {
  label: string;
  headline: string;
  description: string;
  variant: "default" | "success" | "muted" | "warning";
}

const STATUS_MESSAGES: Record<PipelineStage, CandidateStatusInfo> = {
  applied: {
    label: PIPELINE_STAGE_LABELS.applied,
    headline: "Postulación recibida",
    description:
      "Tu CV fue registrado correctamente. El equipo de talento revisará tu perfil pronto.",
    variant: "default",
  },
  evaluation: {
    label: PIPELINE_STAGE_LABELS.evaluation,
    headline: "En evaluación",
    description:
      "Estamos analizando tu perfil y experiencia para esta vacante. Te avisaremos cuando haya novedades.",
    variant: "default",
  },
  interview: {
    label: PIPELINE_STAGE_LABELS.interview,
    headline: "Etapa de entrevista",
    description:
      "Avanzaste a entrevista. El equipo se pondrá en contacto contigo para coordinar los detalles.",
    variant: "warning",
  },
  interview_approved: {
    label: PIPELINE_STAGE_LABELS.interview_approved,
    headline: "¡Avanzaste en el proceso!",
    description:
      "Aprobaste la evaluación técnica. Pronto coordinaremos los pasos finales del proceso.",
    variant: "success",
  },
  hired: {
    label: PIPELINE_STAGE_LABELS.hired,
    headline: "¡Felicitaciones!",
    description: "Fuiste seleccionado para esta vacante. El equipo te contactará con los siguientes pasos.",
    variant: "success",
  },
  rejected: {
    label: PIPELINE_STAGE_LABELS.rejected,
    headline: "Proceso finalizado",
    description:
      "En esta ocasión no continuaremos con tu postulación. Agradecemos tu interés y te deseamos éxito.",
    variant: "muted",
  },
};

export function getCandidateStatusInfo(stage: PipelineStage): CandidateStatusInfo {
  return STATUS_MESSAGES[stage] ?? STATUS_MESSAGES.applied;
}

export function getCandidateStageIndex(stage: PipelineStage): number {
  if (stage === "rejected") return -1;
  return CANDIDATE_VISIBLE_STAGES.indexOf(stage);
}
