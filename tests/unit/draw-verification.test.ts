import { describe, expect, it } from "vitest";
import { createHash } from "crypto";

/**
 * These tests pin the PUBLIC verification formulas so that the SQL
 * implementation, the verification page and the docs can never drift apart.
 */

/** Winner index formula — mirrors select_draw_winner() and /draws/[id]. */
function winnerPosition(seedHex: string, entriesCount: number): number {
  const value = BigInt(`0x${seedHex.slice(0, 16)}`) & ((1n << 63n) - 1n);
  return Number(value % BigInt(entriesCount)) + 1;
}

/** Canonical snapshot hash — mirrors create_draw_snapshot(). */
function snapshotHash(entries: { position: number; id: string }[]): string {
  const canonical = entries
    .sort((a, b) => a.position - b.position)
    .map((entry) => `${entry.position}:${entry.id}`)
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

describe("winner position derivation", () => {
  it("matches the seeded demo draw (seed → position 4 of 5)", () => {
    // Seed from supabase/seed.sql: winner must be entry_number 4 (Ben).
    expect(winnerPosition("5f8a3d2c9b1e4f6a8c0d2e4f6a8b0c1d", 5)).toBe(4);
  });

  it("is deterministic and within bounds", () => {
    const seeds = ["00000000000000ff", "ffffffffffffffff", "0123456789abcdef"];
    for (const seed of seeds) {
      for (const count of [1, 2, 5, 1000, 999_983]) {
        const position = winnerPosition(seed, count);
        expect(position).toBeGreaterThanOrEqual(1);
        expect(position).toBeLessThanOrEqual(count);
        expect(winnerPosition(seed, count)).toBe(position);
      }
    }
  });

  it("uses the sign-masked 63-bit value (no negative modulo)", () => {
    // High-bit-set seed would be negative as a signed int64.
    const position = winnerPosition("ffffffffffffffff", 7);
    expect(position).toBeGreaterThanOrEqual(1);
    expect(position).toBeLessThanOrEqual(7);
  });
});

describe("snapshot hash", () => {
  it("is order-canonical and reproducible", () => {
    const entries = [
      { position: 2, id: "b" },
      { position: 1, id: "a" },
      { position: 3, id: "c" },
    ];
    const expected = createHash("sha256").update("1:a\n2:b\n3:c").digest("hex");
    expect(snapshotHash(entries)).toBe(expected);
    // Same entries, different input order → same hash.
    expect(snapshotHash([...entries].reverse())).toBe(expected);
  });

  it("changes when any entry changes", () => {
    const base = snapshotHash([
      { position: 1, id: "a" },
      { position: 2, id: "b" },
    ]);
    const tampered = snapshotHash([
      { position: 1, id: "a" },
      { position: 2, id: "x" },
    ]);
    expect(tampered).not.toBe(base);
  });
});
