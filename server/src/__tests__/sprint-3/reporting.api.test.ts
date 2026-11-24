import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'child_process';
import path from 'path';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://crustcraft:crustcraft_test_password@localhost:5432/crustcraft_test?schema=public';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'crustcraft-api-test-jwt-secret-2026';
}

import { app } from '../../app';
import { prisma } from '../../lib/db';
import { signToken } from '../../services/auth.service';

describe('F-08 Bakery Sales & Order Summary Reporting API Tests (RPT-03 to RPT-06)', () => {
  const testRunId = `rpt-${Date.now()}`;

  let operatorToken: string;
  let customerToken: string;

  let operatorUser: { id: string; email: string };
  let customerUser: { id: string; email: string };

  let croissantItem: { id: string; name: string };
  let sourdoughItem: { id: string; name: string };

  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env },
      stdio: 'pipe',
    });

    operatorUser = await prisma.user.create({
      data: {
        name: 'Reporting Test Operator',
        email: `${testRunId}.op@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'OPERATOR',
      },
    });

    customerUser = await prisma.user.create({
      data: {
        name: 'Reporting Test Customer',
        email: `${testRunId}.cust@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    operatorToken = signToken({ userId: operatorUser.id, role: 'OPERATOR' });
    customerToken = signToken({ userId: customerUser.id, role: 'CUSTOMER' });

    croissantItem = await prisma.bakeryItem.create({
      data: {
        name: `RPT Croissant ${testRunId}`,
        description: 'Flaky French butter croissant',
        price: 9500, // Current catalog price differs from historical snapshot
        stockQuantity: 50,
        isAvailable: true,
        category: 'Pastry',
      },
    });

    sourdoughItem = await prisma.bakeryItem.create({
      data: {
        name: `RPT Sourdough ${testRunId}`,
        description: 'Naturally leavened loaf',
        price: 16000,
        stockQuantity: 30,
        isAvailable: true,
        category: 'Bread',
      },
    });

    // Use a dedicated historical window (2025-05-10 .. 2025-05-20) so date-filtered assertions
    // are 100% isolated from seeded or parallel test orders.
    const completedOrder1 = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalAmount: 31000, // 2 * 8500 + 1 * 14000
        createdAt: new Date('2025-05-10T00:00:00.000Z'), // inclusive lower bound
        items: {
          create: [
            {
              bakeryItemId: croissantItem.id,
              quantity: 2,
              unitPriceAtOrder: 8500,
            },
            {
              bakeryItemId: sourdoughItem.id,
              quantity: 1,
              unitPriceAtOrder: 14000,
            },
          ],
        },
      },
    });
    createdOrderIds.push(completedOrder1.id);

    const completedOrder2 = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalAmount: 18000, // 2 * 9000
        createdAt: new Date('2025-05-20T23:59:59.999Z'), // inclusive upper bound
        items: {
          create: [
            {
              bakeryItemId: croissantItem.id,
              quantity: 2,
              unitPriceAtOrder: 9000,
            },
          ],
        },
      },
    });
    createdOrderIds.push(completedOrder2.id);

    const pendingOrder = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalAmount: 28000,
        createdAt: new Date('2025-05-15T12:00:00.000Z'),
        items: {
          create: [
            {
              bakeryItemId: sourdoughItem.id,
              quantity: 2,
              unitPriceAtOrder: 14000,
            },
          ],
        },
      },
    });
    createdOrderIds.push(pendingOrder.id);

    const cancelledOrder = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        status: 'CANCELLED',
        paymentStatus: 'FAILED',
        totalAmount: 42500,
        createdAt: new Date('2025-05-16T08:30:00.000Z'),
        items: {
          create: [
            {
              bakeryItemId: croissantItem.id,
              quantity: 5,
              unitPriceAtOrder: 8500,
            },
          ],
        },
      },
    });
    createdOrderIds.push(cancelledOrder.id);
  });

  afterAll(async () => {
    try {
      if (createdOrderIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { orderId: { in: createdOrderIds } },
        });
        await prisma.order.deleteMany({
          where: { id: { in: createdOrderIds } },
        });
      }
      const itemIds = [croissantItem?.id, sourdoughItem?.id].filter(Boolean);
      if (itemIds.length > 0) {
        await prisma.bakeryItem.deleteMany({
          where: { id: { in: itemIds } },
        });
      }
      const userIds = [operatorUser?.id, customerUser?.id].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } catch {
      // Ignore teardown cleanup errors
    } finally {
      await prisma.$disconnect();
    }
  });

  it('RPT-03: GET /api/operator/reports/summary returns accurate PostgreSQL-backed summary metrics (both unfiltered and date-filtered)', async () => {
    // 1. Date-filtered query covering the isolated 2025-05-10..2025-05-20 window
    const filteredRes = await request(app)
      .get('/api/operator/reports/summary?from=2025-05-10&to=2025-05-20')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.summary).toBeDefined();
    expect(filteredRes.body.summary).toEqual({
      totalRevenueSatang: 49000, // 31000 + 18000 (COMPLETED only)
      completedOrderCount: 2,
      totalOrderCount: 4,
      ordersByStatus: {
        PENDING: 1,
        ACCEPTED: 0,
        BAKING: 0,
        READY_FOR_PICKUP: 0,
        COMPLETED: 2,
        CANCELLED: 1,
      },
      paymentBreakdown: {
        UNPAID: 1,
        PAID: 2,
        FAILED: 1,
      },
      topSellingItems: [
        {
          bakeryItemId: croissantItem.id,
          name: croissantItem.name,
          category: 'Pastry',
          quantitySold: 4, // 2 + 2 from COMPLETED orders only
          revenueSatang: 35000, // (2 * 8500) + (2 * 9000)
        },
        {
          bakeryItemId: sourdoughItem.id,
          name: sourdoughItem.name,
          category: 'Bread',
          quantitySold: 1,
          revenueSatang: 14000,
        },
      ],
      dateRange: {
        from: '2025-05-10',
        to: '2025-05-20',
      },
    });

    // 2. Unfiltered query succeeds and includes at least the 4 orders created above
    const fullRes = await request(app)
      .get('/api/operator/reports/summary')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(fullRes.status).toBe(200);
    expect(fullRes.body.summary).toBeDefined();
    expect(fullRes.body.summary.totalRevenueSatang).toBeGreaterThanOrEqual(49000);
    expect(fullRes.body.summary.completedOrderCount).toBeGreaterThanOrEqual(2);
    expect(fullRes.body.summary.totalOrderCount).toBeGreaterThanOrEqual(4);
    expect(fullRes.body.summary.dateRange).toEqual({ from: null, to: null });
  });

  it('RPT-04: rejects malformed date params, invalid calendar dates, and inverted ranges (from > to) with 400 VALIDATION_ERROR', async () => {
    const malformedRes = await request(app)
      .get('/api/operator/reports/summary?from=invalid-date')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error).toBeDefined();
    expect(malformedRes.body.error.code).toBe('VALIDATION_ERROR');

    const impossibleDateRes = await request(app)
      .get('/api/operator/reports/summary?to=2026-02-30')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(impossibleDateRes.status).toBe(400);
    expect(impossibleDateRes.body.error).toBeDefined();
    expect(impossibleDateRes.body.error.code).toBe('VALIDATION_ERROR');

    const invertedRangeRes = await request(app)
      .get('/api/operator/reports/summary?from=2026-12-10&to=2026-12-01')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(invertedRangeRes.status).toBe(400);
    expect(invertedRangeRes.body.error).toBeDefined();
    expect(invertedRangeRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('RPT-05: rejects unauthenticated requests with 401 UNAUTHORIZED and CUSTOMER requests with 403 FORBIDDEN', async () => {
    const unauthRes = await request(app).get('/api/operator/reports/summary');

    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body.error).toBeDefined();
    expect(unauthRes.body.error.code).toBe('UNAUTHORIZED');

    const customerRes = await request(app)
      .get('/api/operator/reports/summary')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(customerRes.status).toBe(403);
    expect(customerRes.body.error).toBeDefined();
    expect(customerRes.body.error.code).toBe('FORBIDDEN');
  });

  it('RPT-06: returns 200 OK with zeroed metrics and empty topSellingItems when date window has zero orders', async () => {
    const emptyRes = await request(app)
      .get('/api/operator/reports/summary?from=2099-01-01&to=2099-01-31')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.summary).toEqual({
      totalRevenueSatang: 0,
      completedOrderCount: 0,
      totalOrderCount: 0,
      ordersByStatus: {
        PENDING: 0,
        ACCEPTED: 0,
        BAKING: 0,
        READY_FOR_PICKUP: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      },
      paymentBreakdown: {
        UNPAID: 0,
        PAID: 0,
        FAILED: 0,
      },
      topSellingItems: [],
      dateRange: {
        from: '2099-01-01',
        to: '2099-01-31',
      },
    });
  });
});
