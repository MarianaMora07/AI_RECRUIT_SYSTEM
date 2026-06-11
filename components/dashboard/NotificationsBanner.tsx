import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import type { AppNotification } from "@/lib/data/notifications";

export function NotificationsBanner({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  if (notifications.length === 0) return null;

  const top = notifications.slice(0, 3);

  return (
    <div className="space-y-3 mb-6">
      {top.map((n) => (
        <Alert key={n.id} variant={n.variant === "error" ? "error" : n.variant === "warning" ? "warning" : "info"}>
          <p className="font-semibold">{n.title}</p>
          <p className="mt-0.5">{n.message}</p>
          <Link href={n.href} className="inline-block mt-2 text-xs font-semibold underline">
            Ver detalle →
          </Link>
        </Alert>
      ))}
      {notifications.length > 3 && (
        <p className="text-xs text-[var(--foreground-muted)]">
          +{notifications.length - 3} alertas más en el panel de notificaciones 🔔
        </p>
      )}
    </div>
  );
}
