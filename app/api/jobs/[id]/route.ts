import { after } from "next/server";
import { getAuthenticatedClient, getProfile } from "@/lib/api/auth";
import { processJobContent } from "@/lib/ai/process-job";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { JOB_LIST_COLUMNS } from "@/lib/constants/queries";
import { canDeleteJobs } from "@/lib/constants/roles";
import { getJobDeletionCheck } from "@/lib/jobs/delete-job";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateJobSchema } from "@/lib/validations/jobs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_LIST_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) return jsonError("Vacante no encontrada", 404);
  return jsonOk(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(parsed.data)
    .eq("id", id)
    .select(JOB_LIST_COLUMNS)
    .single();

  if (error) return jsonError("No se pudo actualizar", 500);

  const contentChanged =
    parsed.data.title !== undefined ||
    parsed.data.description !== undefined ||
    parsed.data.requirements !== undefined;

  if (contentChanged && process.env.GEMINI_API_KEY) {
    after(async () => {
      await processJobContent({
        jobId: data.id,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        userId: user.id,
      });
    });
  }

  return jsonOk(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  const profile = await getProfile(user.id, supabase);
  if (!canDeleteJobs(profile?.role)) {
    return jsonError("No autorizado", 403);
  }

  const { id } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!job) return jsonError("Vacante no encontrada", 404);

  const admin = createAdminClient();
  const deletionCheck = await getJobDeletionCheck(admin, id);
  if (!deletionCheck.canDelete) {
    return jsonError(deletionCheck.reason ?? "No se puede eliminar esta vacante", 409);
  }

  const { error } = await admin.from("jobs").delete().eq("id", id);

  if (error) {
    return jsonError(
      error.message.includes("policy")
        ? "No tienes permiso para eliminar esta vacante. Verifica tu rol o aplica la migración 014 en Supabase."
        : "No se pudo eliminar la vacante",
      500
    );
  }
  return jsonOk({ deleted: true });
}
