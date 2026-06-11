"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  CandidateCard,
  type CandidateCardData,
} from "@/components/candidates/CandidateCard";
import { STAGE_SLA_LABELS } from "@/lib/constants/sla";
import { PIPELINE_STAGE_LABELS } from "@/lib/constants/roles";
import {
  getAffinityScore,
  groupCandidatesByAffinityTier,
} from "@/lib/utils/candidate-ranking";

const selectClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm w-full sm:w-auto focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";

interface JobOption {
  id: string;
  title: string;
}

export function CandidatesClient({
  initialCandidates,
  jobs,
  initialJobId,
  initialQuery,
  initialSemantic,
}: {
  initialCandidates: CandidateCardData[];
  jobs: JobOption[];
  initialJobId?: string;
  initialQuery?: string;
  initialSemantic: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [filterLoading, setFilterLoading] = useState(false);
  const [semanticLoading, setSemanticLoading] = useState(false);

  useEffect(() => {
    setFilterLoading(false);
    setSemanticLoading(false);
  }, [initialCandidates, initialJobId, initialQuery, initialSemantic]);

  function pushParams(updates: Record<string, string | boolean | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    if (!params.get("jobId")) params.delete("semantic");

    router.push(`/candidates?${params.toString()}`);
  }

  function applyFilters(jobId: string, q: string) {
    setFilterLoading(true);
    pushParams({ jobId: jobId || undefined, q: q.trim() || undefined });
  }

  function toggleSemantic() {
    if (!initialJobId) return;
    setSemanticLoading(true);
    pushParams({ semantic: initialSemantic ? "false" : undefined });
  }

  const rankedView = initialSemantic && Boolean(initialJobId);
  const grouped = rankedView
    ? groupCandidatesByAffinityTier(initialCandidates)
    : null;
  const rankByCandidateId = grouped
    ? new Map(
        grouped
          .flatMap((section) => section.items)
          .map((candidate, index) => [candidate.id, index + 1] as const)
      )
    : null;

  return (
    <div>
      <PageHeader
        title="Candidatos"
        subtitle={`${initialCandidates.length} postulación${initialCandidates.length !== 1 ? "es" : ""} en el sistema`}
        action={
          initialJobId ? (
            <Button
              variant={rankedView ? "primary" : "secondary"}
              size="sm"
              onClick={toggleSemantic}
              loading={semanticLoading}
            >
              {rankedView ? "✨ Orden por afinidad" : "Orden cronológico"}
            </Button>
          ) : undefined
        }
      />

      <p className="text-sm text-[var(--foreground-muted)] mb-4">
        SLA por etapa:{" "}
        {Object.entries(STAGE_SLA_LABELS)
          .filter(([k]) => k !== "hired" && k !== "rejected")
          .map(([, v]) => v)
          .join(" · ")}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="sm:w-56">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] block mb-1">
            Vacante
          </label>
          <select
            className={selectClass}
            value={initialJobId ?? ""}
            onChange={(e) => applyFilters(e.target.value, query)}
            disabled={filterLoading}
          >
            <option value="">Todas las vacantes</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Input
            label="Buscar por nombre o correo"
            placeholder="Ej: Mariana, @gmail.com"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters(initialJobId ?? "", query);
              }
            }}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => applyFilters(initialJobId ?? "", query)}
            disabled={filterLoading}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
      </div>

      {rankedView && (
        <Alert variant="info" className="mb-4">
          Candidatos ordenados por afinidad semántica con la vacante (mayor a
          menor). Los perfiles con mayor encaje aparecen primero.
        </Alert>
      )}

      {!rankedView && initialJobId && (
        <Alert variant="info" className="mb-4">
          Mostrando orden cronológico. Activa &quot;Orden por afinidad&quot; para
          priorizar perfiles con mayor encaje.
        </Alert>
      )}

      {initialCandidates.length === 0 ? (
        <Alert variant="info" title="Sin resultados">
          No hay candidatos con los filtros actuales. Sube CVs desde Cargar CV.
        </Alert>
      ) : grouped ? (
        <div className="space-y-8">
          {grouped.map((section) => (
            <section key={section.tier}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
                  {section.label}
                </h2>
                <span className="text-xs text-[var(--foreground-muted)]">
                  ({section.items.length})
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map((c) => {
                  const rank = rankByCandidateId!.get(c.id)!;
                  return (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      rank={rank}
                      highlightTop={rank <= 3}
                      showJob={false}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Etapas: {Object.values(PIPELINE_STAGE_LABELS).join(", ")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {initialCandidates.map((c, idx) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                rank={
                  getAffinityScore(c) > 0 ? idx + 1 : undefined
                }
                highlightTop={idx < 3 && getAffinityScore(c) >= 75}
                showJob={!initialJobId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
