type LogLevel = "info" | "warn" | "error";

interface LogContext {
  route?: string;
  userId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, ctx?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
  });
}

export const logger = {
  info(message: string, ctx?: LogContext) {
    console.log(formatMessage("info", message, ctx));
  },
  warn(message: string, ctx?: LogContext) {
    console.warn(formatMessage("warn", message, ctx));
  },
  error(message: string, ctx?: LogContext) {
    console.error(formatMessage("error", message, ctx));
  },
};
