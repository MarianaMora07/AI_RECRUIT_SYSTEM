"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-red-400/50 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100 shadow-sm transition-all hover:bg-red-600 hover:border-red-600 hover:text-white hover:shadow-md active:scale-[0.98]"
    >
      <span aria-hidden className="text-base">
        ⏻
      </span>
      Cerrar sesión
    </button>
  );
}
