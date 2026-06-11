"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";

export interface PreOfferData {
  id?: string;
  base_salary?: number | null;
  bonus?: string | null;
  proposed_start_date?: string | null;
  internal_approval_notes?: string | null;
  status?: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobada internamente",
};

export function PreOfferForm({
  candidateId,
  initialOffer,
  variant = "card",
  onSaved,
}: {
  candidateId: string;
  initialOffer?: PreOfferData | null;
  variant?: "card" | "plain";
  onSaved?: (offer: PreOfferData) => void;
}) {
  const [baseSalary, setBaseSalary] = useState(
    initialOffer?.base_salary?.toString() ?? ""
  );
  const [bonus, setBonus] = useState(initialOffer?.bonus ?? "");
  const [startDate, setStartDate] = useState(
    initialOffer?.proposed_start_date ?? ""
  );
  const [approvalNotes, setApprovalNotes] = useState(
    initialOffer?.internal_approval_notes ?? ""
  );
  const [status, setStatus] = useState(initialOffer?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setBaseSalary(initialOffer?.base_salary?.toString() ?? "");
    setBonus(initialOffer?.bonus ?? "");
    setStartDate(initialOffer?.proposed_start_date ?? "");
    setApprovalNotes(initialOffer?.internal_approval_notes ?? "");
    setStatus(initialOffer?.status ?? "draft");
  }, [initialOffer]);

  async function save(nextStatus?: string) {
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/candidates/${candidateId}/offer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_salary: baseSalary ? Number(baseSalary) : null,
        bonus: bonus || null,
        proposed_start_date: startDate || null,
        internal_approval_notes: approvalNotes || null,
        status: nextStatus ?? status,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Error al guardar");
      return;
    }

    setStatus(data.data.status);
    setSuccess("Pre-oferta guardada correctamente");
    onSaved?.(data.data);
  }

  const formBody = (
    <>
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Salario base"
          type="number"
          min={0}
          step="0.01"
          value={baseSalary}
          onChange={(e) => setBaseSalary(e.target.value)}
          placeholder="Ej. 2500000"
        />
        <Input
          label="Bonos / beneficios"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
          placeholder="Ej. bono anual, seguro médico"
        />
        <Input
          label="Fecha de ingreso propuesta"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="approval-notes"
            className="text-sm font-medium text-[var(--foreground-muted)]"
          >
            Aprobaciones internas / notas RRHH
          </label>
          <textarea
            id="approval-notes"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            rows={3}
            placeholder="Referencias verificadas, aprobación del Hiring Manager, presupuesto..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Button size="sm" loading={saving} onClick={() => save("draft")}>
          Guardar borrador
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={saving}
          onClick={() => save("pending_approval")}
        >
          Enviar a aprobación
        </Button>
        <Button
          size="sm"
          variant="primary"
          loading={saving}
          onClick={() => save("approved")}
        >
          Marcar aprobada
        </Button>
      </div>
    </>
  );

  if (variant === "plain") {
    return formBody;
  }

  return (
    <Card className="border-[var(--accent)]/30">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Pre-oferta — recta final</CardTitle>
          <Badge variant="info">{STATUS_LABELS[status] ?? status}</Badge>
        </div>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Coordina fit cultural, referencias y propuesta económica antes de contratar.
        </p>
      </CardHeader>
      {formBody}
    </Card>
  );
}

export function PreOfferStatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return (
    <Badge variant="info">{STATUS_LABELS[status] ?? status}</Badge>
  );
}
