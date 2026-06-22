"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { canAssignJobRecruiters } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/constants/roles";

interface RecruiterOption {
  recruiter_id: string;
  recruiter?: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null;
}

export function RecruiterReassignControl({
  candidateId,
  jobId,
  currentRecruiterId,
  userRole,
  onReassigned,
}: {
  candidateId: string;
  jobId: string;
  currentRecruiterId?: string;
  userRole?: UserRole | string | null;
  onReassigned?: () => void;
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canReassign = canAssignJobRecruiters(userRole);

  useEffect(() => {
    if (!canReassign || !jobId) return;
    void fetch(`/api/jobs/${jobId}/recruiters`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const rows = (data.data as RecruiterOption[]) ?? [];
          setOptions(
            rows.map((row) => {
              const r = Array.isArray(row.recruiter)
                ? row.recruiter[0]
                : row.recruiter;
              return {
                id: row.recruiter_id,
                name: r?.full_name ?? "Reclutador",
              };
            })
          );
        }
      });
  }, [canReassign, jobId]);

  if (!canReassign) return null;

  async function handleReassign() {
    if (!selected) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/candidates/${candidateId}/recruiter`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiterId: selected }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "No se pudo reasignar");
      return;
    }

    setSuccess("Reclutador actualizado");
    onReassigned?.();
  }

  return (
    <div className="mt-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]">
      <p className="text-sm font-semibold mb-2">Reasignar reclutador</p>
      <div className="flex flex-wrap gap-2 items-end">
        <select
          className="flex-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {options
            .filter((o) => o.id !== currentRecruiterId)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
        </select>
        <Button size="sm" onClick={handleReassign} loading={saving} disabled={!selected}>
          Reasignar
        </Button>
      </div>
      {error && (
        <Alert variant="error" className="mt-2 text-xs" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mt-2 text-xs" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
    </div>
  );
}
