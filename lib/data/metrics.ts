import { getServerAuth } from "@/lib/api/auth";
import { logger } from "@/lib/logger";

export interface ConversionRates {
  appliedToEvaluation: number | null;
  evaluationToInterview: number | null;
  interviewToApproved: number | null;
}

export interface TeamWorkloadRow {
  recruiter_id: string;
  full_name: string | null;
  avatar_url?: string | null;
  job_count: number;
  active_candidates: number;
  interviews_this_week: number;
}

export interface DashboardAnalytics {
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  draftJobs: number;
  totalCandidates: number;
  newCandidates24h: number;
  pendingInterview: number;
  interviewApproved: number;
  hiredCount: number;
  stageCounts: Record<string, number>;
  applicantsPerJob: Record<string, number>;
  timeToHireDays: number | null;
  timeToFillDays: number | null;
  overallConversionRate: number | null;
  conversionRates: ConversionRates;
  slaWarningCount: number;
  slaBreachedCount: number;
  jobsWithoutRecruiters: number;
  teamWorkload: TeamWorkloadRow[];
  sourceCounts: Record<string, number>;
  costPerHire: number | null;
}

/** @deprecated use DashboardAnalytics */
export type DashboardMetrics = DashboardAnalytics;

export interface DashboardFilterParams {
  fromDate?: string | null;
  toDate?: string | null;
  jobId?: string | null;
  recruiterId?: string | null;
  department?: string | null;
  location?: string | null;
  priority?: string | null;
  workMode?: string | null;
}

export interface DashboardAnalyticsResult {
  metrics: DashboardAnalytics;
  /** True when falling back to legacy get_dashboard_metrics RPC */
  isLegacy: boolean;
}

const EMPTY_CONVERSION_RATES: ConversionRates = {
  appliedToEvaluation: null,
  evaluationToInterview: null,
  interviewToApproved: null,
};

function normalizeAnalytics(raw: DashboardAnalytics): DashboardAnalytics {
  return {
    ...raw,
    teamWorkload: raw.teamWorkload ?? [],
    sourceCounts: raw.sourceCounts ?? {},
    conversionRates: raw.conversionRates ?? EMPTY_CONVERSION_RATES,
    stageCounts: raw.stageCounts ?? {},
    applicantsPerJob: raw.applicantsPerJob ?? {},
  };
}

function mapLegacyMetrics(raw: Record<string, unknown>): DashboardAnalytics {
  const stageCounts = (raw.stageCounts as Record<string, number>) ?? {};
  return {
    totalJobs: Number(raw.totalJobs ?? 0),
    openJobs: Number(raw.openJobs ?? 0),
    closedJobs: Number(raw.closedJobs ?? 0),
    draftJobs: Number(raw.draftJobs ?? 0),
    totalCandidates: Number(raw.totalCandidates ?? 0),
    newCandidates24h: Number(raw.newCandidates24h ?? 0),
    pendingInterview: stageCounts.interview ?? 0,
    interviewApproved: stageCounts.interview_approved ?? 0,
    hiredCount: stageCounts.hired ?? 0,
    stageCounts,
    applicantsPerJob: (raw.applicantsPerJob as Record<string, number>) ?? {},
    timeToHireDays: null,
    timeToFillDays: null,
    overallConversionRate: null,
    conversionRates: EMPTY_CONVERSION_RATES,
    slaWarningCount: 0,
    slaBreachedCount: 0,
    jobsWithoutRecruiters: 0,
    teamWorkload: [],
    sourceCounts: {},
    costPerHire: null,
  };
}

export async function fetchDashboardAnalytics(
  filters: DashboardFilterParams = {}
): Promise<DashboardAnalyticsResult | null> {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_dashboard_analytics", {
    p_from_date: filters.fromDate ?? null,
    p_to_date: filters.toDate ?? null,
    p_job_id: filters.jobId ?? null,
    p_recruiter_filter: filters.recruiterId ?? null,
  });

  if (!error && data) {
    return {
      metrics: normalizeAnalytics(data as DashboardAnalytics),
      isLegacy: false,
    };
  }

  if (error) {
    logger.warn("get_dashboard_analytics unavailable, trying legacy RPC", {
      message: error.message,
      code: error.code,
    });
  }

  const legacy = await supabase.rpc("get_dashboard_metrics");
  if (legacy.error || !legacy.data) {
    logger.error("dashboard metrics failed", {
      analyticsMessage: error?.message,
      analyticsCode: error?.code,
      legacyMessage: legacy.error?.message,
      legacyCode: legacy.error?.code,
    });
    return null;
  }

  return {
    metrics: mapLegacyMetrics(legacy.data as Record<string, unknown>),
    isLegacy: true,
  };
}

export async function fetchDashboardMetrics(
  filters?: DashboardFilterParams
): Promise<DashboardAnalytics | null> {
  const result = await fetchDashboardAnalytics(filters);
  return result?.metrics ?? null;
}
