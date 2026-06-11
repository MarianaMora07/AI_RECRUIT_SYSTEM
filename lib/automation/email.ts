import {
  getEmailFrom,
  getEmailReplyTo,
  isAutomationConfigured,
  partitionRecipientsByResendPolicy,
} from "@/lib/automation/config";
import { logger } from "@/lib/logger";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(
  params: SendEmailParams
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!isAutomationConfigured() || !apiKey) {
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }

  const requested = Array.isArray(params.to) ? params.to : [params.to];
  const { allowed: to, skipped } = partitionRecipientsByResendPolicy(requested);

  if (skipped.length > 0) {
    logger.info("resend email skipped for disallowed recipients", {
      subject: params.subject,
      skipped,
    });
  }

  if (to.length === 0) {
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to,
        subject: params.subject,
        html: params.html,
        text: params.text ?? params.html.replace(/<[^>]+>/g, " "),
        reply_to: params.replyTo ?? getEmailReplyTo() ?? undefined,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("resend email failed", { status: res.status, body });
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logger.error("resend request error", { message });
    return { ok: false, error: message };
  }
}
