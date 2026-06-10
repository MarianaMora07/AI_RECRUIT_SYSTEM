import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  fetchPipelinePreview,
  fetchRecentJobs,
} from "@/lib/data/dashboard";
import { fetchDashboardMetrics } from "@/lib/data/metrics";

export const revalidate = 15;

export default async function DashboardPage() {
  const [metrics, recentJobs, pipelinePreview] = await Promise.all([
    fetchDashboardMetrics(),
    fetchRecentJobs(5),
    fetchPipelinePreview(3),
  ]);

  if (!metrics) {
    redirect("/login");
  }

  if (metrics.totalJobs === 0 && metrics.totalCandidates === 0) {
    return (
      <Alert variant="info" title="Sin datos">
        Aún no hay métricas disponibles. Crea una vacante y sube candidatos.
      </Alert>
    );
  }

  return (
    <DashboardView
      metrics={metrics}
      recentJobs={recentJobs}
      pipelinePreview={pipelinePreview}
    />
  );
}
