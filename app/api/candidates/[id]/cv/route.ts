import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { id } = await params;

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("id, cv_storage_path")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !candidate) {
    return jsonError("Candidato no encontrado", 404);
  }

  if (!candidate.cv_storage_path) {
    return jsonError("No hay archivo de CV almacenado", 404);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Servicio no disponible", 503);
  }

  const { data: signed, error: signError } = await admin.storage
    .from("cvs")
    .createSignedUrl(candidate.cv_storage_path, 60);

  if (signError || !signed?.signedUrl) {
    return jsonError("No se pudo generar el enlace del CV", 500);
  }

  const fileName = candidate.cv_storage_path.split("/").pop() ?? "cv";
  const lower = fileName.toLowerCase();
  let mimeType = "application/octet-stream";
  if (lower.endsWith(".pdf")) mimeType = "application/pdf";
  else if (lower.endsWith(".png")) mimeType = "image/png";
  else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mimeType = "image/jpeg";
  else if (lower.endsWith(".webp")) mimeType = "image/webp";

  return jsonOk({
    url: signed.signedUrl,
    mimeType,
    fileName,
  });
}
