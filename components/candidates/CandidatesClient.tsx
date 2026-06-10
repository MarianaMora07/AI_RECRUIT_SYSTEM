"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { PIPELINE_STAGE_LABELS } from "@/lib/constants/roles";

interface Score {
  summary?: string;
  classification?: string;
  fit_score?: number;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  pipeline_stage: string;
  job_id: string;
  scores?: Score[];
  similarity_pct?: number;
}

export function CandidatesClient({
  jobId,
  initialCandidates,
  initialSemantic,
}: {
  jobId: string;
  initialCandidates: Candidate[];
  initialSemantic: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  function toggleSemantic() {
    const next = !initialSemantic;
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("semantic", String(next));
    router.push(`/candidates?${params.toString()}`);
  }

  if (!jobId) {
    return (
      <Alert variant="info" title="Selecciona una vacante">
        Ve a Vacantes y haz clic en &quot;Ver candidatos&quot; para un job específico.
      </Alert>
    );
  }

  return (
    <div>
      <PageHeader
        title="Candidatos"
        subtitle={`${initialCandidates.length} perfil${initialCandidates.length !== 1 ? "es" : ""} encontrado${initialCandidates.length !== 1 ? "s" : ""}`}
        action={
          <Button
            variant={initialSemantic ? "primary" : "secondary"}
            size="sm"
            onClick={toggleSemantic}
            loading={loading}
          >
            {initialSemantic ? "✨ Ranking IA activo" : "Activar ranking IA"}
          </Button>
        }
      />

      {initialCandidates.length === 0 ? (
        <Alert variant="info" title="Sin candidatos">
          Sube CVs para esta vacante desde la sección Cargar CV.
        </Alert>
      ) : (
        <div className="space-y-3">
          {initialCandidates.map((c, idx) => {
            const score = Array.isArray(c.scores) ? c.scores[0] : c.scores;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="card-elevated !p-4 md:!p-5">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Avatar name={c.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {initialSemantic && (
                          <span className="text-sm font-extrabold gradient-text">#{idx + 1}</span>
                        )}
                        <Link href={`/candidates/${c.id}`} className="font-bold text-base hover:text-[var(--accent)] truncate">
                          {c.full_name}
                        </Link>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)] truncate">{c.email}</p>
                      {score?.summary && (
                        <p className="text-sm mt-2 line-clamp-2 text-[var(--foreground-muted)]">{score.summary}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge>
                        {PIPELINE_STAGE_LABELS[c.pipeline_stage as keyof typeof PIPELINE_STAGE_LABELS] ?? c.pipeline_stage}
                      </Badge>
                      {score?.classification && <Badge variant="info">{score.classification}</Badge>}
                      {(c.similarity_pct ?? score?.fit_score) != null && (
                        <span className="text-sm font-bold text-[var(--accent)]">
                          {c.similarity_pct ?? score?.fit_score}% afinidad
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
