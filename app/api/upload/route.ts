import { after } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { processCandidateAi } from "@/lib/ai/process-candidate";
import { dispatchN8nEvent } from "@/lib/n8n/dispatch";
import { extractTextFromPdf, normalizeCvText } from "@/lib/pdf/parser";
import { logger } from "@/lib/logger";
import { ALLOWED_CV_MIME, MAX_CV_SIZE_BYTES } from "@/lib/constants/roles";
import { sanitizeFilename } from "@/lib/utils/sanitize-filename";

export async function POST(request: Request) {
  const start = Date.now();
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const rl = rateLimit(`upload:${user.id}`, 10, 60_000);
  if (!rl.allowed) {
    return jsonError("Demasiadas solicitudes. Intenta más tarde.", 429);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Formulario inválido");
  }

  const file = formData.get("file");
  const jobId = formData.get("jobId");
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const phone = formData.get("phone");

  if (!(file instanceof File) || typeof jobId !== "string") {
    return jsonError("Archivo y vacante son requeridos");
  }

  if (file.type !== ALLOWED_CV_MIME) {
    return jsonError("Solo se permiten archivos PDF");
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    return jsonError("El archivo excede el tamaño máximo de 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let cvText: string;
  let job: {
    id: string;
    title: string;
    description: string;
    requirements: string;
  } | null = null;

  try {
    const [text, jobRes] = await Promise.all([
      extractTextFromPdf(buffer).then(normalizeCvText),
      supabase
        .from("jobs")
        .select("id, title, description, requirements")
        .eq("id", jobId)
        .single(),
    ]);
    cvText = text;
    job = jobRes.data;
  } catch {
    return jsonError("No se pudo leer el PDF");
  }

  if (!job) {
    return jsonError("Vacante no encontrada", 404);
  }

  const candidateName =
    typeof fullName === "string" && fullName.trim()
      ? fullName.trim().slice(0, 150)
      : "Candidato";
  const candidateEmail =
    typeof email === "string" && email.includes("@")
      ? email.trim()
      : `candidate-${Date.now()}@placeholder.local`;

  const storagePath = `${jobId}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { data: candidate, error: insertError } = await supabase
    .from("candidates")
    .insert({
      job_id: jobId,
      full_name: candidateName,
      email: candidateEmail,
      phone: typeof phone === "string" ? phone.slice(0, 30) : null,
      cv_storage_path: null,
      cv_text: cvText,
      pipeline_stage: "applied",
    })
    .select("id, full_name, email, pipeline_stage, job_id, created_at")
    .single();

  if (insertError || !candidate) {
    logger.error("candidate insert failed", {
      route: "/api/upload",
      userId: user.id,
    });
    return jsonError("No se pudo registrar el candidato", 500);
  }

  const backgroundParams = {
    candidateId: candidate.id,
    jobId,
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements,
    cvText,
    userId: user.id,
    storagePath,
    buffer,
    n8nPayload: {
      candidateId: candidate.id,
      email: candidate.email,
      fullName: candidate.full_name,
      jobId,
      jobTitle: job.title,
    },
  };

  after(async () => {
    logger.info("background processing started", {
      route: "/api/upload",
      userId: user.id,
      candidateId: candidate.id,
    });

    const { createAdminClient } = await import("@/lib/supabase/admin");
    let bgSupabase;
    try {
      bgSupabase = createAdminClient();
    } catch (err) {
      logger.error("background upload skipped, no admin client", {
        route: "/api/upload",
        userId: user.id,
        message: err instanceof Error ? err.message : "unknown",
      });
      if (process.env.GEMINI_API_KEY) {
        await processCandidateAi(backgroundParams);
      }
      return;
    }

    const { error: uploadError } = await bgSupabase.storage
      .from("cvs")
      .upload(storagePath, buffer, {
        contentType: ALLOWED_CV_MIME,
        upsert: false,
      });

    if (!uploadError) {
      await bgSupabase
        .from("candidates")
        .update({ cv_storage_path: storagePath })
        .eq("id", candidate.id);
    } else {
      logger.warn("storage upload failed in background", {
        route: "/api/upload",
        userId: user.id,
      });
    }

    void dispatchN8nEvent("candidate.created", backgroundParams.n8nPayload);

    if (process.env.GEMINI_API_KEY) {
      await processCandidateAi(backgroundParams);
    }
  });

  logger.info("upload completed", {
    route: "/api/upload",
    userId: user.id,
    durationMs: Date.now() - start,
  });

  return jsonOk(
    {
      candidate,
      aiProcessing: Boolean(process.env.GEMINI_API_KEY),
    },
    201
  );
}
