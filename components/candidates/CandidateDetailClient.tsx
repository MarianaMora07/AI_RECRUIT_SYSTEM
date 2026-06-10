"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/lib/constants/roles";
import { getCandidateScore } from "@/lib/utils/candidate-score";

export interface CandidateDetailData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  pipeline_stage: PipelineStage;
  created_at?: string;
  scores?: Array<{
    summary?: string;
    classification?: string;
    suggestions?: string;
    risk_level?: string;
    fit_score?: number;
    skills?: {
      experienceYears?: number | null;
      matched?: string[];
      missing?: string[];
    };
  }>;
  jobs?: { title: string; requirements: string } | { title: string; requirements: string }[];
}

function isRecentCandidate(createdAt?: string) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 10 * 60 * 1000;
}

export function CandidateDetailClient({
  candidate: initial,
}: {
  candidate: CandidateDetailData;
}) {
  const router = useRouter();
  const [candidate, setCandidate] = useState(initial);

  useEffect(() => {
    setCandidate(initial);
  }, [initial]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    stage: PipelineStage | null;
  }>({ open: false, stage: null });
  const [updating, setUpdating] = useState(false);

  const score = getCandidateScore(candidate.scores);
  const showAiPending = !score && isRecentCandidate(candidate.created_at);

  async function runAnalysis() {
    setRefreshing(true);
    setError("");
    try {
      const analyzeRes = await fetch(`/api/candidates/${candidate.id}/analyze`, {
        method: "POST",
      });
      const analyzeData = await analyzeRes.json();
      if (analyzeData.success) {
        setCandidate(analyzeData.data);
      } else {
        setError(analyzeData.error ?? "No se pudo analizar el CV");
      }
    } catch {
      setError("Error de conexión al analizar");
    } finally {
      setRefreshing(false);
    }
  }

  async function updateStage(stage: PipelineStage, confirmed = false) {
    setUpdating(true);
    const res = await fetch(`/api/candidates/${candidate.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, confirmed }),
    });
    const data = await res.json();
    setUpdating(false);
    setModal({ open: false, stage: null });

    if (data.success) {
      setCandidate(data.data);
      router.refresh();
    } else {
      setError(data.error);
    }
  }

  function handleStageClick(stage: PipelineStage) {
    if (stage === "hired" || stage === "rejected") {
      setModal({ open: true, stage });
    } else {
      updateStage(stage);
    }
  }

  const jobTitle = Array.isArray(candidate.jobs)
    ? candidate.jobs[0]?.title
    : candidate.jobs?.title;

  return (
    <div>
      <Link
        href="/candidates"
        className="text-sm text-[var(--accent)] hover:underline mb-4 inline-block font-semibold"
      >
        ← Volver a candidatos
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start gap-4 mb-6"
      >
        <Avatar name={candidate.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <PageHeader title={candidate.full_name} subtitle={candidate.email} />
          {jobTitle && (
            <p className="text-sm text-[var(--foreground-muted)] -mt-4">
              Vacante: <span className="font-semibold">{jobTitle}</span>
            </p>
          )}
        </div>
        <Badge variant="info" className="shrink-0">
          {PIPELINE_STAGE_LABELS[candidate.pipeline_stage]}
        </Badge>
      </motion.div>

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {showAiPending && (
        <Alert variant="info" className="mb-6" title="Análisis IA en proceso">
          <p className="mb-3">
            El CV se registró correctamente. Pulsa el botón para ejecutar o
            comprobar el análisis (puede tardar 15–30 segundos).
          </p>
          <Button size="sm" variant="secondary" onClick={runAnalysis} loading={refreshing}>
            Ejecutar análisis
          </Button>
        </Alert>
      )}

      {!score && !showAiPending && (
        <Alert variant="info" className="mb-6" title="Sin análisis IA">
          No hay evaluación disponible para este candidato.
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={runAnalysis}
            loading={refreshing}
          >
            Analizar con IA
          </Button>
        </Alert>
      )}

      {score && (
        <>
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={runAnalysis}
              loading={refreshing}
            >
              Re-analizar CV
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Resumen IA</CardTitle>
              </CardHeader>
              <p className="text-sm leading-relaxed">{score.summary}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="info">{score.classification}</Badge>
                {score.skills?.experienceYears != null && (
                  <Badge variant="default">
                    {score.skills.experienceYears} años exp.
                  </Badge>
                )}
                <Badge
                  variant={
                    score.risk_level === "high"
                      ? "danger"
                      : score.risk_level === "medium"
                        ? "warning"
                        : "success"
                  }
                >
                  Riesgo: {score.risk_level}
                </Badge>
                {score.fit_score != null && (
                  <Badge variant="default">{score.fit_score}% encaje</Badge>
                )}
              </div>
            </Card>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Sugerencia</CardTitle>
              </CardHeader>
              <p className="text-sm leading-relaxed">{score.suggestions}</p>
            </Card>
          </div>

          {(score.skills?.matched?.length || score.skills?.missing?.length) ? (
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
              {score.skills?.matched && score.skills.matched.length > 0 && (
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Skills que coinciden</CardTitle>
                  </CardHeader>
                  <div className="flex flex-wrap gap-2">
                    {score.skills.matched.map((skill) => (
                      <Badge key={skill} variant="success">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
              {score.skills?.missing && score.skills.missing.length > 0 && (
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Brechas vs vacante</CardTitle>
                  </CardHeader>
                  <div className="flex flex-wrap gap-2">
                    {score.skills.missing.map((skill) => (
                      <Badge key={skill} variant="warning">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mover etapa</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PIPELINE_STAGE_LABELS) as PipelineStage[]).map((stage) => (
            <Button
              key={stage}
              size="sm"
              variant={candidate.pipeline_stage === stage ? "primary" : "secondary"}
              onClick={() => handleStageClick(stage)}
              disabled={candidate.pipeline_stage === stage || updating}
            >
              {PIPELINE_STAGE_LABELS[stage]}
            </Button>
          ))}
        </div>
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, stage: null })}
        title="Confirmar acción crítica"
        variant="danger"
        confirmLabel="Confirmar"
        onConfirm={() => modal.stage && updateStage(modal.stage, true)}
        loading={updating}
      >
        ¿Estás seguro de mover a{" "}
        <strong>
          {modal.stage ? PIPELINE_STAGE_LABELS[modal.stage] : ""}
        </strong>
        ?
      </Modal>
    </div>
  );
}
