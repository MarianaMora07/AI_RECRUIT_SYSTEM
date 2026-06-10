"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "./LogoutButton";
import { APP_TAGLINE } from "@/lib/constants/branding";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/jobs", label: "Vacantes", icon: "💼" },
  { href: "/upload", label: "Cargar CV", icon: "📄" },
  { href: "/candidates", label: "Candidatos", icon: "👥" },
  { href: "/pipeline", label: "Pipeline", icon: "🔄" },
  { href: "/settings", label: "Mi perfil", icon: "⚙️" },
];

export interface ShellProfile {
  full_name?: string | null;
  email?: string;
  avatar_url?: string | null;
}

export function Sidebar({
  profile,
  onNavigate,
}: {
  profile: ShellProfile | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col gradient-dark text-white">
      <div className="p-5 border-b border-white/10">
        <Logo size="md" variant="light" />
        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-2 ml-1">
          {APP_TAGLINE}
        </p>
      </div>

      <Link
        href="/settings"
        onClick={onNavigate}
        className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-white/8 p-3 hover:bg-white/12 transition-colors border border-white/10"
      >
        <Avatar
          src={profile?.avatar_url}
          name={profile?.full_name ?? profile?.email}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">
            {profile?.full_name || "Mi perfil"}
          </p>
          <p className="text-xs text-white/50 truncate">{profile?.email}</p>
        </div>
      </Link>

      <nav className="flex-1 p-3 mt-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
            >
              <span aria-hidden className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <LogoutButton />
      </div>
    </aside>
  );
}
