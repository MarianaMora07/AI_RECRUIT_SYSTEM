import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import {
  CANDIDATE_LIST_COLUMNS,
  CANDIDATE_PIPELINE_EXTENDED_COLUMNS,
} from "@/lib/constants/queries";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/constants/roles";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const stageParam = searchParams.get("stage");
  const semantic = searchParams.get("semantic") === "true";
  const view = searchParams.get("view");

  const stage =
    stageParam && PIPELINE_STAGES.includes(stageParam as PipelineStage)
      ? (stageParam as PipelineStage)
      : null;

  if (semantic && jobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("embedding")
      .eq("id", jobId)
      .single();

    if (job?.embedding) {
      const { data: ranked, error: rpcError } = await supabase.rpc(
        "match_candidates_by_job",
        {
          job_embedding: job.embedding,
          target_job_id: jobId,
        }
      );

      if (!rpcError && ranked) {
        const filtered = stage
          ? ranked.filter(
              (c: { pipeline_stage: string }) => c.pipeline_stage === stage
            )
          : ranked;
        return jsonOk(filtered);
      }
    }
  }

  const columns =
    view === "pipeline"
      ? CANDIDATE_PIPELINE_EXTENDED_COLUMNS
      : CANDIDATE_LIST_COLUMNS;

  let query = supabase
    .from("candidates")
    .select(columns)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (jobId) query = query.eq("job_id", jobId);
  if (stage) query = query.eq("pipeline_stage", stage);

  const { data, error } = await query;

  if (error) {
    logger.error("candidates list failed", {
      route: "/api/candidates",
      userId: user.id,
    });
    return jsonError("No se pudieron cargar candidatos", 500);
  }

  const results = data ?? [];

  if (semantic && results.length > 0) {
    type WithScores = { scores?: { fit_score?: number }[] };
    (results as WithScores[]).sort((a, b) => {
      const scoreA = a.scores?.[0]?.fit_score ?? 0;
      const scoreB = b.scores?.[0]?.fit_score ?? 0;
      return Number(scoreB) - Number(scoreA);
    });
  }

  return jsonOk(results);
}
