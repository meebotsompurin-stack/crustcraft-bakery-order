import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import path from 'path';

process.env.DATABASE_URL = 'file:./test.db';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'crustcraft-api-test-jwt-secret-2026';
}

import { app } from '../../app';
import { prisma } from '../../lib/db';
import { hashPassword, getJwtSecret } from '../../services/auth.service';

describe('F-04 Operator Order Queue & Acceptance API Tests (OPS-01 to OPS-08)', () => {
  const testRunId = Date.now();
  const operatorEmail = `operator.${testRunId}@test.com`;
  const customerEmail = `customer.${testRunId}@test.com`;

  let operatorId: string;
  let customerId: string;
  let operatorToken: string;
  let customerToken: string;

  let testBakeryItemId: string;
  let pendingOrderId: string;
  let acceptedOrderId: string;

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'pipe',
    });

    const pwdHash = await hashPassword('password123');

    // Create test operator
    const operatorUser = await prisma.user.create({
      data: {
        name: 'Queue Test Operator',
        email: operatorEmail,
        passwordHash: pwdHash,
        role: 'OPERATOR',
      },
    });
    operatorId = operatorUser.id;

    // Create test customer
    const customerUser = await prisma.user.create({
      data: {
        name: 'Queue Test Customer',
        email: customerEmail,
        passwordHash: pwdHash,
        role: 'CUSTOMER',
      },
    });
    customerId = customerUser.id;

    // Create a bakery item for test orders
    const bakeryItem = await prisma.bakeryItem.create({
      data: {
        name: `Test Item ${testRunId}`,
        description: 'Test Croissant for Queue Integration',
        price: 8500, // 85.00 THB in satang
        stockQuantity: 100,
        isAvailable: true,
        category: 'Pastry',
      },
    });
    testBakeryItemId = bakeryItem.id;

    // Create an ACCEPTED order (older timestamp)
    const acceptedOrder = await prisma.order.create({
      data: {
        customerId,
        status: 'ACCEPTED',
        totalAmount: 8500,
        pickupNote: 'Pre-accepted order',
        createdAt: new Date(Date.now() - 60000), // 1 min ago
        items: {
          create: [
            {
              bakeryItemId: testBakeryItemId,
              quantity: 1,
              unitPriceAtOrder: 8500,
            },
          ],
        },
      },
    });
    acceptedOrderId = acceptedOrder.id;

    // Create a PENDING order (newer timestamp)
    const pendingOrder = await prisma.order.create({
      data: {
        customerId,
        status: 'PENDING',
        totalAmount: 17000,
        pickupNote: 'Pack extra napkins please',
        createdAt: new Date(),
        items: {
          create: [
            {
              bakeryItemId: testBakeryItemId,
              quantity: 2,
              unitPriceAtOrder: 8500,
            },
          ],
        },
      },
    });
    pendingOrderId = pendingOrder.id;

    // Sign JWT tokens
    operatorToken = jwt.sign(
      { userId: operatorId, role: 'OPERATOR' },
      getJwtSecret(),
      { expiresIn: '24h' }
    );
    customerToken = jwt.sign(
      { userId: customerId, role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany({
      where: {
        orderId: { in: [pendingOrderId, acceptedOrderId] },
      },
    });
    await prisma.order.deleteMany({
      where: {
        id: { in: [pendingOrderId, acceptedOrderId] },
      },
    });
    if (testBakeryItemId) {
      await prisma.bakeryItem.deleteMany({
        where: { id: testBakeryItemId },
      });
    }
    await prisma.user.deleteMany({
      where: {
        email: { in: [operatorEmail, customerEmail] },
      },
    });
    await prisma.$disconnect();
  });

  // OPS-01
  it('OPS-01: GET /api/operator/orders by CUSTOMER returns 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/operator/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Unauthenticated check
  it('Unauthenticated GET /api/operator/orders returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/operator/orders');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // OPS-02
  it('OPS-02: GET /api/operator/orders by OPERATOR returns 200 + all orders sorted PENDING first, newest first (BR-06)', async () => {
    // Test both Bearer header and Cookie channel
    const res = await request(app)
      .get('/api/operator/orders')
      .set('Cookie', [`token=${operatorToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.orders).toBeDefined();
    expect(Array.isArray(res.body.orders)).toBe(true);

    const orders = res.body.orders;
    const testPending = orders.find((o: { id: string }) => o.id === pendingOrderId);
    const testAccepted = orders.find((o: { id: string }) => o.id === acceptedOrderId);

    expect(testPending).toBeDefined();
    expect(testAccepted).toBeDefined();

    // Verify ordering: PENDING must appear before ACCEPTED
    const pendingIndex = orders.findIndex((o: { id: string }) => o.id === pendingOrderId);
    const acceptedIndex = orders.findIndex((o: { id: string }) => o.id === acceptedOrderId);
    expect(pendingIndex).toBeLessThan(acceptedIndex);

    // Verify structure of order in queue
    expect(testPending.customer).toBeDefined();
    expect(testPending.customer.name).toBe('Queue Test Customer');
    expect(testPending.customer.email).toBe(customerEmail);
    expect(testPending.items).toBeDefined();
    expect(testPending.items.length).toBeGreaterThan(0);
    expect(testPending.totalAmount).toBe(17000);
    expect(testPending.status).toBe('PENDING');
  });

  // OPS-03
  it('OPS-03: GET /api/operator/orders/:id by OPERATOR returns 200 + full order detail', async () => {
    const res = await request(app)
      .get(`/api/operator/orders/${pendingOrderId}`)
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.id).toBe(pendingOrderId);
    expect(res.body.order.status).toBe('PENDING');
    expect(res.body.order.totalAmount).toBe(17000);
    expect(res.body.order.pickupNote).toBe('Pack extra napkins please');
    expect(res.body.order.customer).toBeDefined();
    expect(res.body.order.customer.name).toBe('Queue Test Customer');
    expect(res.body.order.customer.email).toBe(customerEmail);
    expect(res.body.order.items).toBeDefined();
    expect(res.body.order.items.length).toBe(1);
    expect(res.body.order.items[0].quantity).toBe(2);
    expect(res.body.order.items[0].unitPriceAtOrder).toBe(8500);
    expect(res.body.order.items[0].bakeryItem).toBeDefined();
    expect(res.body.order.items[0].bakeryItem.name).toBe(`Test Item ${testRunId}`);
  });

  // OPS-04
  it('OPS-04: GET /api/operator/orders/:id for non-existent order returns 404 NOT_FOUND', async () => {
    const res = await request(app)
      .get('/api/operator/orders/non-existent-order-id-99999')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // OPS-05
  it('OPS-05: PATCH /api/operator/orders/:id/status with { status: "ACCEPTED" } on PENDING order returns 200 + updated order', async () => {
    const res = await request(app)
      .patch(`/api/operator/orders/${pendingOrderId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.id).toBe(pendingOrderId);
    expect(res.body.order.status).toBe('ACCEPTED');

    // Confirm database record was actually updated
    const updatedInDb = await prisma.order.findUnique({
      where: { id: pendingOrderId },
    });
    expect(updatedInDb?.status).toBe('ACCEPTED');
  });

  // OPS-06
  it('OPS-06: PATCH /api/operator/orders/:id/status with { status: "ACCEPTED" } on non-PENDING order returns 409 CONFLICT', async () => {
    // pendingOrderId was transitioned to ACCEPTED in OPS-05; acceptedOrderId was created as ACCEPTED
    const res = await request(app)
      .patch(`/api/operator/orders/${acceptedOrderId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('CONFLICT');

    // Attempting backward transition to PENDING also returns 409 CONFLICT
    const backwardRes = await request(app)
      .patch(`/api/operator/orders/${acceptedOrderId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'PENDING' });

    expect(backwardRes.status).toBe(409);
    expect(backwardRes.body.error.code).toBe('CONFLICT');
  });

  // OPS-07
  it('OPS-07: PATCH /api/operator/orders/:id/status by CUSTOMER returns 403 FORBIDDEN', async () => {
    const res = await request(app)
      .patch(`/api/operator/orders/${pendingOrderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // OPS-08
  it('OPS-08: PATCH /api/operator/orders/:id/status with invalid status value returns 400 VALIDATION_ERROR', async () => {
    // Completely invalid status string
    const resInvalid = await request(app)
      .patch(`/api/operator/orders/${pendingOrderId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'INVALID_STATUS' });

    expect(resInvalid.status).toBe(400);
    expect(resInvalid.body.error).toBeDefined();
    expect(resInvalid.body.error.code).toBe('VALIDATION_ERROR');

    // Missing status property
    const resMissing = await request(app)
      .patch(`/api/operator/orders/${pendingOrderId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({});

    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe('VALIDATION_ERROR');

    // Non-string status property
    const resNonString = await request(app)
      .patch(`/api/operator/orders/${pendingOrderId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 123 });

    expect(resNonString.status).toBe(400);
    expect(resNonString.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Concurrent accepts of the same PENDING order: exactly one 200 and one 409 CONFLICT', async () => {
    const order = await prisma.order.create({
      data: {
        customerId,
        status: 'PENDING',
        totalAmount: 8500,
        items: {
          create: [
            { bakeryItemId: testBakeryItemId, quantity: 1, unitPriceAtOrder: 8500 },
          ],
        },
      },
    });

    try {
      const send = () =>
        request(app)
          .patch(`/api/operator/orders/${order.id}/status`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ status: 'ACCEPTED' });

      const results = await Promise.all([send(), send()]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([200, 409]);
    } finally {
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.deleteMany({ where: { id: order.id } });
    }
  });

  it('PATCH /api/operator/orders/:id/status for non-existent order returns 404 NOT_FOUND', async () => {
    const res = await request(app)
      .patch('/api/operator/orders/non-existent-order-id/status')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
