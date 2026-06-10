import { STAGE_SLA_DAYS } from "@/lib/constants/sla";
import type { PipelineStage } from "@/lib/constants/roles";

export type SlaStatus = "ok" | "warning" | "breached" | "closed";

export interface SlaInfo {
  status: SlaStatus;
  daysInStage: number;
  limitDays: number;
  label: string;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function getSlaInfo(
  stage: PipelineStage,
  stageEnteredAt?: string | null,
  now = new Date()
): SlaInfo {
  const limitDays = STAGE_SLA_DAYS[stage];

  if (stage === "hired" || stage === "rejected" || limitDays === 0) {
    return {
      status: "closed",
      daysInStage: 0,
      limitDays: 0,
      label: "Proceso cerrado",
    };
  }

  const entered = stageEnteredAt ? new Date(stageEnteredAt) : now;
  const daysInStage = Math.max(0, daysBetween(entered, now));

  if (daysInStage > limitDays) {
    return {
      status: "breached",
      daysInStage,
      limitDays,
      label: `${daysInStage}d en etapa · SLA ${limitDays}d`,
    };
  }

  if (daysInStage >= Math.ceil(limitDays * 0.75)) {
    return {
      status: "warning",
      daysInStage,
      limitDays,
      label: `${daysInStage}/${limitDays}d en etapa`,
    };
  }

  return {
    status: "ok",
    daysInStage,
    limitDays,
    label: `${daysInStage}/${limitDays}d en etapa`,
  };
}
