"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import {
  HM_DECISION_LABELS,
  HM_DECISION_TARGETS,
  PIPELINE_STAGE_LABELS,
  type HiringManagerDecisionTarget,
  type PipelineStage,
} from "@/lib/constants/roles";

interface InterviewRecord {
  rating?: number | null;
  notes?: string | null;
  created_at?: string;
}

export function HiringManagerDecisionCard({
  currentStage,
  interview,
  onDecide,
  loading = false,
}: {
  currentStage: PipelineStage;
  interview?: InterviewRecord | InterviewRecord[] | null;
  onDecide: (
    target: HiringManagerDecisionTarget,
    feedback: { rating: number; notes: string },
    confirmed?: boolean
  ) => Promise<void>;
  loading?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pendingReject, setPendingReject] = useState(false);

  const latestInterview = Array.isArray(interview) ? interview[0] : interview;

  if (currentStage !== "interview") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Decisión post-entrevista</CardTitle>
        </CardHeader>
        <Alert variant="info">
          Como Hiring Manager puedes decidir cuando el candidato esté en etapa{" "}
          <strong>{PIPELINE_STAGE_LABELS.interview}</strong>. Etapa actual:{" "}
          <strong>{PIPELINE_STAGE_LABELS[currentStage]}</strong>.
        </Alert>
        {latestInterview?.notes && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/40 p-4 text-sm">
            <p className="font-semibold mb-1">Último feedback registrado</p>
            {latestInterview.rating != null && (
              <p className="text-[var(--foreground-muted)]">
                Calificación: {latestInterview.rating}/5
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap">{latestInterview.notes}</p>
          </div>
        )}
      </Card>
    );
  }

  async function submitDecision(
    target: HiringManagerDecisionTarget,
    confirmed = false
  ) {
    setError("");
    if (rating < 1 || rating > 5) {
      setError("Selecciona una calificación del 1 al 5.");
      return;
    }
    if (notes.trim().length < 10) {
      setError("Escribe notas de evaluación (mínimo 10 caracteres).");
      return;
    }
    await onDecide(target, { rating, notes: notes.trim() }, confirmed);
    setPendingReject(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluación post-entrevista</CardTitle>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Califica al candidato y registra tus notas antes de avanzar o descartar.
        </p>
      </CardHeader>

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[var(--foreground-muted)] mb-2">
            Calificación
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`h-10 w-10 rounded-xl border text-sm font-bold transition-colors ${
                  rating >= value
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--accent)]/40"
                }`}
                aria-label={`Calificar ${value} de 5`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="hm-notes"
            className="text-sm font-medium text-[var(--foreground-muted)]"
          >
            Notas de evaluación
          </label>
          <textarea
            id="hm-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Resume fortalezas, debilidades y recomendación tras la entrevista..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {HM_DECISION_TARGETS.filter((t) => t !== "rejected").map((target) => (
            <Button
              key={target}
              size="sm"
              variant="primary"
              loading={loading}
              onClick={() => submitDecision(target)}
            >
              {HM_DECISION_LABELS[target]}
            </Button>
          ))}
          <Button
            size="sm"
            variant="danger"
            loading={loading}
            onClick={() => setPendingReject(true)}
          >
            {HM_DECISION_LABELS.rejected}
          </Button>
        </div>
      </div>

      <Modal
        open={pendingReject}
        onClose={() => setPendingReject(false)}
        title="Confirmar descarte"
        variant="danger"
        confirmLabel="Descartar candidato"
        onConfirm={() => submitDecision("rejected", true)}
        loading={loading}
      >
        ¿Confirmas mover a <strong>{PIPELINE_STAGE_LABELS.rejected}</strong> con
        la calificación y notas ingresadas?
      </Modal>
    </Card>
  );
}
