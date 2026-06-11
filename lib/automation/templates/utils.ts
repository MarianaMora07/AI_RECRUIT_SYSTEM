export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export function emailTrackingBlock(trackingUrl?: string): string {
  if (!trackingUrl) return "";
  const safe = escapeHtml(trackingUrl);
  return `
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#3d4558;">
      Consulta el estado de tu postulación en cualquier momento:<br />
      <a href="${safe}" style="color:#ff6b4a;font-weight:700;word-break:break-all;">${safe}</a>
    </p>`;
}

export function emailTrackingText(trackingUrl?: string): string {
  if (!trackingUrl) return "";
  return `\n\nSeguimiento de tu postulación: ${trackingUrl}`;
}
