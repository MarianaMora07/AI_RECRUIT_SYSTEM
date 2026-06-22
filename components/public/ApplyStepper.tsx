"use client";

import { motion } from "framer-motion";

const STEPS = [
  { id: 1, label: "Vacante", short: "Elige tu puesto" },
  { id: 2, label: "Reclutador", short: "Quién te atiende" },
  { id: 3, label: "Tus datos", short: "Contacto y CV" },
] as const;

export function ApplyStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progreso de postulación" className="mb-8">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <motion.div
                  animate={{
                    scale: active ? 1.05 : 1,
                    backgroundColor: done
                      ? "var(--accent)"
                      : active
                        ? "var(--institutional)"
                        : "var(--surface-hover)",
                  }}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    done || active ? "text-white shadow-md" : "text-[var(--foreground-muted)] border border-[var(--border)]"
                  }`}
                >
                  {done ? "✓" : step.id}
                </motion.div>
                <span
                  className={`mt-2 text-xs font-bold text-center hidden sm:block ${
                    active ? "text-[var(--institutional)]" : "text-[var(--foreground-muted)]"
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 text-[10px] text-[var(--foreground-muted)] text-center hidden md:block truncate w-full px-1">
                  {step.short}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 sm:mx-2 rounded-full transition-colors ${
                    currentStep > step.id ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
