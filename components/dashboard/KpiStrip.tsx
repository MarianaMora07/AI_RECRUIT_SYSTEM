"use client";

import { StatCard } from "@/components/ui/StatCard";
import {
  canSeeCostPerHire,
} from "@/lib/constants/dashboard";
import type { UserRole } from "@/lib/constants/roles";
import { isHiringManager } from "@/lib/constants/roles";
import type { DashboardAnalytics } from "@/lib/data/metrics";

function formatDays(value: number | null): string {
  if (value == null) return "—";
  return `${value} d`;
}

function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function KpiStrip({
  metrics,
  userRole,
}: {
  metrics: DashboardAnalytics;
  userRole: UserRole;
}) {
  if (userRole === "recruiter") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          label="Mis candidatos"
          value={metrics.totalCandidates}
          icon="👥"
          accent="navy"
          delay={0}
        />
        <StatCard
          label="Nuevos (24h)"
          value={metrics.newCandidates24h}
          icon="✨"
          accent="coral"
          delay={0.05}
        />
        <StatCard
          label="SLA en riesgo"
          value={metrics.slaWarningCount + metrics.slaBreachedCount}
          icon="⚠️"
          accent="gold"
          delay={0.1}
        />
        <StatCard
          label="Mis vacantes abiertas"
          value={metrics.openJobs}
          icon="💼"
          accent="rose"
          delay={0.15}
        />
      </div>
    );
  }

  if (isHiringManager(userRole)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          label="Pendientes entrevista"
          value={metrics.pendingInterview}
          icon="🎯"
          accent="coral"
          delay={0}
        />
        <StatCard
          label="Aprobados técnicos"
          value={metrics.interviewApproved}
          icon="✅"
          accent="navy"
          delay={0.05}
        />
        <StatCard
          label="Contratados"
          value={metrics.hiredCount}
          icon="🎉"
          accent="gold"
          delay={0.1}
        />
        <StatCard
          label="Conversión global"
          value={formatPct(metrics.overallConversionRate)}
          icon="📈"
          accent="rose"
          delay={0.15}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
      <StatCard
        label="Time-to-Hire"
        value={formatDays(metrics.timeToHireDays)}
        icon="⏱️"
        accent="navy"
        delay={0}
      />
      <StatCard
        label="Time-to-Fill"
        value={formatDays(metrics.timeToFillDays)}
        icon="📅"
        accent="coral"
        delay={0.05}
      />
      <StatCard
        label="Conversión"
        value={formatPct(metrics.overallConversionRate)}
        icon="📈"
        accent="gold"
        delay={0.1}
      />
      <StatCard
        label="Abiertas / Cerradas"
        value={`${metrics.openJobs} / ${metrics.closedJobs}`}
        icon="💼"
        accent="rose"
        delay={0.15}
      />
      <StatCard
        label="SLA en riesgo"
        value={metrics.slaWarningCount + metrics.slaBreachedCount}
        icon="⚠️"
        accent="coral"
        delay={0.2}
      />
      {canSeeCostPerHire(userRole) && (
        <StatCard
          label="Costo / contratación"
          value={formatCurrency(metrics.costPerHire)}
          icon="💰"
          accent="navy"
          delay={0.25}
        />
      )}
    </div>
  );
}
