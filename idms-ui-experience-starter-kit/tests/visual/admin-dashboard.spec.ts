import { test, expect } from "@playwright/test";

test.describe("Admin dashboard visual smoke", () => {
  test("renders admin dashboard without layout regressions", async ({ page }) => {
    await page.goto("/#/admin");
    await expect(page).toHaveScreenshot("admin-dashboard.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
