import { expect, test } from "@playwright/test";
import { USERS, signIn } from "./helpers";

test.describe("Entering campaigns", () => {
  test("free draw entry end-to-end (Alice, GB)", async ({ page }) => {
    await signIn(page, USERS.alice);
    await page.goto("/campaigns/launch-week-console-bundle/enter");
    await expect(page.getByText(/Free entry — one per person/)).toBeVisible();
    await page.getByLabel(/I confirm I am 18 or older/).click();
    await page.getByLabel(/I have read the/).click();
    await page.getByRole("button", { name: "Confirm my free entry" }).click();
    await expect(page.getByRole("heading", { name: "Entry confirmed" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/account/entries");
    await expect(page.getByText(/Launch-week console bundle/).first()).toBeVisible();
  });

  test("paid entry with skill question and mock payment (Alice)", async ({ page }) => {
    await signIn(page, USERS.alice);
    await page.goto("/campaigns/heritage-chronograph-1968/enter");

    // Skill gate first — wrong answer is rejected server-side.
    await page.getByLabel("The date wheel").click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText(/Not quite/)).toBeVisible();

    await page.getByLabel(/pushers and central chronograph hand/).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText(/Correct — you qualify/)).toBeVisible();

    // Two entries at £5.00 each.
    await page.getByRole("button", { name: "More entries" }).click();
    await expect(page.getByText("£10.00").first()).toBeVisible();

    await page.getByLabel(/I confirm I am 18 or older/).click();
    await page.getByLabel(/I have read the/).click();
    await page.getByRole("button", { name: /Pay £10\.00 and enter/ }).click();
    await expect(page.getByRole("heading", { name: "Entry confirmed" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("free entry route records a request with identical odds (Ben)", async ({ page }) => {
    await signIn(page, USERS.ben);
    await page.goto("/campaigns/aurora-carbon-gravel-bike/enter?route=free");
    await page.getByRole("tab", { name: /Free entry route/ }).click();

    // Skill gate applies equally to the free route.
    await page.getByLabel("Shimano Ultegra").click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText(/Correct — you qualify/)).toBeVisible();

    await page.getByLabel(/I confirm I am 18 or older/).click();
    await page.getByLabel(/I have read the/).click();
    await page.getByRole("button", { name: "Request my free entry" }).click();
    await expect(page.getByRole("heading", { name: "Entry confirmed" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("entering requires sign-in", async ({ page }) => {
    await page.goto("/campaigns/launch-week-console-bundle/enter");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
