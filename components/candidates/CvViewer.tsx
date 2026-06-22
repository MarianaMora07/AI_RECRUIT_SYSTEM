"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormModal } from "@/components/ui/FormModal";

const PREVIEW_HEIGHT = "h-[200px]";

export function CvViewer({ candidateId }: { candidateId: string }) {
  const [cv, setCv] = useState<{
    url: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    void fetch(`/api/candidates/${candidateId}/cv`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCv(data.data);
        } else {
          setError(data.error ?? "No hay CV disponible");
        }
      })
      .catch(() => setError("Error al cargar el CV"))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) {
    return (
      <Card className="card-elevated h-full">
        <CardHeader>
          <CardTitle className="text-base">Currículum</CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--foreground-muted)] pb-4">
          Cargando currículum…
        </p>
      </Card>
    );
  }

  if (error || !cv) {
    return (
      <Card className="card-elevated h-full">
        <CardHeader>
          <CardTitle className="text-base">Currículum</CardTitle>
        </CardHeader>
        <Alert variant="info" className="text-sm mb-4">
          {error || "No hay archivo de CV almacenado para este candidato."}
        </Alert>
      </Card>
    );
  }

  const isPdf = cv.mimeType === "application/pdf";
  const isImage = cv.mimeType.startsWith("image/");
  const canPreview = isPdf || isImage;

  return (
    <>
      <Card className="card-elevated h-full flex flex-col">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 shrink-0">
          <CardTitle className="text-base">Currículum</CardTitle>
          <div className="flex flex-wrap gap-2">
            {canPreview && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setFullscreenOpen(true)}
              >
                Pantalla completa
              </Button>
            )}
            <a
              href={cv.url}
              target="_blank"
              rel="noopener noreferrer"
              download={cv.fileName}
            >
              <Button size="sm" variant="secondary">
                Descargar
              </Button>
            </a>
          </div>
        </CardHeader>

        {isPdf && (
          <div
            className={`relative ${PREVIEW_HEIGHT} overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-hover)]`}
          >
            <iframe
              src={`${cv.url}#toolbar=0&navpanes=0`}
              title="Vista previa del CV"
              className="absolute inset-0 h-full w-full pointer-events-none scale-[1.02] origin-top"
            />
            <button
              type="button"
              onClick={() => setFullscreenOpen(true)}
              className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/25 to-transparent cursor-pointer group"
              aria-label="Ampliar currículum a pantalla completa"
            >
              <span className="rounded-full bg-[var(--surface)]/95 px-3 py-1 text-xs font-semibold text-[var(--foreground)] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para ampliar
              </span>
            </button>
          </div>
        )}

        {isImage && (
          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            className={`relative ${PREVIEW_HEIGHT} w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] cursor-pointer group`}
            aria-label="Ampliar currículum a pantalla completa"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cv.url}
              alt="Vista previa del CV"
              className="h-full w-full object-contain object-top"
            />
            <span className="absolute inset-x-0 bottom-0 flex justify-center pb-2 bg-gradient-to-t from-black/20 to-transparent">
              <span className="rounded-full bg-[var(--surface)]/95 px-3 py-1 text-xs font-semibold text-[var(--foreground)] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para ampliar
              </span>
            </span>
          </button>
        )}

        {!isPdf && !isImage && (
          <p className="text-sm text-[var(--foreground-muted)] pb-1">
            <a
              href={cv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] font-semibold hover:underline"
            >
              Abrir archivo en nueva pestaña
            </a>
          </p>
        )}

        {canPreview && (
          <p className="text-xs text-[var(--foreground-muted)] mt-2">
            Vista previa breve. Usa pantalla completa para revisar el documento.
          </p>
        )}
      </Card>

      {canPreview && (
        <FormModal
          open={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          title="Currículum"
          description={cv.fileName}
          size="xl"
        >
          <div className="flex flex-col gap-3 min-h-[70vh]">
            {isPdf && (
              <iframe
                src={cv.url}
                title="CV en pantalla completa"
                className="w-full flex-1 min-h-[70vh] rounded-lg border border-[var(--border)]"
              />
            )}
            {isImage && (
              <div className="flex-1 min-h-[70vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] flex items-start justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cv.url}
                  alt="CV del candidato"
                  className="max-w-full h-auto object-contain"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-end shrink-0 pt-2 border-t border-[var(--border)]">
              <a
                href={cv.url}
                target="_blank"
                rel="noopener noreferrer"
                download={cv.fileName}
              >
                <Button size="sm" variant="secondary">
                  Descargar
                </Button>
              </a>
              <Button size="sm" onClick={() => setFullscreenOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </FormModal>
      )}
    </>
  );
}
