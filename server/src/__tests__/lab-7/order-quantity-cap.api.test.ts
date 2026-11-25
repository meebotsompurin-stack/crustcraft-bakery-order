import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
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

describe('Lab 7 CR-01 — Per-Item Max 5 Order Quantity Cap (CR01-01 to CR01-06)', () => {
  const testRunId = Date.now();

  let customerToken: string;
  let customer: { id: string; email: string };

  const itemHighStockA = `cr01-item-a-${testRunId}`;
  const itemHighStockB = `cr01-item-b-${testRunId}`;
  const itemLowStock = `cr01-item-low-${testRunId}`;

  const ownedItemIds = [itemHighStockA, itemHighStockB, itemLowStock];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env },
      stdio: 'pipe',
    });

    customer = await prisma.user.create({
      data: {
        name: 'CR01 Test Customer',
        email: `cr01.cust.${testRunId}@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    customerToken = signToken({ userId: customer.id, role: 'CUSTOMER' });

    await prisma.bakeryItem.createMany({
      data: [
        {
          id: itemHighStockA,
          name: `CR01 Croissant A ${testRunId}`,
          description: 'High stock test item A (stock: 20)',
          price: 8500,
          stockQuantity: 20,
          isAvailable: true,
          category: 'Pastry',
        },
        {
          id: itemHighStockB,
          name: `CR01 Brioche B ${testRunId}`,
          description: 'High stock test item B (stock: 20)',
          price: 6500,
          stockQuantity: 20,
          isAvailable: true,
          category: 'Sweet Bread',
        },
        {
          id: itemLowStock,
          name: `CR01 Sourdough Low ${testRunId}`,
          description: 'Low stock test item (stock: 3)',
          price: 22000,
          stockQuantity: 3,
          isAvailable: true,
          category: 'Bread',
        },
      ],
    });
  });

  beforeEach(async () => {
    // Reset test item stocks to exact contract preconditions before each case
    await prisma.bakeryItem.update({
      where: { id: itemHighStockA },
      data: { stockQuantity: 20, isAvailable: true },
    });
    await prisma.bakeryItem.update({
      where: { id: itemHighStockB },
      data: { stockQuantity: 20, isAvailable: true },
    });
    await prisma.bakeryItem.update({
      where: { id: itemLowStock },
      data: { stockQuantity: 3, isAvailable: true },
    });
  });

  afterAll(async () => {
    try {
      if (customer?.id) {
        await prisma.orderItem.deleteMany({
          where: { order: { customerId: customer.id } },
        });
        await prisma.order.deleteMany({
          where: { customerId: customer.id },
        });
      }
      await prisma.orderItem.deleteMany({
        where: { bakeryItemId: { in: ownedItemIds } },
      });
      await prisma.bakeryItem.deleteMany({
        where: { id: { in: ownedItemIds } },
      });
      if (customer?.id) {
        await prisma.user.deleteMany({ where: { id: customer.id } });
      }
    } catch {
      // Ignore teardown errors
    } finally {
      await prisma.$disconnect();
    }
  });

  it('CR01-01: allows upper boundary quantity === 5 (201 Created) and decrements stock 20 -> 15', async () => {
    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ bakeryItemId: itemHighStockA, quantity: 5 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.items[0].quantity).toBe(5);
    expect(res.body.order.totalAmount).toBe(8500 * 5);

    const updated = await prisma.bakeryItem.findUnique({ where: { id: itemHighStockA } });
    expect(updated?.stockQuantity).toBe(15);
  });

  it('CR01-02: rejects quantity === 6 with 400 VALIDATION_ERROR, exact details[0].field, zero stock deducted, and no order persisted', async () => {
    const ordersBefore = await prisma.order.count({ where: { customerId: customer.id } });

    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ bakeryItemId: itemHighStockA, quantity: 6 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Maximum order quantity is 5 units per item per order.');
    expect(res.body.error.details).toEqual([
      { field: 'items[0].quantity', issue: 'Quantity cannot exceed 5 per item per order' },
    ]);

    const itemAfter = await prisma.bakeryItem.findUnique({ where: { id: itemHighStockA } });
    expect(itemAfter?.stockQuantity).toBe(20);
    expect(await prisma.order.count({ where: { customerId: customer.id } })).toBe(ordersBefore);
  });

  it('CR01-03: rejects multi-item order when items[1].quantity === 6 with exact field items[1].quantity and zero stock deducted on both items', async () => {
    const ordersBefore = await prisma.order.count({ where: { customerId: customer.id } });

    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [
          { bakeryItemId: itemHighStockA, quantity: 2 },
          { bakeryItemId: itemHighStockB, quantity: 6 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Maximum order quantity is 5 units per item per order.');
    expect(res.body.error.details).toEqual([
      { field: 'items[1].quantity', issue: 'Quantity cannot exceed 5 per item per order' },
    ]);

    const itemAAfter = await prisma.bakeryItem.findUnique({ where: { id: itemHighStockA } });
    const itemBAfter = await prisma.bakeryItem.findUnique({ where: { id: itemHighStockB } });
    expect(itemAAfter?.stockQuantity).toBe(20);
    expect(itemBAfter?.stockQuantity).toBe(20);
    expect(await prisma.order.count({ where: { customerId: customer.id } })).toBe(ordersBefore);
  });

  it('CR01-04: preserves 409 CONFLICT insufficient stock check when quantity === 5 exceeds stockQuantity === 3', async () => {
    const ordersBefore = await prisma.order.count({ where: { customerId: customer.id } });

    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ bakeryItemId: itemLowStock, quantity: 5 }],
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('Insufficient stock');

    const itemAfter = await prisma.bakeryItem.findUnique({ where: { id: itemLowStock } });
    expect(itemAfter?.stockQuantity).toBe(3);
    expect(await prisma.order.count({ where: { customerId: customer.id } })).toBe(ordersBefore);
  });

  it('CR01-05 (TA Condition #1): rejects duplicate bakeryItemId entries (5 + 5) with 400 VALIDATION_ERROR and details[0].field items[1].bakeryItemId', async () => {
    const ordersBefore = await prisma.order.count({ where: { customerId: customer.id } });

    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [
          { bakeryItemId: itemHighStockA, quantity: 5 },
          { bakeryItemId: itemHighStockA, quantity: 5 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe(
      `Duplicate bakeryItemId '${itemHighStockA}' entries are not allowed in a single order.`
    );
    expect(res.body.error.details).toEqual([
      {
        field: 'items[1].bakeryItemId',
        issue: 'Duplicate bakeryItemId entries are not allowed in a single order',
      },
    ]);

    const itemAfter = await prisma.bakeryItem.findUnique({ where: { id: itemHighStockA } });
    expect(itemAfter?.stockQuantity).toBe(20);
    expect(await prisma.order.count({ where: { customerId: customer.id } })).toBe(ordersBefore);
  });

  it('CR01-06 (TA Condition #2): returns 400 VALIDATION_ERROR BEFORE 409 CONFLICT when quantity === 6 and stockQuantity === 3', async () => {
    const ordersBefore = await prisma.order.count({ where: { customerId: customer.id } });

    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ bakeryItemId: itemLowStock, quantity: 6 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Maximum order quantity is 5 units per item per order.');
    expect(res.body.error.details).toEqual([
      { field: 'items[0].quantity', issue: 'Quantity cannot exceed 5 per item per order' },
    ]);

    const itemAfter = await prisma.bakeryItem.findUnique({ where: { id: itemLowStock } });
    expect(itemAfter?.stockQuantity).toBe(3);
    expect(await prisma.order.count({ where: { customerId: customer.id } })).toBe(ordersBefore);
  });
});
