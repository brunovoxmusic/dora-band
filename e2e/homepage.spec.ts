import { test, expect } from "@playwright/test";

/**
 * D.2 — Homepage E2E tests
 */

test.describe("Homepage", () => {
  test("homepage sa načíta a zobrazí hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/D\.O\.R\.A/);
    // H1 alebo hlavný heading
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/D\.O\.R\.A/i);
  });

  test("navigácia obsahuje所有 sekcie", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    // Skontroluj aspoň 3 nav linky
    const links = nav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("footer obsahuje legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
    // Ochrana osobných údajov
    await expect(footer.locator("a", { hasText: /Ochrana osobných údajov/i })).toBeVisible();
    // Cookies
    await expect(footer.locator("a", { hasText: /Cookies/i })).toBeVisible();
    // Impressum
    await expect(footer.locator("a", { hasText: /Impressum/i })).toBeVisible();
  });

  test("JSON-LD structured data je prítomné", async ({ page }) => {
    await page.goto("/");
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThanOrEqual(3); // MusicGroup, WebSite, FAQPage minimálne
  });

  test("security headers sú prítomné", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() || {};
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toBeTruthy();
  });
});
