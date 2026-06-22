import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createCandidateFromCv,
  scheduleCandidateBackgroundProcessing,
} from "@/lib/candidates/create-from-cv";
import { isAllowedCvMime, MAX_CV_SIZE_BYTES } from "@/lib/constants/roles";
import { publicApplySchema } from "@/lib/validations/candidates";
import { logger } from "@/lib/logger";

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`public-apply:${ip}`, 5, 60_000);
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
  const recruiterId = formData.get("recruiterId");
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const phone = formData.get("phone");

  if (!(file instanceof File)) {
    return jsonError("Archivo de CV requerido");
  }

  const parsed = publicApplySchema.safeParse({
    jobId: typeof jobId === "string" ? jobId : "",
    recruiterId: typeof recruiterId === "string" ? recruiterId : "",
    fullName: typeof fullName === "string" ? fullName : "",
    email: typeof email === "string" ? email : "",
    phone: typeof phone === "string" ? phone : undefined,
  });

  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  if (!isAllowedCvMime(file.type)) {
    return jsonError(
      "Formato no permitido. Usa PDF o imagen del CV (JPG, PNG, WebP)."
    );
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    return jsonError("El archivo excede el tamaño máximo de 5MB");
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return jsonError("Servicio no disponible", 503);
  }

  const { jobId: validJobId, recruiterId: validRecruiterId, fullName: validName, email: validEmail, phone: validPhone } =
    parsed.data;

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, description, requirements, status")
    .eq("id", validJobId)
    .single();

  if (!job || job.status !== "open") {
    return jsonError("Vacante no disponible", 404);
  }

  const { data: assignment } = await supabase
    .from("job_recruiters")
    .select("recruiter_id")
    .eq("job_id", validJobId)
    .eq("recruiter_id", validRecruiterId)
    .maybeSingle();

  if (!assignment) {
    return jsonError("Reclutador no válido para esta vacante", 400);
  }

  const { data: recruiter } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", validRecruiterId)
    .single();

  if (!recruiter || recruiter.role !== "recruiter") {
    return jsonError("Reclutador no válido", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let result;
  try {
    result = await createCandidateFromCv({
      supabase,
      jobId: validJobId,
      assignedRecruiterId: validRecruiterId,
      fullName: validName.trim(),
      email: validEmail.trim(),
      phone: validPhone?.slice(0, 30) ?? null,
      file,
      buffer,
      changedByUserId: null,
      applicationSource: "public_portal",
      route: "/api/public/apply",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "GEMINI_REQUIRED_FOR_IMAGE_CV") {
      return jsonError(
        "Para CVs en imagen se requiere configuración adicional.",
        503
      );
    }
    if (message === "EMPTY_CV_TEXT") {
      return jsonError(
        "No se pudo extraer texto del archivo. Prueba con mejor calidad o un PDF."
      );
    }
    logger.error("public apply failed", { message });
    return jsonError("No se pudo registrar la postulación", 500);
  }

  const { candidate, job: jobData, cvText, storagePath } = result;

  scheduleCandidateBackgroundProcessing({
    candidateId: candidate.id,
    jobId: validJobId,
    jobTitle: jobData.title,
    jobDescription: jobData.description,
    jobRequirements: jobData.requirements,
    cvText,
    userId: validRecruiterId,
    storagePath,
    buffer,
    fileType: file.type,
    automationPayload: {
      candidateId: candidate.id,
      email: candidate.email,
      fullName: candidate.full_name,
      jobId: validJobId,
      jobTitle: jobData.title,
      trackingToken: candidate.public_tracking_token,
    },
    route: "/api/public/apply",
  });

  return jsonOk(
    {
      candidate,
      trackingUrl: candidate.public_tracking_token
        ? `/track/${candidate.public_tracking_token}`
        : null,
      aiProcessing: Boolean(process.env.GEMINI_API_KEY),
    },
    201
  );
}
