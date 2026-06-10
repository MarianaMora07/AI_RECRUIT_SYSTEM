"use client";

import { cn } from "@/lib/utils/cn";

type AlertVariant = "info" | "success" | "warning" | "error";

const variants: Record<AlertVariant, string> = {
  info: "bg-sky-50 border-sky-200 text-sky-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-900",
};

export function Alert({
  children,
  variant = "info",
  title,
  onClose,
  className,
}: {
  children?: React.ReactNode;
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
