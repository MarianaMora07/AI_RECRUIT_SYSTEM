import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { PROFILE_COLUMNS } from "@/lib/constants/queries";
import { z } from "zod";

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
});

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return jsonError("Perfil no encontrado", 404);
  }

  return jsonOk(data);
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) return jsonError("No se pudo actualizar el perfil", 500);
  return jsonOk(data);
}
