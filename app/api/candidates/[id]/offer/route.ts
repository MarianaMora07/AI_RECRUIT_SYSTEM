import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { canManagePipeline } from "@/lib/constants/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { preOfferSchema } from "@/lib/validations/offer";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const { data, error } = await supabase
    .from("candidate_offers")
    .select("*")
    .eq("candidate_id", id)
    .maybeSingle();

  if (error) return jsonError("No se pudo cargar la pre-oferta", 500);
  return jsonOk(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const profile = await getProfile(user.id, supabase);
  if (!canManagePipeline(profile?.role)) {
    return jsonError("Solo el Equipo de Talento puede gestionar pre-ofertas.", 403);
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = preOfferSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, job_id, pipeline_stage")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!candidate) return jsonError("Candidato no encontrado", 404);

  if (candidate.pipeline_stage !== "interview_approved") {
    return jsonError(
      "La pre-oferta solo está disponible en etapa Entrevista técnica aprobada.",
      422
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Configuración del servidor incompleta", 500);
  }

  const payload = {
    candidate_id: id,
    job_id: candidate.job_id,
    base_salary: parsed.data.base_salary ?? null,
    bonus: parsed.data.bonus ?? null,
    proposed_start_date: parsed.data.proposed_start_date ?? null,
    internal_approval_notes: parsed.data.internal_approval_notes ?? null,
    status: parsed.data.status ?? "draft",
    updated_by: user.id,
  };

  const { data: existing } = await admin
    .from("candidate_offers")
    .select("id")
    .eq("candidate_id", id)
    .maybeSingle();

  const { data: offer, error } = existing?.id
    ? await admin
        .from("candidate_offers")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await admin
        .from("candidate_offers")
        .insert({ ...payload, created_by: user.id })
        .select("*")
        .single();

  if (error || !offer) {
    logger.error("pre-offer save failed", {
      route: "/api/candidates/[id]/offer",
      message: error?.message,
    });
    return jsonError("No se pudo guardar la pre-oferta", 500);
  }

  return jsonOk(offer);
}
