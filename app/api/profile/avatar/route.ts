import { getAuthenticatedClient } from "@/lib/api/auth";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { PROFILE_COLUMNS } from "@/lib/constants/queries";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Formulario inválido");
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return jsonError("Imagen requerida");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("Solo JPG, PNG o WebP");
  }

  if (file.size > MAX_SIZE) {
    return jsonError("La imagen no puede superar 2MB");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return jsonError("No se pudo subir la imagen", 500);
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) return jsonError("No se pudo guardar el avatar", 500);
  return jsonOk(data);
}
