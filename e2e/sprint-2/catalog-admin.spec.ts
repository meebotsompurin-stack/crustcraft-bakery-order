import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@crustcraft.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'supersecret_admin_pass';
const CUSTOMER_EMAIL = 'customer1@test.com';
const CUSTOMER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'supersecret_demo_pass';

async function loginAs(page: Page, email: string, password: string, expectedUrl: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(expectedUrl);
}

test.describe('F-05 Bakery Catalog Administration E2E (E2E-S2-01)', () => {
  test('E2E-S2-01: Operator creates, restocks, archives, and restores bakery item; Customer catalog reflects visibility', async ({
    page,
  }, testInfo) => {
    const viewport = testInfo.project.name.toLowerCase();
    const itemName = `E2E Cardamom Bun ${viewport} ${Date.now()}`;

    // 1. Operator logs in and navigates to /operator/catalog
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, '/operator/orders');
    await page.goto('/operator/catalog');
    await expect(page.locator('h1')).toContainText('Catalog Administration');

    // 2. Create a new bakery item (฿95.00, stock 5)
    await page.click('button:has-text("Add Bakery Item")');
    await page.fill('#catalog-name', itemName);
    await page.selectOption('#catalog-category', 'Sweet Bread');
    await page.fill('#catalog-price', '95.00');
    await page.fill('#catalog-stock', '5');
    await page.fill(
      '#catalog-description',
      'Freshly baked cardamom brioche bun for E2E catalog admin verification.'
    );
    await page.click('button[type="submit"]:has-text("Create Item")');

    await expect(page.getByRole('status')).toContainText(itemName);

    // Scope to visible row (desktop table) or visible card (mobile)
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    const itemContainer = isMobile
      ? page.locator('div.md\\:hidden > div').filter({ hasText: itemName }).first()
      : page.locator('tbody tr').filter({ hasText: itemName }).first();

    await expect(itemContainer).toBeVisible();
    await expect(itemContainer).toContainText('฿95.00');
    await expect(itemContainer).toContainText('5');

    // 3. Restock item (+10 Restock -> 15)
    await itemContainer.locator('button:has-text("+10 Restock")').click();
    await expect(page.getByRole('status')).toContainText('15 units');
    await expect(itemContainer).toContainText('15');

    // 4. Archive item (isAvailable -> false)
    await itemContainer.locator('button:has-text("Archive")').click();
    await expect(page.getByRole('status')).toContainText('Archived');
    await expect(itemContainer).toContainText('Archived');

    // 5. Customer checks /catalog -> archived item must NOT be visible
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, '/catalog');
    await expect(page.locator('h1')).toContainText('Artisan Bakery Catalog');
    await expect(page.locator('[data-testid^="bakery-item-card-"]').first()).toBeVisible();
    await expect(page.getByText(itemName)).toHaveCount(0);

    // 6. Operator restores item (isAvailable -> true)
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, '/operator/orders');
    await page.goto('/operator/catalog');
    await expect(itemContainer).toBeVisible();
    await itemContainer.locator('button:has-text("Restore")').click();
    await expect(page.getByRole('status')).toContainText('Restored');
    await expect(itemContainer).toContainText('Active');

    // 7. Customer checks /catalog -> restored item IS visible with ฿95.00
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, '/catalog');
    const customerCard = page
      .locator('[data-testid^="bakery-item-card-"]')
      .filter({ hasText: itemName })
      .first();
    await expect(customerCard).toBeVisible();
    await expect(customerCard).toContainText('฿95.00');
  });
});
