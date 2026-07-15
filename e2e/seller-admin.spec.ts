import { expect, test } from "@playwright/test";
import { USERS, signIn } from "./helpers";

test.describe.serial("Seller → moderation → close → draw lifecycle", () => {
  test("seller creates a draft campaign through the wizard and submits it", async ({ page }) => {
    await signIn(page, USERS.seller);
    await page.goto("/seller");
    await page.getByRole("button", { name: "New campaign" }).click();
    await expect(page).toHaveURL(/\/seller\/campaigns\/.+\/edit/, { timeout: 20_000 });

    // Step 1 — basics
    await page.getByRole("button", { name: /Paid with free entry route/ }).click();
    await page.getByLabel("Title").fill("E2E test lot — premium headphones");
    await page
      .getByLabel("Short summary")
      .fill("A sealed pair of premium headphones for the e2e lifecycle test.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2 — prize
    await page
      .getByLabel("Full description")
      .fill(
        "Brand new, sealed premium noise-cancelling headphones. Includes warranty, original receipt available to moderation. This description exists to satisfy the fifty character minimum.",
      );
    await page.getByLabel(/Prize value/).fill("350");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 — mechanics
    await page.getByLabel(/Entry price/).fill("150");
    await page.getByLabel("Total entries available").fill("500");
    await page
      .getByLabel(/Free route instructions/)
      .fill(
        "Enter for free online from this page, or by post to the address in the official rules.",
      );
    // Skill question (mandatory in GB seed)
    await page
      .getByLabel("Qualifying question")
      .fill("Which feature do noise-cancelling headphones primarily provide?");
    await page.getByLabel("Option 1").fill("Active noise cancellation");
    await page.getByLabel("Option 2").fill("Water resistance");
    await page.getByLabel("Option 3").fill("Extra bass only");
    await page.getByLabel("Option 1 is correct").click();
    await page.getByRole("button", { name: "Save question" }).click();
    await expect(page.getByText("Skill question saved")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4 — territory (defaults fine)
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 5 — dates & delivery
    const end = new Date(Date.now() + 7 * 86_400_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const endLocal = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T18:00`;
    await page.getByLabel("Closes").fill(endLocal);
    await page
      .getByLabel("Prize handover policy")
      .fill("Tracked, insured delivery within 7 days of winner verification.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 6 — submit
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Campaign submitted for review")).toBeVisible({ timeout: 20_000 });
  });

  test("admin approves the campaign from the moderation queue", async ({ page }) => {
    await signIn(page, USERS.admin);
    await page.goto("/admin/moderation");
    const card = page.locator("li", { hasText: "E2E test lot — premium headphones" });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Approve" }).click();
    await page.getByLabel(/Justification/).fill("E2E test approval — documents verified.");
    await page.getByRole("button", { name: "Approve & publish" }).click();
    await expect(page.getByText(/done/)).toBeVisible({ timeout: 15_000 });
  });

  test("the approved campaign is publicly visible and enterable", async ({ page }) => {
    await page.goto("/campaigns?q=premium+headphones");
    await expect(page.getByRole("link", { name: /E2E test lot/ })).toBeVisible({ timeout: 10_000 });
  });

  test("admin closes the campaign and the draw record is published", async ({ page }) => {
    // A participant first, so the draw has at least one entry.
    await signIn(page, USERS.alice);
    await page.goto("/campaigns?q=premium+headphones");
    await page.getByRole("link", { name: /E2E test lot/ }).click();
    await page.getByRole("link", { name: "Enter now" }).click();
    await page.getByLabel("Active noise cancellation").click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText(/Correct — you qualify/)).toBeVisible();
    await page.getByLabel(/I confirm I am 18 or older/).click();
    await page.getByLabel(/I have read the/).click();
    await page.getByRole("button", { name: /Pay .* and enter/ }).click();
    await expect(page.getByRole("heading", { name: "Entry confirmed" })).toBeVisible({
      timeout: 20_000,
    });

    // Now the admin closes it.
    await page.context().clearCookies();
    await signIn(page, USERS.admin);
    await page.goto("/admin/campaigns?status=active");
    const row = page.locator("tr", { hasText: "E2E test lot" });
    await row.getByRole("button", { name: "Close & draw now" }).click();
    await page.getByLabel(/Justification/).fill("E2E lifecycle test — closing early.");
    await page.getByRole("button", { name: "Run close pipeline" }).click();
    await expect(page.getByText(/done/)).toBeVisible({ timeout: 30_000 });

    // Winner verification from the draws board.
    await page.goto("/admin/draws");
    const drawRow = page.locator("tr", { hasText: "E2E test lot" });
    await drawRow.getByRole("button", { name: "Verify winner" }).click();
    await page.getByLabel(/Justification/).fill("E2E verification — identity checks passed.");
    await page.getByRole("button", { name: "Winner verified" }).click();
    await expect(page.getByText(/done/)).toBeVisible({ timeout: 15_000 });

    // The public record exists and exposes the verification material.
    await page.goto("/draws");
    await page.locator("tr", { hasText: "E2E test lot" }).getByRole("link").first().click();
    await expect(page.getByText(/Frozen snapshot/)).toBeVisible();
    await expect(page.getByText(/Selection seed/)).toBeVisible();
  });
});

test.describe("Refunds", () => {
  test("finance can issue a refund from the payments board", async ({ page }) => {
    await signIn(page, USERS.admin);
    await page.goto("/admin/payments");
    const refundButtons = page.getByRole("button", { name: "Refund" });
    const count = await refundButtons.count();
    test.skip(count === 0, "No refundable transaction available");
    await refundButtons.first().click();
    await page.getByLabel(/Amount/).fill("100");
    await page.getByLabel(/Justification/).fill("E2E partial refund test.");
    await page.getByRole("button", { name: "Issue refund" }).click();
    await expect(page.getByText(/done/)).toBeVisible({ timeout: 15_000 });
  });
});
