"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { canAssignJobRecruiters, type UserRole } from "@/lib/constants/roles";

interface HistoryEvent {
  id: string;
  fromRecruiter: { id: string; full_name: string | null; avatar_url?: string | null } | null;
  toRecruiter: { id: string; full_name: string | null; avatar_url?: string | null };
  changedBy: { id: string; full_name: string | null } | null;
  reason: string;
  reasonLabel: string;
  createdAt: string;
}

export function RecruiterAssignmentHistory({
  candidateId,
  userRole,
}: {
  candidateId: string;
  userRole?: UserRole | string | null;
}) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/candidates/${candidateId}/recruiter-history`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEvents(data.data?.events ?? []);
      })
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) {
    return (
      <Card className="card-elevated h-full">
        <CardHeader>
          <CardTitle className="text-base">Historial de reclutadores</CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--foreground-muted)] pb-4">Cargando historial…</p>
      </Card>
    );
  }

  const showAuthor = canAssignJobRecruiters(userRole);

  return (
    <Card className="card-elevated h-full">
      <CardHeader>
        <CardTitle className="text-base">Historial de reclutadores</CardTitle>
      </CardHeader>
      {events.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)] pb-4">
          Sin reasignaciones registradas.
        </p>
      ) : (
      <ul className="space-y-3 pb-1">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex gap-3 text-sm border-l-2 border-[var(--accent)]/30 pl-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[var(--foreground-muted)] text-xs">
                {new Date(event.createdAt).toLocaleString("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {event.reason === "initial_assignment" ? (
                <p className="mt-1">
                  Asignado a{" "}
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Avatar
                      name={event.toRecruiter.full_name ?? "?"}
                      src={event.toRecruiter.avatar_url}
                      size="sm"
                    />
                    {event.toRecruiter.full_name}
                  </span>{" "}
                  <span className="text-[var(--foreground-muted)]">
                    ({event.reasonLabel})
                  </span>
                </p>
              ) : (
                <p className="mt-1">
                  Traspasado de{" "}
                  <span className="font-semibold">
                    {event.fromRecruiter?.full_name ?? "—"}
                  </span>{" "}
                  →{" "}
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Avatar
                      name={event.toRecruiter.full_name ?? "?"}
                      src={event.toRecruiter.avatar_url}
                      size="sm"
                    />
                    {event.toRecruiter.full_name}
                  </span>
                </p>
              )}
              {showAuthor && event.changedBy && event.reason !== "initial_assignment" && (
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  Autorizado por {event.changedBy.full_name}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      )}
    </Card>
  );
}
