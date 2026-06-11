import { getProfile, getServerAuth } from "@/lib/api/auth";
import {
  canManagePipeline,
  isHiringManager,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
  type UserRole,
} from "@/lib/constants/roles";
import { getSlaInfo } from "@/lib/utils/sla";

export type NotificationVariant = "info" | "warning" | "error" | "success";

export type NotificationType =
  | "sla_warning"
  | "sla_breached"
  | "new_candidate"
  | "interview_pending"
  | "technical_approved";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  variant: NotificationVariant;
  createdAt: string;
}

interface InterviewSnippet {
  rating?: number | null;
  notes?: string | null;
}

interface OfferSnippet {
  status?: string | null;
}

interface CandidateRow {
  id: string;
  full_name: string;
  pipeline_stage: PipelineStage;
  stage_entered_at: string | null;
  created_at: string;
  jobs?: { title: string } | { title: string }[] | null;
  interviews?: InterviewSnippet | InterviewSnippet[] | null;
  candidate_offers?: OfferSnippet | OfferSnippet[] | null;
}

const NEW_CANDIDATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function jobTitle(jobs: CandidateRow["jobs"]) {
  if (!jobs) return "Vacante";
  return Array.isArray(jobs) ? jobs[0]?.title ?? "Vacante" : jobs.title;
}

function latestInterview(row: CandidateRow): InterviewSnippet | null {
  if (!row.interviews) return null;
  return Array.isArray(row.interviews) ? row.interviews[0] ?? null : row.interviews;
}

function offerStatus(row: CandidateRow): string | null {
  if (!row.candidate_offers) return null;
  const offer = Array.isArray(row.candidate_offers)
    ? row.candidate_offers[0]
    : row.candidate_offers;
  return offer?.status ?? null;
}

function buildRecruiterNotifications(rows: CandidateRow[]): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = Date.now();

  for (const row of rows) {
    const sla = getSlaInfo(row.pipeline_stage, row.stage_entered_at);
    const stageLabel = PIPELINE_STAGE_LABELS[row.pipeline_stage];
    const job = jobTitle(row.jobs);

    if (row.pipeline_stage === "interview_approved") {
      const interview = latestInterview(row);
      const rating = interview?.rating;
      const offer = offerStatus(row);
      if (offer !== "approved") {
        notifications.push({
          id: `tech-approved-${row.id}`,
          type: "technical_approved",
          title: "Entrevista técnica aprobada",
          message: `${row.full_name} aprobó la evaluación técnica para ${job}${
            rating != null ? ` (calificación ${rating}/5)` : ""
          }. Proceder con fit cultural y pre-oferta.`,
          href: `/candidates/${row.id}`,
          variant: "success",
          createdAt: row.stage_entered_at ?? row.created_at,
        });
      }
    }

    if (sla.status === "breached") {
      notifications.push({
        id: `sla-breached-${row.id}`,
        type: "sla_breached",
        title: "SLA vencido",
        message: `${row.full_name} lleva ${sla.daysInStage}d en ${stageLabel} (${job})`,
        href: `/candidates/${row.id}`,
        variant: "error",
        createdAt: row.stage_entered_at ?? row.created_at,
      });
    } else if (sla.status === "warning") {
      const daysLeft = sla.limitDays - sla.daysInStage;
      notifications.push({
        id: `sla-warning-${row.id}`,
        type: "sla_warning",
        title: "SLA por vencer",
        message: `${row.full_name} en ${stageLabel}: quedan ~${Math.max(daysLeft, 1)}d (${job})`,
        href: `/candidates/${row.id}`,
        variant: "warning",
        createdAt: row.stage_entered_at ?? row.created_at,
      });
    }

    if (
      row.pipeline_stage === "applied" &&
      now - new Date(row.created_at).getTime() <= NEW_CANDIDATE_WINDOW_MS
    ) {
      notifications.push({
        id: `new-${row.id}`,
        type: "new_candidate",
        title: "Nuevo candidato",
        message: `${row.full_name} se registró para ${job}`,
        href: `/candidates/${row.id}`,
        variant: "info",
        createdAt: row.created_at,
      });
    }
  }

  return notifications;
}

function buildHiringManagerNotifications(rows: CandidateRow[]): AppNotification[] {
  return rows
    .filter((row) => row.pipeline_stage === "interview")
    .map((row) => ({
      id: `interview-${row.id}`,
      type: "interview_pending" as const,
      title: "Candidato en entrevista",
      message: `${row.full_name} espera tu evaluación (${jobTitle(row.jobs)})`,
      href: `/candidates/${row.id}`,
      variant: "warning" as const,
      createdAt: row.stage_entered_at ?? row.created_at,
    }));
}

const PRIORITY: Record<NotificationType, number> = {
  technical_approved: 0,
  sla_breached: 1,
  interview_pending: 2,
  sla_warning: 3,
  new_candidate: 4,
};

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const profile = await getProfile(user.id, supabase);
  const role = profile?.role as UserRole | string | null | undefined;

  const { data } = await supabase
    .from("candidates")
    .select(
      "id, full_name, pipeline_stage, stage_entered_at, created_at, jobs(title), interviews(rating, notes), candidate_offers(status)"
    )
    .is("deleted_at", null)
    .in("pipeline_stage", ["applied", "evaluation", "interview", "interview_approved"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as CandidateRow[];
  const notifications: AppNotification[] = [];

  if (canManagePipeline(role)) {
    notifications.push(...buildRecruiterNotifications(rows));
  }

  if (isHiringManager(role) || role === "admin") {
    notifications.push(...buildHiringManagerNotifications(rows));
  }

  return notifications
    .sort(
      (a, b) =>
        PRIORITY[a.type] - PRIORITY[b.type] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 12);
}
