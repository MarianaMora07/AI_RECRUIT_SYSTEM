"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

interface SummaryProps {
  jobTitle?: string;
  recruiterName?: string | null;
  recruiterAvatar?: string | null;
  fullName?: string;
  email?: string;
  fileName?: string | null;
  step: number;
}

export function ApplyOrderSummary({
  jobTitle,
  recruiterName,
  recruiterAvatar,
  fullName,
  email,
  fileName,
  step,
}: SummaryProps) {
  return (
    <Card className="sticky top-24 border-[var(--institutional)]/15 bg-[var(--institutional-light)]/40">
      <CardHeader>
        <CardTitle className="text-base text-[var(--institutional)]">
          Resumen de postulación
        </CardTitle>
        <p className="text-xs text-[var(--foreground-muted)]">
          Como en un pedido en línea: revisa antes de enviar
        </p>
      </CardHeader>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
            Vacante
          </dt>
          <dd className="font-semibold mt-0.5">
            {jobTitle ?? (
              <span className="text-[var(--foreground-muted)] font-normal">
                Pendiente — paso 1
              </span>
            )}
          </dd>
        </div>
        {step >= 2 && recruiterName && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
              Reclutador
            </dt>
            <dd className="mt-0.5 flex items-center gap-2 font-semibold">
              <Avatar name={recruiterName} src={recruiterAvatar} size="sm" />
              {recruiterName}
            </dd>
          </div>
        )}
        {step >= 3 && fullName && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
              Candidato
            </dt>
            <dd className="font-semibold mt-0.5">{fullName}</dd>
            {email && (
              <dd className="text-xs text-[var(--foreground-muted)]">{email}</dd>
            )}
          </div>
        )}
        {step >= 3 && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
              CV
            </dt>
            <dd className="font-semibold mt-0.5">
              {fileName ?? (
                <span className="text-[var(--foreground-muted)] font-normal">
                  Pendiente — paso 3
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
