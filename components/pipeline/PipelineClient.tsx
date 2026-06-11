"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { SlaBadge } from "@/components/ui/SlaBadge";
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from "@/lib/constants/roles";
import type { PipelineCandidate } from "@/lib/data/candidates";

interface JobOption {
  id: string;
  title: string;
  status: string;
}

const selectClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";

function getJobTitle(
  jobs?: PipelineCandidate["jobs"]
): string | undefined {
  if (!jobs) return undefined;
  return Array.isArray(jobs) ? jobs[0]?.title : jobs.title;
}

function getScoreData(scores?: PipelineCandidate["scores"]) {
  if (!scores) return {};
  const s = Array.isArray(scores) ? scores[0] : scores;
  return { fitScore: s?.fit_score, classification: s?.classification };
}

export function PipelineClient({
  initialCandidates,
  initialJobs,
  initialJobId,
  initialStage,
  initialSemantic,
  canManagePipeline = false,
  isHiringManager = false,
}: {
  initialCandidates: PipelineCandidate[];
  initialJobs: JobOption[];
  initialJobId?: string;
  initialStage?: PipelineStage;
  initialSemantic: boolean;
  canManagePipeline?: boolean;
  isHiringManager?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modal, setModal] = useState<{
    open: boolean;
    candidateId: string;
    stage: PipelineStage | null;
  }>({ open: false, candidateId: "", stage: null });
  const [updating, setUpdating] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    setFilterLoading(false);
  }, [initialJobId, initialStage, initialSemantic, initialCandidates]);

  const semanticActive = initialSemantic && Boolean(initialJobId);

  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    if (semanticActive) {
      initialCandidates.forEach((c, i) => map.set(c.id, i + 1));
    }
    return map;
  }, [initialCandidates, semanticActive]);

  function updateFilters(updates: {
    jobId?: string;
    stage?: string;
    semantic?: boolean;
  }) {
    setFilterLoading(true);
    const params = new URLSearchParams(searchParams.toString());

    if (updates.jobId !== undefined) {
      if (updates.jobId) params.set("jobId", updates.jobId);
      else params.delete("jobId");
      if (!updates.jobId) params.delete("semantic");
    }

    if (updates.stage !== undefined) {
      if (updates.stage) params.set("stage", updates.stage);
      else params.delete("stage");
    }

    if (updates.semantic !== undefined) {
      if (updates.semantic) params.set("semantic", "true");
      else params.delete("semantic");
    }

    router.push(`/pipeline?${params.toString()}`);
  }

  async function moveCandidate(
    candidateId: string,
    stage: PipelineStage,
    confirmed = false
  ) {
    setUpdating(true);
    await fetch(`/api/candidates/${candidateId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, confirmed }),
    });
    setUpdating(false);
    setModal({ open: false, candidateId: "", stage: null });
    router.refresh();
  }

  function handleMove(candidateId: string, stage: PipelineStage) {
    if (stage === "hired" || stage === "rejected") {
      setModal({ open: true, candidateId, stage });
    } else {
      moveCandidate(candidateId, stage);
    }
  }

  const columns: PipelineStage[] = initialStage
    ? [initialStage]
    : PIPELINE_STAGES.filter((s) => s !== "rejected");

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Gestiona candidatos entre etapas del proceso"
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--foreground-muted)]">
            Vacante
          </label>
          <select
            className={selectClass}
            value={initialJobId ?? ""}
            onChange={(e) => {
              updateFilters({ jobId: e.target.value });
            }}
            disabled={filterLoading}
          >
            <option value="">Todas las vacantes</option>
            {initialJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--foreground-muted)]">
            Etapa
          </label>
          <select
            className={selectClass}
            value={initialStage ?? ""}
            onChange={(e) => {
              updateFilters({ stage: e.target.value });
            }}
            disabled={filterLoading}
          >
            <option value="">Todas las etapas</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 justify-end">
          <Button
            variant={semanticActive ? "primary" : "secondary"}
            size="sm"
            disabled={!initialJobId || filterLoading}
            onClick={() => updateFilters({ semantic: !semanticActive })}
            title={
              !initialJobId
                ? "Selecciona una vacante para activar ranking IA"
                : undefined
            }
          >
            {semanticActive ? "✨ Ranking IA activo" : "Activar ranking IA"}
          </Button>
        </div>
      </div>

      {semanticActive && (
        <Alert variant="info" className="mb-4">
          Candidatos ordenados por afinidad semántica con la vacante seleccionada.
        </Alert>
      )}

      {isHiringManager && (
        <Alert variant="info" className="mb-4">
          Como Hiring Manager puedes evaluar candidatos en etapa Entrevista desde su perfil:
          calificar, dejar notas y decidir si descartar o aprobar la entrevista técnica.
        </Alert>
      )}

      {initialCandidates.length === 0 ? (
        <Alert variant="info" title="Sin candidatos">
          No hay candidatos con los filtros actuales. Prueba ampliar la búsqueda.
        </Alert>
      ) : (
        <div
          className={`flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible ${
            columns.length === 1
              ? "md:grid md:grid-cols-1 max-w-xl"
              : "md:grid md:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {columns.map((stage, colIdx) => {
            const items = initialCandidates.filter(
              (c) => c.pipeline_stage === stage
            );
            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIdx * 0.08 }}
                className="min-w-[260px] md:min-w-0 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm">
                    {PIPELINE_STAGE_LABELS[stage]}
                  </h3>
                  <Badge variant="info">{items.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {items.map((c) => {
                    const { fitScore, classification } = getScoreData(
                      c.scores
                    );
                    const affinity = c.similarity_pct ?? fitScore;
                    const jobTitle = getJobTitle(c.jobs);
                    const rank = rankMap.get(c.id);

                    return (
                      <Card
                        key={c.id}
                        className="!p-3 !shadow-none border-[var(--border)]"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {rank != null && (
                            <span className="text-xs font-extrabold gradient-text shrink-0">
                              #{rank}
                            </span>
                          )}
                          <Avatar name={c.full_name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/candidates/${c.id}`}
                              className="font-semibold text-sm hover:text-[var(--accent)] truncate block"
                            >
                              {c.full_name}
                            </Link>
                            {!initialJobId && jobTitle && (
                              <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                                {jobTitle}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              <SlaBadge
                                stage={c.pipeline_stage}
                                stageEnteredAt={c.stage_entered_at}
                                className="!text-[9px]"
                              />
                              {affinity != null && (
                                <span className="text-[10px] font-bold text-[var(--accent)]">
                                  {affinity}% afinidad
                                </span>
                              )}
                              {classification && (
                                <Badge variant="info" className="!text-[9px]">
                                  {classification}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManagePipeline && (
                          <div className="flex flex-wrap gap-1">
                            {PIPELINE_STAGES.filter((s) => s !== stage).map(
                              (target) => (
                                <button
                                  key={target}
                                  onClick={() => handleMove(c.id, target)}
                                  className="text-[10px] px-2 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] hover:gradient-brand hover:text-white transition-all font-semibold"
                                >
                                  → {PIPELINE_STAGE_LABELS[target]}
                                </button>
                              )
                            )}
                          </div>
                        )}
                        {isHiringManager && stage === "interview" && (
                          <Link
                            href={`/candidates/${c.id}`}
                            className="inline-block mt-1 text-[10px] font-semibold text-[var(--accent)] hover:underline"
                          >
                            Evaluar post-entrevista →
                          </Link>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, candidateId: "", stage: null })}
        title="Confirmar acción crítica"
        variant="danger"
        confirmLabel="Confirmar"
        onConfirm={() =>
          modal.stage &&
          moveCandidate(modal.candidateId, modal.stage, true)
        }
        loading={updating}
      >
        ¿Confirmas el cambio a{" "}
        <strong>
          {modal.stage ? PIPELINE_STAGE_LABELS[modal.stage] : ""}
        </strong>
        ?
      </Modal>
    </div>
  );
}
