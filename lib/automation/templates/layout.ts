import { APP_NAME, APP_TAGLINE } from "@/lib/constants/branding";
import { getEmailReplyTo, getSiteUrl } from "@/lib/automation/config";
import { escapeHtml } from "@/lib/automation/templates/utils";

export interface EmailLayoutOptions {
  preheader?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  variant?: "default" | "success" | "alert";
}

const ACCENT = "#ff6b4a";
const NAVY = "#131829";
const MUTED = "#5c6478";
const BG = "#f8f9fc";

function accentBar(variant: EmailLayoutOptions["variant"]) {
  if (variant === "success") return "#22c55e";
  if (variant === "alert") return "#f59e0b";
  return ACCENT;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const siteUrl = getSiteUrl();
  const logoUrl = process.env.NEXT_PUBLIC_APP_LOGO
    ? `${siteUrl}${process.env.NEXT_PUBLIC_APP_LOGO}`
    : null;
  const preheader = options.preheader
    ? escapeHtml(options.preheader)
    : escapeHtml(options.title);
  const replyTo = getEmailReplyTo();

  const ctaBlock = options.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0;">
        <tr>
          <td style="border-radius:12px;background:${ACCENT};">
            <a href="${escapeHtml(options.cta.href)}" target="_blank"
              style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
              ${escapeHtml(options.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(19,24,41,0.08);">
          <tr>
            <td style="height:4px;background:${accentBar(options.variant)};"></td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#131829 0%,#2d3a5c 100%);">
              ${
                logoUrl
                  ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(APP_NAME)}" width="120" style="display:block;margin:0 auto 12px;max-width:120px;height:auto;" />`
                  : ""
              }
              <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(APP_NAME)}</p>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.12em;">${escapeHtml(APP_TAGLINE)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${options.bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e4e8f0;background:#fafbfd;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
                Este correo fue enviado por <strong style="color:${NAVY};">${escapeHtml(APP_NAME)}</strong>.<br />
                ${replyTo ? `¿Dudas? Escríbenos a <a href="mailto:${escapeHtml(replyTo)}" style="color:${ACCENT};">${escapeHtml(replyTo)}</a>.` : ""}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:${MUTED};text-align:center;">
          <a href="${escapeHtml(siteUrl)}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(siteUrl)}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHeading(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:800;color:${NAVY};">${escapeHtml(text)}</h1>`;
}

export function emailParagraph(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d4558;">${text}</p>`;
}

export function emailHighlightBox(content: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="padding:16px 18px;background:#fff0ec;border-left:4px solid ${ACCENT};border-radius:0 12px 12px 0;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#3d4558;">${content}</p>
        </td>
      </tr>
    </table>`;
}

export function emailMetaRow(label: string, value: string) {
  return `<p style="margin:0 0 8px;font-size:14px;color:#3d4558;"><strong style="color:${NAVY};">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}
