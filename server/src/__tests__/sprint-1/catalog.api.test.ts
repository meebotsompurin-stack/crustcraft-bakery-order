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

describe('F-02 Bakery Catalog API Integration Tests (CAT-01 to CAT-05)', () => {
  const testRunId = Date.now();
  let customerToken: string;
  let testCustomer: { id: string; email: string };

  const testActiveItemId = `cat-active-${testRunId}`;
  const testZeroStockItemId = `cat-zerostock-${testRunId}`;
  const testUnavailableItemId = `cat-unavail-${testRunId}`;

  const ownedItemIds = [
    testActiveItemId,
    testZeroStockItemId,
    testUnavailableItemId,
  ];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    try {
      execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
        env: { ...process.env },
        stdio: 'pipe',
      });
    } catch (error) {
      console.warn('Prisma migrate deploy note in catalog test:', error instanceof Error ? error.message : error);
    }

    // Create authenticated test customer
    const customerEmail = `cat.customer.${testRunId}@test.com`;
    testCustomer = await prisma.user.create({
      data: {
        name: 'Catalog Test Customer',
        email: customerEmail,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    customerToken = signToken({
      userId: testCustomer.id,
      role: 'CUSTOMER',
    });

    // Clean up any stale test items
    try {
      await prisma.orderItem.deleteMany({
        where: { bakeryItemId: { in: ownedItemIds } },
      });
      await prisma.bakeryItem.deleteMany({
        where: { id: { in: ownedItemIds } },
      });
    } catch {
      // Ignore if items do not exist
    }

    // 1. Active item with positive stock
    await prisma.bakeryItem.create({
      data: {
        id: testActiveItemId,
        name: `Croissant Test ${testRunId}`,
        description: 'Buttery flaky test croissant',
        price: 8500, // 85.00 THB in satang
        stockQuantity: 40,
        isAvailable: true,
        category: 'Pastry',
      },
    });

    // 2. Active item with zero stock (BR-05: Out of stock, but isAvailable remains true)
    await prisma.bakeryItem.create({
      data: {
        id: testZeroStockItemId,
        name: `Sourdough Sold Out ${testRunId}`,
        description: 'Naturally leavened loaf currently out of stock',
        price: 22000, // 220.00 THB in satang
        stockQuantity: 0,
        isAvailable: true,
        category: 'Bread',
      },
    });

    // 3. Inactive / unlisted item (isAvailable: false — archived or seasonal retired)
    await prisma.bakeryItem.create({
      data: {
        id: testUnavailableItemId,
        name: `Archived Tart ${testRunId}`,
        description: 'Seasonally retired tart not visible on public menu',
        price: 14500, // 145.00 THB in satang
        stockQuantity: 15,
        isAvailable: false,
        category: 'Tart',
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.orderItem.deleteMany({
        where: { bakeryItemId: { in: ownedItemIds } },
      });
      await prisma.bakeryItem.deleteMany({
        where: { id: { in: ownedItemIds } },
      });

      if (testCustomer?.id) {
        await prisma.orderItem.deleteMany({
          where: { order: { customerId: testCustomer.id } },
        });
        await prisma.order.deleteMany({
          where: { customerId: testCustomer.id },
        });
        await prisma.user.deleteMany({
          where: { id: testCustomer.id },
        });
      }
    } catch (e) {
      // Ignore teardown errors
    } finally {
      await prisma.$disconnect();
    }
  });

  describe('CAT-01, CAT-02, CAT-03: GET /api/catalog listing and availability semantics (AC-04-01, AC-04-02, AC-04-03, BR-05)', () => {
    it('CAT-01 & CAT-03: returns only items with isAvailable == true, excluding isAvailable == false items', async () => {
      const res = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);

      const returnedIds = res.body.items.map((i: { id: string }) => i.id);

      // Active item MUST be included
      expect(returnedIds).toContain(testActiveItemId);

      // Zero stock item MUST ALSO be included because isAvailable == true (BR-05)
      expect(returnedIds).toContain(testZeroStockItemId);

      // Inactive item with isAvailable == false MUST NOT be included (CAT-03)
      expect(returnedIds).not.toContain(testUnavailableItemId);

      // Verify every returned item strictly satisfies isAvailable === true
      res.body.items.forEach((item: { isAvailable: boolean }) => {
        expect(item.isAvailable).toBe(true);
      });
    });

    it('CAT-02: returns full schema with id, name, description, price (satang Int), stockQuantity, isAvailable, category', async () => {
      const res = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);

      const activeItem = res.body.items.find((i: { id: string }) => i.id === testActiveItemId);
      expect(activeItem).toBeDefined();
      expect(activeItem.id).toBe(testActiveItemId);
      expect(activeItem.name).toBe(`Croissant Test ${testRunId}`);
      expect(activeItem.description).toBe('Buttery flaky test croissant');
      expect(activeItem.price).toBe(8500);
      expect(Number.isInteger(activeItem.price)).toBe(true);
      expect(activeItem.stockQuantity).toBe(40);
      expect(Number.isInteger(activeItem.stockQuantity)).toBe(true);
      expect(activeItem.isAvailable).toBe(true);
      expect(activeItem.category).toBe('Pastry');
      expect(activeItem).toHaveProperty('createdAt');
      expect(activeItem).toHaveProperty('updatedAt');

      // Verify zero-stock item reflects stockQuantity: 0 while isAvailable: true
      const zeroStockItem = res.body.items.find((i: { id: string }) => i.id === testZeroStockItemId);
      expect(zeroStockItem).toBeDefined();
      expect(zeroStockItem.stockQuantity).toBe(0);
      expect(zeroStockItem.isAvailable).toBe(true);
    });

    it('requires authentication and returns 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/catalog');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('CAT-04, CAT-05: GET /api/catalog/:id single item detail query (AC-04-04, AC-04-05)', () => {
    it('CAT-04: returns single item detail with 200 OK for an existing bakery item ID', async () => {
      const res = await request(app)
        .get(`/api/catalog/${testActiveItemId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('item');
      expect(res.body.item.id).toBe(testActiveItemId);
      expect(res.body.item.name).toBe(`Croissant Test ${testRunId}`);
      expect(res.body.item.price).toBe(8500);
      expect(res.body.item.stockQuantity).toBe(40);
      expect(res.body.item.isAvailable).toBe(true);
      expect(res.body.item.category).toBe('Pastry');
    });

    it('CAT-05: returns 404 NOT_FOUND when querying a non-existent bakery item ID', async () => {
      const nonExistentId = `non-existent-item-${testRunId}`;
      const res = await request(app)
        .get(`/api/catalog/${nonExistentId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('Bakery item not found');
    });

    it('returns 401 UNAUTHORIZED for GET /api/catalog/:id when unauthenticated', async () => {
      const res = await request(app).get(`/api/catalog/${testActiveItemId}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
