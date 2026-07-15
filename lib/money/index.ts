import type { Currency, Locale } from "@/lib/config/brand";

/**
 * All monetary amounts in ChanceMarket are integers in the currency's minor
 * unit (pence, cents). Floats are never used for money. These helpers are the
 * only sanctioned way to do money arithmetic and formatting.
 */

export type Money = {
  amountMinor: number;
  currency: Currency;
};

const MINOR_UNIT_FACTOR: Record<Currency, number> = {
  GBP: 100,
  USD: 100,
};

export class MoneyError extends Error {}

export function assertValidMinor(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new MoneyError(`Amount must be a safe integer of minor units, got ${amountMinor}`);
  }
}

export function money(amountMinor: number, currency: Currency): Money {
  assertValidMinor(amountMinor);
  return { amountMinor, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} + ${b.currency}`);
  }
  const sum = a.amountMinor + b.amountMinor;
  assertValidMinor(sum);
  return { amountMinor: sum, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} - ${b.currency}`);
  }
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function multiplyMoney(a: Money, quantity: number): Money {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new MoneyError(`Quantity must be a non-negative integer, got ${quantity}`);
  }
  const product = a.amountMinor * quantity;
  assertValidMinor(product);
  return { amountMinor: product, currency: a.currency };
}

/**
 * Percentage fee in basis points (1 bp = 0.01%), rounded half-up to the
 * nearest minor unit — deterministic and reproducible in SQL.
 */
export function feeFromBasisPoints(amount: Money, basisPoints: number): Money {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new MoneyError(`Basis points must be an integer in [0, 10000], got ${basisPoints}`);
  }
  const raw = (amount.amountMinor * basisPoints) / 10_000;
  return money(Math.round(raw), amount.currency);
}

export function formatMoney(m: Money, locale: Locale = "en-GB"): string {
  const factor = MINOR_UNIT_FACTOR[m.currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
  }).format(m.amountMinor / factor);
}

/** Format without pence/cents when the amount is a whole major unit. */
export function formatMoneyCompact(m: Money, locale: Locale = "en-GB"): string {
  const factor = MINOR_UNIT_FACTOR[m.currency];
  const whole = m.amountMinor % factor === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(m.amountMinor / factor);
}

export function isCurrency(value: string): value is Currency {
  return value === "GBP" || value === "USD";
}
