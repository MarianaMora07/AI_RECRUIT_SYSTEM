"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ScheduledInterview } from "@/lib/data/interviews";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatInterviewTime(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCandidateName(interview: ScheduledInterview) {
  const c = interview.candidates;
  if (!c) return "Candidato";
  return c.full_name;
}

function getJobTitle(interview: ScheduledInterview) {
  return interview.jobs?.title ?? "Vacante";
}

export function InterviewCalendar({
  interviews,
}: {
  interviews: ScheduledInterview[];
}) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const interviewsByDay = useMemo(() => {
    const map = new Map<string, ScheduledInterview[]>();
    for (const item of interviews) {
      const key = item.scheduled_at.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [interviews]);

  const monthStart = startOfMonth(viewDate);
  const totalDays = daysInMonth(viewDate);
  const leadingBlanks = (monthStart.getDay() + 6) % 7;
  const monthLabel = viewDate.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const upcoming = interviews.slice(0, 6);

  function shiftMonth(delta: number) {
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Calendario de entrevistas</CardTitle>
        <Badge variant="info">{interviews.length} programada{interviews.length !== 1 ? "s" : ""}</Badge>
      </CardHeader>

      {interviews.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)]">
          No hay entrevistas programadas. Al avanzar un candidato a la etapa
          Entrevista podrás agendar fecha y hora.
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-lg px-2 py-1 text-sm hover:bg-[var(--surface-hover)]"
                aria-label="Mes anterior"
              >
                ←
              </button>
              <p className="text-sm font-bold capitalize">{monthLabel}</p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-lg px-2 py-1 text-sm hover:bg-[var(--surface-hover)]"
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--foreground-muted)] mb-1">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const key = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayInterviews = interviewsByDay.get(key) ?? [];
                const isToday =
                  key === new Date().toISOString().slice(0, 10);

                return (
                  <div
                    key={key}
                    className={`aspect-square rounded-lg border text-xs flex flex-col items-center justify-center relative ${
                      dayInterviews.length
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] font-bold text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--foreground-muted)]"
                    } ${isToday ? "ring-2 ring-[var(--accent)]/40" : ""}`}
                    title={
                      dayInterviews.length
                        ? `${dayInterviews.length} entrevista(s)`
                        : undefined
                    }
                  >
                    <span>{day}</span>
                    {dayInterviews.length > 0 && (
                      <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Próximas entrevistas
            </p>
            <ul className="space-y-2">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/candidates/${item.candidate_id}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {getCandidateName(item)}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] truncate">
                        {getJobTitle(item)}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--accent)] shrink-0 text-right">
                      {formatInterviewTime(item.scheduled_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
