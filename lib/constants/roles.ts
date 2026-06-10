export const USER_ROLES = ["admin", "recruiter", "hiring_manager"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const JOB_STATUSES = ["draft", "open", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const PIPELINE_STAGES = [
  "applied",
  "evaluation",
  "interview",
  "hired",
  "rejected",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  applied: "Postulado",
  evaluation: "Evaluación",
  interview: "Entrevista",
  hired: "Contratado",
  rejected: "Descartado",
};

export const SENIORITY_LEVELS = ["Junior", "Mid", "Senior", "Lead"] as const;
export const RISK_LEVELS = ["low", "medium", "high"] as const;

export const CRITICAL_STAGES: PipelineStage[] = ["hired", "rejected"];

export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_CV_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type AllowedCvMime = (typeof ALLOWED_CV_MIMES)[number];

/** @deprecated use isAllowedCvMime */
export const ALLOWED_CV_MIME = "application/pdf";

export function isAllowedCvMime(mime: string): mime is AllowedCvMime {
  return (ALLOWED_CV_MIMES as readonly string[]).includes(mime);
}

export function isImageCvMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export const CV_ACCEPT_ATTRIBUTE =
  ".pdf,image/jpeg,image/jpg,image/png,image/webp,application/pdf";
