import { describe, expect, it } from "vitest";
import {
  MoneyError,
  addMoney,
  feeFromBasisPoints,
  formatMoney,
  formatMoneyCompact,
  isCurrency,
  money,
  multiplyMoney,
  subtractMoney,
} from "@/lib/money";

describe("money", () => {
  it("creates money from integer minor units", () => {
    expect(money(250, "GBP")).toEqual({ amountMinor: 250, currency: "GBP" });
  });

  it("rejects non-integer amounts", () => {
    expect(() => money(2.5, "GBP")).toThrow(MoneyError);
    expect(() => money(Number.NaN, "GBP")).toThrow(MoneyError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, "GBP")).toThrow(MoneyError);
  });

  it("adds and subtracts same-currency amounts", () => {
    expect(addMoney(money(100, "GBP"), money(50, "GBP")).amountMinor).toBe(150);
    expect(subtractMoney(money(100, "GBP"), money(30, "GBP")).amountMinor).toBe(70);
  });

  it("refuses cross-currency arithmetic", () => {
    expect(() => addMoney(money(100, "GBP"), money(100, "USD"))).toThrow(MoneyError);
    expect(() => subtractMoney(money(100, "GBP"), money(100, "USD"))).toThrow(MoneyError);
  });

  it("multiplies by integer quantities only", () => {
    expect(multiplyMoney(money(250, "GBP"), 10).amountMinor).toBe(2500);
    expect(() => multiplyMoney(money(250, "GBP"), 1.5)).toThrow(MoneyError);
    expect(() => multiplyMoney(money(250, "GBP"), -1)).toThrow(MoneyError);
  });

  it("computes basis-point fees with half-up rounding", () => {
    // 10% of 800 = 80
    expect(feeFromBasisPoints(money(800, "GBP"), 1000).amountMinor).toBe(80);
    // 2.5% of 999 = 24.975 → 25
    expect(feeFromBasisPoints(money(999, "GBP"), 250).amountMinor).toBe(25);
    // 0 bp
    expect(feeFromBasisPoints(money(999, "GBP"), 0).amountMinor).toBe(0);
    expect(() => feeFromBasisPoints(money(100, "GBP"), 10_001)).toThrow(MoneyError);
    expect(() => feeFromBasisPoints(money(100, "GBP"), -1)).toThrow(MoneyError);
  });

  it("formats in locale currency", () => {
    expect(formatMoney(money(250, "GBP"), "en-GB")).toBe("£2.50");
    expect(formatMoney(money(120000, "USD"), "en-US")).toBe("$1,200.00");
    expect(formatMoneyCompact(money(45000000, "GBP"), "en-GB")).toBe("£450,000");
    expect(formatMoneyCompact(money(199, "GBP"), "en-GB")).toBe("£1.99");
  });

  it("narrows currency strings", () => {
    expect(isCurrency("GBP")).toBe(true);
    expect(isCurrency("USD")).toBe(true);
    expect(isCurrency("EUR")).toBe(false);
  });
});
