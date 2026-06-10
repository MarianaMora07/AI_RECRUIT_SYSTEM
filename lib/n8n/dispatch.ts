import { logger } from "@/lib/logger";

export type N8nEventType =
  | "candidate.created"
  | "candidate.scored"
  | "stage.changed"
  | "interview.approved";

interface N8nPayload {
  event_type: N8nEventType;
  timestamp: string;
  payload: Record<string, unknown>;
}

const N8N_TIMEOUT_MS = 3000;

function isConfiguredWebhook(url: string | undefined): url is string {
  if (!url) return false;
  if (url.includes("your-n8n-instance")) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function dispatchN8nEvent(
  eventType: N8nEventType,
  payload: Record<string, unknown>
) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!isConfiguredWebhook(webhookUrl)) {
    return { skipped: true };
  }

  const body: N8nPayload = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    if (!res.ok) {
      logger.error("n8n webhook failed", {
        eventType,
        status: res.status,
      });
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    logger.error("n8n dispatch error", {
      eventType,
      message: err instanceof Error ? err.message : "unknown",
    });
    return { success: false };
  }
}
