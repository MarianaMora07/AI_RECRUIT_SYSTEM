"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  FUNNEL_STAGE_LABELS,
  getFunnelStagesForRole,
} from "@/lib/constants/dashboard";
import type { PipelineStage, UserRole } from "@/lib/constants/roles";
import type { DashboardAnalytics } from "@/lib/data/metrics";
import type { PipelinePreviewCandidate } from "@/lib/data/dashboard";

function ConversionBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--foreground-muted)]">{label}</span>
      <span className="font-bold text-[var(--accent)]">{value}%</span>
    </div>
  );
}

export function PipelineFunnel({
  metrics,
  pipelinePreview,
  userRole,
}: {
  metrics: DashboardAnalytics;
  pipelinePreview: Record<string, PipelinePreviewCandidate[]>;
  userRole: UserRole;
}) {
  const stages = getFunnelStagesForRole(userRole);
  const maxCount = Math.max(
    1,
    ...stages.map((s) => metrics.stageCounts[s] ?? 0)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Embudo de reclutamiento</CardTitle>
            <Link
              href="/pipeline"
              className="text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Ver Kanban
            </Link>
          </CardHeader>

          <div className="space-y-3">
            {stages.map((stage) => {
              const count = metrics.stageCounts[stage] ?? 0;
              const widthPct = Math.max(8, (count / maxCount) * 100);
              return (
                <Link
                  key={stage}
                  href={`/pipeline?stage=${stage}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">
                      {FUNNEL_STAGE_LABELS[stage as PipelineStage]}
                    </span>
                    <Badge variant="info">{count}</Badge>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#ff8f75] transition-all group-hover:opacity-90"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
            <p className="text-xs font-bold uppercase text-[var(--foreground-muted)]">
              Tasas de conversión
            </p>
            <ConversionBar
              label="Postulados → Cribado"
              value={metrics.conversionRates.appliedToEvaluation}
            />
            <ConversionBar
              label="Cribado → Entrevista"
              value={metrics.conversionRates.evaluationToInterview}
            />
            <ConversionBar
              label="Entrevista → Aprobados"
              value={metrics.conversionRates.interviewToApproved}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Vista previa del pipeline</CardTitle>
          </CardHeader>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {stages.map((stage) => {
              const items = pipelinePreview[stage] ?? [];
              const total = metrics.stageCounts[stage] ?? 0;
              return (
                <div
                  key={stage}
                  className="min-w-[140px] flex-1 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold">
                      {FUNNEL_STAGE_LABELS[stage as PipelineStage]}
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
  );
}
