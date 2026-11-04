import { test, expect } from '@playwright/test';

test.describe('Auth Guard & RBAC Protections (E2E-09)', () => {
  test('E2E-09: Unauthenticated access to protected routes redirects to /login', async ({ page }) => {
    // Ensure clean unauthenticated session
    await page.context().clearCookies();

    // 1. Direct navigation to /catalog without auth redirects to /login
    await page.goto('/catalog');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');

    // 2. Direct navigation to /orders/new redirects to /login
    await page.goto('/orders/new');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');

    // 3. Direct navigation to /orders redirects to /login
    await page.goto('/orders');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');

    // 4. Direct navigation to /operator/orders redirects to /login
    await page.goto('/operator/orders');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');
  });

  test('E2E-09: Cross-role RBAC navigation guards enforce strict role boundaries', async ({ page }) => {
    // 1. Login as CUSTOMER
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'customer1@test.com');
    await page.fill('#password', 'customer123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');

    // Attempt to access OPERATOR route
    await page.goto('/operator/orders');
    // Guard redirects CUSTOMER away to /catalog
    await page.waitForURL('/catalog');
    await expect(page.locator('h1')).toContainText('Artisan Bakery Catalog');

    // 2. Logout and login as OPERATOR
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'operator@crustcraft.com');
    await page.fill('#password', 'operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/operator/orders');

    // Attempt to access CUSTOMER-only route /orders/new
    await page.goto('/orders/new');
    // Guard redirects OPERATOR back to /operator/orders
    await page.waitForURL('/operator/orders');
    await expect(page.locator('h1')).toContainText('Incoming Order Queue');
  });
});
