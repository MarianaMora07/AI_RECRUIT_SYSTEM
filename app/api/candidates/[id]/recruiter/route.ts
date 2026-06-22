import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { manualReassignCandidateRecruiter } from "@/lib/candidates/reassign-recruiter";
import { canAssignJobRecruiters } from "@/lib/constants/roles";
import { reassignRecruiterSchema } from "@/lib/validations/candidates";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const profile = await getProfile(user.id, supabase);
  if (!canAssignJobRecruiters(profile?.role)) {
    return jsonError("No autorizado", 403);
  }

  const { id: candidateId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = reassignRecruiterSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, job_id")
    .eq("id", candidateId)
    .is("deleted_at", null)
    .single();

  if (!candidate) {
    return jsonError("Candidato no encontrado", 404);
  }

  const result = await manualReassignCandidateRecruiter(supabase, {
    candidateId,
    jobId: candidate.job_id,
    newRecruiterId: parsed.data.recruiterId,
    changedBy: user.id,
  });

  if (result.error) {
    return jsonError(result.error, result.status ?? 400);
  }

  return jsonOk({ reassigned: true });
}
