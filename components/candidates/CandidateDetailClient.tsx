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
import { SlaBadge } from "@/components/ui/SlaBadge";
import { STAGE_SLA_LABELS } from "@/lib/constants/sla";
import {
  getPipelineAdjacentStage,
  isHiringManager,
  PIPELINE_STAGE_LABELS,
  type HiringManagerDecisionTarget,
  type PipelineStage,
  type UserRole,
} from "@/lib/constants/roles";
import { getCandidateScore } from "@/lib/utils/candidate-score";
import { HiringManagerDecisionCard } from "./HiringManagerDecisionCard";
import { FormModal } from "@/components/ui/FormModal";
import { PreOfferForm, type PreOfferData } from "./PreOfferForm";
import { PreOfferTrigger } from "./PreOfferTrigger";
import { ScheduleInterviewModal } from "@/components/pipeline/ScheduleInterviewModal";
import { CopyTrackingLink } from "@/components/track/CopyTrackingLink";
import { getCandidateTrackingUrl } from "@/lib/utils/candidate-tracking";
import { CvViewer } from "@/components/candidates/CvViewer";
import { RecruiterAssignmentHistory } from "@/components/candidates/RecruiterAssignmentHistory";
import { RecruiterReassignControl } from "@/components/candidates/RecruiterReassignControl";

export interface CandidateDetailData {
  id: string;
  full_name: string;
  email: string;
  public_tracking_token?: string | null;
  phone?: string | null;
  cv_storage_path?: string | null;
  assigned_recruiter_id?: string;
  job_id?: string;
  assigned_recruiter?: { id: string; full_name: string | null; avatar_url?: string | null } | { id: string; full_name: string | null; avatar_url?: string | null }[] | null;
  pipeline_stage: PipelineStage;
  stage_entered_at?: string | null;
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
  interviews?: Array<{
    id?: string;
    scheduled_at?: string | null;
    rating?: number | null;
    notes?: string | null;
    approved?: boolean | null;
    created_at?: string;
  }> | {
    id?: string;
    scheduled_at?: string | null;
    rating?: number | null;
    notes?: string | null;
    approved?: boolean | null;
    created_at?: string;
  } | null;
  candidate_offers?:
    | PreOfferData
    | PreOfferData[]
    | null;
}

function isRecentCandidate(createdAt?: string) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 10 * 60 * 1000;
}

export function CandidateDetailClient({
  candidate: initial,
  canManagePipeline = false,
  userRole = null,
}: {
  candidate: CandidateDetailData;
  canManagePipeline?: boolean;
  userRole?: UserRole | string | null;
}) {
  const router = useRouter();
  const [candidate, setCandidate] = useState(initial);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    stage: PipelineStage | null;
  }>({ open: false, stage: null });
  const [updating, setUpdating] = useState(false);
  const [preOfferOpen, setPreOfferOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<PipelineStage | null>(null);
  const [preOffer, setPreOffer] = useState<PreOfferData | null | undefined>(
    Array.isArray(initial.candidate_offers)
      ? initial.candidate_offers[0]
      : initial.candidate_offers
  );

  useEffect(() => {
    setCandidate(initial);
    setPreOffer(
      Array.isArray(initial.candidate_offers)
        ? initial.candidate_offers[0]
        : initial.candidate_offers
    );
  }, [initial]);

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

  async function updateStage(
    stage: PipelineStage,
    confirmed = false,
    feedback?: { rating: number; notes: string },
    scheduledAt?: string
  ) {
    setUpdating(true);
    const res = await fetch(`/api/candidates/${candidate.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, confirmed, feedback, scheduledAt }),
    });
    const data = await res.json();
    setUpdating(false);
    setModal({ open: false, stage: null });
    setScheduleOpen(false);
    setPendingStage(null);

    if (data.success) {
      setCandidate(data.data);
      router.refresh();
    } else {
      setError(data.error);
    }
  }

  function handleStageClick(stage: PipelineStage) {
    if (stage === "interview") {
      setPendingStage(stage);
      setScheduleOpen(true);
      return;
    }
    if (stage === "hired" || stage === "rejected") {
      setModal({ open: true, stage });
    } else {
      void updateStage(stage);
    }
  }

  async function handleHiringManagerDecision(
    target: HiringManagerDecisionTarget,
    feedback: { rating: number; notes: string },
    confirmed = false
  ) {
    await updateStage(target, confirmed || target === "rejected", feedback);
  }

  const showHiringManagerPanel = isHiringManager(userRole);
  const showPreOffer =
    canManagePipeline &&
    candidate.pipeline_stage === "interview_approved";
  const jobTitle = Array.isArray(candidate.jobs)
    ? candidate.jobs[0]?.title
    : candidate.jobs?.title;
  const jobId = candidate.job_id ?? "";
  const assignedRecruiter = Array.isArray(candidate.assigned_recruiter)
    ? candidate.assigned_recruiter[0]
    : candidate.assigned_recruiter;
  const latestInterview = Array.isArray(candidate.interviews)
    ? candidate.interviews[0]
    : candidate.interviews;
  const scheduledAt = latestInterview?.scheduled_at;

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
          {assignedRecruiter && (
            <p className="text-sm text-[var(--foreground-muted)] mt-1 flex items-center gap-2">
              Reclutador asignado:{" "}
              <span className="font-semibold inline-flex items-center gap-1.5">
                <Avatar
                  name={assignedRecruiter.full_name ?? "?"}
                  src={assignedRecruiter.avatar_url}
                  size="sm"
                />
                {assignedRecruiter.full_name}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant="info">
            {PIPELINE_STAGE_LABELS[candidate.pipeline_stage]}
          </Badge>
          <SlaBadge
            stage={candidate.pipeline_stage}
            stageEnteredAt={candidate.stage_entered_at}
          />
          <span className="text-[10px] text-[var(--foreground-muted)] text-right max-w-[140px]">
            SLA: {STAGE_SLA_LABELS[candidate.pipeline_stage]}
          </span>
        </div>
      </motion.div>

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {scheduledAt && (
        <Alert variant="info" className="mb-6" title="Entrevista programada">
          {new Date(scheduledAt).toLocaleString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Alert>
      )}

      {canManagePipeline && candidate.public_tracking_token && (
        <Card className="mb-6 border-[var(--accent)]/20 bg-[var(--accent-soft)]/30">
          <CardHeader>
            <CardTitle className="text-base">Enlace de seguimiento para el candidato</CardTitle>
            <p className="text-sm text-[var(--foreground-muted)]">
              Comparte este enlace para que consulte su etapa sin depender del correo.
            </p>
          </CardHeader>
          <CopyTrackingLink
            url={getCandidateTrackingUrl(candidate.public_tracking_token)}
            candidateName={candidate.full_name}
            jobTitle={jobTitle}
          />
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 items-start">
        <div className="min-w-0 space-y-4">
          <RecruiterAssignmentHistory candidateId={candidate.id} userRole={userRole} />

          {jobId && (
            <RecruiterReassignControl
              candidateId={candidate.id}
              jobId={jobId}
              currentRecruiterId={candidate.assigned_recruiter_id}
              userRole={userRole}
              onReassigned={() => router.refresh()}
            />
          )}
        </div>

        <div className="min-w-0">
          <CvViewer candidateId={candidate.id} />
        </div>
      </div>

      {showPreOffer && (
        <PreOfferTrigger
          offer={preOffer}
          onOpen={() => setPreOfferOpen(true)}
        />
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

      {showHiringManagerPanel ? (
        <HiringManagerDecisionCard
          currentStage={candidate.pipeline_stage}
          interview={candidate.interviews}
          onDecide={handleHiringManagerDecision}
          loading={updating}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mover etapa</CardTitle>
            <p className="text-sm text-[var(--foreground-muted)]">
              Avanza o retrocede un paso a la vez en el proceso.
            </p>
          </CardHeader>
          {canManagePipeline ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Etapa actual:{" "}
                <span className="text-[var(--accent)]">
                  {PIPELINE_STAGE_LABELS[candidate.pipeline_stage]}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const prev = getPipelineAdjacentStage(
                      candidate.pipeline_stage,
                      "prev"
                    );
                    if (prev) handleStageClick(prev);
                  }}
                  disabled={
                    !getPipelineAdjacentStage(candidate.pipeline_stage, "prev") ||
                    updating
                  }
                >
                  ← Retroceder
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const next = getPipelineAdjacentStage(
                      candidate.pipeline_stage,
                      "next"
                    );
                    if (next) handleStageClick(next);
                  }}
                  disabled={
                    !getPipelineAdjacentStage(candidate.pipeline_stage, "next") ||
                    updating
                  }
                >
                  Avanzar →
                </Button>
                {candidate.pipeline_stage !== "rejected" &&
                  candidate.pipeline_stage !== "hired" && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStageClick("rejected")}
                      disabled={updating}
                    >
                      Descartar candidato
                    </Button>
                  )}
              </div>
            </div>
          ) : (
            <Alert variant="info">
              Tu rol tiene acceso de solo lectura en el pipeline general.
            </Alert>
          )}
        </Card>
      )}


      <FormModal
        open={preOfferOpen}
        onClose={() => setPreOfferOpen(false)}
        title="Formulario de contratación"
        description="Fit cultural, referencias y propuesta económica antes de contratar."
      >
        <PreOfferForm
          candidateId={candidate.id}
          initialOffer={preOffer}
          variant="plain"
          onSaved={(offer) => setPreOffer(offer)}
        />
      </FormModal>

      <ScheduleInterviewModal
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          setPendingStage(null);
        }}
        candidateName={candidate.full_name}
        loading={updating}
        onConfirm={(scheduledAt) => {
          if (pendingStage === "interview") {
            void updateStage("interview", false, undefined, scheduledAt);
          }
        }}
      />

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
