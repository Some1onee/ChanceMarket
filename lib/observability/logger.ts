import "server-only";
import { randomUUID } from "crypto";

/**
 * Structured JSON logger. Secrets, tokens, card data, KYC payloads and raw
 * IP addresses must never be passed here — use the redact helper for
 * anything user-supplied.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|authorization|cookie|card|cvv|pan|ssn|api[_-]?key|ip[_-]?address)/i;

export function redact(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      out[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redact(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function emit(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  // eslint-disable-next-line no-console
  else console.log(line);
}

export function logDebug(event: string, fields?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") emit("debug", event, fields);
}
export function logInfo(event: string, fields?: Record<string, unknown>): void {
  emit("info", event, fields);
}
export function logWarn(event: string, fields?: Record<string, unknown>): void {
  emit("warn", event, fields);
}
export function logError(event: string, error?: unknown, fields?: Record<string, unknown>): void {
  const correlationId = randomUUID();
  emit("error", event, {
    correlationId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...fields,
  });
}
