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

function formatTHB(satang: number): string {
  return `฿${(satang / 100).toFixed(2)}`;
}

async function seedReportingScenarioViaApi(
  viewport: string,
  baseURL: string = 'http://localhost:5173'
) {
  const opContext = await request.newContext({ baseURL });
  const opLogin = await opContext.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(opLogin.ok()).toBe(true);

  // 1. Capture current baseline summary before creating test orders
  const baselineRes = await opContext.get('/api/operator/reports/summary');
  expect(baselineRes.status()).toBe(200);
  const { summary: baselineSummary } = await baselineRes.json();

  // 2. Create a unique bakery item (125.00 THB = 12500 satang) for deterministic reporting checks
  const itemName = `E2E Report Tart ${viewport} ${Date.now()}`;
  const createItemRes = await opContext.post('/api/operator/catalog', {
    data: {
      name: itemName,
      description: 'Deterministic tart item for E2E-S2-05 sales reporting verification.',
      price: 12500,
      stockQuantity: 20,
      category: 'Tart',
      isAvailable: true,
    },
  });
  expect(createItemRes.status()).toBe(201);
  const { item } = await createItemRes.json();

  // 3. As CUSTOMER, place 2 orders:
  //    - completedOrder: 2 x 12500 = 25000 satang (฿250.00) -> will be COMPLETED (counts in revenue)
  //    - pendingOrder:   3 x 12500 = 37500 satang (฿375.00) -> stays PENDING (must NOT count in revenue)
  const custContext = await request.newContext({ baseURL });
  const custLogin = await custContext.post('/api/auth/login', {
    data: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
  });
  expect(custLogin.ok()).toBe(true);

  const completedOrderRes = await custContext.post('/api/customer/orders', {
    data: {
      items: [{ bakeryItemId: item.id, quantity: 2 }],
      pickupNote: 'E2E-S2-05 completed order for revenue inclusion',
    },
  });
  expect(completedOrderRes.status()).toBe(201);
  const { order: completedOrder } = await completedOrderRes.json();

  const pendingOrderRes = await custContext.post('/api/customer/orders', {
    data: {
      items: [{ bakeryItemId: item.id, quantity: 3 }],
      pickupNote: 'E2E-S2-05 pending order for revenue exclusion',
    },
  });
  expect(pendingOrderRes.status()).toBe(201);

  // 4. Advance completedOrder through full lifecycle to COMPLETED and mark PAID
  for (const nextStatus of ['ACCEPTED', 'BAKING', 'READY_FOR_PICKUP', 'COMPLETED']) {
    const stepRes = await opContext.patch(`/api/operator/orders/${completedOrder.id}/status`, {
      data: { status: nextStatus },
    });
    expect(stepRes.status()).toBe(200);
  }
  const payRes = await opContext.patch(`/api/operator/orders/${completedOrder.id}/payment`, {
    data: { paymentStatus: 'PAID' },
  });
  expect(payRes.status()).toBe(200);

  await custContext.dispose();
  await opContext.dispose();

  return {
    itemName,
    expectedTotalRevenueSatang: baselineSummary.totalRevenueSatang + 25000,
    expectedCompletedOrderCount: baselineSummary.completedOrderCount + 1,
    expectedTotalOrderCount: baselineSummary.totalOrderCount + 2,
  };
}

test.describe('F-08 Bakery Sales & Order Summary Reporting E2E (E2E-S2-05)', () => {
  test('E2E-S2-05: Enforces RBAC for CUSTOMER and verifies Operator sales reporting KPIs, revenue exclusion, date filter & NFR-04 overflow', async ({
    page,
  }, testInfo) => {
    const viewport = testInfo.project.name.toLowerCase();

    // 1. RBAC Check: CUSTOMER must not see "Sales Reports" nav link and cannot access /operator/reports
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, '/catalog');
    await expect(page.locator('a[href="/operator/reports"]')).toHaveCount(0);
    await page.goto('/operator/reports');
    await page.waitForURL('/catalog');
    await expect(page.locator('h1')).toContainText('Artisan Bakery Catalog');

    // 2. Seed deterministic COMPLETED (+฿250.00) and PENDING (+฿375.00 excluded) orders
    const {
      itemName,
      expectedTotalRevenueSatang,
      expectedCompletedOrderCount,
      expectedTotalOrderCount,
    } = await seedReportingScenarioViaApi(viewport);

    // 3. Log in as OPERATOR and navigate via "Sales Reports" link
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, '/operator/orders');
    const reportsLink = page.locator('a[href="/operator/reports"]');
    await expect(reportsLink).toBeVisible();
    await reportsLink.click();
    await page.waitForURL('/operator/reports');
    await expect(page.locator('h1')).toContainText('Sales & Order Summary Reports');

    // 4. Verify KPI cards (exact THB revenue proving PENDING order was excluded, no NaN)
    const revenueCard = page.locator('[data-testid="reports-kpi-revenue"]');
    const completedCard = page.locator('[data-testid="reports-kpi-completed"]');
    const paidCard = page.locator('[data-testid="reports-kpi-paid"]');

    await expect(revenueCard).toBeVisible();
    await expect(revenueCard).toContainText(formatTHB(expectedTotalRevenueSatang));
    await expect(revenueCard).not.toContainText('NaN');

    await expect(completedCard).toContainText(String(expectedCompletedOrderCount));
    await expect(completedCard).toContainText(`Out of ${expectedTotalOrderCount} total orders`);
    await expect(paidCard).toBeVisible();

    // 5. Verify all 6 Order Status Breakdown cards render cleanly
    for (const statusKey of [
      'PENDING',
      'ACCEPTED',
      'BAKING',
      'READY_FOR_PICKUP',
      'COMPLETED',
      'CANCELLED',
    ]) {
      await expect(page.locator(`[data-testid="reports-status-${statusKey}"]`)).toBeVisible();
    }

    // 6. Verify Top-Selling Items includes our completed item with ฿250.00 revenue (2 units sold)
    const topItemsSection = page.locator('[data-testid="reports-top-items"]');
    await expect(topItemsSection).toBeVisible();
    await expect(topItemsSection).toContainText(itemName);
    await expect(topItemsSection).toContainText('฿250.00');

    // 7. Verify NFR-04 zero horizontal overflow across Desktop, Tablet, and Mobile
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);

    // 8. Test Date Range Filter (future empty window -> ฿0.00 + empty state) and Reset
    await page.fill('[data-testid="reports-filter-from"]', '2099-01-01');
    await page.fill('[data-testid="reports-filter-to"]', '2099-01-31');
    await page.click('[data-testid="reports-filter-apply"]');

    await expect(revenueCard).toContainText('฿0.00');
    await expect(page.locator('[data-testid="reports-empty-state"]')).toBeVisible();

    await page.click('[data-testid="reports-filter-reset"]');
    await expect(revenueCard).toContainText(formatTHB(expectedTotalRevenueSatang));
    await expect(topItemsSection).toContainText(itemName);

    // Re-check NFR-04 after filter reset
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
