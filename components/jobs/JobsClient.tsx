"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";

export function JobsClient({
  initialJobs,
  highlightJobId,
}: {
  initialJobs: JobCardData[];
  highlightJobId?: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    status: "open",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Error al crear vacante");
      return;
    }

    setSuccess(
      "Vacante creada. Los requisitos se formatearán con IA en unos segundos."
    );
    setForm({ title: "", description: "", requirements: "", status: "open" });
    setShowForm(false);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Vacantes"
        subtitle={`${initialJobs.length} posición${initialJobs.length !== 1 ? "es" : ""} registrada${initialJobs.length !== 1 ? "s" : ""}`}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nueva vacante"}
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {showForm && (
        <div className="mb-6">
          <Card className="border-[var(--accent)]/20">
            <CardHeader>
              <CardTitle>Crear vacante</CardTitle>
            </CardHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <div>
                <label className="text-sm font-medium text-[var(--foreground-muted)]">
                  Descripción
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm min-h-[100px] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--foreground-muted)]">
                  Requisitos técnicos
                </label>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5 mb-1.5">
                  Puedes pegar texto libre; la IA lo organizará en listas al
                  guardar.
                </p>
                <textarea
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm min-h-[120px] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  value={form.requirements}
                  onChange={(e) =>
                    setForm({ ...form, requirements: e.target.value })
                  }
                  placeholder="Ej: React avanzado, TypeScript, testing con Jest..."
                  required
                />
              </div>
              <Button type="submit" loading={saving}>
                Guardar vacante
              </Button>
            </form>
          </Card>
        </div>
      )}

      {initialJobs.length === 0 ? (
        <Alert variant="info" title="Sin vacantes">
          Crea tu primera vacante para comenzar a recibir candidatos.
        </Alert>
      ) : (
        <>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Pasa el cursor sobre una tarjeta para ver la descripción completa y
            los requisitos formateados.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 items-stretch">
            {initialJobs.map((job) => (
              <div key={job.id} className="min-h-[220px]">
                <JobCard job={job} highlighted={highlightJobId === job.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
