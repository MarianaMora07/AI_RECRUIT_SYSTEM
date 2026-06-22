"use client";

import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemeMode } from "@/lib/theme/constants";

export function ThemeToggle({
  className,
  showLabel = false,
  variant = "default",
}: {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "compact" | "segmented";
}) {
  const { theme, setTheme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <span
        className={cn("inline-block h-9 w-9 rounded-lg bg-[var(--surface-hover)]", className)}
        aria-hidden
      />
    );
  }

  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-1",
          className
        )}
        role="group"
        aria-label="Tema de la interfaz"
      >
        {(["light", "dark"] as ThemeMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            className={cn(
              "px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer",
              theme === mode
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            )}
          >
            {mode === "light" ? "Claro" : "Oscuro"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer",
        variant === "compact" ? "h-9 w-9 text-lg" : "h-9 px-3 text-sm font-semibold",
        className
      )}
      aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      title={theme === "light" ? "Modo oscuro" : "Modo claro"}
    >
      <span aria-hidden>{theme === "light" ? "🌙" : "☀️"}</span>
      {showLabel && (
        <span>{theme === "light" ? "Oscuro" : "Claro"}</span>
      )}
    </button>
  );
}
