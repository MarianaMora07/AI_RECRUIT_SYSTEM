"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { getNavItemsForRole, type UserRole } from "@/lib/constants/roles";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "./LogoutButton";
import { NotificationsPanel } from "./NotificationsPanel";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { APP_TAGLINE } from "@/lib/constants/branding";
import type { AppNotification } from "@/lib/data/notifications";

export interface ShellProfile {
  full_name?: string | null;
  email?: string;
  avatar_url?: string | null;
  role?: UserRole | string | null;
}

export function Sidebar({
  profile,
  notifications = [],
  onNavigate,
}: {
  profile: ShellProfile | null;
  notifications?: AppNotification[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navItems = getNavItemsForRole(profile?.role);

  return (
    <aside className="flex h-full w-64 flex-col gradient-dark text-white">
      <div className="p-5 border-b border-white/10 flex items-start justify-between gap-2">
        <div>
          <Logo size="md" variant="light" />
          <p className="text-[10px] text-white/50 uppercase tracking-widest mt-2 ml-1">
            {APP_TAGLINE}
          </p>
        </div>
        <NotificationsPanel notifications={notifications} variant="dark" />
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

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-white/50 font-medium">Tema</span>
          <ThemeToggle variant="compact" className="border-white/20 bg-white/10 text-white hover:bg-white/15" />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
