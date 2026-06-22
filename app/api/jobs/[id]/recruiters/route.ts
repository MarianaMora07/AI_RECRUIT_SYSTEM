import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { validateAndApplyJobRecruitersPatch } from "@/lib/candidates/reassign-recruiter";
import { canAssignJobRecruiters } from "@/lib/constants/roles";
import { jobRecruitersPatchSchema } from "@/lib/validations/candidates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { id: jobId } = await params;

  const { data, error } = await supabase
    .from("job_recruiters")
    .select("recruiter_id, created_at, recruiter:profiles!job_recruiters_recruiter_id_fkey(id, full_name, avatar_url, email)")
    .eq("job_id", jobId);

  if (error) {
    return jsonError("No se pudieron cargar reclutadores de la vacante", 500);
  }

  return jsonOk(data ?? []);
}

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

  const { id: jobId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = jobRecruitersPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { recruiterIds, reassignments } = parsed.data;

  if (recruiterIds.length > 0) {
    const { data: recruiters } = await supabase
      .from("profiles")
      .select("id, role")
      .in("id", recruiterIds);

    const invalid = recruiterIds.filter(
      (id) => !recruiters?.find((r) => r.id === id && r.role === "recruiter")
    );
    if (invalid.length > 0) {
      return jsonError("Todos los IDs deben ser reclutadores válidos", 400);
    }
  }

  const result = await validateAndApplyJobRecruitersPatch(supabase, user.id, {
    jobId,
    recruiterIds,
    reassignments,
  });

  if (result.error) {
    return jsonError(result.error, result.status ?? 400);
  }

  const { data: updated } = await supabase
    .from("job_recruiters")
    .select("recruiter_id, recruiter:profiles!job_recruiters_recruiter_id_fkey(id, full_name, avatar_url)")
    .eq("job_id", jobId);

  return jsonOk(updated ?? []);
}
