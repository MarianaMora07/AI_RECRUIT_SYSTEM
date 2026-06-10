import { Badge } from "@/components/ui/Badge";
import type { PipelineStage } from "@/lib/constants/roles";
import { getSlaInfo, type SlaStatus } from "@/lib/utils/sla";

const variants: Record<SlaStatus, "success" | "warning" | "danger" | "default"> =
  {
    ok: "success",
    warning: "warning",
    breached: "danger",
    closed: "default",
  };

export function SlaBadge({
  stage,
  stageEnteredAt,
  className,
}: {
  stage: PipelineStage;
  stageEnteredAt?: string | null;
  className?: string;
}) {
  const sla = getSlaInfo(stage, stageEnteredAt);

  if (sla.status === "closed") return null;

  return (
    <Badge variant={variants[sla.status]} className={className}>
      {sla.status === "breached" ? "⚠ SLA vencido" : sla.label}
    </Badge>
  );
}
