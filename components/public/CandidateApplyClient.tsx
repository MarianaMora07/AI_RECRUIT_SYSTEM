"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { CV_ACCEPT_ATTRIBUTE } from "@/lib/constants/roles";
import { CopyTrackingLink } from "@/components/track/CopyTrackingLink";
import { getCandidateTrackingUrl } from "@/lib/utils/candidate-tracking";
import { ApplyStepper } from "@/components/public/ApplyStepper";
import { PublicJobCard, type PublicJobCardData } from "@/components/public/PublicJobCard";
import { ApplyOrderSummary } from "@/components/public/ApplyOrderSummary";

interface PublicRecruiter {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25 },
};

export function CandidateApplyClient() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId") ?? "";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [jobs, setJobs] = useState<PublicJobCardData[]>([]);
  const [recruiters, setRecruiters] = useState<PublicRecruiter[]>([]);
  const [jobId, setJobId] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const effectiveJobId = jobId || preselectedJobId;
  const selectedJob = jobs.find((j) => j.id === effectiveJobId);
  const selectedRecruiter = recruiters.find((r) => r.id === recruiterId);

  useEffect(() => {
    void fetch("/api/public/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJobs(data.data ?? []);
      })
      .finally(() => setLoadingJobs(false));
  }, []);

  useEffect(() => {
    if (preselectedJobId && jobs.some((j) => j.id === preselectedJobId)) {
      setJobId(preselectedJobId);
      setStep(2);
    }
  }, [preselectedJobId, jobs]);

  useEffect(() => {
    if (!effectiveJobId) {
      setRecruiters([]);
      setRecruiterId("");
      return;
    }

    setLoadingRecruiters(true);
    void fetch(`/api/public/jobs/${effectiveJobId}/recruiters`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list = (data.data as PublicRecruiter[]) ?? [];
          setRecruiters(list);
          setRecruiterId(list.length === 1 ? list[0].id : "");
        }
      })
      .finally(() => setLoadingRecruiters(false));
  }, [effectiveJobId]);

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

  function selectJob(id: string) {
    setJobId(id);
    setError("");
  }

  function goToStep2() {
    if (!effectiveJobId) {
      setError("Selecciona una vacante para continuar");
      return;
    }
    setError("");
    setStep(2);
  }

  function goToStep3() {
    if (recruiters.length === 0) {
      setError("Esta vacante no tiene reclutadores disponibles");
      return;
    }
    if (!recruiterId) {
      setError("Selecciona el reclutador que gestionará tu proceso");
      return;
    }
    setError("");
    setStep(3);
  }

  async function handleSubmit() {
    if (!fullName.trim() || !email.includes("@")) {
      setError("Completa nombre y correo válido");
      return;
    }
    if (!file || !effectiveJobId || !recruiterId) {
      setError("Debes cargar tu CV para finalizar");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("jobId", effectiveJobId);
    formData.append("recruiterId", recruiterId);
    formData.append("fullName", fullName.trim());
    formData.append("email", email.trim());
    if (phone) formData.append("phone", phone);

    const res = await fetch("/api/public/apply", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Error al enviar la postulación");
      return;
    }

    setSuccess("¡Postulación enviada correctamente!");
    setTrackingToken(data.data?.candidate?.public_tracking_token ?? null);
    setStep(4);
  }

  if (success && step === 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-emerald-500/30 bg-emerald-50/30 text-center p-8">
            <span className="text-5xl mb-4 block" aria-hidden>
              🎉
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--institutional)] mb-2">
              ¡Postulación recibida!
            </h2>
            <p className="text-[var(--foreground-muted)] mb-6">
              Tu CV será analizado automáticamente. Guarda el enlace de seguimiento.
            </p>
            {trackingToken && (
              <CopyTrackingLink
                url={getCandidateTrackingUrl(trackingToken)}
                candidateName={fullName}
                jobTitle={selectedJob?.title}
              />
            )}
            <Button
              className="mt-6"
              variant="secondary"
              onClick={() => {
                setSuccess("");
                setTrackingToken(null);
                setStep(1);
                setJobId("");
                setFile(null);
                setFullName("");
                setEmail("");
                setPhone("");
              }}
            >
              Postular a otra vacante
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Portal de candidatos"
        subtitle="Postula en 3 pasos — vacante, reclutador y tus datos con CV"
      />

      <ApplyStepper currentStep={step} />

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...stepMotion}>
                <Card className="border-[var(--border)]">
                  <CardHeader>
                    <CardTitle>Paso 1 — Elige una vacante</CardTitle>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Explora las posiciones abiertas y selecciona la que te interese
                    </p>
                  </CardHeader>

                  {loadingJobs ? (
                    <div className="flex justify-center py-16">
                      <Spinner size="lg" />
                    </div>
                  ) : jobs.length === 0 ? (
                    <Alert variant="info" title="Sin vacantes disponibles">
                      No hay vacantes abiertas con reclutadores asignados en este momento.
                    </Alert>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {jobs.map((job) => (
                        <PublicJobCard
                          key={job.id}
                          job={job}
                          selected={effectiveJobId === job.id}
                          onSelect={() => selectJob(job.id)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Button size="lg" onClick={goToStep2} disabled={!effectiveJobId}>
                      Continuar →
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" {...stepMotion}>
                <Card>
                  <CardHeader>
                    <CardTitle>Paso 2 — Elige tu reclutador</CardTitle>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Selecciona quién gestionará tu proceso para esta vacante
                    </p>
                  </CardHeader>

                  <div className="space-y-4">
                    {selectedJob && (
                      <div className="rounded-xl bg-[var(--accent-soft)]/50 border border-[var(--accent)]/20 px-4 py-3 text-sm">
                        <span className="text-[var(--foreground-muted)]">Vacante: </span>
                        <span className="font-bold">{selectedJob.title}</span>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="ml-2 text-[var(--accent)] text-xs font-semibold hover:underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}

                    {loadingRecruiters ? (
                      <div className="flex justify-center py-12">
                        <Spinner size="lg" />
                      </div>
                    ) : recruiters.length === 0 ? (
                      <Alert variant="warning">
                        Esta vacante no tiene reclutadores asignados. Elige otra vacante.
                      </Alert>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {recruiters.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRecruiterId(r.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                              recruiterId === r.id
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-md"
                                : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-sm"
                            }`}
                          >
                            <Avatar
                              name={r.full_name ?? "Reclutador"}
                              src={r.avatar_url}
                              size="md"
                            />
                            <div>
                              <p className="font-bold text-[var(--institutional)]">
                                {r.full_name ?? "Reclutador"}
                              </p>
                              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                {recruiterId === r.id ? "Seleccionado" : "Seleccionar →"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 justify-between">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      ← Volver
                    </Button>
                    <Button
                      size="lg"
                      onClick={goToStep3}
                      disabled={!recruiterId || recruiters.length === 0}
                    >
                      Continuar →
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" {...stepMotion}>
                <Card>
                  <CardHeader>
                    <CardTitle>Paso 3 — Tus datos y CV</CardTitle>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Completa tu información y carga tu currículum para el análisis
                    </p>
                  </CardHeader>

                  <div className="space-y-4 mb-6">
                    {selectedJob && selectedRecruiter && (
                      <div className="rounded-xl bg-[var(--institutional-light)]/60 border border-[var(--border)] px-4 py-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <span className="text-[var(--foreground-muted)]">Vacante: </span>
                          <span className="font-bold">{selectedJob.title}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[var(--foreground-muted)]">Reclutador: </span>
                          <Avatar
                            name={selectedRecruiter.full_name ?? "?"}
                            src={selectedRecruiter.avatar_url}
                            size="sm"
                          />
                          <span className="font-bold">{selectedRecruiter.full_name}</span>
                        </span>
                      </div>
                    )}

                    <Input
                      label="Nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    <Input
                      label="Correo electrónico"
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
                  </div>

                  <label className="text-sm font-medium text-[var(--foreground-muted)] block mb-2">
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
                    className={`w-full rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all cursor-pointer ${
                      dragOver
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.01]"
                        : file
                          ? "border-emerald-500/50 bg-emerald-50/40"
                          : "border-[var(--border)] bg-[var(--surface-hover)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span className="text-5xl block mb-3" aria-hidden>
                      {file ? "✅" : "📄"}
                    </span>
                    <p className="font-bold text-lg">
                      {file ? file.name : "Arrastra tu CV o haz clic aquí"}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-2">
                      PDF · JPG · PNG · WebP — máximo 5 MB
                    </p>
                  </button>

                  <div className="mt-6 flex flex-wrap gap-3 justify-between">
                    <Button variant="secondary" onClick={() => setStep(2)}>
                      ← Volver
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      loading={loading}
                      disabled={!file || !fullName.trim() || !email.includes("@")}
                    >
                      Enviar postulación
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block">
          <ApplyOrderSummary
            step={step}
            jobTitle={selectedJob?.title}
            recruiterName={selectedRecruiter?.full_name}
            recruiterAvatar={selectedRecruiter?.avatar_url}
            fullName={fullName}
            email={email}
            fileName={file?.name ?? null}
          />
        </aside>
      </div>
    </div>
  );
}
