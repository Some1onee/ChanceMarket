import { expect, type Page } from "@playwright/test";

/** Seeded demo accounts (supabase/seed.sql). */
export const DEMO_PASSWORD = "Demo1234!pass";
export const USERS = {
  alice: "alice@demo.test",
  ben: "ben@demo.test",
  admin: "admin@demo.test",
  seller: "seller.one@demo.test",
} as const;

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible({ timeout: 15_000 });
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
}
