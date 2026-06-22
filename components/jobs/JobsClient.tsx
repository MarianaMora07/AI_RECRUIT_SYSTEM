"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { CreateJobWizard } from "@/components/jobs/CreateJobWizard";
import {
  canAssignJobRecruiters,
  canDeleteJobs,
  canManageJobs,
  type UserRole,
} from "@/lib/constants/roles";

export function JobsClient({
  initialJobs,
  highlightJobId,
  userRole = null,
}: {
  initialJobs: JobCardData[];
  highlightJobId?: string;
  userRole?: UserRole | string | null;
}) {
  const router = useRouter();
  const canAssign = canAssignJobRecruiters(userRole);
  const canDelete = canDeleteJobs(userRole);
  const canCreate = canManageJobs(userRole);
  const [showWizard, setShowWizard] = useState(false);
  const [success, setSuccess] = useState("");

  return (
    <div>
      <PageHeader
        title="Vacantes"
        subtitle={`${initialJobs.length} posición${initialJobs.length !== 1 ? "es" : ""} registrada${initialJobs.length !== 1 ? "s" : ""}`}
        action={
          canCreate ? (
            <Button onClick={() => setShowWizard(!showWizard)}>
              {showWizard ? "Cancelar" : "+ Nueva vacante"}
            </Button>
          ) : undefined
        }
      />

      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {showWizard && canCreate && (
        <CreateJobWizard
          canAssignRecruiters={canAssign}
          onCancel={() => setShowWizard(false)}
          onSuccess={(message) => {
            setSuccess(message);
            setShowWizard(false);
            router.refresh();
          }}
        />
      )}

      {initialJobs.length === 0 ? (
        <Alert variant="info" title="Sin vacantes">
          {canCreate
            ? "Crea tu primera vacante para comenzar a recibir candidatos."
            : "No hay vacantes registradas. Un administrador o reclutador puede crearlas."}
        </Alert>
      ) : (
        <>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Haz clic en una tarjeta para ver la descripción y requisitos completos.
            {canAssign &&
              " Usa «Asignar reclutadores» para vincular el equipo a cada vacante."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 items-stretch">
            {initialJobs.map((job) => (
              <div key={job.id} className="min-h-[220px]">
                <JobCard
                  job={job}
                  highlighted={highlightJobId === job.id}
                  canAssignRecruiters={canAssign}
                  canManageJobs={canCreate}
                  canDeleteJobs={canDelete}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
