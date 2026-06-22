import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return jsonError("Servicio no disponible", 503);
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (!job || job.status !== "open") {
    return jsonError("Vacante no disponible", 404);
  }

  const { data, error } = await supabase
    .from("job_recruiters")
    .select("recruiter:profiles!job_recruiters_recruiter_id_fkey(id, full_name, avatar_url)")
    .eq("job_id", jobId);

  if (error) {
    return jsonError("No se pudieron cargar reclutadores", 500);
  }

  const recruiters = (data ?? [])
    .map((row) => row.recruiter)
    .filter(Boolean);

  return jsonOk(recruiters);
}
