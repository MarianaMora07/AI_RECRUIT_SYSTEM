"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import type { TeamWorkloadRow } from "@/lib/data/metrics";
import type { UserRole } from "@/lib/constants/roles";
import { canSeeTeamWorkload } from "@/lib/constants/dashboard";

export function TeamWorkload({
  rows,
  userRole,
  jobsWithoutRecruiters,
}: {
  rows: TeamWorkloadRow[];
  userRole: UserRole;
  jobsWithoutRecruiters: number;
}) {
  if (rows.length === 0) return null;

  const title = canSeeTeamWorkload(userRole)
    ? "Carga del equipo"
    : "Mi carga de trabajo";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {canSeeTeamWorkload(userRole) && jobsWithoutRecruiters > 0 && (
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {jobsWithoutRecruiters} vacante
            {jobsWithoutRecruiters !== 1 ? "s" : ""} sin reclutador
          </span>
        )}
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--foreground-muted)] border-b border-[var(--border)]">
              <th className="pb-2 font-semibold">Reclutador</th>
              <th className="pb-2 font-semibold text-center">Vacantes</th>
              <th className="pb-2 font-semibold text-center">Activos</th>
              <th className="pb-2 font-semibold text-center">Entrevistas sem.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.recruiter_id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={row.full_name ?? "R"}
                      src={row.avatar_url ?? undefined}
                      size="sm"
                    />
                    <span className="font-medium">
                      {row.full_name ?? "Reclutador"}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-center font-semibold">
                  {row.job_count}
                </td>
                <td className="py-2.5 text-center font-semibold">
                  {row.active_candidates}
                </td>
                <td className="py-2.5 text-center font-semibold">
                  {row.interviews_this_week}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
