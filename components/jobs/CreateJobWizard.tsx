"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Stepper, type StepperStep } from "@/components/ui/Stepper";
import { RecruiterPicker } from "@/components/jobs/RecruiterPicker";
import { JOB_PRIORITY_LABELS, WORK_MODE_LABELS } from "@/lib/constants/dashboard";
import { JOB_STATUSES } from "@/lib/constants/roles";

const STEP_DATA = { id: 1, label: "Datos", short: "Título y descripción" };
const STEP_REQUIREMENTS = { id: 2, label: "Requisitos", short: "Perfil técnico" };
const STEP_RECRUITERS = { id: 3, label: "Reclutadores", short: "Equipo asignado" };

export function CreateJobWizard({
  canAssignRecruiters,
  onCancel,
  onSuccess,
}: {
  canAssignRecruiters: boolean;
  onCancel: () => void;
  onSuccess?: (message: string) => void;
}) {
  const router = useRouter();
  const steps: StepperStep[] = useMemo(
    () =>
      canAssignRecruiters
        ? [STEP_DATA, STEP_REQUIREMENTS, STEP_RECRUITERS]
        : [STEP_DATA, STEP_REQUIREMENTS],
    [canAssignRecruiters]
  );

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    status: "open" as (typeof JOB_STATUSES)[number],
    department: "",
    location: "",
    work_mode: "" as "" | "remote" | "hybrid" | "onsite",
    priority: "standard" as "urgent" | "standard",
  });
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>([]);

  const isLastStep = step === steps.length;

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (form.title.trim().length < 3) return "El título debe tener al menos 3 caracteres";
      if (form.description.trim().length < 10) {
        return "La descripción debe tener al menos 10 caracteres";
      }
    }
    if (current === 2) {
      if (form.requirements.trim().length < 10) {
        return "Los requisitos deben tener al menos 10 caracteres";
      }
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    if (!isLastStep) setStep((s) => s + 1);
  }

  function goBack() {
    setError("");
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleCreate() {
    const validationError = validateStep(2);
    if (validationError) {
      setError(validationError);
      setStep(2);
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        status: form.status,
        ...(form.department.trim() && { department: form.department.trim() }),
        ...(form.location.trim() && { location: form.location.trim() }),
        ...(form.work_mode && { work_mode: form.work_mode }),
        priority: form.priority,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      setSaving(false);
      setError(data.error ?? "Error al crear la vacante");
      return;
    }

    const jobId = data.data.id as string;

    if (canAssignRecruiters && selectedRecruiters.length > 0) {
      const assignRes = await fetch(`/api/jobs/${jobId}/recruiters`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterIds: selectedRecruiters }),
      });
      const assignData = await assignRes.json();
      setSaving(false);

      if (!assignData.success) {
        setError(
          assignData.error ??
            "Vacante creada, pero no se pudieron asignar los reclutadores. Asígnalos desde la tarjeta de la vacante."
        );
        router.refresh();
        return;
      }
    } else {
      setSaving(false);
    }

    const message =
      canAssignRecruiters && selectedRecruiters.length > 0
        ? "Vacante creada y reclutadores asignados. Los requisitos se formatearán con IA en unos segundos."
        : "Vacante creada. Los requisitos se formatearán con IA en unos segundos.";

    onSuccess?.(message);
    router.refresh();
  }

  return (
    <Card className="mb-6 border-[var(--accent)]/20">
      <CardHeader>
        <CardTitle>Nueva vacante</CardTitle>
      </CardHeader>

      <Stepper steps={steps} currentStep={step} ariaLabel="Progreso de creación" />

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Título de la vacante"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej: Desarrollador Frontend Senior"
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--foreground-muted)]">
              Descripción
            </label>
            <textarea
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm min-h-[120px] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe el rol, responsabilidades y contexto del equipo..."
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Departamento (opcional)"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Ej: Ingeniería"
            />
            <Input
              label="Ubicación (opcional)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ej: Santiago"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground-muted)]">
                Modalidad
              </label>
              <select
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 cursor-pointer"
                value={form.work_mode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    work_mode: e.target.value as typeof form.work_mode,
                  })
                }
              >
                <option value="">Sin especificar</option>
                {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground-muted)]">
                Prioridad
              </label>
              <select
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 cursor-pointer"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as typeof form.priority,
                  })
                }
              >
                {Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--foreground-muted)]">
              Estado inicial
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 cursor-pointer"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as (typeof JOB_STATUSES)[number],
                })
              }
            >
              <option value="open">Abierta</option>
              <option value="draft">Borrador</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--foreground-muted)]">
              Requisitos técnicos
            </label>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5 mb-1.5">
              Puedes pegar texto libre; la IA lo organizará en listas al guardar.
            </p>
            <textarea
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm min-h-[160px] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="Ej: React avanzado, TypeScript, testing con Jest..."
              required
            />
          </div>
        </div>
      )}

      {step === 3 && canAssignRecruiters && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            Selecciona los reclutadores que gestionarán esta vacante. Si la dejas
            abierta sin reclutadores, no aparecerá en el portal de candidatos.
          </p>
          {form.status === "open" && selectedRecruiters.length === 0 && (
            <Alert variant="warning">
              Recomendamos asignar al menos un reclutador para vacantes abiertas.
            </Alert>
          )}
          <RecruiterPicker
            selected={selectedRecruiters}
            onChange={setSelectedRecruiters}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 justify-between border-t border-[var(--border)] pt-4">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          {step > 1 && (
            <Button variant="secondary" onClick={goBack} disabled={saving}>
              ← Volver
            </Button>
          )}
        </div>
        {isLastStep ? (
          <Button onClick={handleCreate} loading={saving}>
            Crear vacante
          </Button>
        ) : (
          <Button onClick={goNext}>Siguiente →</Button>
        )}
      </div>
    </Card>
  );
}
