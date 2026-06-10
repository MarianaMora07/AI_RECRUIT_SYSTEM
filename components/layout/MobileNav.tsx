"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/jobs", label: "Vacantes", icon: "💼" },
  { href: "/upload", label: "Subir", icon: "📤" },
  { href: "/candidates", label: "Talento", icon: "👥" },
  { href: "/settings", label: "Perfil", icon: "⚙️" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-lg safe-area-pb">
      <div className="flex items-center justify-around px-1 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[56px] transition-colors",
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--foreground-muted)]"
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {active && (
                <span className="absolute bottom-1 h-0.5 w-6 rounded-full gradient-brand" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
