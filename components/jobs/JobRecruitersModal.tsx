"use client";

import { FormModal } from "@/components/ui/FormModal";
import { JobRecruitersAssignForm } from "@/components/jobs/JobRecruitersAssignForm";

export function JobRecruitersModal({
  open,
  onClose,
  jobId,
  jobTitle,
  jobStatus,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
}) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Asignar reclutadores"
      description="Elige quién gestionará los candidatos de esta vacante."
      size="lg"
    >
      <JobRecruitersAssignForm
        jobId={jobId}
        jobTitle={jobTitle}
        jobStatus={jobStatus}
        onCancel={onClose}
      />
    </FormModal>
  );
}
