import { test, expect } from '@playwright/test';

const CUSTOMER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'supersecret_demo_pass';

test.describe('Lab 7 CR-01 — Per-Item Max 5 Order Quantity Cap E2E (E2E-CR01-01)', () => {
  test('E2E-CR01-01: displays "Max 5 per item", disables "+" at 5, shows "5 ×" in OrderSummary, and submits order showing "× 5" on /orders/:id', async ({
    page,
  }) => {
    // 1. Authenticate as seeded customer
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('#email', 'customer1@test.com');
    await page.fill('#password', CUSTOMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalog');

    // 2. Navigate to /orders/new
    await page.goto('/orders/new');
    await expect(page.locator('h1')).toContainText('Create New Pre-Order');

    // 3. Target a seeded high-stock item (e.g., Cinnamon Brioche Roll with stock >= 20)
    const targetCard = page
      .locator('[data-testid^="bakery-item-card-"]')
      .filter({ hasText: 'Cinnamon Brioche Roll' })
      .first();
    await expect(targetCard).toBeVisible();

    // Verify "Max 5 per item" notice is visible on the card
    await expect(targetCard).toContainText('Max 5 per item');

    // 4. Click "+" 5 times -> quantity reaches 5 and "+" becomes disabled
    const plusBtn = targetCard.locator('button:has-text("+")');
    for (let i = 0; i < 5; i++) {
      await expect(plusBtn).toBeEnabled();
      await plusBtn.click();
    }

    await expect(plusBtn).toBeDisabled();

    // 5. Verify OrderSummary on /orders/new shows "5 ×"
    await expect(page.getByText(/5\s*×/)).toBeVisible();

    // 6. Confirm Pre-Order and verify /orders/:id shows "× 5" (OrderDetailPage format: ฿<price> × 5)
    await page.click('button:has-text("Confirm Pre-Order")');
    await page.waitForURL(/\/orders\/[a-z0-9-]+$/);

    await expect(page.locator('h1')).toContainText('Pre-Order Details');
    await expect(page.locator('text=Pending Acceptance / รอยืนยัน')).toBeVisible();
    await expect(page.getByText(/×\s*5/)).toBeVisible();
  });
});
