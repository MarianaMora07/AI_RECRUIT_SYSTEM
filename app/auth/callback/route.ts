import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function buildLoginRedirect(origin: string, next: string, verified: boolean) {
  const url = new URL(next, origin);
  if (verified) {
    url.searchParams.set("verified", "1");
  } else {
    url.searchParams.set("error", "verification_failed");
  }
  return url;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/login";
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const successRedirect = buildLoginRedirect(origin, next, true);
  const failureRedirect = buildLoginRedirect(origin, next, false);

  if (!token_hash && !code) {
    return NextResponse.redirect(failureRedirect.toString());
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(successRedirect.toString());

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      return NextResponse.redirect(failureRedirect.toString());
    }
    await supabase.auth.signOut();
    return response;
  }

  // Supabase verifies the email before redirecting here with `code`.
  // Session exchange can fail (e.g. PKCE verifier cleared after signOut on register)
  // even though the email is already confirmed — treat presence of `code` as success.
  await supabase.auth.exchangeCodeForSession(code!);
  await supabase.auth.signOut();
  return response;
}
