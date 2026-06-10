"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { CV_ACCEPT_ATTRIBUTE } from "@/lib/constants/roles";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState("");
  const effectiveJobId = jobId || preselectedJob;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedCandidate, setUploadedCandidate] = useState<{
    id: string;
    full_name: string;
    job_id: string;
  } | null>(null);

  function pickFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowed.includes(next.type)) {
      setError("Formato no válido. Usa PDF o imagen (JPG, PNG, WebP).");
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setError("El archivo excede 5 MB.");
      return;
    }
    setError("");
    setFile(next);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !effectiveJobId) {
      setError("Selecciona una vacante y un archivo de CV");
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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="max-w-2xl mx-auto w-full">
      <PageHeader
        title="Cargar CV"
        subtitle="Sube un currículum en PDF o imagen para evaluación automática con IA"
      />

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          variant="success"
          className="mb-4"
          onClose={() => {
            setSuccess("");
            setUploadedCandidate(null);
          }}
        >
          <p>{success}</p>
          {uploadedCandidate && (
            <p className="mt-2 text-sm">
              Ver análisis en{" "}
              <Link
                href={`/candidates/${uploadedCandidate.id}`}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                ficha de {uploadedCandidate.full_name}
              </Link>{" "}
              o en{" "}
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

      <Card className="border-[var(--accent)]/15">
        <CardHeader className="text-center">
          <CardTitle>Ingesta de candidato</CardTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            Completa los datos y arrastra o haz clic en la zona para subir el CV
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-[var(--foreground-muted)]">
              Vacante
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              value={effectiveJobId}
              onChange={(e) => setJobId(e.target.value)}
              required
            >
              <option value="">Seleccionar vacante...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Nombre del candidato"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Correo del candidato"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex flex-col items-center">
            <label className="text-sm font-medium text-[var(--foreground-muted)] mb-2 self-start w-full">
              Archivo del CV
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={CV_ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.01]"
                  : file
                    ? "border-emerald-500/50 bg-emerald-50/50"
                    : "border-[var(--border)] bg-[var(--surface-hover)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              <span className="text-4xl block mb-3" aria-hidden>
                {file ? "✅" : "📄"}
              </span>
              <p className="font-bold text-base text-[var(--foreground)]">
                {file
                  ? file.name
                  : "Haz clic aquí para seleccionar tu CV"}
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-2">
                o arrastra y suelta el archivo en esta zona
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-3">
                PDF · JPG · PNG · WebP — máximo 5 MB
              </p>
              {file && (
                <p className="text-xs text-[var(--accent)] mt-2 font-semibold">
                  Archivo listo · pulsa &quot;Subir y analizar&quot; abajo
                </p>
              )}
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
            disabled={!file}
          >
            Subir y analizar
          </Button>
        </form>
      </Card>
    </div>
  );
}
