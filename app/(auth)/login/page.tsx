"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    setLoading(false);
    if (authError) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full gradient-brand blur-3xl"
              style={{ width: 200 + i * 80, height: 200 + i * 80, left: `${i * 20}%`, top: `${i * 15}%` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5 + i, repeat: Infinity }}
            />
          ))}
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="mb-6">
            <Logo size="lg" variant="light" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Reclutamiento inteligente
          </h2>
          <p className="text-white/70 leading-relaxed">
            Parsea CVs, rankea candidatos con IA y acelera tu proceso de contratación con una plataforma moderna y eficiente.
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
              <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Accede a tu panel de reclutamiento
              </p>
            </CardHeader>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Entrar
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                Regístrate
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
