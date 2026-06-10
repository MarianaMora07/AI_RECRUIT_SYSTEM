import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { data, error } = await supabase.rpc("get_dashboard_metrics");

  if (error || !data) {
    return jsonError("No se pudieron cargar las métricas", 500);
  }

  return jsonOk(data);
}
