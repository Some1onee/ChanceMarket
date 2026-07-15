import { describe, expect, it } from "vitest";
import { AppError, fail, ok } from "@/lib/errors";

describe("AppError", () => {
  it("maps codes to sensible HTTP statuses", () => {
    expect(new AppError("unauthorized", "x").status).toBe(401);
    expect(new AppError("forbidden", "x").status).toBe(403);
    expect(new AppError("not_found", "x").status).toBe(404);
    expect(new AppError("sold_out", "x").status).toBe(409);
    expect(new AppError("validation_failed", "x").status).toBe(422);
    expect(new AppError("rate_limited", "x").status).toBe(429);
    expect(new AppError("payment_failed", "x").status).toBe(402);
    expect(new AppError("jurisdiction_blocked", "x").status).toBe(403);
    expect(new AppError("internal", "x").status).toBe(500);
  });

  it("keeps user-safe messages separate from internals", () => {
    const error = new AppError("sold_out", "This campaign has sold out.");
    expect(error.userMessage).toBe("This campaign has sold out.");
    expect(error.message).toContain("sold_out");
  });
});

describe("ActionResult helpers", () => {
  it("wraps success and failure uniformly", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
    expect(fail("not_found", "missing")).toEqual({
      ok: false,
      code: "not_found",
      message: "missing",
    });
  });
});
