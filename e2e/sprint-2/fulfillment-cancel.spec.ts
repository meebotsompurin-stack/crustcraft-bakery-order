import { test, expect, request, type Page } from '@playwright/test';

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

async function createPendingOrderViaApi(baseURL: string = 'http://localhost:5173') {
  const apiContext = await request.newContext({ baseURL });
  const loginRes = await apiContext.post('/api/auth/login', {
    data: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
  });
  expect(loginRes.ok()).toBe(true);

  const catalogRes = await apiContext.get('/api/catalog');
  const catalog = await catalogRes.json();
  const inStockItem = catalog.items.find(
    (i: { stockQuantity: number; isAvailable: boolean }) => i.isAvailable && i.stockQuantity >= 2
  );
  expect(inStockItem).toBeDefined();

  const orderRes = await apiContext.post('/api/customer/orders', {
    data: {
      items: [{ bakeryItemId: inStockItem.id, quantity: 1 }],
      pickupNote: 'E2E Sprint 2 fulfillment test order',
    },
  });
  expect(orderRes.status()).toBe(201);
  const { order } = await orderRes.json();
  await apiContext.dispose();
  return { order, itemId: inStockItem.id, itemName: inStockItem.name, stockBefore: inStockItem.stockQuantity };
}

test.describe('F-06 Fulfillment & Cancellation Lifecycle E2E (E2E-S2-02 & E2E-S2-03)', () => {
  test('E2E-S2-02: Customer places order, cancels it on /orders/:id, sees CANCELLED badge and restored stock on /catalog', async ({
    page,
  }) => {
    // 1. Login as customer and inspect initial stock via API
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, '/catalog');

    const firstCard = page.locator('[data-testid^="bakery-item-card-"]').first();
    await expect(firstCard).toBeVisible();
    const stockBadgeText = await firstCard.locator('[data-testid="badge-in-stock"]').textContent();
    const stockMatchBefore = stockBadgeText?.match(/In Stock:\s*(\d+)/);
    expect(stockMatchBefore).toBeTruthy();
    const initialStock = Number(stockMatchBefore![1]);

    // 2. Place a pre-order for 1 unit of the first item
    await page.goto('/orders/new');
    await expect(page.locator('h1')).toContainText('Create New Pre-Order');
    const orderCards = page.locator('[data-testid^="bakery-item-card-"]');
    await expect(orderCards.first()).toBeVisible();
    await orderCards.first().locator('button:has-text("+")').click();
    await page.click('button:has-text("Confirm Pre-Order")');
    await page.waitForURL(/\/orders\/[a-z0-9-]+$/);

    // 3. Verify PENDING state and cancel the order
    await expect(page.locator('text=Pending Acceptance / รอยืนยัน')).toBeVisible();
    await page.click('button:has-text("Cancel Order")');
    await page.click('button:has-text("Confirm Cancellation")');

    // 4. Verify CANCELLED badge & restoration notice
    await expect(page.locator('text=Cancelled / ยกเลิกแล้ว')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('restored');

    // 5. Return to /catalog and confirm stock is restored to initialStock
    await page.goto('/catalog');
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('[data-testid="badge-in-stock"]')).toContainText(
      `In Stock: ${initialStock}`
    );
  });

  test('E2E-S2-03: Operator advances order PENDING -> ACCEPTED -> BAKING -> READY_FOR_PICKUP -> COMPLETED and Customer sees COMPLETED', async ({
    page,
  }) => {
    const { order } = await createPendingOrderViaApi();

    // 1. Operator opens /operator/orders/:id and advances through all 4 steps
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, '/operator/orders');
    await page.goto(`/operator/orders/${order.id}`);
    await expect(page.locator('h1')).toContainText(`Order #${order.id.slice(-8)}`);
    await expect(page.getByText('PENDING', { exact: true })).toBeVisible();

    // PENDING -> ACCEPTED
    await page.click('button:has-text("Accept Order")');
    await expect(page.getByText('ACCEPTED', { exact: true })).toBeVisible();

    // ACCEPTED -> BAKING
    await page.click('button:has-text("Start Baking")');
    await expect(page.getByText('BAKING', { exact: true })).toBeVisible();

    // BAKING -> READY_FOR_PICKUP
    await page.click('button:has-text("Mark Ready for Pickup")');
    await expect(page.getByText('READY_FOR_PICKUP', { exact: true })).toBeVisible();

    // READY_FOR_PICKUP -> COMPLETED
    await page.click('button:has-text("Mark Completed")');
    await expect(page.getByText('COMPLETED', { exact: true })).toBeVisible();
    await expect(page.getByText('Completed ✓')).toBeVisible();

    // 2. Customer views /orders/:id and sees COMPLETED badge
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, '/catalog');
    await page.goto(`/orders/${order.id}`);
    await expect(page.locator('text=Completed / เสร็จสมบูรณ์')).toBeVisible();
  });
});
