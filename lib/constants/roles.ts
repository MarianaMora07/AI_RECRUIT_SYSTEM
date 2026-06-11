export const USER_ROLES = ["admin", "recruiter", "hiring_manager"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Rol asignado automáticamente en el registro público. */
export const DEFAULT_REGISTER_ROLE = "recruiter" as const;

/** Roles que un admin puede asignar manualmente (no disponibles en /register). */
export const ADMIN_ASSIGNABLE_ROLES = ["hiring_manager", "admin"] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  recruiter: "Reclutador",
  hiring_manager: "Hiring Manager",
};

export const ROLE_DESCRIPTIONS: Record<typeof DEFAULT_REGISTER_ROLE, string> = {
  recruiter:
    "Acceso completo: vacantes, carga de CVs, pipeline, candidatos y métricas.",
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", roles: USER_ROLES },
  { href: "/jobs", label: "Vacantes", icon: "💼", roles: ["admin", "recruiter"] as const },
  { href: "/upload", label: "Cargar CV", icon: "📄", roles: ["admin", "recruiter"] as const },
  {
    href: "/candidates",
    label: "Candidatos",
    icon: "👥",
    roles: USER_ROLES,
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: "🔄",
    roles: USER_ROLES,
  },
  { href: "/settings", label: "Mi perfil", icon: "⚙️", roles: USER_ROLES },
] as const;

export function getNavItemsForRole(role: UserRole | string | null | undefined) {
  const effectiveRole = (role ?? "recruiter") as UserRole;
  return NAV_ITEMS.filter((item) =>
    (item.roles as readonly UserRole[]).includes(effectiveRole)
  );
}

export const PIPELINE_STAGES = [
  "applied",
  "evaluation",
  "interview",
  "interview_approved",
  "hired",
  "rejected",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function canManagePipeline(role: UserRole | string | null | undefined): boolean {
  return role === "admin" || role === "recruiter";
}

export function isHiringManager(
  role: UserRole | string | null | undefined
): role is "hiring_manager" {
  return role === "hiring_manager";
}

/** Etapa en la que el HM puede tomar decisiones post-entrevista. */
export const HM_DECISION_SOURCE_STAGE = "interview" as const;

/** Destinos permitidos para el Hiring Manager tras entrevistar. */
export const HM_DECISION_TARGETS = [
  "rejected",
  "interview_approved",
] as const;

export type HiringManagerDecisionTarget = (typeof HM_DECISION_TARGETS)[number];

export function canHiringManagerDecide(
  role: UserRole | string | null | undefined,
  currentStage: PipelineStage
): boolean {
  return isHiringManager(role) && currentStage === HM_DECISION_SOURCE_STAGE;
}

export function isHiringManagerDecisionTarget(
  stage: PipelineStage
): stage is HiringManagerDecisionTarget {
  return (HM_DECISION_TARGETS as readonly string[]).includes(stage);
}

export function canChangeCandidateStage(
  role: UserRole | string | null | undefined,
  currentStage: PipelineStage,
  targetStage: PipelineStage
): boolean {
  if (canManagePipeline(role)) return true;
  if (!canHiringManagerDecide(role, currentStage)) return false;
  return isHiringManagerDecisionTarget(targetStage);
}

export const JOB_STATUSES = ["draft", "open", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  applied: "Postulado",
  evaluation: "Evaluación",
  interview: "Entrevista",
  interview_approved: "Entrevista técnica aprobada",
  hired: "Contratado",
  rejected: "Descartado",
};

export const HM_DECISION_LABELS: Record<HiringManagerDecisionTarget, string> = {
  rejected: "Descartar candidato",
  interview_approved: "Aprobar entrevista técnica",
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
