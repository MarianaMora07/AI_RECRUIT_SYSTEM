import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle variant="compact" />
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Acceso reclutadores
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
