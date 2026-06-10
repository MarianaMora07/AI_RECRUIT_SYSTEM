import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { CANDIDATE_DETAIL_COLUMNS } from "@/lib/constants/queries";
import { CRITICAL_STAGES } from "@/lib/constants/roles";
import { dispatchN8nEvent } from "@/lib/n8n/dispatch";
import { updateStageSchema } from "@/lib/validations/candidates";

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

  const { data: candidate, error } = await supabase
    .from("candidates")
    .update({ pipeline_stage: parsed.data.stage })
    .eq("id", id)
    .select(CANDIDATE_DETAIL_COLUMNS)
    .single();

  if (error || !candidate) {
    return jsonError("No se pudo actualizar la etapa", 500);
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
