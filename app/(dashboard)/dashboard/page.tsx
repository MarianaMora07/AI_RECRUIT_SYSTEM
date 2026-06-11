import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { NotificationsBanner } from "@/components/dashboard/NotificationsBanner";
import {
  fetchPipelinePreview,
  fetchRecentJobs,
} from "@/lib/data/dashboard";
import { fetchDashboardMetrics } from "@/lib/data/metrics";
import { fetchScheduledInterviews } from "@/lib/data/interviews";
import { fetchNotifications } from "@/lib/data/notifications";

export const revalidate = 15;

export default async function DashboardPage() {
  const [metrics, recentJobs, pipelinePreview, notifications, scheduledInterviews] =
    await Promise.all([
    fetchDashboardMetrics(),
    fetchRecentJobs(5),
    fetchPipelinePreview(3),
    fetchNotifications(),
    fetchScheduledInterviews(),
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
    <>
      <NotificationsBanner notifications={notifications} />
      <DashboardView
        metrics={metrics}
        recentJobs={recentJobs}
        pipelinePreview={pipelinePreview}
        scheduledInterviews={scheduledInterviews}
      />
    </>
  );
}
