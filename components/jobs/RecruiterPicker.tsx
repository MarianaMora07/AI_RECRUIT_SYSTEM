"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";

export interface RecruiterOption {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

export function RecruiterPicker({
  selected,
  onChange,
  disabled = false,
  maxHeight = "max-h-48",
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  maxHeight?: string;
}) {
  const [recruiters, setRecruiters] = useState<RecruiterOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/recruiters")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRecruiters(data.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    if (disabled) return;
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (recruiters.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-muted)] py-4 text-center">
        No hay reclutadores registrados en el sistema.
      </p>
    );
  }

  return (
    <div
      className={`space-y-1 overflow-y-auto border border-[var(--border)] rounded-xl p-2 ${maxHeight}`}
    >
      {recruiters.map((r) => (
        <label
          key={r.id}
          className={`flex items-center gap-3 text-sm rounded-lg px-2 py-2 cursor-pointer transition-colors ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[var(--accent-soft)]/40"
          } ${selected.includes(r.id) ? "bg-[var(--accent-soft)]/50" : ""}`}
        >
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            onChange={() => toggle(r.id)}
            disabled={disabled}
            className="rounded border-[var(--border)]"
          />
          <Avatar name={r.full_name ?? "?"} src={r.avatar_url} size="sm" />
          <span className="font-medium">{r.full_name ?? "Reclutador"}</span>
        </label>
      ))}
    </div>
  );
}
