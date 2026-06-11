"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/email-verification";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  async function handleResend() {
    if (!email) {
      setResendError("No hay un correo asociado. Regístrate de nuevo.");
      return;
    }

    setResending(true);
    setResendMessage("");
    setResendError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl("/login"),
      },
    });

    setResending(false);
    if (error) {
      setResendError("No se pudo reenviar el correo. Intenta más tarde.");
      return;
    }
    setResendMessage("Te enviamos un nuevo enlace de verificación.");
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-dark items-center justify-center p-12">
        <div className="text-white max-w-md">
          <div className="mb-6">
            <Logo size="lg" variant="light" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4">Revisa tu correo</h2>
          <p className="text-white/70 leading-relaxed">
            Por seguridad, debes confirmar tu correo antes de acceder al panel.
            El enlace expira en unos minutos.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[var(--background)] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-[var(--shadow-lg)] border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Te enviamos un enlace de confirmación
                {email ? (
                  <>
                    {" "}
                    a <span className="font-semibold text-[var(--foreground)]">{email}</span>
                  </>
                ) : (
                  " a tu correo electrónico"
                )}
                .
              </p>
            </CardHeader>

            <div className="space-y-4 text-sm text-[var(--foreground-muted)]">
              <p>1. Abre el correo de confirmación.</p>
              <p>2. Haz clic en el enlace para activar tu cuenta.</p>
              <p>3. Vuelve aquí e inicia sesión con tus credenciales.</p>
            </div>

            {resendError && (
              <Alert variant="error" className="mt-4">
                {resendError}
              </Alert>
            )}
            {resendMessage && (
              <Alert variant="success" className="mt-4">
                {resendMessage}
              </Alert>
            )}

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                loading={resending}
                onClick={handleResend}
                disabled={!email}
              >
                Reenviar correo de verificación
              </Button>
              <Link href="/login" className="block">
                <Button type="button" className="w-full" size="lg">
                  Ir a iniciar sesión
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
              ¿Correo incorrecto?{" "}
              <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                Registrarse de nuevo
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
