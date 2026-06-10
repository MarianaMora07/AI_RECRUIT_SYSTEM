import { getServerAuth } from "@/lib/api/auth";

export interface DashboardMetrics {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  stageCounts: Record<string, number>;
  applicantsPerJob: Record<string, number>;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics | null> {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_dashboard_metrics");
  if (error || !data) return null;
  return data as DashboardMetrics;
}
