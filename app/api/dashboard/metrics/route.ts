import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { parseDashboardFilters } from "@/lib/data/dashboard";
import { fetchDashboardAnalytics } from "@/lib/data/metrics";

export async function GET(request: Request) {
  const { user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const filters = parseDashboardFilters(
    Object.fromEntries(searchParams.entries())
  );

  const result = await fetchDashboardAnalytics(filters);
  if (!result) {
    return jsonError("No se pudieron cargar las métricas", 500);
  }

  return jsonOk({ ...result.metrics, _legacy: result.isLegacy });
}
