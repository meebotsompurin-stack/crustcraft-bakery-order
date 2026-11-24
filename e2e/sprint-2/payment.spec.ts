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
    (i: { stockQuantity: number; isAvailable: boolean }) => i.isAvailable && i.stockQuantity >= 1
  );
  expect(inStockItem).toBeDefined();

  const orderRes = await apiContext.post('/api/customer/orders', {
    data: {
      items: [{ bakeryItemId: inStockItem.id, quantity: 1 }],
      pickupNote: 'E2E Sprint 2 simulated payment order',
    },
  });
  expect(orderRes.status()).toBe(201);
  const { order } = await orderRes.json();
  await apiContext.dispose();
  return order;
}

test.describe('F-07 Simulated Payment Transitions E2E (E2E-S2-04)', () => {
  test('E2E-S2-04: Customer simulates FAILED then PAID payment via SimulatedPaymentCard; Operator confirms Paid badge', async ({
    page,
  }) => {
    const order = await createPendingOrderViaApi();

    // 1. Customer visits /orders/:id and sees Unpaid badge
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, '/catalog');
    await page.goto(`/orders/${order.id}`);
    await expect(page.locator('[data-payment-status="UNPAID"]').first()).toBeVisible();

    // 2. Simulate Failed Payment -> Payment Failed badge
    await page.click('button:has-text("Simulate Failed Payment")');
    await expect(page.locator('[data-payment-status="FAILED"]').first()).toBeVisible();

    // 3. Retry with Pay Now (Simulated) -> Paid badge
    await page.click('button:has-text("Pay Now (Simulated)")');
    await expect(page.locator('[data-payment-status="PAID"]').first()).toBeVisible();
    await expect(page.getByText('Payment confirmed.')).toBeVisible();

    // 4. Operator logs in and views /operator/orders/:id -> sees Paid badge
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, '/operator/orders');
    await page.goto(`/operator/orders/${order.id}`);
    await expect(page.locator('[data-payment-status="PAID"]').first()).toBeVisible();
  });
});
