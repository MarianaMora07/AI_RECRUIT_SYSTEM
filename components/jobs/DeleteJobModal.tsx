"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { JobDeletionCheck } from "@/lib/jobs/delete-job";

export function DeleteJobModal({
  open,
  onClose,
  jobId,
  jobTitle,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [check, setCheck] = useState<JobDeletionCheck | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCheck(null);
      setError("");
      return;
    }

    setLoadingCheck(true);
    void fetch(`/api/jobs/${jobId}/delete-eligibility`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCheck(data.data);
        else setError(data.error ?? "No se pudo verificar la vacante");
      })
      .finally(() => setLoadingCheck(false));
  }, [open, jobId]);

  async function handleDelete() {
    setDeleting(true);
    setError("");

    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);

    if (!data.success) {
      setError(data.error ?? "No se pudo eliminar la vacante");
      return;
    }

    onDeleted?.();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar vacante"
      variant="danger"
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      onConfirm={check?.canDelete ? handleDelete : undefined}
      loading={deleting}
    >
      <div className="space-y-3">
        <p>
          ¿Eliminar <strong>{jobTitle}</strong>? Esta acción no se puede deshacer.
        </p>

        {loadingCheck && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}

        {!loadingCheck && check && !check.canDelete && (
          <p className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-800 dark:text-amber-200">
            {check.reason}
          </p>
        )}

        {!loadingCheck && check?.canDelete && (
          <p className="text-[var(--foreground-muted)]">
            La vacante no tiene reclutadores ni candidatos asociados y puede
            eliminarse de forma segura.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
