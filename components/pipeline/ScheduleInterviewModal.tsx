"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

function defaultDateTimeLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: "10:00",
  };
}

export function ScheduleInterviewModal({
  open,
  onClose,
  onConfirm,
  candidateName,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
  candidateName?: string;
  loading?: boolean;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      const defaults = defaultDateTimeLocal();
      setDate(defaults.date);
      setTime(defaults.time);
      setError("");
    }
  }, [open]);

  function handleConfirm() {
    if (!date || !time) {
      setError("Selecciona fecha y hora");
      return;
    }
    const scheduled = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduled.getTime())) {
      setError("Fecha u hora inválida");
      return;
    }
    if (scheduled.getTime() < Date.now()) {
      setError("La entrevista debe ser en el futuro");
      return;
    }
    onConfirm(scheduled.toISOString());
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Programar entrevista"
      variant="default"
      confirmLabel="Confirmar y avanzar"
      onConfirm={handleConfirm}
      loading={loading}
    >
      <p className="text-sm text-[var(--foreground-muted)] mb-4">
        {candidateName ? (
          <>
            Indica cuándo se realizará la entrevista con{" "}
            <strong>{candidateName}</strong>.
          </>
        ) : (
          "Indica la fecha y hora de la entrevista."
        )}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input
          label="Fecha"
          type="date"
          min={today}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError("");
          }}
        />
        <Input
          label="Hora"
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            setError("");
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
