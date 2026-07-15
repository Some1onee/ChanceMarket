import { expect, test } from "@playwright/test";

test.describe("Catalogue", () => {
  test("home page shows hero and featured campaigns", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Win remarkable things/);
    await expect(
      page.getByRole("link", { name: /Aurora carbon gravel bike/ }).first(),
    ).toBeVisible();
  });

  test("catalogue lists campaigns with filters synchronised to the URL", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.getByRole("heading", { name: "Browse competitions" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Aurora carbon gravel bike/ })).toBeVisible();

    // Debounced search syncs to ?q=
    await page.getByLabel("Search competitions").fill("chronograph");
    await expect(page).toHaveURL(/q=chronograph/, { timeout: 5_000 });
    await expect(page.getByRole("link", { name: /Heritage chronograph/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Aurora carbon gravel bike/ })).toHaveCount(0);

    // Clear filters restores the list.
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("link", { name: /Aurora carbon gravel bike/ })).toBeVisible();
  });

  test("category filter narrows results", async ({ page }) => {
    await page.goto("/campaigns");
    await page.getByLabel("Category").click();
    await page.getByRole("option", { name: "Watches" }).click();
    await expect(page).toHaveURL(/category=watches/);
    await expect(page.getByRole("link", { name: /Heritage chronograph/ })).toBeVisible();
  });

  test("campaign detail shows the full information set", async ({ page }) => {
    await page.goto("/campaigns/aurora-carbon-gravel-bike");
    await expect(page.getByRole("heading", { name: /Aurora carbon gravel bike/ })).toBeVisible();
    await expect(page.getByText("Entry price")).toBeVisible();
    await expect(page.getByText("Prize value")).toBeVisible();
    await expect(page.getByText(/of 4,000 entries|of 4 000/)).toBeVisible();
    await expect(page.getByText("Official rules")).toBeVisible();
    await expect(page.getByText("Northway Cycles")).toBeVisible();
    await expect(page.getByRole("timer")).toBeVisible();
    // Free route visible
    await expect(page.getByText(/Free entry route/).first()).toBeVisible();
  });

  test("ended campaign links to its public draw verification page", async ({ page }) => {
    await page.goto("/campaigns/iconic-lounge-chair-1956");
    await page.getByRole("link", { name: /DRW-2026-000042/ }).click();
    await expect(page).toHaveURL(/\/draws\/DRW-2026-000042/);
    await expect(page.getByText(/Frozen snapshot/)).toBeVisible();
    await expect(page.getByText(/Selection seed/)).toBeVisible();
    await expect(page.getByText("#4", { exact: false })).toBeVisible();
  });

  test("winners page lists the completed draw", async ({ page }) => {
    await page.goto("/winners");
    await expect(page.getByText(/Iconic 1956 lounge chair/)).toBeVisible();
  });
});
