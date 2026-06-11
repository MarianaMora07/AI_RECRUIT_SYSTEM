import { isAutomationConfigured } from "@/lib/automation/config";
import { runAutomationHandler } from "@/lib/automation/handlers";
import type {
  AutomationEventType,
  AutomationResult,
} from "@/lib/automation/types";
import { logger } from "@/lib/logger";

/** Motor de automatización nativo (equivalente a ramas n8n, sin costo de n8n). */
export async function dispatchAutomation(
  eventType: AutomationEventType,
  payload: Record<string, unknown>
): Promise<AutomationResult> {
  if (!isAutomationConfigured()) {
    logger.info("automation skipped, RESEND_API_KEY not set", { eventType });
    return { skipped: true };
  }

  try {
    const errors = await runAutomationHandler(eventType, payload);
    if (errors.length > 0) {
      logger.warn("automation partial failure", { eventType, errors });
      return { success: false, errors };
    }
    return { success: true };
  } catch (err) {
    logger.error("automation error", {
      eventType,
      message: err instanceof Error ? err.message : "unknown",
    });
    return { success: false, errors: ["automation error"] };
  }
}
