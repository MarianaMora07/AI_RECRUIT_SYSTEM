import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/lib/constants/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CandidateStageEvent {
  toStage: PipelineStage;
  toStageLabel: string;
  changedAt: string;
}

export interface CandidatePublicStatus {
  fullName: string;
  jobTitle: string;
  pipelineStage: PipelineStage;
  stageEnteredAt: string;
  appliedAt: string;
  timeline: CandidateStageEvent[];
}

export async function fetchCandidateStatusByToken(
  token: string
): Promise<CandidatePublicStatus | null> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 16) return null;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return null;
  }

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select(
      "id, full_name, pipeline_stage, stage_entered_at, created_at, jobs(title), deleted_at"
    )
    .eq("public_tracking_token", trimmed)
    .maybeSingle();

  if (error || !candidate || candidate.deleted_at) return null;

  const jobs = candidate.jobs as { title?: string } | { title?: string }[] | null;
  const jobTitle = Array.isArray(jobs)
    ? jobs[0]?.title ?? "Vacante"
    : jobs?.title ?? "Vacante";

  const pipelineStage = candidate.pipeline_stage as PipelineStage;

  const { data: events } = await supabase
    .from("candidate_stage_events")
    .select("to_stage, changed_at")
    .eq("candidate_id", candidate.id)
    .order("changed_at", { ascending: true })
    .limit(20);

  const timeline: CandidateStageEvent[] = (events ?? []).map((event) => {
    const stage = event.to_stage as PipelineStage;
    return {
      toStage: stage,
      toStageLabel: PIPELINE_STAGE_LABELS[stage] ?? stage,
      changedAt: event.changed_at,
    };
  });

  return {
    fullName: candidate.full_name,
    jobTitle,
    pipelineStage,
    stageEnteredAt: candidate.stage_entered_at ?? candidate.created_at,
    appliedAt: candidate.created_at,
    timeline,
  };
}
