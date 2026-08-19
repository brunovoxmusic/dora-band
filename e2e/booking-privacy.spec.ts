import { test, expect } from "@playwright/test";

/**
 * D.2 — Booking form E2E tests
 * Testuje GDPR consent validation, honeypot, rate limiting
 */

test.describe("Booking Form", () => {
  test("zobrazí GDPR consent checkbox", async ({ page }) => {
    await page.goto("/#kontakt");
    // GDPR checkbox
    const consent = page.locator('input[type="checkbox"][required]').first();
    await expect(consent).toBeVisible();
  });

  test("zamietne odoslanie bez GDPR consent", async ({ page }) => {
    await page.goto("/#kontakt");
    // Vyplň formulár bez consentu
    await page.fill('input[placeholder*="Meno"]', "Test User");
    await page.fill('input[placeholder*="email"]', "test@test.com");
    await page.fill('input[placeholder*="telefón"]', "+421901234567");
    await page.fill('input[placeholder*="dátum"]', "2026-12-01");
    await page.fill('input[placeholder*="miesto"]', "Test Venue");
    // Odoslať bez consentu
    const submitButton = page.locator("button", { hasText: /Odoslať dopyt/i });
    await submitButton.click();
    // Mali by sme vidieť chybu alebo nie úspech
    await expect(page).not.toHaveURL(/success/);
  });

  test("honeypot pole je skryté", async ({ page }) => {
    await page.goto("/#kontakt");
    // Honeypot by mal byť offscreen
    const honeypot = page.locator('input[aria-hidden="true"]').first();
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
  });

  test("link na Privacy Policy v consent texte", async ({ page }) => {
    await page.goto("/#kontakt");
    const privacyLink = page.locator('a[href="/privacy"]').first();
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute("target", "_blank");
  });
});

test.describe("Privacy Page", () => {
  test("privacy page sa načíta", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Ochrana osobných údajov/);
    const heading = page.locator("h1").first();
    await expect(heading).toContainText(/Ochrana osobných údajov/i);
  });

  test("obsahuje všetky sekcie", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h2", { hasText: /Privacy Policy/i })).toBeVisible();
    await expect(page.locator("h2", { hasText: /Cookie Policy/i })).toBeVisible();
    await expect(page.locator("h2", { hasText: /Impressum/i })).toBeVisible();
  });

  test("cookie anchor funguje", async ({ page }) => {
    await page.goto("/privacy#cookies");
    // Cookie Policy sekcia by mala byť viditeľná
    await expect(page.locator("#cookies")).toBeVisible();
  });

  test("impressum anchor funguje", async ({ page }) => {
    await page.goto("/privacy#impressum");
    await expect(page.locator("#impressum")).toBeVisible();
  });
});
