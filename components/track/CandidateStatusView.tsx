import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  CANDIDATE_VISIBLE_STAGES,
  getCandidateStageIndex,
  getCandidateStatusInfo,
} from "@/lib/constants/candidate-status";
import type { CandidatePublicStatus } from "@/lib/data/candidate-tracking";
import { APP_NAME } from "@/lib/constants/branding";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

const VARIANT_STYLES = {
  default: "border-[var(--accent)]/30 bg-[var(--accent-soft)]",
  success: "border-emerald-500/30 bg-emerald-50",
  warning: "border-amber-500/30 bg-amber-50",
  muted: "border-[var(--border)] bg-[var(--surface-hover)]",
} as const;

export function CandidateStatusView({ status }: { status: CandidatePublicStatus }) {
  const info = getCandidateStatusInfo(status.pipelineStage);
  const activeIndex = getCandidateStageIndex(status.pipelineStage);
  const isRejected = status.pipelineStage === "rejected";

  return (
    <div className="min-h-full bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-gradient-to-br from-[#131829] to-[#2d3a5c] px-4 py-8 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          {APP_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          Estado de tu postulación
        </h1>
        <p className="mt-2 text-sm text-white/75">
          Hola, <strong>{status.fullName}</strong>
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <p className="text-sm text-[var(--foreground-muted)]">Vacante</p>
            <CardTitle className="text-xl">{status.jobTitle}</CardTitle>
          </CardHeader>
          <div
            className={`rounded-xl border px-4 py-4 ${VARIANT_STYLES[info.variant]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">
                  Etapa actual
                </p>
                <p className="mt-1 text-lg font-bold text-[var(--foreground)]">
                  {info.headline}
                </p>
              </div>
              <Badge variant={isRejected ? "default" : "info"}>
                {info.label}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
              {info.description}
            </p>
            <p className="mt-3 text-xs text-[var(--foreground-muted)]">
              Última actualización: {formatDate(status.stageEnteredAt)}
            </p>
          </div>
        </Card>

        {!isRejected && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progreso del proceso</CardTitle>
            </CardHeader>
            <ol className="space-y-3">
              {CANDIDATE_VISIBLE_STAGES.map((stage, index) => {
                const done = activeIndex > index;
                const current = activeIndex === index;
                const label = getCandidateStatusInfo(stage).label;
                return (
                  <li key={stage} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? "bg-emerald-500 text-white"
                          : current
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-hover)] text-[var(--foreground-muted)]"
                      }`}
                      aria-hidden
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span
                      className={`text-sm ${
                        current
                          ? "font-bold text-[var(--foreground)]"
                          : done
                            ? "text-[var(--foreground-muted)]"
                            : "text-[var(--foreground-muted)]/70"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        {(status.timeline.length > 0 || status.appliedAt) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial reciente</CardTitle>
            </CardHeader>
            <ul className="space-y-3">
              {status.timeline.length === 0 && (
                <li className="flex flex-col gap-0.5 border-l-2 border-[var(--accent)]/40 pl-3">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Postulado
                  </span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {formatDate(status.appliedAt)}
                  </span>
                </li>
              )}
              {status.timeline.map((event, i) => (
                <li
                  key={`${event.changedAt}-${i}`}
                  className="flex flex-col gap-0.5 border-l-2 border-[var(--accent)]/40 pl-3"
                >
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {event.toStageLabel}
                  </span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {formatDate(event.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="text-center text-xs text-[var(--foreground-muted)] px-4">
          Guarda este enlace para consultar tu estado cuando quieras. No
          requiere iniciar sesión.
        </p>
      </main>
    </div>
  );
}
