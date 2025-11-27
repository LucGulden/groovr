import { test, expect } from '@playwright/test';

test.describe('Groovr Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads successfully
    await expect(page).toHaveTitle(/Groovr/i);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Add specific checks for your app's navigation
    // This is a placeholder - adjust based on your actual UI
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
