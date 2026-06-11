export function isAutomationConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFrom(): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "AI Recruit";
  const custom = process.env.EMAIL_FROM?.trim();
  if (custom) return custom;
  return `${appName} <onboarding@resend.dev>`;
}

export function getEmailReplyTo(): string | null {
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  return replyTo || getTalentTeamEmail();
}

export function getTalentTeamEmail(): string | null {
  const email = process.env.TALENT_TEAM_EMAIL?.trim();
  return email || null;
}

export function getSlackWebhookUrl(): string | null {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!url || url.includes("hooks.slack.com/services/XXX")) return null;
  return url;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

/** Resend sandbox (`onboarding@resend.dev`) only delivers to verified account emails. */
export function isResendSandboxMode(): boolean {
  return getEmailFrom().includes("@resend.dev");
}

export function getResendAllowedRecipients(): string[] {
  const custom = process.env.RESEND_ALLOWED_RECIPIENTS?.trim();
  if (custom) {
    return [
      ...new Set(
        custom
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
  }

  const allowed = [getEmailReplyTo(), getTalentTeamEmail()]
    .filter((email): email is string => Boolean(email))
    .map((email) => email.toLowerCase());

  return [...new Set(allowed)];
}

export function partitionRecipientsByResendPolicy(to: string[]): {
  allowed: string[];
  skipped: string[];
} {
  if (!isResendSandboxMode()) {
    return { allowed: to, skipped: [] };
  }

  const allowedSet = new Set(getResendAllowedRecipients());
  if (allowedSet.size === 0) {
    return { allowed: [], skipped: to };
  }

  const allowed: string[] = [];
  const skipped: string[] = [];

  for (const email of to) {
    if (allowedSet.has(email.trim().toLowerCase())) {
      allowed.push(email);
    } else {
      skipped.push(email);
    }
  }

  return { allowed, skipped };
}
