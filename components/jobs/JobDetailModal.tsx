"use client";

import Link from "next/link";
import { FormModal } from "@/components/ui/FormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormattedRequirements } from "@/components/jobs/FormattedRequirements";
import type { JobCardData } from "@/components/jobs/JobCard";

const STATUS_LABELS: Record<string, string> = {
  open: "Abierta",
  draft: "Borrador",
  closed: "Cerrada",
};

export function JobDetailModal({
  open,
  onClose,
  job,
  canAssignRecruiters,
  canManageJobs,
  canDeleteJobs,
  onAssignRecruiters,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  job: JobCardData;
  canAssignRecruiters: boolean;
  canManageJobs: boolean;
  canDeleteJobs: boolean;
  onAssignRecruiters: () => void;
  onDelete: () => void;
}) {
  const createdLabel = new Date(job.created_at).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={job.title}
      description={`Vacante ${STATUS_LABELS[job.status] ?? job.status} · Creada el ${createdLabel}`}
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={job.status === "open" ? "success" : "default"}>
            {STATUS_LABELS[job.status] ?? job.status}
          </Badge>
          {job.status === "open" && (
            <a
              href={`/candidatos?jobId=${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Ver en portal de candidatos ↗
            </a>
          )}
        </div>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)] mb-2">
            Descripción
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--foreground)]">
            {job.description}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)] mb-2">
            Requisitos técnicos
          </h3>
          <FormattedRequirements
            raw={job.requirements}
            formatted={job.requirements_formatted}
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
          <div className="flex flex-wrap gap-2">
            {canAssignRecruiters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onAssignRecruiters();
                }}
              >
                Asignar reclutadores
              </Button>
            )}
            <Link href={`/candidates?jobId=${job.id}`} onClick={onClose}>
              <Button variant="secondary" size="sm">
                Ver candidatos
              </Button>
            </Link>
            {canManageJobs && (
              <Link href={`/upload?jobId=${job.id}`} onClick={onClose}>
                <Button size="sm">Subir CV</Button>
              </Link>
            )}
            <Link href={`/pipeline?jobId=${job.id}`} onClick={onClose}>
              <Button variant="secondary" size="sm">
                Pipeline
              </Button>
            </Link>
          </div>
          {canDeleteJobs && (
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 ml-auto"
              onClick={() => {
                onClose();
                onDelete();
              }}
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </FormModal>
  );
}
