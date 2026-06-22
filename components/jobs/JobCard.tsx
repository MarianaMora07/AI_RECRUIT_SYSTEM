"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { JobRecruitersModal } from "@/components/jobs/JobRecruitersModal";
import { DeleteJobModal } from "@/components/jobs/DeleteJobModal";

export interface JobCardData {
  id: string;
  title: string;
  description: string;
  requirements: string;
  requirements_formatted?: string | null;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierta",
  draft: "Borrador",
  closed: "Cerrada",
};

export function JobCard({
  job,
  highlighted,
  canAssignRecruiters = false,
  canManageJobs = true,
  canDeleteJobs = false,
}: {
  job: JobCardData;
  highlighted?: boolean;
  canAssignRecruiters?: boolean;
  canManageJobs?: boolean;
  canDeleteJobs?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [recruitersOpen, setRecruitersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setDetailOpen(true);
    }
  }, [highlighted]);

  function openDetail() {
    setDetailOpen(true);
  }

  return (
    <>
      <div ref={cardRef} className="h-full min-h-[220px]">
        <Card
          className={`card-elevated h-full min-h-[220px] flex flex-col transition-shadow duration-200 hover:shadow-lg ${
            highlighted ? "ring-2 ring-[var(--accent)]/40" : ""
          }`}
        >
          <button
            type="button"
            onClick={openDetail}
            className="flex flex-1 flex-col text-left p-4 md:p-5 cursor-pointer min-h-0 w-full"
          >
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-3">
                  {job.description}
                </p>
              </div>
              <Badge variant={job.status === "open" ? "success" : "default"}>
                {STATUS_LABELS[job.status] ?? job.status}
              </Badge>
            </div>
            <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
              Clic para ver detalle completo →
            </p>
          </button>

          <div
            className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 md:px-5 md:pb-5 pt-0 w-full border-t border-[var(--border)] mt-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap gap-2 pt-3">
              {canAssignRecruiters && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRecruitersOpen(true)}
                >
                  Asignar reclutadores
                </Button>
              )}
              <Link href={`/candidates?jobId=${job.id}`}>
                <Button variant="secondary" size="sm">
                  Ver candidatos
                </Button>
              </Link>
              {canManageJobs && (
                <Link href={`/upload?jobId=${job.id}`}>
                  <Button size="sm">Subir CV</Button>
                </Link>
              )}
            </div>
            {canDeleteJobs && (
              <Button
                variant="danger"
                size="sm"
                className="shrink-0 ml-auto mt-3"
                onClick={() => setDeleteOpen(true)}
              >
                Eliminar
              </Button>
            )}
          </div>
        </Card>
      </div>

      <JobDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        job={job}
        canAssignRecruiters={canAssignRecruiters}
        canManageJobs={canManageJobs}
        canDeleteJobs={canDeleteJobs}
        onAssignRecruiters={() => setRecruitersOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {canAssignRecruiters && (
        <JobRecruitersModal
          open={recruitersOpen}
          onClose={() => setRecruitersOpen(false)}
          jobId={job.id}
          jobTitle={job.title}
          jobStatus={job.status}
        />
      )}

      {canDeleteJobs && (
        <DeleteJobModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}
    </>
  );
}
