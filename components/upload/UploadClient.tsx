"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface Job {
  id: string;
  title: string;
}

export function UploadClient({
  jobs,
  preselectedJob,
}: {
  jobs: Job[];
  preselectedJob: string;
}) {
  const [jobId, setJobId] = useState("");
  const effectiveJobId = jobId || preselectedJob;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedCandidate, setUploadedCandidate] = useState<{
    id: string;
    full_name: string;
    job_id: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !effectiveJobId) {
      setError("Selecciona una vacante y un archivo PDF");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadedCandidate(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("jobId", effectiveJobId);
    formData.append("fullName", fullName);
    formData.append("email", email);
    if (phone) formData.append("phone", phone);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error al subir el CV");
        return;
      }
      setUploadedCandidate(data.data.candidate);
      setSuccess(
        data.data.aiProcessing
          ? "CV registrado. El análisis con IA se procesará en segundo plano (tarda ~15–30 s)."
          : "CV registrado correctamente"
      );
      setFile(null);
      setFullName("");
      setEmail("");
      setPhone("");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Cargar CV" subtitle="Sube un CV en PDF para evaluación automática con IA" />

      {error && <Alert variant="error" className="mb-4" onClose={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => { setSuccess(""); setUploadedCandidate(null); }}>
          <p>{success}</p>
          {uploadedCandidate && (
            <p className="mt-2 text-sm">
              Ver análisis en{" "}
              <Link
                href={`/candidates/${uploadedCandidate.id}`}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                ficha de {uploadedCandidate.full_name}
              </Link>
              {" "}o en{" "}
              <Link
                href={`/candidates?jobId=${uploadedCandidate.job_id}`}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                lista de candidatos
              </Link>
              .
            </p>
          )}
        </Alert>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
        <Card className="border-[var(--accent)]/15">
          <CardHeader>
            <CardTitle>Ingesta de candidato</CardTitle>
            <p className="text-sm text-[var(--foreground-muted)]">
              El análisis IA se ejecuta en background para una respuesta más rápida
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground-muted)]">Vacante</label>
              <select
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                value={effectiveJobId}
                onChange={(e) => setJobId(e.target.value)}
                required
              >
                <option value="">Seleccionar vacante...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
            <Input label="Nombre del candidato" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Correo del candidato" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-[var(--foreground-muted)]">Archivo PDF (máx. 5MB)</label>
              <input
                type="file"
                accept="application/pdf"
                className="mt-1.5 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:gradient-brand file:text-white"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Subir y analizar
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
