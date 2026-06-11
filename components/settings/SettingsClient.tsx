"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProfileAvatar } from "@/components/layout/ProfileAvatar";
import { Badge } from "@/components/ui/Badge";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

export function SettingsClient({ profile: initial }: { profile: Profile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const roleLabel =
    ROLE_LABELS[profile.role as UserRole] ?? profile.role;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Error al guardar");
      return;
    }
    setProfile(data.data);
    setSuccess("Perfil actualizado correctamente");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Mi perfil" subtitle="Personaliza tu cuenta, foto y contraseña" />

      {error && <Alert variant="error" className="mb-4" onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" className="mb-4" onClose={() => setSuccess("")}>{success}</Alert>}

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="text-center">
            <ProfileAvatar
              src={profile.avatar_url}
              name={profile.full_name ?? profile.email}
              size="xl"
              editable
              onUploaded={(url) => {
                setProfile((p) => ({ ...p, avatar_url: url }));
                router.refresh();
              }}
            />
            <p className="mt-4 font-bold text-lg">{profile.full_name || "Usuario"}</p>
            <p className="text-sm text-[var(--foreground-muted)]">{profile.email}</p>
            <Badge variant="info" className="mt-3">{roleLabel}</Badge>
            <p className="mt-4 text-xs text-[var(--foreground-subtle)]">JPG, PNG o WebP · máx. 2MB</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input label="Correo electrónico" value={profile.email} disabled />
              <Button type="submit" loading={saving}>Guardar cambios</Button>
            </form>
          </Card>
          <ChangePasswordForm />
        </motion.div>
      </div>
    </div>
  );
}
