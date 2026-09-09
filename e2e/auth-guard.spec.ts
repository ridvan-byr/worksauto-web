import { test, expect } from '@playwright/test';

test.describe('E2E Authentication & Route Guard', () => {
  test('unauthenticated visitor accessing /customers is redirected to /sign-in', async ({ page }) => {
    await page.goto('/customers');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('public booking portal is publicly accessible without login', async ({ page }) => {
    const response = await page.goto('/book/yildiz-oto');
    // Public booking page should load (200 status or Next.js client render)
    expect(response?.status()).toBeLessThan(400);
  });

  test('admin portal requires admin authentication', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*admin\/login/);
  });
});
