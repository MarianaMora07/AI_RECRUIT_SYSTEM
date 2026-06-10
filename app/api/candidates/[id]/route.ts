import { getServerAuth } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { CANDIDATE_DETAIL_COLUMNS } from "@/lib/constants/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getServerAuth();
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const { data, error } = await supabase
    .from("candidates")
    .select(CANDIDATE_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return jsonError("Candidato no encontrado", 404);
  return jsonOk(data);
}
