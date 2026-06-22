import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { NotificationsBanner } from "@/components/dashboard/NotificationsBanner";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { getProfile, getServerAuth } from "@/lib/api/auth";
import { isHiringManager, type UserRole } from "@/lib/constants/roles";
import {
  fetchDecisionQueue,
  fetchFilterOptions,
  fetchPipelinePreview,
  fetchRecentJobs,
  fetchTopCandidatesByFit,
  parseDashboardFilters,
} from "@/lib/data/dashboard";
import { fetchDashboardAnalytics } from "@/lib/data/metrics";
import { fetchScheduledInterviews } from "@/lib/data/interviews";
import { fetchNotifications } from "@/lib/data/notifications";

export const revalidate = 15;

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id, supabase);
  const userRole = (profile?.role ?? "recruiter") as UserRole;
  const resolvedParams = await searchParams;
  const filters = parseDashboardFilters(resolvedParams);

  const [
    analyticsResult,
    recentJobs,
    pipelinePreview,
    notifications,
    scheduledInterviews,
    filterOptions,
    decisionQueue,
    rankedCandidates,
  ] = await Promise.all([
    fetchDashboardAnalytics(filters),
    fetchRecentJobs(5, filters),
    fetchPipelinePreview(3, filters),
    fetchNotifications(),
    fetchScheduledInterviews(),
    fetchFilterOptions(),
    isHiringManager(userRole)
      ? fetchDecisionQueue(filters)
      : Promise.resolve([]),
    isHiringManager(userRole)
      ? fetchTopCandidatesByFit(8, filters)
      : Promise.resolve([]),
  ]);

  if (!analyticsResult) {
    return (
      <Alert variant="error" title="No se pudieron cargar las métricas">
        No hay conexión con las funciones de métricas en Supabase. En el SQL
        Editor de tu proyecto, ejecuta las migraciones{" "}
        <code className="text-xs">016</code>, <code className="text-xs">017</code>{" "}
        y <code className="text-xs">018</code> (archivos en{" "}
        <code className="text-xs">supabase/migrations/</code>), en ese orden.
      </Alert>
    );
  }

  const { metrics, isLegacy } = analyticsResult;

  if (metrics.totalJobs === 0 && metrics.totalCandidates === 0) {
    return (
      <Alert variant="info" title="Sin datos">
        Aún no hay métricas disponibles. Crea una vacante y sube candidatos.
      </Alert>
    );
  }

  return (
    <>
      {isLegacy && (
        <Alert variant="warning" title="Métricas limitadas" className="mb-4">
          Aplica en Supabase las migraciones 016, 017 y 018 para habilitar
          time-to-hire, fuentes, carga de equipo y filtros avanzados.
        </Alert>
      )}
      <NotificationsBanner notifications={notifications} />
      <RoleDashboard
        userRole={userRole}
        metrics={metrics}
        recentJobs={recentJobs}
        pipelinePreview={pipelinePreview}
        scheduledInterviews={scheduledInterviews}
        notifications={notifications}
        filterOptions={filterOptions}
        decisionQueue={decisionQueue}
        rankedCandidates={rankedCandidates}
      />
    </>
  );
}
