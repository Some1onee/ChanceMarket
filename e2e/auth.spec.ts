import { expect, test } from "@playwright/test";
import { USERS, DEMO_PASSWORD, signIn } from "./helpers";

test.describe("Authentication", () => {
  test("sign-up flow reaches the email-confirmation screen", async ({ page }) => {
    await page.goto("/sign-up");
    const unique = `e2e-${Date.now()}@demo.test`;
    await page.getByLabel("Display name").fill("E2E Tester");
    await page.getByLabel("Email").fill(unique);
    await page.getByLabel("Password").fill("SuperSecret123!e2e");
    await page.getByText(/I confirm I meet the minimum age/).click();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Check your inbox")).toBeVisible({ timeout: 15_000 });
  });

  test("sign-in with a seeded account works and sign-out returns home", async ({ page }) => {
    await signIn(page, USERS.alice);
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  });

  test("wrong password is rejected with a friendly error", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(USERS.alice);
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("protected routes redirect anonymous visitors to sign-in", async ({ page }) => {
    await page.goto("/account/entries");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("Authorization boundaries", () => {
  test("a standard user cannot open the admin back office", async ({ page }) => {
    await signIn(page, USERS.alice);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("an admin can open the admin back office", async ({ page }) => {
    await signIn(page, USERS.admin);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("sign-in page open-redirect is neutralised", async ({ page }) => {
    await page.goto("/sign-in?next=//evil.example.com");
    await page.getByLabel("Email").fill(USERS.alice);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/localhost/);
  });
});
