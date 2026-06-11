"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PreOfferStatusBadge, type PreOfferData } from "./PreOfferForm";

export function PreOfferTrigger({
  offer,
  onOpen,
}: {
  offer?: PreOfferData | null;
  onOpen: () => void;
}) {
  const hasDraft =
    offer?.base_salary != null ||
    offer?.bonus ||
    offer?.proposed_start_date ||
    offer?.internal_approval_notes;

  return (
    <Card className="mb-6 flex flex-col gap-3 border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-sm">Recta final — pre-oferta</p>
          <PreOfferStatusBadge status={offer?.status} />
        </div>
        <p className="mt-1 text-xs text-[var(--foreground-muted)] leading-relaxed">
          {hasDraft
            ? "Tienes una pre-oferta en progreso. Abre el formulario para editarla o enviarla a aprobación."
            : "El candidato aprobó la entrevista técnica. Completa fit cultural, referencias y propuesta económica."}
        </p>
      </div>
      <Button size="sm" className="shrink-0 w-full sm:w-auto" onClick={onOpen}>
        {hasDraft ? "Ver formulario de contratación" : "Abrir formulario de contratación"}
      </Button>
    </Card>
  );
}
