"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = registerSchema.safeParse({ ...form, role: "recruiter" });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          role: parsed.data.role,
        },
      },
    });

    setLoading(false);
    if (authError) {
      setError("No se pudo crear la cuenta. Intenta con otro correo.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-white max-w-md">
          <div className="mb-6">
            <Logo size="lg" variant="light" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Únete al futuro del reclutamiento
          </h2>
          <p className="text-white/70 leading-relaxed">
            Crea tu cuenta y comienza a gestionar candidatos con inteligencia artificial en minutos.
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
              <CardTitle className="text-2xl">Crear cuenta</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Únete como reclutador
              </p>
            </CardHeader>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="fullName"
                label="Nombre completo"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Registrarse
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
