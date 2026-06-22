import type { PipelineStage, UserRole } from "@/lib/constants/roles";

export const APPLICATION_SOURCE_LABELS: Record<string, string> = {
  public_portal: "Portal propio",
  manual_upload: "Carga interna",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  referral: "Referidos",
  agency: "Agencias",
  other: "Otros",
};

export const JOB_PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgente",
  standard: "Estándar",
};

export const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const FUNNEL_STAGE_LABELS: Record<PipelineStage, string> = {
  applied: "Postulados",
  evaluation: "Cribado / IA",
  interview: "Entrevista",
  interview_approved: "Oferta / Pre-contrato",
  hired: "Contratados",
  rejected: "Descartados",
};

export const DATE_RANGE_PRESETS = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "90d", label: "90 días", days: 90 },
  { id: "all", label: "Todo", days: null },
] as const;

export function getDashboardSubtitle(role: UserRole | string | null | undefined): string {
  if (role === "admin") return "Vista estratégica y operativa del proceso de reclutamiento";
  if (role === "hiring_manager") return "Decisiones post-entrevista y salud del embudo";
  return "Tu bandeja de trabajo y candidatos asignados";
}

export function getFunnelStagesForRole(
  role: UserRole | string | null | undefined
): PipelineStage[] {
  if (role === "hiring_manager") {
    return ["interview", "interview_approved", "hired", "rejected"];
  }
  return ["applied", "evaluation", "interview", "interview_approved", "hired"];
}

export function canFilterByRecruiter(role: UserRole | string | null | undefined): boolean {
  return role === "admin" || role === "hiring_manager";
}

export function canSeeTeamWorkload(role: UserRole | string | null | undefined): boolean {
  return role === "admin";
}

export function canSeeCostPerHire(role: UserRole | string | null | undefined): boolean {
  return role === "admin";
}

export function canSeeSourceChart(role: UserRole | string | null | undefined): boolean {
  return role === "admin" || role === "hiring_manager" || role === "recruiter";
}
