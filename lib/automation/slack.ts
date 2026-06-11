import { getSlackWebhookUrl } from "@/lib/automation/config";
import { logger } from "@/lib/logger";

export async function sendSlackMessage(
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = getSlackWebhookUrl();
  if (!webhookUrl) {
    return { ok: false, error: "SLACK_WEBHOOK_URL no configurada" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { ok: false, error: `Slack HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logger.error("slack webhook error", { message });
    return { ok: false, error: message };
  }
}
