"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

export interface PublicJobCardData {
  id: string;
  title: string;
  description: string;
  requirements_formatted?: string | null;
}

export function PublicJobCard({
  job,
  selected,
  onSelect,
}: {
  job: PublicJobCardData;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-2xl border-2 bg-[var(--surface)] p-5 transition-shadow flex flex-col h-full min-h-[200px] cursor-pointer ${
        selected
          ? "border-[var(--accent)] shadow-lg ring-2 ring-[var(--accent)]/20"
          : "border-[var(--border)] hover:border-[var(--institutional)]/30 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-lg text-[var(--institutional)] leading-tight">
          {job.title}
        </h3>
        {selected ? (
          <Badge variant="success">Seleccionada</Badge>
        ) : (
          <Badge variant="default">Abierta</Badge>
        )}
      </div>
      <p className="text-sm text-[var(--foreground-muted)] line-clamp-4 flex-1 leading-relaxed">
        {job.description}
      </p>
      <p className="mt-4 text-xs font-semibold text-[var(--accent)]">
        {selected ? "Vacante seleccionada" : "Seleccionar vacante →"}
      </p>
    </motion.button>
  );
}
