"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { AppNotification } from "@/lib/data/notifications";

const variantStyles: Record<
  AppNotification["variant"],
  string
> = {
  error: "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30",
  warning:
    "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30",
  info: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30",
  success:
    "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30",
};

export function ActionQueue({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bandeja de acción</CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--foreground-muted)]">
          No hay acciones pendientes.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bandeja de acción</CardTitle>
      </CardHeader>
      <ul className="space-y-2 max-h-[320px] overflow-y-auto">
        {notifications.slice(0, 8).map((n) => (
          <li key={n.id}>
            <Link
              href={n.href}
              className={`block rounded-xl border p-3 transition-colors hover:opacity-90 ${variantStyles[n.variant]}`}
            >
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                {n.message}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
