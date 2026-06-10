import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthOptions = {
  /** Valida el JWT contra Supabase Auth. Usar en mutaciones sensibles. */
  strict?: boolean;
};

/** Una sola validación por request en Server Components (deduplicada con cache). */
export const getServerAuth = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null as User | null };
  return { supabase, user };
});

export async function getAuthenticatedClient(
  options: AuthOptions = {}
): Promise<{
  supabase: SupabaseClient;
  user: User | null;
}> {
  if (!options.strict) {
    return getServerAuth();
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function getSessionUser(strict = false) {
  const { user } = await getAuthenticatedClient({ strict });
  return user;
}

export async function requireUser() {
  const user = await getSessionUser(true);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function getProfile(
  userId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}
