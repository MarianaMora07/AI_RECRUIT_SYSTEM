import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { canAssignJobRecruiters } from "@/lib/constants/roles";
import { PROFILE_COLUMNS } from "@/lib/constants/queries";

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const profile = await getProfile(user.id, supabase);
  if (!canAssignJobRecruiters(profile?.role)) {
    return jsonError("No autorizado", 403);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("role", "recruiter")
    .order("full_name", { ascending: true });

  if (error) {
    return jsonError("No se pudieron cargar reclutadores", 500);
  }

  return jsonOk(data ?? []);
}
