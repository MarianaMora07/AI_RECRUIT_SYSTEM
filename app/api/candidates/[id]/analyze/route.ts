import { getAuthenticatedClient } from "@/lib/api/auth";
import { processCandidateAi } from "@/lib/ai/process-candidate";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { CANDIDATE_DETAIL_COLUMNS } from "@/lib/constants/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  if (!process.env.GEMINI_API_KEY) {
    return jsonError("Análisis IA no configurado", 503);
  }

  const { id } = await params;
  const { data: current } = await supabase
    .from("candidates")
    .select(CANDIDATE_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!current) return jsonError("Candidato no encontrado", 404);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Servicio de análisis no disponible", 503);
  }

  const { data: row, error: rowError } = await admin
    .from("candidates")
    .select("id, job_id, cv_text, jobs(title, description, requirements)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (rowError || !row?.cv_text) {
    return jsonError("No hay texto de CV para analizar", 400);
  }

  const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
  if (!job?.requirements) {
    return jsonError("Vacante sin requisitos", 400);
  }

  logger.info("manual AI analysis started", {
    route: "/api/candidates/[id]/analyze",
    userId: user.id,
    candidateId: id,
  });

  const result = await processCandidateAi({
    candidateId: id,
    jobId: row.job_id,
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements,
    cvText: row.cv_text,
    userId: user.id,
    replaceExisting: true,
  });

  if (!result.ok) {
    return jsonError(result.reason, 502);
  }

  const { data: updated, error: fetchError } = await supabase
    .from("candidates")
    .select(CANDIDATE_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !updated) {
    return jsonError("Análisis guardado pero no se pudo cargar el perfil", 500);
  }

  return jsonOk(updated);
}
