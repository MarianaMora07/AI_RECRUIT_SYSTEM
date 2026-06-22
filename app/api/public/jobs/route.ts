import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET() {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return jsonError("Servicio no disponible", 503);
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, description, requirements_formatted, status")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError("No se pudieron cargar vacantes", 500);
  }

  const { data: jobRecruiters } = await supabase
    .from("job_recruiters")
    .select("job_id");

  const jobsWithRecruiters = new Set(
    (jobRecruiters ?? []).map((r) => r.job_id as string)
  );

  const openJobs = (jobs ?? []).filter((j) => jobsWithRecruiters.has(j.id));

  return jsonOk(openJobs);
}
