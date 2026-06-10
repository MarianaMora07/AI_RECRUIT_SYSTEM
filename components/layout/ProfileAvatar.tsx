"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onUploaded?: (avatarUrl: string) => void;
}

export function ProfileAvatar({
  src,
  name,
  size = "lg",
  editable = false,
  onUploaded,
}: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error al subir");
        return;
      }
      setPreview(data.data.avatar_url);
      onUploaded?.(data.data.avatar_url);
    } catch {
      setError("Error de conexión");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <Avatar src={preview ?? src} name={name} size={size} />
        {editable && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Cambiar foto de perfil"
            >
              {uploading ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <span className="text-white text-xs font-semibold">📷 Cambiar</span>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 text-center max-w-[200px]">{error}</p>
      )}
    </div>
  );
}
