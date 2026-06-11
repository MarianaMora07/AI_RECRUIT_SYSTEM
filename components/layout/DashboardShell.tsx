"use client";

import { useState } from "react";
import { Sidebar, type ShellProfile } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { NotificationsPanel } from "./NotificationsPanel";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";
import type { AppNotification } from "@/lib/data/notifications";

export function DashboardShell({
  children,
  profile,
  notifications = [],
}: {
  children: React.ReactNode;
  profile: ShellProfile | null;
  notifications?: AppNotification[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <div className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40">
        <Sidebar profile={profile} notifications={notifications} />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          profile={profile}
          notifications={notifications}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-lg px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-lg"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <Logo size="sm" />
          <div className="ml-auto">
            <NotificationsPanel notifications={notifications} variant="light" />
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in">
            {children}
          </div>
        </main>
      </div>

      <MobileNav role={profile?.role} />
    </div>
  );
}
