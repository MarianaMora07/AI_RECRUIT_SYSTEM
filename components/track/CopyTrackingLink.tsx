"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getCandidateTrackingWhatsAppUrl } from "@/lib/utils/candidate-tracking";

export function CopyTrackingLink({
  url,
  label = "Copiar enlace",
  candidateName,
  jobTitle,
}: {
  url: string;
  label?: string;
  candidateName?: string;
  jobTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const whatsAppUrl = getCandidateTrackingWhatsAppUrl({
    url,
    candidateName,
    jobTitle,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace para el candidato:", url);
    }
  }

  return (
    <div className="space-y-2">
      <code className="block truncate rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
        {url}
      </code>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? "¡Copiado!" : label}
        </Button>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          <span aria-hidden>💬</span>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
