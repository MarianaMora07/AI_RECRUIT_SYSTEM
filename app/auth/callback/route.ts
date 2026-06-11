import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/login";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  await supabase.auth.signOut();

  const loginUrl = new URL(next, origin);
  loginUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(loginUrl.toString());
}
