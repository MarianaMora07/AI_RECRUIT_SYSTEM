import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { upsertInterviewFeedback } from "@/lib/api/interview-feedback";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { CANDIDATE_DETAIL_COLUMNS } from "@/lib/constants/queries";
import {
  canChangeCandidateStage,
  CRITICAL_STAGES,
  isHiringManager,
  isHiringManagerDecisionTarget,
} from "@/lib/constants/roles";
import { dispatchN8nEvent } from "@/lib/n8n/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateStageSchema } from "@/lib/validations/candidates";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const profile = await getProfile(user.id, supabase);
  const role = profile?.role;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = updateStageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { data: current } = await supabase
    .from("candidates")
    .select("id, job_id, pipeline_stage")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!current) return jsonError("Candidato no encontrado", 404);

  if (
    !canChangeCandidateStage(role, current.pipeline_stage, parsed.data.stage)
  ) {
    if (isHiringManager(role)) {
      return jsonError(
        "Como Hiring Manager solo puedes decidir tras la entrevista: descartar o aprobar entrevista técnica.",
        403
      );
    }
    return jsonError(
      "Tu rol no puede mover candidatos en el pipeline. Solo reclutadores y administradores.",
      403
    );
  }

  if (isHiringManager(role)) {
    if (!parsed.data.feedback) {
      return jsonError(
        "Debes calificar al candidato y dejar notas antes de tomar una decisión.",
        422
      );
    }
    if (!isHiringManagerDecisionTarget(parsed.data.stage)) {
      return jsonError("Decisión no permitida para tu rol.", 422);
    }
  }

  if (
    CRITICAL_STAGES.includes(parsed.data.stage) &&
    !parsed.data.confirmed
  ) {
    return jsonError("Se requiere confirmación para esta acción", 422);
  }

  const now = new Date().toISOString();

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logger.error("admin client unavailable for stage update", {
      route: "/api/candidates/[id]/stage",
      message: err instanceof Error ? err.message : "unknown",
    });
    return jsonError("Configuración del servidor incompleta", 500);
  }

  if (
    isHiringManager(role) &&
    parsed.data.feedback &&
    isHiringManagerDecisionTarget(parsed.data.stage)
  ) {
    try {
      await upsertInterviewFeedback(admin, {
        candidateId: id,
        jobId: current.job_id,
        evaluatorId: user.id,
        targetStage: parsed.data.stage,
        feedback: parsed.data.feedback,
      });
    } catch (err) {
      logger.error("interview feedback save failed", {
        route: "/api/candidates/[id]/stage",
        candidateId: id,
        message: err instanceof Error ? err.message : "unknown",
      });
      return jsonError("No se pudo guardar el feedback de la entrevista", 500);
    }
  }

  const { data: candidate, error } = await admin
    .from("candidates")
    .update({
      pipeline_stage: parsed.data.stage,
      stage_entered_at: now,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select(CANDIDATE_DETAIL_COLUMNS)
    .single();

  if (error || !candidate) {
    logger.error("stage update failed", {
      route: "/api/candidates/[id]/stage",
      candidateId: id,
      code: error?.code,
      message: error?.message,
    });
    return jsonError("No se pudo actualizar la etapa", 500);
  }

  try {
    await admin.from("candidate_stage_events").insert({
      candidate_id: id,
      job_id: current.job_id,
      from_stage: current.pipeline_stage,
      to_stage: parsed.data.stage,
      changed_by: user.id,
      changed_at: now,
    });
  } catch (err) {
    logger.warn("stage event insert failed", {
      route: "/api/candidates/[id]/stage",
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  const jobs = candidate.jobs as
    | { title?: string }
    | { title?: string }[]
    | null;
  const jobTitle = Array.isArray(jobs) ? jobs[0]?.title : jobs?.title;

  void dispatchN8nEvent("stage.changed", {
    candidateId: candidate.id,
    email: candidate.email,
    fullName: candidate.full_name,
    stage: parsed.data.stage,
    fromStage: current.pipeline_stage,
    jobTitle,
    trackingToken: candidate.public_tracking_token,
    hiringManagerFeedback: parsed.data.feedback ?? null,
  });

  if (parsed.data.stage === "interview_approved") {
    void dispatchN8nEvent("interview.technical_approved", {
      candidateId: candidate.id,
      candidateEmail: candidate.email,
      fullName: candidate.full_name,
      jobId: current.job_id,
      jobTitle,
      trackingToken: candidate.public_tracking_token,
      rating: parsed.data.feedback?.rating ?? null,
      notes: parsed.data.feedback?.notes ?? null,
      fromStage: current.pipeline_stage,
      notifyTalentTeam: true,
      notifyCandidate: true,
      talentTeamMessage: `El candidato ${candidate.full_name} aprobó la entrevista técnica para la vacante ${jobTitle ?? "N/A"} con calificación ${parsed.data.feedback?.rating ?? "N/A"}/5. Proceder con fit cultural y pre-oferta.`,
      candidateEmailSubject: "¡Buenas noticias! Aprobaste nuestra evaluación técnica",
      candidateEmailBody: `¡Buenas noticias, ${candidate.full_name}! Has aprobado nuestra evaluación técnica. El Equipo de Talento se comunicará contigo en las próximas 48 horas para coordinar el paso final del proceso.`,
    });
  }

  if (parsed.data.stage === "interview" && parsed.data.confirmed) {
    void dispatchN8nEvent("interview.approved", {
      candidateId: candidate.id,
      email: candidate.email,
      fullName: candidate.full_name,
      jobTitle,
      trackingToken: candidate.public_tracking_token,
    });
  }

  return jsonOk(candidate);
}
