"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormattedRequirements } from "@/components/jobs/FormattedRequirements";

export interface JobCardData {
  id: string;
  title: string;
  description: string;
  requirements: string;
  requirements_formatted?: string | null;
  status: string;
  created_at: string;
}

export function JobCard({
  job,
  highlighted,
}: {
  job: JobCardData;
  highlighted?: boolean;
}) {
  const [pinned, setPinned] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setPinned(true);
    }
  }, [highlighted]);

  const expanded = pinned;

  return (
    <div
      ref={cardRef}
      className="group relative h-full min-h-[220px]"
      onMouseLeave={() => setPinned(false)}
    >
      <Card
        className={`card-elevated relative h-full min-h-[220px] overflow-hidden transition-shadow duration-200 ${
          highlighted ? "ring-2 ring-[var(--accent)]/40" : ""
        } ${expanded ? "shadow-xl z-20" : "group-hover:shadow-xl group-hover:z-20"}`}
      >
        <div className="flex flex-col h-full min-h-[220px] p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{job.title}</h3>
              <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                {job.description}
              </p>
            </div>
            <Badge variant={job.status === "open" ? "success" : "default"}>
              {job.status}
            </Badge>
          </div>
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            <Link href={`/candidates?jobId=${job.id}`}>
              <Button variant="secondary" size="sm">
                Ver candidatos
              </Button>
            </Link>
            <Link href={`/upload?jobId=${job.id}`}>
              <Button size="sm">Subir CV</Button>
            </Link>
          </div>
        </div>

        <div
          className={`absolute inset-0 flex flex-col bg-[var(--surface)] p-4 md:p-5 transition-opacity duration-200 ${
            expanded
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          }`}
        >
          <div
            className="flex-1 flex flex-col min-h-0 cursor-default"
            onClick={() => setPinned((p) => !p)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPinned((p) => !p);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-2 mb-3 shrink-0">
              <h3 className="font-bold text-base leading-tight">{job.title}</h3>
              <Badge variant={job.status === "open" ? "success" : "default"}>
                {job.status}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
              <section>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)] mb-1.5">
                  Descripción
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </section>
              <section>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)] mb-1.5">
                  Requisitos técnicos
                </p>
                <FormattedRequirements
                  raw={job.requirements}
                  formatted={job.requirements_formatted}
                />
              </section>
            </div>

            <p className="text-[10px] text-[var(--foreground-muted)] mt-2 shrink-0 lg:hidden">
              Toca para {pinned ? "cerrar" : "fijar"} el detalle
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-[var(--border)] shrink-0">
            <Link href={`/candidates?jobId=${job.id}`}>
              <Button variant="secondary" size="sm">
                Ver candidatos
              </Button>
            </Link>
            <Link href={`/upload?jobId=${job.id}`}>
              <Button size="sm">Subir CV</Button>
            </Link>
            <Link href={`/pipeline?jobId=${job.id}`}>
              <Button variant="secondary" size="sm">
                Pipeline
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
