import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";

const REASON_LABELS: Record<string, string> = {
  initial_assignment: "Asignación inicial",
  job_recruiter_removed: "Reclutador removido de la vacante",
  manual_reassignment: "Reasignación manual",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { id: candidateId } = await params;

  const { data: events, error } = await supabase
    .from("candidate_recruiter_events")
    .select(
      "id, from_recruiter_id, to_recruiter_id, changed_by, reason, created_at, from_recruiter:profiles!candidate_recruiter_events_from_recruiter_id_fkey(id, full_name, avatar_url), to_recruiter:profiles!candidate_recruiter_events_to_recruiter_id_fkey(id, full_name, avatar_url), changed_by_profile:profiles!candidate_recruiter_events_changed_by_fkey(id, full_name, avatar_url)"
    )
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError("No se pudo cargar el historial", 500);
  }

  const formatted = (events ?? []).map((e) => ({
    id: e.id,
    fromRecruiter: e.from_recruiter ?? null,
    toRecruiter: e.to_recruiter,
    changedBy: e.changed_by_profile ?? null,
    reason: e.reason,
    reasonLabel: REASON_LABELS[e.reason as string] ?? e.reason,
    createdAt: e.created_at,
  }));

  return jsonOk({ events: formatted });
}
