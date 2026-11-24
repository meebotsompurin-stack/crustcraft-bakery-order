import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'child_process';
import path from 'path';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://crustcraft:crustcraft_test_password@localhost:5432/crustcraft_test?schema=public';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'crustcraft-api-test-jwt-secret-2026';
}

import { app } from '../../app';
import { prisma } from '../../lib/db';
import { signToken } from '../../services/auth.service';

describe('F-06 Order Fulfillment & Atomic Cancellation API Tests (FUL-01 to FUL-08)', () => {
  const testRunId = `ful-${Date.now()}`;

  let customer1Token: string;
  let customer2Token: string;
  let operatorToken: string;

  let customer1: { id: string; email: string };
  let customer2: { id: string; email: string };
  let operatorUser: { id: string; email: string };

  const itemAId = `${testRunId}-item-a`;
  const itemBId = `${testRunId}-item-b`;
  const ownedItemIds = [itemAId, itemBId];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env },
      stdio: 'pipe',
    });

    customer1 = await prisma.user.create({
      data: {
        name: 'Fulfillment Customer One',
        email: `${testRunId}.cust1@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    customer2 = await prisma.user.create({
      data: {
        name: 'Fulfillment Customer Two',
        email: `${testRunId}.cust2@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    operatorUser = await prisma.user.create({
      data: {
        name: 'Fulfillment Test Operator',
        email: `${testRunId}.op@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'OPERATOR',
      },
    });

    customer1Token = signToken({ userId: customer1.id, role: 'CUSTOMER' });
    customer2Token = signToken({ userId: customer2.id, role: 'CUSTOMER' });
    operatorToken = signToken({ userId: operatorUser.id, role: 'OPERATOR' });

    await prisma.bakeryItem.create({
      data: {
        id: itemAId,
        name: `Croissant ${testRunId}`,
        description: 'Fulfillment test pastry A',
        price: 8500,
        stockQuantity: 30,
        isAvailable: true,
        category: 'Pastry',
      },
    });

    await prisma.bakeryItem.create({
      data: {
        id: itemBId,
        name: `Sourdough ${testRunId}`,
        description: 'Fulfillment test bread B',
        price: 22000,
        stockQuantity: 20,
        isAvailable: true,
        category: 'Bread',
      },
    });
  });

  afterAll(async () => {
    try {
      const userIds = [customer1?.id, customer2?.id, operatorUser?.id].filter(Boolean);
      await prisma.orderItem.deleteMany({
        where: { order: { customerId: { in: userIds } } },
      });
      await prisma.order.deleteMany({
        where: { customerId: { in: userIds } },
      });
      await prisma.orderItem.deleteMany({
        where: { bakeryItemId: { in: ownedItemIds } },
      });
      await prisma.bakeryItem.deleteMany({
        where: { id: { in: ownedItemIds } },
      });
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

  async function createCustomerOrder(
    token: string,
    items: Array<{ bakeryItemId: string; quantity: number }>,
    pickupNote?: string
  ) {
    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items, ...(pickupNote ? { pickupNote } : {}) });
    expect(res.status).toBe(201);
    return res.body.order;
  }

  it('FUL-01: OPERATOR advances PENDING -> ACCEPTED -> BAKING -> READY_FOR_PICKUP -> COMPLETED (200 OK & persisted at each step)', async () => {
    const order = await createCustomerOrder(customer1Token, [
      { bakeryItemId: itemAId, quantity: 1 },
    ]);

    const sequence = ['ACCEPTED', 'BAKING', 'READY_FOR_PICKUP', 'COMPLETED'] as const;

    for (const nextStatus of sequence) {
      const res = await request(app)
        .patch(`/api/operator/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: nextStatus });

      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.id).toBe(order.id);
      expect(res.body.order.status).toBe(nextStatus);

      const inDb = await prisma.order.findUnique({ where: { id: order.id } });
      expect(inDb?.status).toBe(nextStatus);
    }
  });

  it('FUL-02: OPERATOR invalid transitions (PENDING->BAKING, BAKING->ACCEPTED, COMPLETED->READY_FOR_PICKUP) return 409 CONFLICT and leave DB unchanged', async () => {
    const pendingOrder = await prisma.order.create({
      data: {
        customerId: customer1.id,
        status: 'PENDING',
        totalAmount: 8500,
        items: { create: [{ bakeryItemId: itemAId, quantity: 1, unitPriceAtOrder: 8500 }] },
      },
    });

    const bakingOrder = await prisma.order.create({
      data: {
        customerId: customer1.id,
        status: 'BAKING',
        totalAmount: 8500,
        items: { create: [{ bakeryItemId: itemAId, quantity: 1, unitPriceAtOrder: 8500 }] },
      },
    });

    const completedOrder = await prisma.order.create({
      data: {
        customerId: customer1.id,
        status: 'COMPLETED',
        totalAmount: 8500,
        items: { create: [{ bakeryItemId: itemAId, quantity: 1, unitPriceAtOrder: 8500 }] },
      },
    });

    // Skip transition: PENDING -> BAKING
    const skipRes = await request(app)
      .patch(`/api/operator/orders/${pendingOrder.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'BAKING' });
    expect(skipRes.status).toBe(409);
    expect(skipRes.body.error.code).toBe('CONFLICT');
    expect((await prisma.order.findUnique({ where: { id: pendingOrder.id } }))?.status).toBe('PENDING');

    // Backward transition: BAKING -> ACCEPTED
    const backwardRes = await request(app)
      .patch(`/api/operator/orders/${bakingOrder.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'ACCEPTED' });
    expect(backwardRes.status).toBe(409);
    expect(backwardRes.body.error.code).toBe('CONFLICT');
    expect((await prisma.order.findUnique({ where: { id: bakingOrder.id } }))?.status).toBe('BAKING');

    // Terminal backward transition: COMPLETED -> READY_FOR_PICKUP
    const terminalRes = await request(app)
      .patch(`/api/operator/orders/${completedOrder.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'READY_FOR_PICKUP' });
    expect(terminalRes.status).toBe(409);
    expect(terminalRes.body.error.code).toBe('CONFLICT');
    expect((await prisma.order.findUnique({ where: { id: completedOrder.id } }))?.status).toBe('COMPLETED');
  });

  it('FUL-03: Owning CUSTOMER cancels PENDING multi-item order via PATCH /api/customer/orders/:id/cancel and atomically restores every item stockQuantity', async () => {
    const stockABefore = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;
    const stockBBefore = (await prisma.bakeryItem.findUnique({ where: { id: itemBId } }))!.stockQuantity;

    const order = await createCustomerOrder(customer1Token, [
      { bakeryItemId: itemAId, quantity: 3 },
      { bakeryItemId: itemBId, quantity: 2 },
    ]);

    expect((await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity).toBe(stockABefore - 3);
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemBId } }))!.stockQuantity).toBe(stockBBefore - 2);

    const cancelRes = await request(app)
      .patch(`/api/customer/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order).toBeDefined();
    expect(cancelRes.body.order.id).toBe(order.id);
    expect(cancelRes.body.order.status).toBe('CANCELLED');

    const stockAAfter = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;
    const stockBAfter = (await prisma.bakeryItem.findUnique({ where: { id: itemBId } }))!.stockQuantity;
    expect(stockAAfter).toBe(stockABefore);
    expect(stockBAfter).toBe(stockBBefore);

    const inDb = await prisma.order.findUnique({ where: { id: order.id } });
    expect(inDb?.status).toBe('CANCELLED');
  });

  it('FUL-04: Repeat and concurrent cancel on already CANCELLED order returns 409 CONFLICT and does NOT double-restore stockQuantity', async () => {
    const stockABefore = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;

    const order = await createCustomerOrder(customer1Token, [
      { bakeryItemId: itemAId, quantity: 2 },
    ]);

    // Concurrent cancel calls: exactly one 200 and one 409
    const sendCancel = () =>
      request(app)
        .patch(`/api/customer/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({});

    const [r1, r2] = await Promise.all([sendCancel(), sendCancel()]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);

    const stockAfterConcurrent = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;
    expect(stockAfterConcurrent).toBe(stockABefore);

    // Explicit sequential repeat cancel
    const repeatRes = await sendCancel();
    expect(repeatRes.status).toBe(409);
    expect(repeatRes.body.error.code).toBe('CONFLICT');

    const stockAfterRepeat = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;
    expect(stockAfterRepeat).toBe(stockABefore);
  });

  it('FUL-05: Customer B cancelling Customer A PENDING order returns 403 FORBIDDEN; Customer A cancelling own ACCEPTED order returns 409 CONFLICT with zero stock change', async () => {
    const order = await createCustomerOrder(customer1Token, [
      { bakeryItemId: itemAId, quantity: 2 },
    ]);

    const stockAfterOrder = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;

    // Customer B attempts to cancel Customer A's PENDING order
    const forbiddenRes = await request(app)
      .patch(`/api/customer/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({});

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('PENDING');
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity).toBe(stockAfterOrder);

    // Operator accepts the order
    const acceptRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'ACCEPTED' });
    expect(acceptRes.status).toBe(200);

    // Customer A attempts to cancel own ACCEPTED order
    const conflictRes = await request(app)
      .patch(`/api/customer/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('CONFLICT');
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('ACCEPTED');
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity).toBe(stockAfterOrder);
  });

  it('FUL-06: OPERATOR cancels PENDING order via PATCH /api/operator/orders/:id/status with { status: "CANCELLED" } and restores stock atomically', async () => {
    const stockABefore = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;
    const stockBBefore = (await prisma.bakeryItem.findUnique({ where: { id: itemBId } }))!.stockQuantity;

    const order = await createCustomerOrder(customer1Token, [
      { bakeryItemId: itemAId, quantity: 4 },
      { bakeryItemId: itemBId, quantity: 1 },
    ]);

    const cancelRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'CANCELLED' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order).toBeDefined();
    expect(cancelRes.body.order.id).toBe(order.id);
    expect(cancelRes.body.order.status).toBe('CANCELLED');

    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('CANCELLED');
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity).toBe(stockABefore);
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemBId } }))!.stockQuantity).toBe(stockBBefore);
  });

  it('FUL-07: OPERATOR attempting to cancel ACCEPTED or BAKING order returns 409 CONFLICT with status and stock unchanged', async () => {
    const order = await createCustomerOrder(customer1Token, [
      { bakeryItemId: itemAId, quantity: 1 },
    ]);
    const stockAfterOrder = (await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity;

    // Move to ACCEPTED
    const acceptRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'ACCEPTED' });
    expect(acceptRes.status).toBe(200);

    // Operator tries to cancel ACCEPTED order
    const cancelAcceptedRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'CANCELLED' });
    expect(cancelAcceptedRes.status).toBe(409);
    expect(cancelAcceptedRes.body.error.code).toBe('CONFLICT');
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('ACCEPTED');
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity).toBe(stockAfterOrder);

    // Move to BAKING
    const bakingRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'BAKING' });
    expect(bakingRes.status).toBe(200);

    // Operator tries to cancel BAKING order
    const cancelBakingRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'CANCELLED' });
    expect(cancelBakingRes.status).toBe(409);
    expect(cancelBakingRes.body.error.code).toBe('CONFLICT');
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('BAKING');
    expect((await prisma.bakeryItem.findUnique({ where: { id: itemAId } }))!.stockQuantity).toBe(stockAfterOrder);
  });

  it('FUL-08: GET /api/operator/orders sorts all 6 statuses by operational priority (PENDING -> ACCEPTED -> BAKING -> READY_FOR_PICKUP -> COMPLETED -> CANCELLED, createdAt DESC tie-breaker)', async () => {
    const baseTime = Date.now();

    const makeOrder = (status: string, offsetMs: number) =>
      prisma.order.create({
        data: {
          customerId: customer2.id,
          status,
          totalAmount: 8500,
          createdAt: new Date(baseTime + offsetMs),
          items: { create: [{ bakeryItemId: itemAId, quantity: 1, unitPriceAtOrder: 8500 }] },
        },
      });

    // Deliberately give lower-priority statuses newer timestamps to prove priority beats createdAt
    const cancelledOrder = await makeOrder('CANCELLED', 60000);
    const completedOrder = await makeOrder('COMPLETED', 50000);
    const readyOrder = await makeOrder('READY_FOR_PICKUP', 40000);
    const bakingOrder = await makeOrder('BAKING', 30000);
    const acceptedOrder = await makeOrder('ACCEPTED', 20000);
    const olderPendingOrder = await makeOrder('PENDING', 5000);
    const newerPendingOrder = await makeOrder('PENDING', 10000);

    const res = await request(app)
      .get('/api/operator/orders')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);

    const ids: string[] = res.body.orders.map((o: { id: string }) => o.id);
    const expectedOrder = [
      newerPendingOrder.id,
      olderPendingOrder.id,
      acceptedOrder.id,
      bakingOrder.id,
      readyOrder.id,
      completedOrder.id,
      cancelledOrder.id,
    ];

    const indices = expectedOrder.map((id) => ids.indexOf(id));
    indices.forEach((idx) => expect(idx).toBeGreaterThanOrEqual(0));

    for (let i = 0; i < indices.length - 1; i++) {
      expect(indices[i]).toBeLessThan(indices[i + 1]);
    }
  });
});
