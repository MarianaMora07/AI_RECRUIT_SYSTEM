"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/constants/roles";
import type { DashboardMetrics } from "@/lib/data/metrics";
import type {
  PipelinePreviewCandidate,
  RecentJob,
} from "@/lib/data/dashboard";

const PREVIEW_STAGES = PIPELINE_STAGES.filter((s) => s !== "rejected");

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

export function DashboardView({
  metrics,
  recentJobs,
  pipelinePreview,
}: {
  metrics: DashboardMetrics;
  recentJobs: RecentJob[];
  pipelinePreview: Record<string, PipelinePreviewCandidate[]>;
}) {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de tu proceso de reclutamiento"
        action={
          <Link href="/upload">
            <Button size="sm">+ Subir CV</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          label="Vacantes totales"
          value={metrics.totalJobs}
          icon="💼"
          accent="navy"
          delay={0}
        />
        <StatCard
          label="Vacantes abiertas"
          value={metrics.openJobs}
          icon="🟢"
          accent="coral"
          delay={0.05}
        />
        <StatCard
          label="Candidatos"
          value={metrics.totalCandidates}
          icon="👥"
          accent="gold"
          delay={0.1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Vista previa del pipeline</CardTitle>
              <Link
                href="/pipeline"
                className="text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                Ver completo
              </Link>
            </CardHeader>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {PREVIEW_STAGES.map((stage) => {
                const items = pipelinePreview[stage] ?? [];
                const total = metrics.stageCounts[stage] ?? 0;
                return (
                  <div
                    key={stage}
                    className="min-w-[140px] flex-1 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold">
                        {PIPELINE_STAGE_LABELS[stage]}
                      </p>
                      <Badge variant="info">{total}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {items.length === 0 ? (
                        <p className="text-[10px] text-[var(--foreground-muted)]">
                          Sin candidatos
                        </p>
                      ) : (
                        items.map((c) => (
                          <Link
                            key={c.id}
                            href={`/candidates/${c.id}`}
                            className="flex items-center gap-1.5 hover:opacity-80"
                          >
                            <Avatar name={c.full_name} size="sm" />
                            <span className="text-[11px] font-medium truncate">
                              {c.full_name}
                            </span>
                          </Link>
                        ))
                      )}
                      {total > items.length && (
                        <Link
                          href={`/pipeline?stage=${stage}`}
                          className="text-[10px] text-[var(--accent)] font-semibold"
                        >
                          +{total - items.length} más
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Candidatos por etapa</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {Object.entries(PIPELINE_STAGE_LABELS).map(([key, label], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link
                  href={`/pipeline?stage=${key}`}
                  className="block rounded-xl bg-gradient-to-br from-[var(--surface-hover)] to-[var(--surface)] border border-[var(--border)] p-4 text-center hover:shadow-md transition-shadow"
                >
                  <p className="text-2xl md:text-3xl font-extrabold gradient-text">
                    {metrics.stageCounts[key] ?? 0}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1 font-medium">
                    {label}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/jobs" className="card-elevated p-5 block">
          <span className="text-2xl">💼</span>
          <p className="font-bold mt-2">Gestionar vacantes</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Crear y administrar posiciones
          </p>
        </Link>
        <Link href="/pipeline" className="card-elevated p-5 block">
          <span className="text-2xl">🔄</span>
          <p className="font-bold mt-2">Ver pipeline</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Mover candidatos entre etapas
          </p>
        </Link>
      </div>
    </div>
  );
}
