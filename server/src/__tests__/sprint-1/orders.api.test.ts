import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'child_process';
import path from 'path';

process.env.DATABASE_URL = 'file:./test.db';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'crustcraft-api-test-jwt-secret-2026';
}

import { app } from '../../app';
import { prisma } from '../../lib/db';
import { signToken } from '../../services/auth.service';

describe('F-03 Customer Pre-Order API Integration Tests (ORD-01, ORD-04 to ORD-12)', () => {
  const testRunId = Date.now();

  let customer1Token: string;
  let customer2Token: string;
  let operatorToken: string;

  let customer1: { id: string; email: string };
  let customer2: { id: string; email: string };
  let operatorUser: { id: string; email: string };

  const itemInStockA = `ord-item-a-${testRunId}`;
  const itemInStockB = `ord-item-b-${testRunId}`;
  const itemZeroStock = `ord-item-zero-${testRunId}`;
  const itemUnavailable = `ord-item-unavail-${testRunId}`;

  const ownedItemIds = [
    itemInStockA,
    itemInStockB,
    itemZeroStock,
    itemUnavailable,
  ];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'pipe',
    });

    // Create 2 test customers for ownership isolation verification (BR-04)
    customer1 = await prisma.user.create({
      data: {
        name: 'Order Customer One',
        email: `ord.cust1.${testRunId}@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    customer2 = await prisma.user.create({
      data: {
        name: 'Order Customer Two',
        email: `ord.cust2.${testRunId}@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    operatorUser = await prisma.user.create({
      data: {
        name: 'Order Test Operator',
        email: `ord.op.${testRunId}@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'OPERATOR',
      },
    });

    customer1Token = signToken({ userId: customer1.id, role: 'CUSTOMER' });
    customer2Token = signToken({ userId: customer2.id, role: 'CUSTOMER' });
    operatorToken = signToken({ userId: operatorUser.id, role: 'OPERATOR' });

    // Clean up any conflicting test bakery items
    await prisma.bakeryItem.deleteMany({
      where: { id: { in: ownedItemIds } },
    });

    // 1. In-stock item A: Butter Croissant (price: 8500 satang, stock: 10)
    await prisma.bakeryItem.create({
      data: {
        id: itemInStockA,
        name: `Croissant Order Test ${testRunId}`,
        description: 'Pastry item with 10 stock units',
        price: 8500,
        stockQuantity: 10,
        isAvailable: true,
        category: 'Pastry',
      },
    });

    // 2. In-stock item B: Pain au Chocolat (price: 9000 satang, stock: 5)
    await prisma.bakeryItem.create({
      data: {
        id: itemInStockB,
        name: `Chocolat Order Test ${testRunId}`,
        description: 'Pastry item with 5 stock units',
        price: 9000,
        stockQuantity: 5,
        isAvailable: true,
        category: 'Pastry',
      },
    });

    // 3. Zero-stock item: Sourdough (price: 22000 satang, stock: 0, isAvailable: true per BR-05)
    await prisma.bakeryItem.create({
      data: {
        id: itemZeroStock,
        name: `Sourdough Order Test ${testRunId}`,
        description: 'Bread with 0 stock',
        price: 22000,
        stockQuantity: 0,
        isAvailable: true,
        category: 'Bread',
      },
    });

    // 4. Inactive item: Tart (price: 14500 satang, stock: 20, isAvailable: false)
    await prisma.bakeryItem.create({
      data: {
        id: itemUnavailable,
        name: `Tart Order Test ${testRunId}`,
        description: 'Tart currently closed for order',
        price: 14500,
        stockQuantity: 20,
        isAvailable: false,
        category: 'Tart',
      },
    });
  });

  afterAll(async () => {
    // Delete order items and orders created for this test run
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          customerId: { in: [customer1?.id, customer2?.id].filter(Boolean) },
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        customerId: { in: [customer1?.id, customer2?.id].filter(Boolean) },
      },
    });

    // Clean up test bakery items
    await prisma.bakeryItem.deleteMany({
      where: { id: { in: ownedItemIds } },
    });

    // Clean up test users
    const userIds = [customer1?.id, customer2?.id, operatorUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  });

  describe('ORD-01, ORD-04, ORD-12: POST /api/customer/orders pre-order creation & stock deduction (AC-04-07, AC-04-10, AC-04-18, BR-01, BR-02)', () => {
    it('creates pre-order, returns 201, initializes status as PENDING, calculates total, and decrements stock', async () => {
      const orderPayload = {
        items: [
          { bakeryItemId: itemInStockA, quantity: 2 }, // 8500 * 2 = 17000
          { bakeryItemId: itemInStockB, quantity: 1 }, // 9000 * 1 = 9000
        ],
        pickupNote: 'Morning batch pickup at 09:30 please',
      };

      const res = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send(orderPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('order');

      const order = res.body.order;
      expect(order.id).toBeDefined();
      expect(order.customerId).toBe(customer1.id);
      expect(order.status).toBe('PENDING'); // ORD-12, AC-04-18
      expect(order.totalAmount).toBe(26000); // ORD-01, AC-04-07 (17000 + 9000)
      expect(order.pickupNote).toBe('Morning batch pickup at 09:30 please');
      expect(order.items).toHaveLength(2);

      // Verify line items and unit price snapshots
      const lineItemA = order.items.find((i: { bakeryItemId: string }) => i.bakeryItemId === itemInStockA);
      expect(lineItemA).toBeDefined();
      expect(lineItemA.quantity).toBe(2);
      expect(lineItemA.unitPriceAtOrder).toBe(8500);

      const lineItemB = order.items.find((i: { bakeryItemId: string }) => i.bakeryItemId === itemInStockB);
      expect(lineItemB).toBeDefined();
      expect(lineItemB.quantity).toBe(1);
      expect(lineItemB.unitPriceAtOrder).toBe(9000);

      // Verify DB stock decrements (ORD-04, AC-04-10)
      const updatedItemA = await prisma.bakeryItem.findUnique({ where: { id: itemInStockA } });
      const updatedItemB = await prisma.bakeryItem.findUnique({ where: { id: itemInStockB } });

      expect(updatedItemA?.stockQuantity).toBe(8); // 10 - 2
      expect(updatedItemB?.stockQuantity).toBe(4); // 5 - 1
    });

    it('ORD-04 & BR-05: when stockQuantity drops to 0, isAvailable remains true', async () => {
      // itemInStockB currently has 4 units left. Ordering all 4 must set stock to 0 while keeping isAvailable: true
      const orderPayload = {
        items: [{ bakeryItemId: itemInStockB, quantity: 4 }],
      };

      const res = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send(orderPayload);

      expect(res.status).toBe(201);

      const depletedItem = await prisma.bakeryItem.findUnique({ where: { id: itemInStockB } });
      expect(depletedItem?.stockQuantity).toBe(0);
      expect(depletedItem?.isAvailable).toBe(true); // BR-05: Does NOT flip to false automatically
    });
  });

  describe('ORD-05, ORD-06, ORD-07, ORD-08: Validation and transactional rollback guards (AC-04-11 to AC-04-14, BR-03)', () => {
    it('ORD-06: returns 400 VALIDATION_ERROR when quantity is <= 0 or items array is empty', async () => {
      // Empty items array
      const emptyRes = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ items: [] });

      expect(emptyRes.status).toBe(400);
      expect(emptyRes.body.error.code).toBe('VALIDATION_ERROR');

      // Negative or zero quantity
      const zeroQtyRes = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          items: [{ bakeryItemId: itemInStockA, quantity: 0 }],
        });

      expect(zeroQtyRes.status).toBe(400);
      expect(zeroQtyRes.body.error.code).toBe('VALIDATION_ERROR');

      const negativeQtyRes = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          items: [{ bakeryItemId: itemInStockA, quantity: -3 }],
        });

      expect(negativeQtyRes.status).toBe(400);
      expect(negativeQtyRes.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('ORD-07: returns 409 CONFLICT when attempting to order an item with isAvailable == false', async () => {
      const res = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          items: [{ bakeryItemId: itemUnavailable, quantity: 1 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('not available');
    });

    it('ORD-08: returns 409 CONFLICT when attempting to order an item with stockQuantity == 0 or exceeding stock', async () => {
      // 1. Item with stockQuantity == 0
      const zeroStockRes = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          items: [{ bakeryItemId: itemZeroStock, quantity: 1 }],
        });

      expect(zeroStockRes.status).toBe(409);
      expect(zeroStockRes.body.error.code).toBe('CONFLICT');
      expect(zeroStockRes.body.error.message).toContain('Insufficient stock');

      // 2. Quantity exceeds stock (itemInStockA has 8 units left, requesting 20)
      const exceedStockRes = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          items: [{ bakeryItemId: itemInStockA, quantity: 20 }],
        });

      expect(exceedStockRes.status).toBe(409);
      expect(exceedStockRes.body.error.code).toBe('CONFLICT');
      expect(exceedStockRes.body.error.message).toContain('Insufficient stock');
    });

    it('ORD-05: atomic rollback — if any item fails stock validation, no items have stock deducted and no order is created', async () => {
      const stockABefore = (await prisma.bakeryItem.findUnique({ where: { id: itemInStockA } }))?.stockQuantity ?? 0;
      const stockZeroBefore = (await prisma.bakeryItem.findUnique({ where: { id: itemZeroStock } }))?.stockQuantity ?? 0;

      // Item A is valid (qty 2 <= 8), but Item Zero has 0 stock -> entire order must roll back!
      const multiItemConflictPayload = {
        items: [
          { bakeryItemId: itemInStockA, quantity: 2 },
          { bakeryItemId: itemZeroStock, quantity: 1 },
        ],
      };

      const res = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send(multiItemConflictPayload);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');

      // Verify atomic rollback in DB: Item A stock MUST NOT be decremented!
      const stockAAfter = (await prisma.bakeryItem.findUnique({ where: { id: itemInStockA } }))?.stockQuantity;
      const stockZeroAfter = (await prisma.bakeryItem.findUnique({ where: { id: itemZeroStock } }))?.stockQuantity;

      expect(stockAAfter).toBe(stockABefore);
      expect(stockZeroAfter).toBe(stockZeroBefore);
    });

    it('returns 403 FORBIDDEN when an OPERATOR attempts to place a customer pre-order', async () => {
      const res = await request(app)
        .post('/api/customer/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          items: [{ bakeryItemId: itemInStockA, quantity: 1 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('ORD-09, ORD-10, ORD-11: Customer order retrieval & ownership isolation (AC-04-15, AC-04-16, AC-04-17, BR-04)', () => {
    let customer1OrderId: string;
    let customer2OrderId: string;

    beforeAll(async () => {
      // Create one order for Customer 1
      const order1 = await prisma.order.create({
        data: {
          customerId: customer1.id,
          status: 'PENDING',
          totalAmount: 8500,
          pickupNote: 'Cust 1 note',
          items: {
            create: [
              {
                bakeryItemId: itemInStockA,
                quantity: 1,
                unitPriceAtOrder: 8500,
              },
            ],
          },
        },
      });
      customer1OrderId = order1.id;

      // Create one order for Customer 2
      const order2 = await prisma.order.create({
        data: {
          customerId: customer2.id,
          status: 'PENDING',
          totalAmount: 17000,
          pickupNote: 'Cust 2 note',
          items: {
            create: [
              {
                bakeryItemId: itemInStockA,
                quantity: 2,
                unitPriceAtOrder: 8500,
              },
            ],
          },
        },
      });
      customer2OrderId = order2.id;
    });

    it('ORD-09: GET /api/customer/orders returns only orders belonging to the authenticated customer', async () => {
      const res = await request(app)
        .get('/api/customer/orders')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
      expect(Array.isArray(res.body.orders)).toBe(true);

      const returnedOrderIds = res.body.orders.map((o: { id: string }) => o.id);
      expect(returnedOrderIds).toContain(customer1OrderId);
      expect(returnedOrderIds).not.toContain(customer2OrderId);

      res.body.orders.forEach((o: { customerId: string }) => {
        expect(o.customerId).toBe(customer1.id);
      });
    });

    it('ORD-10: GET /api/customer/orders/:id returns full order detail for own order with 200 OK', async () => {
      const res = await request(app)
        .get(`/api/customer/orders/${customer1OrderId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('order');
      expect(res.body.order.id).toBe(customer1OrderId);
      expect(res.body.order.customerId).toBe(customer1.id);
      expect(res.body.order.status).toBe('PENDING');
      expect(res.body.order.totalAmount).toBe(8500);
      expect(res.body.order.pickupNote).toBe('Cust 1 note');
      expect(res.body.order.items).toHaveLength(1);
      expect(res.body.order.items[0].bakeryItemId).toBe(itemInStockA);
      expect(res.body.order.items[0].quantity).toBe(1);
      expect(res.body.order.items[0].unitPriceAtOrder).toBe(8500);
    });

    it('ORD-11: GET /api/customer/orders/:id returns 403 FORBIDDEN when accessing another customer order (BR-04)', async () => {
      // Customer 1 tries to access Customer 2's order
      const res = await request(app)
        .get(`/api/customer/orders/${customer2OrderId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('You do not have permission to access this order');
    });

    it('returns 404 NOT_FOUND for GET /api/customer/orders/:id when order does not exist', async () => {
      const nonExistentOrderId = `non-existent-order-${testRunId}`;
      const res = await request(app)
        .get(`/api/customer/orders/${nonExistentOrderId}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 401 UNAUTHORIZED when order endpoints are queried without credentials', async () => {
      const listRes = await request(app).get('/api/customer/orders');
      expect(listRes.status).toBe(401);

      const detailRes = await request(app).get(`/api/customer/orders/${customer1OrderId}`);
      expect(detailRes.status).toBe(401);
    });
  });
});
