"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PIPELINE_STAGE_LABELS } from "@/lib/constants/roles";
import type {
  DecisionQueueCandidate,
  RankedCandidate,
} from "@/lib/data/dashboard";

function jobTitle(
  jobs: DecisionQueueCandidate["jobs"]
): string {
  if (!jobs) return "Vacante";
  return Array.isArray(jobs) ? jobs[0]?.title ?? "Vacante" : jobs.title;
}

function daysInStage(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86_400_000
  );
  return `${days}d`;
}

export function HmDecisionQueue({
  decisionQueue,
  rankedCandidates,
}: {
  decisionQueue: DecisionQueueCandidate[];
  rankedCandidates: RankedCandidate[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
    >
      <Card className="border-2 border-[var(--accent)]/30">
        <CardHeader>
          <CardTitle>Cola de decisión — entrevistas pendientes</CardTitle>
        </CardHeader>
        {decisionQueue.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            No hay candidatos esperando tu decisión.
          </p>
        ) : (
          <ul className="space-y-2">
            {decisionQueue.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/candidates/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={c.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.full_name}</p>
                      <p className="text-xs text-[var(--foreground-muted)] truncate">
                        {jobTitle(c.jobs)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">
                    {daysInStage(c.stage_entered_at)} en etapa
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking por fit score</CardTitle>
        </CardHeader>
        {rankedCandidates.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            Aún no hay candidatos con puntuación de encaje.
          </p>
        ) : (
          <ul className="space-y-2">
            {rankedCandidates.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/candidates/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-[var(--foreground-muted)] w-5">
                      #{i + 1}
                    </span>
                    <Avatar name={c.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.full_name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {PIPELINE_STAGE_LABELS[c.pipeline_stage]}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">
                    {c.fit_score != null ? `${Math.round(c.fit_score)}%` : "—"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}
