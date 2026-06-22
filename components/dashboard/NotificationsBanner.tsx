"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Alert } from "@/components/ui/Alert";
import type { AppNotification, NotificationVariant } from "@/lib/data/notifications";

const AUTO_DISMISS_MS = 10_000;

function toAlertVariant(variant: NotificationVariant) {
  if (variant === "error") return "error" as const;
  if (variant === "warning") return "warning" as const;
  if (variant === "success") return "success" as const;
  return "info" as const;
}

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(notification.id);
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      <Alert
        variant={toAlertVariant(notification.variant)}
        onClose={() => onDismiss(notification.id)}
        className="shadow-md"
      >
        <p className="font-semibold">{notification.title}</p>
        <p className="mt-0.5">{notification.message}</p>
        <Link
          href={notification.href}
          className="inline-block mt-2 text-xs font-semibold underline"
        >
          Ver detalle →
        </Link>
      </Alert>
    </motion.div>
  );
}

export function NotificationsBanner({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const top = notifications.slice(0, 3);
  const topKey = top.map((n) => n.id).join("|");
  const [visibleIds, setVisibleIds] = useState<string[]>(() =>
    top.map((n) => n.id)
  );

  useEffect(() => {
    setVisibleIds(topKey ? topKey.split("|") : []);
  }, [topKey]);

  const dismiss = useCallback((id: string) => {
    setVisibleIds((current) => current.filter((item) => item !== id));
  }, []);

  const visible = top.filter((n) => visibleIds.includes(n.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-6" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {visible.map((n) => (
          <NotificationToast key={n.id} notification={n} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
      {notifications.length > 3 && visible.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-xs text-[var(--foreground-muted)]"
        >
          +{notifications.length - 3} alertas más en el panel de notificaciones
          🔔
        </motion.p>
      )}
    </div>
  );
}
