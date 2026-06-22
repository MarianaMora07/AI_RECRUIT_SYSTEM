"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  canFilterByRecruiter,
  DATE_RANGE_PRESETS,
  JOB_PRIORITY_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/constants/dashboard";
import type { UserRole } from "@/lib/constants/roles";
import type {
  FilterOptionJob,
  FilterOptionRecruiter,
} from "@/lib/data/dashboard";

interface DashboardFiltersProps {
  userRole: UserRole;
  jobs: FilterOptionJob[];
  recruiters: FilterOptionRecruiter[];
  departments: string[];
  locations: string[];
}

export function DashboardFilters({
  userRole,
  jobs,
  recruiters,
  departments,
  locations,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      const nextUrl = query ? `/dashboard?${query}` : "/dashboard";
      const currentQuery = searchParams.toString();
      const currentUrl = currentQuery
        ? `/dashboard?${currentQuery}`
        : "/dashboard";
      if (nextUrl === currentUrl) return;
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParams]
  );

  const currentRange = searchParams.get("range") ?? "30d";
  const showRecruiterFilter = canFilterByRecruiter(userRole);

  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-3 mb-6 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mr-1">
          Filtros
        </span>

        <div className="flex flex-wrap gap-1">
          {DATE_RANGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                updateParams({
                  range: preset.id === "all" ? "all" : preset.id,
                  from: null,
                  to: null,
                })
              }
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                currentRange === preset.id
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <select
          value={searchParams.get("jobId") ?? ""}
          onChange={(e) => updateParams({ jobId: e.target.value || null })}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium min-w-[140px]"
          aria-label="Filtrar por vacante"
        >
          <option value="">Todas las vacantes</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>

        {showRecruiterFilter && recruiters.length > 0 && (
          <select
            value={searchParams.get("recruiterId") ?? ""}
            onChange={(e) =>
              updateParams({ recruiterId: e.target.value || null })
            }
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium min-w-[140px]"
            aria-label="Filtrar por reclutador"
          >
            <option value="">Todos los reclutadores</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name ?? "Reclutador"}
              </option>
            ))}
          </select>
        )}

        {departments.length > 0 && (
          <select
            value={searchParams.get("department") ?? ""}
            onChange={(e) =>
              updateParams({ department: e.target.value || null })
            }
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium"
            aria-label="Filtrar por departamento"
          >
            <option value="">Departamento</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {locations.length > 0 && (
          <select
            value={searchParams.get("location") ?? ""}
            onChange={(e) =>
              updateParams({ location: e.target.value || null })
            }
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium"
            aria-label="Filtrar por ubicación"
          >
            <option value="">Ubicación</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}

        <select
          value={searchParams.get("priority") ?? ""}
          onChange={(e) => updateParams({ priority: e.target.value || null })}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium"
          aria-label="Filtrar por prioridad"
        >
          <option value="">Prioridad</option>
          {Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("workMode") ?? ""}
          onChange={(e) => updateParams({ workMode: e.target.value || null })}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium"
          aria-label="Filtrar por modalidad"
        >
          <option value="">Modalidad</option>
          {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
