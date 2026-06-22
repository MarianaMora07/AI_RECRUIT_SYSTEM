import { getServerAuth, getProfile } from "@/lib/api/auth";
import { JOB_LIST_COLUMNS, JOB_LIST_COLUMNS_EXTENDED } from "@/lib/constants/queries";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/constants/roles";
import type { DashboardFilterParams } from "@/lib/data/metrics";

export interface RecentJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
  department?: string | null;
  location?: string | null;
  priority?: string | null;
  work_mode?: string | null;
}

export interface PipelinePreviewCandidate {
  id: string;
  full_name: string;
  pipeline_stage: PipelineStage;
  job_id: string;
  jobs?: { title: string } | { title: string }[] | null;
}

export interface DecisionQueueCandidate {
  id: string;
  full_name: string;
  pipeline_stage: PipelineStage;
  stage_entered_at: string | null;
  job_id: string;
  jobs?: { title: string } | { title: string }[] | null;
}

export interface RankedCandidate {
  id: string;
  full_name: string;
  pipeline_stage: PipelineStage;
  job_id: string;
  fit_score: number | null;
  jobs?: { title: string } | { title: string }[] | null;
}

export interface FilterOptionJob {
  id: string;
  title: string;
  department?: string | null;
  location?: string | null;
  priority?: string | null;
  work_mode?: string | null;
}

export interface FilterOptionRecruiter {
  id: string;
  full_name: string | null;
}

export async function fetchRecentJobs(
  limit = 5,
  filters: DashboardFilterParams = {}
): Promise<RecentJob[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  async function runQuery(columns: string) {
    let query = supabase
      .from("jobs")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit * 3);

    if (filters.jobId) {
      query = query.eq("id", filters.jobId);
    }
    if (filters.department) query = query.eq("department", filters.department);
    if (filters.location) query = query.eq("location", filters.location);
    if (filters.priority) query = query.eq("priority", filters.priority);
    if (filters.workMode) query = query.eq("work_mode", filters.workMode);

    return query;
  }

  let { data, error } = await runQuery(JOB_LIST_COLUMNS_EXTENDED);
  if (error) {
    ({ data, error } = await runQuery(JOB_LIST_COLUMNS));
  }

  if (error) return [];
  return ((data ?? []) as unknown as RecentJob[]).slice(0, limit);
}

export async function fetchFilterOptions(): Promise<{
  jobs: FilterOptionJob[];
  recruiters: FilterOptionRecruiter[];
  departments: string[];
  locations: string[];
}> {
  const { supabase, user } = await getServerAuth();
  if (!user) {
    return { jobs: [], recruiters: [], departments: [], locations: [] };
  }

  const profile = await getProfile(user.id, supabase);
  const isRecruiter = profile?.role === "recruiter";

  let jobsRes = await supabase
    .from("jobs")
    .select("id, title, department, location, priority, work_mode")
    .order("title");

  if (jobsRes.error) {
    jobsRes = await supabase.from("jobs").select("id, title").order("title");
  }

  const recruitersRes = isRecruiter
    ? { data: [] as FilterOptionRecruiter[] }
    : await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "recruiter")
        .order("full_name");

  const jobs = (jobsRes.data ?? []) as FilterOptionJob[];
  const departments = [
    ...new Set(jobs.map((j) => j.department).filter(Boolean) as string[]),
  ].sort();
  const locations = [
    ...new Set(jobs.map((j) => j.location).filter(Boolean) as string[]),
  ].sort();

  return {
    jobs,
    recruiters: (recruitersRes.data ?? []) as FilterOptionRecruiter[],
    departments,
    locations,
  };
}

export async function fetchPipelinePreview(
  limitPerStage = 3,
  filters: DashboardFilterParams = {}
): Promise<Record<string, PipelinePreviewCandidate[]>> {
  const { supabase, user } = await getServerAuth();
  if (!user) return {};

  const grouped: Record<string, PipelinePreviewCandidate[]> = {};

  await Promise.all(
    PIPELINE_STAGES.map(async (stage) => {
      let query = supabase
        .from("candidates")
        .select("id, full_name, pipeline_stage, job_id, jobs(title)")
        .eq("pipeline_stage", stage)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limitPerStage);

      if (filters.jobId) query = query.eq("job_id", filters.jobId);
      if (filters.fromDate) query = query.gte("created_at", filters.fromDate);
      if (filters.toDate) query = query.lte("created_at", filters.toDate);

      const { data } = await query;
      grouped[stage] = (data ?? []) as PipelinePreviewCandidate[];
    })
  );

  return grouped;
}

export async function fetchDecisionQueue(
  filters: DashboardFilterParams = {}
): Promise<DecisionQueueCandidate[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  let query = supabase
    .from("candidates")
    .select("id, full_name, pipeline_stage, stage_entered_at, job_id, jobs(title)")
    .eq("pipeline_stage", "interview")
    .is("deleted_at", null)
    .order("stage_entered_at", { ascending: true })
    .limit(12);

  if (filters.jobId) query = query.eq("job_id", filters.jobId);

  const { data } = await query;
  return (data ?? []) as DecisionQueueCandidate[];
}

export async function fetchTopCandidatesByFit(
  limit = 8,
  filters: DashboardFilterParams = {}
): Promise<RankedCandidate[]> {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  let query = supabase
    .from("candidates")
    .select(
      "id, full_name, pipeline_stage, job_id, jobs(title), scores(fit_score)"
    )
    .is("deleted_at", null)
    .in("pipeline_stage", ["evaluation", "interview", "interview_approved"])
    .order("created_at", { ascending: false })
    .limit(40);

  if (filters.jobId) query = query.eq("job_id", filters.jobId);

  const { data } = await query;
  const rows = (data ?? []) as Array<
    RankedCandidate & { scores?: { fit_score: number | null } | { fit_score: number | null }[] }
  >;

  return rows
    .map((row) => {
      const score = Array.isArray(row.scores) ? row.scores[0] : row.scores;
      return {
        id: row.id,
        full_name: row.full_name,
        pipeline_stage: row.pipeline_stage,
        job_id: row.job_id,
        jobs: row.jobs,
        fit_score: score?.fit_score ?? null,
      };
    })
    .filter((r) => r.fit_score != null)
    .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0))
    .slice(0, limit);
}

export function parseDashboardFilters(
  searchParams: Record<string, string | string[] | undefined>
): DashboardFilterParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" && v.length > 0 ? v : null;
  };

  const range = get("range") ?? "30d";
  let fromDate: string | null = get("from");
  const toDate: string | null = get("to");

  if (!fromDate && range !== "all") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : null;
    if (days) {
      const d = new Date();
      d.setDate(d.getDate() - days);
      fromDate = d.toISOString();
    }
  }

  return {
    fromDate,
    toDate,
    jobId: get("jobId"),
    recruiterId: get("recruiterId"),
    department: get("department"),
    location: get("location"),
    priority: get("priority"),
    workMode: get("workMode"),
  };
}
