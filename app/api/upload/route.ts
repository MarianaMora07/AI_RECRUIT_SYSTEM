import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import {
  canAssignJobRecruiters,
  isAllowedCvMime,
  MAX_CV_SIZE_BYTES,
} from "@/lib/constants/roles";
import {
  createCandidateFromCv,
  scheduleCandidateBackgroundProcessing,
} from "@/lib/candidates/create-from-cv";
import { logger } from "@/lib/logger";

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

  if (!isAllowedCvMime(file.type)) {
    return jsonError(
      "Formato no permitido. Usa PDF o imagen del CV (JPG, PNG, WebP)."
    );
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    return jsonError("El archivo excede el tamaño máximo de 5MB");
  }

  const profile = await getProfile(user.id, supabase);
  const role = profile?.role ?? "recruiter";

  if (!canAssignJobRecruiters(role)) {
    const { data: assignment } = await supabase
      .from("job_recruiters")
      .select("recruiter_id")
      .eq("job_id", jobId)
      .eq("recruiter_id", user.id)
      .maybeSingle();

    if (!assignment) {
      return jsonError(
        "No estás asignado a esta vacante. Contacta al administrador.",
        403
      );
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const candidateName =
    typeof fullName === "string" && fullName.trim()
      ? fullName.trim().slice(0, 150)
      : "Candidato";
  const candidateEmail =
    typeof email === "string" && email.includes("@")
      ? email.trim()
      : `candidate-${Date.now()}@placeholder.local`;

  let result;
  try {
    result = await createCandidateFromCv({
      supabase,
      jobId,
      assignedRecruiterId: user.id,
      fullName: candidateName,
      email: candidateEmail,
      phone: typeof phone === "string" ? phone.slice(0, 30) : null,
      file,
      buffer,
      changedByUserId: user.id,
      applicationSource: "manual_upload",
      route: "/api/upload",
      actorUserId: user.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "JOB_NOT_FOUND") {
      return jsonError("Vacante no encontrada", 404);
    }
    if (message === "GEMINI_REQUIRED_FOR_IMAGE_CV") {
      return jsonError(
        "Para CVs en imagen se requiere GEMINI_API_KEY configurada.",
        503
      );
    }
    if (message === "EMPTY_CV_TEXT") {
      return jsonError(
        "No se pudo extraer texto del archivo. Prueba con mejor calidad o un PDF."
      );
    }
    if (message === "CANDIDATE_INSERT_FAILED") {
      return jsonError("No se pudo registrar el candidato", 500);
    }
    return jsonError("No se pudo leer el CV");
  }

  const { candidate, job, cvText, storagePath } = result;

  scheduleCandidateBackgroundProcessing({
    candidateId: candidate.id,
    jobId,
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements,
    cvText,
    userId: user.id,
    storagePath,
    buffer,
    fileType: file.type,
    automationPayload: {
      candidateId: candidate.id,
      email: candidate.email,
      fullName: candidate.full_name,
      jobId,
      jobTitle: job.title,
      trackingToken: candidate.public_tracking_token,
    },
    route: "/api/upload",
    actorUserId: user.id,
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
