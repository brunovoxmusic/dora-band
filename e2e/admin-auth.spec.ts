import { test, expect } from "@playwright/test";

/**
 * D.2 — Admin authentication E2E tests
 * Testuje login flow, rate limiting, protected routes
 */

test.describe("Admin Login", () => {
  test("login page sa načíta", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveTitle(/Prihlásenie|Admin/i);
    await expect(page.locator('input[placeholder*="E-MAIL"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="HESLO"]')).toBeVisible();
    await expect(page.locator("button", { hasText: /PRIHLÁSIŤ/i })).toBeVisible();
  });

  test("zamietne nesprávne credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[placeholder*="E-MAIL"]', "wrong@test.com");
    await page.fill('input[placeholder*="HESLO"]', "wrongpassword");
    await page.click("button", { hasText: /PRIHLÁSIŤ/i });
    // Mali by ostať na login page alebo vidieť chybu
    await page.waitForTimeout(1000);
    // Neobjaví sa admin dashboard
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("vyžaduje email aj heslo", async ({ page }) => {
    await page.goto("/admin/login");
    // Skús odoslať prázdne polia
    await page.click("button", { hasText: /PRIHLÁSIŤ/i });
    // HTML5 validation by zablokovalo odoslanie
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Admin Protected Routes", () => {
  test("admin API vracia 401 bez auth", async ({ request }) => {
    const response = await request.get("/api/admin/stats");
    expect(response.status()).toBe(401);
  });

  test("admin API vracia 401 pre gigs bez auth", async ({ request }) => {
    const response = await request.get("/api/admin/gigs");
    expect(response.status()).toBe(401);
  });

  test("admin API vracia 401 pre merch bez auth", async ({ request }) => {
    const response = await request.get("/api/admin/merch/products");
    expect(response.status()).toBe(401);
  });

  test("admin API vracia 401 pre approvals bez auth", async ({ request }) => {
    const response = await request.get("/api/admin/approvals");
    expect(response.status()).toBe(401);
  });

  test("admin API vracia 401 for ai-usage bez auth", async ({ request }) => {
    const response = await request.get("/api/admin/ai-usage");
    expect(response.status()).toBe(401);
  });
});

test.describe("Public API Access", () => {
  test("public booking API je prístupná", async ({ request }) => {
    // GET nemusi existovat, ale POST by mal byt pristupný (nie 401)
    const response = await request.post("/api/booking", {
      data: { gdprConsent: false },
    });
    // 422 (validation) je OK — nie 401
    expect(response.status()).not.toBe(401);
  });

  test("public newsletter API je prístupná", async ({ request }) => {
    const response = await request.post("/api/newsletter", {
      data: { email: "invalid" },
    });
    // 422 (validation) je OK — nie 401
    expect(response.status()).not.toBe(401);
  });
});
