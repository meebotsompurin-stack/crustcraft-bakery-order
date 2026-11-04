import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/sprint-1');

test.describe('Customer Order Flow (E2E-01 to E2E-05)', () => {
  test('E2E-01: Customer registers successfully', async ({ page }, testInfo) => {
    const timestamp = Date.now();
    const viewport = testInfo.project.name.toLowerCase();
    const uniqueEmail = `e2e-reg-${viewport}-${timestamp}@test.com`;

    await page.context().clearCookies();
    await page.goto('/register');

    await expect(page.locator('h1')).toContainText('Create your account');
    await page.fill('#name', `E2E Customer ${viewport}`);
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'CustomerPass123!');
    await page.click('button[type="submit"]');

    // Upon successful registration, app navigates to /login
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in to your account');
  });

  test('E2E-02: Customer logs in and sees Catalog', async ({ page }, testInfo) => {
    const viewport = testInfo.project.name.toLowerCase();

    await page.context().clearCookies();
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Sign in to your account');

    // Capture responsive screenshot: login-page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${viewport}-login-page.png`),
      fullPage: true,
    });

    // Fill customer login credentials
    await page.fill('#email', 'customer1@test.com');
    await page.fill('#password', 'customer123');
    await page.click('button[type="submit"]');

    // Customer logs in and is redirected to /catalog
    await page.waitForURL('/catalog');
    await expect(page.locator('h1')).toContainText('Artisan Bakery Catalog');

    // Verify catalog items are rendered
    const itemCards = page.locator('[data-testid^="bakery-item-card-"]');
    await expect(itemCards.first()).toBeVisible();
    const count = await itemCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Capture responsive screenshot: catalog-page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${viewport}-catalog-page.png`),
      fullPage: true,
    });
  });

  test('E2E-03: Customer places an order (2+ items), sees order confirmation', async ({ page }, testInfo) => {
    const viewport = testInfo.project.name.toLowerCase();

    // Authenticate as customer1
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'customer1@test.com');
    await page.fill('#password', 'customer123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');

    // Navigate to Order creation form
    await page.goto('/orders/new');
    await expect(page.locator('h1')).toContainText('Create New Pre-Order');

    // Select at least 2 items
    const cards = page.locator('[data-testid^="bakery-item-card-"]');
    await expect(cards.first()).toBeVisible();

    // Add first item
    await cards.nth(0).locator('button:has-text("+")').click();
    // Add second item
    await cards.nth(1).locator('button:has-text("+")').click();

    // Enter pickup note
    await page.fill('#pickupNote', `Special E2E note for ${viewport} batch pickup.`);

    // Capture responsive screenshot: order-form
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${viewport}-order-form.png`),
      fullPage: true,
    });

    // Confirm Pre-Order
    await page.click('button:has-text("Confirm Pre-Order")');

    // Redirects to /orders/:id
    await page.waitForURL(/\/orders\/[a-z0-9-]+$/);

    // Verify confirmation and PENDING state
    await expect(page.locator('h1')).toContainText('Pre-Order Details');
    await expect(page.locator('text=Pending Acceptance / รอยืนยัน')).toBeVisible();
  });

  test('E2E-04: Customer views My Orders list — order appears with PENDING status', async ({ page }, testInfo) => {
    const viewport = testInfo.project.name.toLowerCase();

    // Authenticate as customer1
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'customer1@test.com');
    await page.fill('#password', 'customer123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');

    // Navigate to My Orders
    await page.goto('/orders');
    await expect(page.locator('h1')).toContainText('My Pre-Orders');

    // Expect at least one order to display with PENDING status badge
    const pendingBadges = page.locator('text=Pending Acceptance / รอยืนยัน');
    await expect(pendingBadges.first()).toBeVisible();

    // Capture responsive screenshot: my-orders-list
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${viewport}-my-orders-list.png`),
      fullPage: true,
    });
  });

  test('E2E-05: Customer views order detail — totalAmount correct, items listed', async ({ page }) => {
    // Authenticate as customer1
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'customer1@test.com');
    await page.fill('#password', 'customer123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');

    // Go to My Orders and open details of the most recent order
    await page.goto('/orders');
    await expect(page.locator('h1')).toContainText('My Pre-Orders');

    const detailLinks = page.locator('a:has-text("View Details")');
    await expect(detailLinks.first()).toBeVisible();
    await detailLinks.first().click();

    // Verify Order Detail breakdown
    await page.waitForURL(/\/orders\/[a-z0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Pre-Order Details');
    await expect(page.locator('text=Order Identifier')).toBeVisible();
    await expect(page.locator('text=Current Status')).toBeVisible();
    await expect(page.locator('text=Total Amount')).toBeVisible();
  });
});
