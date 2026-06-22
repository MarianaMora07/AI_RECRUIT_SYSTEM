"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { RecruiterPicker, type RecruiterOption } from "@/components/jobs/RecruiterPicker";

interface JobRecruiterRow {
  recruiter_id: string;
  recruiter?: RecruiterOption | RecruiterOption[] | null;
}

function normalizeRecruiter(
  r: RecruiterOption | RecruiterOption[] | null | undefined
): RecruiterOption | null {
  if (!r) return null;
  return Array.isArray(r) ? r[0] ?? null : r;
}

export function JobRecruitersAssignForm({
  jobId,
  jobTitle,
  jobStatus,
  onSaved,
  onCancel,
}: {
  jobId: string;
  jobTitle?: string;
  jobStatus: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [assigned, setAssigned] = useState<RecruiterOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/recruiters`);
      const data = await res.json();
      if (data.success) {
        const rows = (data.data as JobRecruiterRow[]) ?? [];
        const list = rows
          .map((row) => normalizeRecruiter(row.recruiter))
          .filter((r): r is RecruiterOption => Boolean(r));
        setAssigned(list);
        setSelected(list.map((r) => r.id));
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    const removed = assigned.filter((r) => !selected.includes(r.id));
    const reassignments: Record<string, string> = {};

    if (removed.length > 0 && selected.length > 0) {
      const replacement = selected[0];
      for (const r of removed) {
        reassignments[r.id] = replacement;
      }
    }

    const res = await fetch(`/api/jobs/${jobId}/recruiters`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiterIds: selected, reassignments }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "No se pudo guardar");
      return;
    }

    setSuccess("Reclutadores actualizados correctamente");
    await load();
    onSaved?.();
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--foreground-muted)] py-6 text-center">
        Cargando reclutadores…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {jobTitle && (
        <p className="text-sm text-[var(--foreground-muted)]">
          Vacante:{" "}
          <span className="font-semibold text-[var(--foreground)]">{jobTitle}</span>
        </p>
      )}

      {jobStatus === "open" && assigned.length === 0 && selected.length === 0 && (
        <Alert variant="warning">
          Esta vacante no aparecerá en el portal de candidatos hasta asignar al
          menos un reclutador.
        </Alert>
      )}

      {assigned.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)] mb-2">
            Actualmente asignados
          </p>
          <div className="flex flex-wrap gap-2">
            {assigned.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium"
              >
                <Avatar name={r.full_name ?? "?"} src={r.avatar_url} size="sm" />
                {r.full_name ?? "Reclutador"}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Selecciona reclutadores
        </p>
        <RecruiterPicker selected={selected} onChange={setSelected} />
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {assigned.length > 0 && selected.length > 0 && (
        <a
          href={`/candidatos?jobId=${jobId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-[var(--accent)] hover:underline font-semibold"
        >
          Ver link para candidatos ↗
        </a>
      )}

      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-[var(--border)]">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cerrar
          </Button>
        )}
        <Button onClick={handleSave} loading={saving}>
          Guardar reclutadores
        </Button>
      </div>
    </div>
  );
}
