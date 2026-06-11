import { getServerAuth } from "@/lib/api/auth";
import type { PipelineStage } from "@/lib/constants/roles";
import {
  CANDIDATE_DETAIL_COLUMNS,
  CANDIDATE_LIST_COLUMNS,
  CANDIDATE_PIPELINE_EXTENDED_COLUMNS,
} from "@/lib/constants/queries";
import { sortCandidatesByAffinity } from "@/lib/utils/candidate-ranking";

export interface PipelineFilters {
  jobId?: string;
  stage?: PipelineStage;
  /** When undefined with jobId, defaults to semantic ranking. */
  semantic?: boolean;
}

export interface PipelineCandidate {
  id: string;
  full_name: string;
  email?: string;
  pipeline_stage: PipelineStage;
  job_id: string;
  stage_entered_at?: string | null;
  similarity_pct?: number;
  jobs?: { title: string } | { title: string }[] | null;
  scores?: Array<{ fit_score?: number; classification?: string }> | { fit_score?: number; classification?: string };
}

export interface CandidateListFilters {
  jobId?: string;
  q?: string;
}

export async function fetchCandidatesList(
  filters: CandidateListFilters = {},
  options: { rankByAffinity?: boolean } = {}
) {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const { jobId, q } = filters;
  const { rankByAffinity = Boolean(jobId) } = options;

  if (jobId && rankByAffinity) {
    const ranked = await fetchCandidatesByJob(jobId, true);
    let results = ranked as PipelineCandidate[];
    const term = q?.trim().toLowerCase();
    if (term) {
      results = results.filter(
        (c) =>
          c.full_name.toLowerCase().includes(term) ||
          (c.email?.toLowerCase().includes(term) ?? false)
      );
    }
    return results;
  }

  let query = supabase
    .from("candidates")
    .select(CANDIDATE_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (jobId) query = query.eq("job_id", jobId);

  const term = q?.trim().replace(/[%_,]/g, "");
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data } = await query;
  const results = (data ?? []) as PipelineCandidate[];
  return sortCandidatesByAffinity(results);
}

export async function fetchPipelineCandidates(
  filters: PipelineFilters = {}
): Promise<PipelineCandidate[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const { jobId, stage, semantic } = filters;
  const useSemantic = Boolean(jobId) && semantic !== false;

  if (useSemantic && jobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("embedding")
      .eq("id", jobId)
      .single();

    if (job?.embedding) {
      const { data: ranked } = await supabase.rpc("match_candidates_by_job", {
        job_embedding: job.embedding,
        target_job_id: jobId,
      });

      if (ranked) {
        let results = ranked as PipelineCandidate[];
        if (stage) {
          results = results.filter((c) => c.pipeline_stage === stage);
        }
        return results;
      }
    }
  }

  let query = supabase
    .from("candidates")
    .select(CANDIDATE_PIPELINE_EXTENDED_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (jobId) query = query.eq("job_id", jobId);
  if (stage) query = query.eq("pipeline_stage", stage);

  const { data } = await query;
  let results = (data ?? []) as PipelineCandidate[];

  if (useSemantic && jobId && results.length > 0) {
    type WithScores = { scores?: { fit_score?: number }[] | { fit_score?: number } };
    results = [...results].sort((a, b) => {
      const scoreA = getFitScore(a as WithScores);
      const scoreB = getFitScore(b as WithScores);
      return scoreB - scoreA;
    });
  }

  return results;
}

function getFitScore(c: { scores?: { fit_score?: number }[] | { fit_score?: number } }) {
  if (!c.scores) return 0;
  if (Array.isArray(c.scores)) return Number(c.scores[0]?.fit_score ?? 0);
  return Number(c.scores.fit_score ?? 0);
}

export async function fetchCandidatesByJob(jobId: string, semantic = false) {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  if (semantic) {
    const { data: job } = await supabase
      .from("jobs")
      .select("embedding")
      .eq("id", jobId)
      .single();

    if (job?.embedding) {
      const { data: ranked } = await supabase.rpc("match_candidates_by_job", {
        job_embedding: job.embedding,
        target_job_id: jobId,
      });
      if (ranked) return ranked;
    }
  }

  const { data } = await supabase
    .from("candidates")
    .select(CANDIDATE_LIST_COLUMNS)
    .eq("job_id", jobId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function fetchCandidateById(id: string) {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data, error } = await supabase
    .from("candidates")
    .select(CANDIDATE_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data;
}
