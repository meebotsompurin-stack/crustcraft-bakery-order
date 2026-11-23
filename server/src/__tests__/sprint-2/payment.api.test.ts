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

describe('F-07 Simulated Payment Transitions API Tests (PAY-01 to PAY-07)', () => {
  const testRunId = `pay-${Date.now()}`;

  let customer1Token: string;
  let customer2Token: string;
  let operatorToken: string;

  let customer1: { id: string; email: string };
  let customer2: { id: string; email: string };
  let operatorUser: { id: string; email: string };

  const itemAId = `${testRunId}-item-a`;

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env },
      stdio: 'pipe',
    });

    customer1 = await prisma.user.create({
      data: {
        name: 'Payment Customer One',
        email: `${testRunId}.cust1@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    customer2 = await prisma.user.create({
      data: {
        name: 'Payment Customer Two',
        email: `${testRunId}.cust2@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    operatorUser = await prisma.user.create({
      data: {
        name: 'Payment Test Operator',
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
        name: `Brioche ${testRunId}`,
        description: 'Payment test bakery item',
        price: 6500,
        stockQuantity: 50,
        isAvailable: true,
        category: 'Sweet Bread',
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
        where: { bakeryItemId: itemAId },
      });
      await prisma.bakeryItem.deleteMany({
        where: { id: itemAId },
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

  async function createCustomerOrder(token: string) {
    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ bakeryItemId: itemAId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    return res.body.order;
  }

  it('PAY-01: POST /api/customer/orders initializes paymentStatus as UNPAID (returned & persisted)', async () => {
    const order = await createCustomerOrder(customer1Token);

    expect(order.paymentStatus).toBe('UNPAID');

    const detailRes = await request(app)
      .get(`/api/customer/orders/${order.id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.order.paymentStatus).toBe('UNPAID');

    const inDb = (await prisma.order.findUnique({ where: { id: order.id } })) as unknown as {
      paymentStatus?: string;
    } | null;
    expect(inDb?.paymentStatus).toBe('UNPAID');
  });

  it('PAY-02: Owning CUSTOMER calls POST /api/customer/orders/:id/pay (default) -> 200 OK with paymentStatus PAID persisted', async () => {
    const order = await createCustomerOrder(customer1Token);

    const res = await request(app)
      .post(`/api/customer/orders/${order.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.id).toBe(order.id);
    expect(res.body.order.paymentStatus).toBe('PAID');

    const inDb = (await prisma.order.findUnique({ where: { id: order.id } })) as unknown as {
      paymentStatus?: string;
    } | null;
    expect(inDb?.paymentStatus).toBe('PAID');
  });

  it('PAY-03: Owning CUSTOMER sends { simulateOutcome: "FAIL" } -> 200 OK (FAILED), then retries { simulateOutcome: "SUCCESS" } -> 200 OK (PAID)', async () => {
    const order = await createCustomerOrder(customer1Token);

    const failRes = await request(app)
      .post(`/api/customer/orders/${order.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ simulateOutcome: 'FAIL' });

    expect(failRes.status).toBe(200);
    expect(failRes.body.order.paymentStatus).toBe('FAILED');

    const dbAfterFail = (await prisma.order.findUnique({ where: { id: order.id } })) as unknown as {
      paymentStatus?: string;
    } | null;
    expect(dbAfterFail?.paymentStatus).toBe('FAILED');

    const retryRes = await request(app)
      .post(`/api/customer/orders/${order.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ simulateOutcome: 'SUCCESS' });

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.order.paymentStatus).toBe('PAID');

    const dbAfterRetry = (await prisma.order.findUnique({ where: { id: order.id } })) as unknown as {
      paymentStatus?: string;
    } | null;
    expect(dbAfterRetry?.paymentStatus).toBe('PAID');
  });

  it('PAY-04: Customer B calling POST /api/customer/orders/:id/pay on Customer A order returns 403 FORBIDDEN', async () => {
    const order = await createCustomerOrder(customer1Token);

    const res = await request(app)
      .post(`/api/customer/orders/${order.id}/pay`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ simulateOutcome: 'SUCCESS' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('PAY-05: Customer attempting to pay an already PAID order or a CANCELLED order returns 409 CONFLICT with paymentStatus unchanged', async () => {
    // Case 1: Already PAID order
    const paidOrder = await createCustomerOrder(customer1Token);
    const firstPayRes = await request(app)
      .post(`/api/customer/orders/${paidOrder.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ simulateOutcome: 'SUCCESS' });
    expect(firstPayRes.status).toBe(200);

    const duplicatePayRes = await request(app)
      .post(`/api/customer/orders/${paidOrder.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ simulateOutcome: 'SUCCESS' });
    expect(duplicatePayRes.status).toBe(409);
    expect(duplicatePayRes.body.error.code).toBe('CONFLICT');

    const dbPaid = (await prisma.order.findUnique({ where: { id: paidOrder.id } })) as unknown as {
      paymentStatus?: string;
    } | null;
    expect(dbPaid?.paymentStatus).toBe('PAID');

    // Case 2: CANCELLED order
    const cancelledOrder = await prisma.order.create({
      data: {
        customerId: customer1.id,
        status: 'CANCELLED',
        totalAmount: 6500,
        items: { create: [{ bakeryItemId: itemAId, quantity: 1, unitPriceAtOrder: 6500 }] },
      },
    });

    const cancelledPayRes = await request(app)
      .post(`/api/customer/orders/${cancelledOrder.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ simulateOutcome: 'SUCCESS' });
    expect(cancelledPayRes.status).toBe(409);
    expect(cancelledPayRes.body.error.code).toBe('CONFLICT');

    const dbCancelled = (await prisma.order.findUnique({ where: { id: cancelledOrder.id } })) as unknown as {
      paymentStatus?: string;
    } | null;
    expect(dbCancelled?.paymentStatus).toBe('UNPAID');
  });

  it('PAY-06: OPERATOR PATCH /api/operator/orders/:id/payment { paymentStatus: "PAID" } returns 200 on active order and 409 CONFLICT on CANCELLED order', async () => {
    const activeOrder = await createCustomerOrder(customer1Token);

    const activeRes = await request(app)
      .patch(`/api/operator/orders/${activeOrder.id}/payment`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ paymentStatus: 'PAID' });

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.order).toBeDefined();
    expect(activeRes.body.order.id).toBe(activeOrder.id);
    expect(activeRes.body.order.paymentStatus).toBe('PAID');

    const cancelledOrder = await prisma.order.create({
      data: {
        customerId: customer1.id,
        status: 'CANCELLED',
        totalAmount: 6500,
        items: { create: [{ bakeryItemId: itemAId, quantity: 1, unitPriceAtOrder: 6500 }] },
      },
    });

    const cancelledRes = await request(app)
      .patch(`/api/operator/orders/${cancelledOrder.id}/payment`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ paymentStatus: 'PAID' });

    expect(cancelledRes.status).toBe(409);
    expect(cancelledRes.body.error.code).toBe('CONFLICT');
  });

  it('PAY-07: CUSTOMER calling PATCH /api/operator/orders/:id/payment returns 403 FORBIDDEN; invalid paymentStatus returns 400 VALIDATION_ERROR', async () => {
    const order = await createCustomerOrder(customer1Token);

    const customerForbiddenRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/payment`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ paymentStatus: 'PAID' });

    expect(customerForbiddenRes.status).toBe(403);
    expect(customerForbiddenRes.body.error.code).toBe('FORBIDDEN');

    const invalidStatusRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/payment`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ paymentStatus: 'REFUNDED' });

    expect(invalidStatusRes.status).toBe(400);
    expect(invalidStatusRes.body.error.code).toBe('VALIDATION_ERROR');

    const missingStatusRes = await request(app)
      .patch(`/api/operator/orders/${order.id}/payment`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({});

    expect(missingStatusRes.status).toBe(400);
    expect(missingStatusRes.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid simulateOutcome on customer pay endpoint
    const invalidOutcomeRes = await request(app)
      .post(`/api/customer/orders/${order.id}/pay`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ simulateOutcome: 'INVALID_OUTCOME' });

    expect(invalidOutcomeRes.status).toBe(400);
    expect(invalidOutcomeRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});
