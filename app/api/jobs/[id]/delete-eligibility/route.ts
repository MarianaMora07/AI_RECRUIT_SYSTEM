import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { canDeleteJobs } from "@/lib/constants/roles";
import { getJobDeletionCheck } from "@/lib/jobs/delete-job";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const profile = await getProfile(user.id, supabase);
  if (!canDeleteJobs(profile?.role)) {
    return jsonError("No autorizado", 403);
  }

  const { id } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!job) return jsonError("Vacante no encontrada", 404);

  const admin = createAdminClient();
  const check = await getJobDeletionCheck(admin, id);
  return jsonOk(check);
}
