import { test, expect, request } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/sprint-1');

async function ensurePendingOrder(baseURL: string = 'http://localhost:5173') {
  const apiContext = await request.newContext({ baseURL });
  await apiContext.post('/api/auth/login', {
    data: { email: 'customer1@test.com', password: 'customer123' },
  });
  const catalogRes = await apiContext.get('/api/catalog');
  const catalog = await catalogRes.json();
  const itemId = catalog.items?.[0]?.id;
  if (itemId) {
    await apiContext.post('/api/customer/orders', {
      data: {
        items: [{ bakeryItemId: itemId, quantity: 1 }],
        pickupNote: 'Order auto-created for operator acceptance flow',
      },
    });
  }
}

test.describe('Operator Acceptance Flow (E2E-06 to E2E-08)', () => {
  test('E2E-06: Operator logs in and sees Order Queue', async ({ page }, testInfo) => {
    const viewport = testInfo.project.name.toLowerCase();

    // Ensure there is at least one order in the queue
    await ensurePendingOrder();

    await page.context().clearCookies();
    await page.goto('/login');

    // Fill operator login credentials
    await page.fill('#email', 'operator@crustcraft.com');
    await page.fill('#password', 'operator123');
    await page.click('button[type="submit"]');

    // Operator is redirected to /operator/orders
    await page.waitForURL('/operator/orders');
    await expect(page.locator('h1')).toContainText('Incoming Order Queue');

    // Verify order rows exist
    const orderRows = page.locator('[data-order-id]');
    await expect(orderRows.first()).toBeVisible();

    // Capture responsive screenshot: operator-order-queue
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${viewport}-operator-order-queue.png`),
      fullPage: true,
    });
  });

  test('E2E-07: Operator accepts a PENDING order — status changes to ACCEPTED', async ({ page }) => {
    // Ensure there is a pending order to accept
    await ensurePendingOrder();

    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'operator@crustcraft.com');
    await page.fill('#password', 'operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/operator/orders');

    // Find the first order row with an "Accept Order" button
    const acceptBtn = page.locator('button:has-text("Accept Order")').first();
    await expect(acceptBtn).toBeVisible();

    // Capture the target order's ID attribute before clicking
    const row = page.locator('[data-order-id]').filter({ hasText: 'Accept Order' }).first();
    const orderId = await row.getAttribute('data-order-id');
    expect(orderId).toBeTruthy();

    // Click "Accept Order"
    await acceptBtn.click();

    // Locate the specific order row by data-order-id to verify in-place update (AC-05-11, AC-06-02)
    const targetRow = page.locator(`[data-order-id="${orderId}"]`);
    await expect(targetRow.getByText('Accepted ✓')).toBeVisible();
    await expect(targetRow.getByText('ACCEPTED', { exact: true })).toBeVisible();
  });

  test('E2E-08: Operator views order detail — full order information displayed', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'operator@crustcraft.com');
    await page.fill('#password', 'operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/operator/orders');

    // Click "View Details" on the first order in the queue
    const detailLink = page.locator('a:has-text("View Details")').first();
    await expect(detailLink).toBeVisible();
    await detailLink.click();

    // Navigates to /operator/orders/:id
    await page.waitForURL(/\/operator\/orders\/[a-z0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Order #');

    // Verify operator detail page contents
    await expect(page.locator('text=Customer Name')).toBeVisible();
    await expect(page.locator('text=Customer Email')).toBeVisible();
    await expect(page.locator('text=Order Items')).toBeVisible();
    await expect(page.locator('text=Total Amount')).toBeVisible();
  });
});
