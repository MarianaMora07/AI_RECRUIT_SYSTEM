import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardFiltersFallback } from "@/components/dashboard/DashboardFiltersFallback";
import { DashboardHeaderActions } from "@/components/dashboard/DashboardHeaderActions";
import { HmDecisionQueue } from "@/components/dashboard/HmDecisionQueue";
import { InterviewCalendar } from "@/components/dashboard/InterviewCalendar";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { SourceChart } from "@/components/dashboard/SourceChart";
import { TeamWorkload } from "@/components/dashboard/TeamWorkload";
import {
  canSeeSourceChart,
  getDashboardSubtitle,
} from "@/lib/constants/dashboard";
import { isHiringManager, type UserRole } from "@/lib/constants/roles";
import type {
  DecisionQueueCandidate,
  FilterOptionJob,
  FilterOptionRecruiter,
  PipelinePreviewCandidate,
  RankedCandidate,
  RecentJob,
} from "@/lib/data/dashboard";
import type { DashboardAnalytics } from "@/lib/data/metrics";
import type { AppNotification } from "@/lib/data/notifications";
import type { ScheduledInterview } from "@/lib/data/interviews";

function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

export function RoleDashboard({
  userRole,
  metrics,
  recentJobs,
  pipelinePreview,
  scheduledInterviews,
  notifications,
  filterOptions,
  decisionQueue = [],
  rankedCandidates = [],
}: {
  userRole: UserRole;
  metrics: DashboardAnalytics;
  recentJobs: RecentJob[];
  pipelinePreview: Record<string, PipelinePreviewCandidate[]>;
  scheduledInterviews: ScheduledInterview[];
  notifications: AppNotification[];
  filterOptions: {
    jobs: FilterOptionJob[];
    recruiters: FilterOptionRecruiter[];
    departments: string[];
    locations: string[];
  };
  decisionQueue?: DecisionQueueCandidate[];
  rankedCandidates?: RankedCandidate[];
}) {
  const teamRows = metrics.teamWorkload ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={getDashboardSubtitle(userRole)}
        action={<DashboardHeaderActions userRole={userRole} />}
      />

      <Suspense fallback={<DashboardFiltersFallback />}>
        <DashboardFilters
          userRole={userRole}
          jobs={filterOptions.jobs}
          recruiters={filterOptions.recruiters}
          departments={filterOptions.departments}
          locations={filterOptions.locations}
        />
      </Suspense>

      {isHiringManager(userRole) && (
        <HmDecisionQueue
          decisionQueue={decisionQueue}
          rankedCandidates={rankedCandidates}
        />
      )}

      <section aria-label="Métricas clave">
        <KpiStrip metrics={metrics} userRole={userRole} />
      </section>

      <section aria-label="Embudo de reclutamiento">
        <PipelineFunnel
          metrics={metrics}
          pipelinePreview={pipelinePreview}
          userRole={userRole}
        />
      </section>

      {canSeeSourceChart(userRole) && (
        <section aria-label="Fuentes de reclutamiento">
          <SourceChart sourceCounts={metrics.sourceCounts ?? {}} />
        </section>
      )}

      <section aria-label="Equipo y actividad" className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {teamRows.length > 0 && (
            <TeamWorkload
              rows={teamRows}
              userRole={userRole}
              jobsWithoutRecruiters={metrics.jobsWithoutRecruiters ?? 0}
            />
          )}
          <ActionQueue notifications={notifications} />
        </div>
        <InterviewCalendar interviews={scheduledInterviews} />
      </section>

      <div className="mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Vacantes recientes</CardTitle>
            <Link
              href="/jobs"
              className="text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              Aún no hay vacantes creadas.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs?selected=${job.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{job.title}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {formatRelativeDate(job.created_at)}
                        {job.department && <> · {job.department}</>}
                        {metrics.applicantsPerJob[job.id] != null && (
                          <>
                            {" "}
                            · {metrics.applicantsPerJob[job.id]} candidato
                            {metrics.applicantsPerJob[job.id] !== 1 ? "s" : ""}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={job.status === "open" ? "success" : "default"}
                    >
                      {job.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
