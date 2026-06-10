import { getServerAuth } from "@/lib/api/auth";
import { JOB_LIST_COLUMNS } from "@/lib/constants/queries";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/constants/roles";

export interface RecentJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface PipelinePreviewCandidate {
  id: string;
  full_name: string;
  pipeline_stage: PipelineStage;
  job_id: string;
  jobs?: { title: string } | { title: string }[] | null;
}

export async function fetchRecentJobs(limit = 5): Promise<RecentJob[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const { data } = await supabase
    .from("jobs")
    .select(JOB_LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentJob[];
}

export async function fetchPipelinePreview(
  limitPerStage = 3
): Promise<Record<string, PipelinePreviewCandidate[]>> {
  const { supabase, user } = await getServerAuth();
  if (!user) return {};

  const grouped: Record<string, PipelinePreviewCandidate[]> = {};

  await Promise.all(
    PIPELINE_STAGES.map(async (stage) => {
      const { data } = await supabase
        .from("candidates")
        .select("id, full_name, pipeline_stage, job_id, jobs(title)")
        .eq("pipeline_stage", stage)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limitPerStage);

      grouped[stage] = (data ?? []) as PipelinePreviewCandidate[];
    })
  );

  return grouped;
}
