import { getServerAuth } from "@/lib/api/auth";

export interface ScheduledInterview {
  id: string;
  scheduled_at: string;
  candidate_id: string;
  job_id: string;
  candidates: { full_name: string; pipeline_stage: string } | null;
  jobs: { title: string } | null;
}

export async function fetchScheduledInterviews(
  daysAhead = 60
): Promise<ScheduledInterview[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);

  const { data } = await supabase
    .from("interviews")
    .select(
      "id, scheduled_at, candidate_id, job_id, candidates(full_name, pipeline_stage), jobs(title)"
    )
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", from.toISOString())
    .lte("scheduled_at", to.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);

  return (data ?? []).map((row) => ({
    ...row,
    candidates: Array.isArray(row.candidates)
      ? row.candidates[0] ?? null
      : row.candidates,
    jobs: Array.isArray(row.jobs) ? row.jobs[0] ?? null : row.jobs,
  })) as ScheduledInterview[];
}
