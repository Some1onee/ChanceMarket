/**
 * Centralized application errors. Server actions catch these and return
 * structured results; unexpected errors are logged with a correlation id and
 * surfaced as an opaque message (no internals leak to the client).
 */

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "not_eligible"
  | "jurisdiction_blocked"
  | "age_restricted"
  | "verification_required"
  | "limit_reached"
  | "sold_out"
  | "campaign_closed"
  | "payment_failed"
  | "payment_required"
  | "idempotency_conflict"
  | "state_conflict"
  | "rate_limited"
  | "spending_limit_reached"
  | "self_excluded"
  | "internal";

export class AppError extends Error {
  readonly code: ErrorCode;
  /** Safe to show to end users. */
  readonly userMessage: string;
  readonly status: number;

  constructor(code: ErrorCode, userMessage: string, opts?: { status?: number; cause?: unknown }) {
    super(`${code}: ${userMessage}`);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
    this.status = opts?.status ?? defaultStatus(code);
    if (opts?.cause) this.cause = opts.cause;
  }
}

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case "unauthorized":
      return 401;
    case "forbidden":
    case "jurisdiction_blocked":
    case "age_restricted":
    case "self_excluded":
      return 403;
    case "not_found":
      return 404;
    case "state_conflict":
    case "idempotency_conflict":
    case "sold_out":
    case "campaign_closed":
    case "limit_reached":
    case "spending_limit_reached":
      return 409;
    case "validation_failed":
      return 422;
    case "rate_limited":
      return 429;
    case "payment_required":
    case "payment_failed":
      return 402;
    case "not_eligible":
    case "verification_required":
      return 403;
    case "internal":
      return 500;
  }
}

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; code: ErrorCode; message: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = undefined>(code: ErrorCode, message: string): ActionResult<T> {
  return { ok: false, code, message };
}

/** Wrap a server action body: AppErrors map to structured results, the rest is opaque. */
export async function toActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.code, error.userMessage);
    }
    const { logError } = await import("@/lib/observability/logger");
    logError("unhandled_action_error", error);
    return fail("internal", "Something went wrong. Please try again.");
  }
}
