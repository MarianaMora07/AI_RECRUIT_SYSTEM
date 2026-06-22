export function DashboardFiltersFallback() {
  return (
    <div
      className="sticky top-0 z-10 -mx-1 px-1 py-3 mb-6 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)]"
      aria-hidden
    >
      <div className="flex flex-wrap gap-2">
        <div className="h-7 w-16 rounded-full bg-[var(--surface-hover)] animate-pulse" />
        <div className="h-7 w-14 rounded-full bg-[var(--surface-hover)] animate-pulse" />
        <div className="h-7 w-14 rounded-full bg-[var(--surface-hover)] animate-pulse" />
        <div className="h-8 w-36 rounded-lg bg-[var(--surface-hover)] animate-pulse" />
      </div>
    </div>
  );
}
