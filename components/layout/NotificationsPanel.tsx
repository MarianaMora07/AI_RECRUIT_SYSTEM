"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { AppNotification } from "@/lib/data/notifications";

const variantBorder: Record<AppNotification["variant"], string> = {
  info: "border-l-sky-500",
  warning: "border-l-amber-500",
  error: "border-l-red-500",
  success: "border-l-emerald-500",
};

export function NotificationsPanel({
  notifications,
  variant = "light",
}: {
  notifications: AppNotification[];
  variant?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const count = notifications.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
          variant === "dark"
            ? "bg-white/10 hover:bg-white/15 text-white"
            : "bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--foreground)]"
        )}
        aria-label={`Notificaciones${count ? `, ${count} pendientes` : ""}`}
      >
        <span className="text-base" aria-hidden>
          🔔
        </span>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 sm:pt-20"
          role="dialog"
          aria-modal="true"
          aria-label="Notificaciones"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label="Cerrar notificaciones"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "relative z-10 flex w-full max-w-md max-h-[min(32rem,calc(100vh-5rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl",
              variant === "dark"
                ? "border-white/10 bg-[#1a2f45] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between border-b px-5 py-4",
                variant === "dark"
                  ? "border-white/10"
                  : "border-[var(--border)]"
              )}
            >
              <h2 className="text-base font-bold">Notificaciones</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                  variant === "dark"
                    ? "hover:bg-white/10"
                    : "hover:bg-[var(--surface-hover)]"
                )}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {count === 0 ? (
                <p
                  className={cn(
                    "px-2 py-8 text-center text-sm",
                    variant === "dark"
                      ? "text-white/60"
                      : "text-[var(--foreground-muted)]"
                  )}
                >
                  No hay alertas pendientes.
                </p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-xl border border-l-4 px-4 py-3 text-sm transition-colors",
                          variantBorder[n.variant],
                          variant === "dark"
                            ? "border-white/10 bg-white/5 hover:bg-white/10"
                            : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-hover)]"
                        )}
                      >
                        <p className="font-semibold leading-snug">{n.title}</p>
                        <p
                          className={cn(
                            "mt-1.5 text-xs leading-relaxed",
                            variant === "dark"
                              ? "text-white/70"
                              : "text-[var(--foreground-muted)]"
                          )}
                        >
                          {n.message}
                        </p>
                        <span
                          className={cn(
                            "mt-2 inline-block text-xs font-semibold",
                            variant === "dark"
                              ? "text-sky-300"
                              : "text-[var(--accent)]"
                          )}
                        >
                          Ver detalle →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
