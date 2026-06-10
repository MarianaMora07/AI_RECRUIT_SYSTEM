import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { CANDIDATE_DETAIL_COLUMNS } from "@/lib/constants/queries";
import { CRITICAL_STAGES } from "@/lib/constants/roles";
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

  if (
    CRITICAL_STAGES.includes(parsed.data.stage) &&
    !parsed.data.confirmed
  ) {
    return jsonError("Se requiere confirmación para esta acción", 422);
  }

  const { data: current } = await supabase
    .from("candidates")
    .select("id, job_id, pipeline_stage")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!current) return jsonError("Candidato no encontrado", 404);

  const now = new Date().toISOString();

  const { data: candidate, error } = await supabase
    .from("candidates")
    .update({
      pipeline_stage: parsed.data.stage,
      stage_entered_at: now,
    })
    .eq("id", id)
    .select(CANDIDATE_DETAIL_COLUMNS)
    .single();

  if (error || !candidate) {
    return jsonError("No se pudo actualizar la etapa", 500);
  }

  try {
    const admin = createAdminClient();
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
  });

  if (parsed.data.stage === "interview" && parsed.data.confirmed) {
    void dispatchN8nEvent("interview.approved", {
      candidateId: candidate.id,
      email: candidate.email,
      fullName: candidate.full_name,
    });
  }

  return jsonOk(candidate);
}
