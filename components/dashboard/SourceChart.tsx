"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { APPLICATION_SOURCE_LABELS } from "@/lib/constants/dashboard";
import type { DashboardAnalytics } from "@/lib/data/metrics";

export function SourceChart({
  sourceCounts,
}: {
  sourceCounts: DashboardAnalytics["sourceCounts"];
}) {
  const entries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fuentes de reclutamiento</CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--foreground-muted)]">
          Aún no hay datos de origen de postulaciones.
        </p>
      </Card>
    );
  }

  const max = Math.max(...entries.map(([, c]) => c), 1);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Fuentes de reclutamiento</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {entries.map(([source, count]) => {
          const pct = Math.round((count / total) * 100);
          const widthPct = (count / max) * 100;
          return (
            <div key={source}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">
                  {APPLICATION_SOURCE_LABELS[source] ?? source}
                </span>
                <span className="text-[var(--foreground-muted)]">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2d3a5c] dark:bg-[#6b7db3]"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
