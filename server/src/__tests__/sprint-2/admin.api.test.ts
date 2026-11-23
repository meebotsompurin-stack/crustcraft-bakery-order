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

describe('F-05 Bakery Catalog Administration API Tests (ADM-01 to ADM-08)', () => {
  const testRunId = `adm-${Date.now()}`;

  let operatorToken: string;
  let customerToken: string;

  let operatorUser: { id: string; email: string };
  let customerUser: { id: string; email: string };

  const createdItemIds: string[] = [];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env },
      stdio: 'pipe',
    });

    operatorUser = await prisma.user.create({
      data: {
        name: 'Catalog Admin Operator',
        email: `${testRunId}.op@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'OPERATOR',
      },
    });

    customerUser = await prisma.user.create({
      data: {
        name: 'Catalog Admin Customer',
        email: `${testRunId}.cust@test.com`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
      },
    });

    operatorToken = signToken({ userId: operatorUser.id, role: 'OPERATOR' });
    customerToken = signToken({ userId: customerUser.id, role: 'CUSTOMER' });
  });

  afterAll(async () => {
    try {
      const userIds = [operatorUser?.id, customerUser?.id].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { order: { customerId: { in: userIds } } },
        });
        await prisma.order.deleteMany({
          where: { customerId: { in: userIds } },
        });
      }
      if (createdItemIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { bakeryItemId: { in: createdItemIds } },
        });
        await prisma.bakeryItem.deleteMany({
          where: { id: { in: createdItemIds } },
        });
      }
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

  it('ADM-01: POST /api/operator/catalog creates a new BakeryItem with integer satang price and persists in PostgreSQL', async () => {
    const payload = {
      name: `Cardamom Morning Bun ${testRunId}`,
      description: 'Swirled brioche dough with freshly ground green cardamom',
      price: 9500,
      stockQuantity: 25,
      category: 'Sweet Bread',
    };

    const res = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.item).toBeDefined();
    expect(res.body.item.id).toBeTruthy();
    expect(res.body.item.name).toBe(payload.name);
    expect(res.body.item.description).toBe(payload.description);
    expect(res.body.item.price).toBe(9500);
    expect(res.body.item.stockQuantity).toBe(25);
    expect(res.body.item.category).toBe('Sweet Bread');
    expect(res.body.item.isAvailable).toBe(true);

    createdItemIds.push(res.body.item.id);

    const persisted = await prisma.bakeryItem.findUnique({
      where: { id: res.body.item.id },
    });
    expect(persisted).not.toBeNull();
    expect(persisted?.price).toBe(9500);
    expect(persisted?.stockQuantity).toBe(25);
    expect(persisted?.isAvailable).toBe(true);
  });

  it('ADM-02: PATCH /api/operator/catalog/:id updates price, description, and category', async () => {
    const created = await prisma.bakeryItem.create({
      data: {
        name: `Olive Rosemary Focaccia ${testRunId}`,
        description: 'Original description',
        price: 11000,
        stockQuantity: 15,
        isAvailable: true,
        category: 'Bread',
      },
    });
    createdItemIds.push(created.id);

    const res = await request(app)
      .patch(`/api/operator/catalog/${created.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        price: 12500,
        description: 'Updated hearth-baked olive & rosemary focaccia',
        category: 'Pastry',
      });

    expect(res.status).toBe(200);
    expect(res.body.item.id).toBe(created.id);
    expect(res.body.item.price).toBe(12500);
    expect(res.body.item.description).toBe(
      'Updated hearth-baked olive & rosemary focaccia'
    );
    expect(res.body.item.category).toBe('Pastry');
    expect(res.body.item.stockQuantity).toBe(15);
    expect(res.body.item.isAvailable).toBe(true);

    const persisted = await prisma.bakeryItem.findUnique({
      where: { id: created.id },
    });
    expect(persisted?.price).toBe(12500);
    expect(persisted?.description).toBe(
      'Updated hearth-baked olive & rosemary focaccia'
    );
    expect(persisted?.category).toBe('Pastry');
  });

  it('ADM-03: PATCH /api/operator/catalog/:id replenishes stockQuantity and toggles isAvailable', async () => {
    const created = await prisma.bakeryItem.create({
      data: {
        name: `Lemon Meringue Tart ${testRunId}`,
        description: 'Tangy lemon curd tart with torched meringue',
        price: 10500,
        stockQuantity: 5,
        isAvailable: true,
        category: 'Tart',
      },
    });
    createdItemIds.push(created.id);

    const res = await request(app)
      .patch(`/api/operator/catalog/${created.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        stockQuantity: 40,
        isAvailable: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.item.stockQuantity).toBe(40);
    expect(res.body.item.isAvailable).toBe(false);

    const persisted = await prisma.bakeryItem.findUnique({
      where: { id: created.id },
    });
    expect(persisted?.stockQuantity).toBe(40);
    expect(persisted?.isAvailable).toBe(false);

    const restoreRes = await request(app)
      .patch(`/api/operator/catalog/${created.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ isAvailable: true });

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.item.isAvailable).toBe(true);
  });

  it('ADM-04: GET /api/operator/catalog returns ALL items (active & archived) while GET /api/catalog excludes isAvailable: false (BR-05)', async () => {
    const activeItem = await prisma.bakeryItem.create({
      data: {
        name: `Active Kouign Amann ${testRunId}`,
        description: 'Caramelized Breton laminated pastry',
        price: 9000,
        stockQuantity: 12,
        isAvailable: true,
        category: 'Pastry',
      },
    });
    const archivedItem = await prisma.bakeryItem.create({
      data: {
        name: `Archived Matcha Tart ${testRunId}`,
        description: 'Seasonal Uji matcha custard tart',
        price: 13000,
        stockQuantity: 8,
        isAvailable: false,
        category: 'Tart',
      },
    });
    createdItemIds.push(activeItem.id, archivedItem.id);

    const opRes = await request(app)
      .get('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(opRes.status).toBe(200);
    expect(Array.isArray(opRes.body.items)).toBe(true);
    const opIds = opRes.body.items.map((i: { id: string }) => i.id);
    expect(opIds).toContain(activeItem.id);
    expect(opIds).toContain(archivedItem.id);

    // Verify ordering: category ASC ('Pastry' before 'Tart')
    expect(opIds.indexOf(activeItem.id)).toBeLessThan(
      opIds.indexOf(archivedItem.id)
    );

    // Public catalog endpoint must exclude isAvailable: false (BR-05)
    const pubRes = await request(app)
      .get('/api/catalog')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(pubRes.status).toBe(200);
    const pubIds = pubRes.body.items.map((i: { id: string }) => i.id);
    expect(pubIds).toContain(activeItem.id);
    expect(pubIds).not.toContain(archivedItem.id);
  });

  it('ADM-05: rejects invalid payloads with 400 VALIDATION_ERROR, duplicate name with 409 CONFLICT, and unknown ID with 404 NOT_FOUND', async () => {
    // 1. price <= 0
    const zeroPriceRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: `Zero Price Item ${testRunId}`,
        description: 'Invalid price',
        price: 0,
        stockQuantity: 10,
        category: 'Bread',
      });
    expect(zeroPriceRes.status).toBe(400);
    expect(zeroPriceRes.body.error.code).toBe('VALIDATION_ERROR');

    // 2. non-integer price (float)
    const floatPriceRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: `Float Price Item ${testRunId}`,
        description: 'Invalid decimal price',
        price: 85.5,
        stockQuantity: 10,
        category: 'Bread',
      });
    expect(floatPriceRes.status).toBe(400);
    expect(floatPriceRes.body.error.code).toBe('VALIDATION_ERROR');

    // 3. negative stockQuantity
    const negStockRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: `Negative Stock Item ${testRunId}`,
        description: 'Invalid negative stock',
        price: 7500,
        stockQuantity: -1,
        category: 'Bread',
      });
    expect(negStockRes.status).toBe(400);
    expect(negStockRes.body.error.code).toBe('VALIDATION_ERROR');

    // 4. blank name
    const blankNameRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: '   ',
        description: 'Blank name test',
        price: 7500,
        stockQuantity: 5,
        category: 'Bread',
      });
    expect(blankNameRes.status).toBe(400);
    expect(blankNameRes.body.error.code).toBe('VALIDATION_ERROR');

    // 5. duplicate name -> 409 CONFLICT
    const uniqueName = `Unique Croissant ${testRunId}`;
    const firstRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: uniqueName,
        description: 'First instance',
        price: 8500,
        stockQuantity: 10,
        category: 'Pastry',
      });
    expect(firstRes.status).toBe(201);
    createdItemIds.push(firstRes.body.item.id);

    const dupRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: uniqueName,
        description: 'Duplicate name instance',
        price: 9000,
        stockQuantity: 5,
        category: 'Pastry',
      });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('CONFLICT');

    // 6. duplicate name on PATCH -> 409 CONFLICT
    const secondRes = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: `Second Unique Croissant ${testRunId}`,
        description: 'Second instance',
        price: 8800,
        stockQuantity: 10,
        category: 'Pastry',
      });
    expect(secondRes.status).toBe(201);
    createdItemIds.push(secondRes.body.item.id);

    const dupPatchRes = await request(app)
      .patch(`/api/operator/catalog/${secondRes.body.item.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ name: uniqueName });
    expect(dupPatchRes.status).toBe(409);
    expect(dupPatchRes.body.error.code).toBe('CONFLICT');

    // 7. empty PATCH body -> 400 VALIDATION_ERROR
    const emptyPatchRes = await request(app)
      .patch(`/api/operator/catalog/${firstRes.body.item.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({});
    expect(emptyPatchRes.status).toBe(400);
    expect(emptyPatchRes.body.error.code).toBe('VALIDATION_ERROR');

    // 8. unknown ID -> 404 NOT_FOUND
    const notFoundRes = await request(app)
      .patch('/api/operator/catalog/non-existent-item-id-999')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ price: 9900 });
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.error.code).toBe('NOT_FOUND');
  });

  it('ADM-06: rejects unauthenticated requests with 401 and CUSTOMER requests with 403 on all /api/operator/catalog* routes', async () => {
    const unauthGet = await request(app).get('/api/operator/catalog');
    expect(unauthGet.status).toBe(401);
    expect(unauthGet.body.error.code).toBe('UNAUTHORIZED');

    const unauthPost = await request(app)
      .post('/api/operator/catalog')
      .send({
        name: `Unauth Item ${testRunId}`,
        description: 'Should fail',
        price: 5000,
        stockQuantity: 1,
        category: 'Bread',
      });
    expect(unauthPost.status).toBe(401);

    const unauthPatch = await request(app)
      .patch('/api/operator/catalog/any-id')
      .send({ price: 6000 });
    expect(unauthPatch.status).toBe(401);

    const custGet = await request(app)
      .get('/api/operator/catalog')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(custGet.status).toBe(403);
    expect(custGet.body.error.code).toBe('FORBIDDEN');

    const custPost = await request(app)
      .post('/api/operator/catalog')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: `Cust Item ${testRunId}`,
        description: 'Should fail',
        price: 5000,
        stockQuantity: 1,
        category: 'Bread',
      });
    expect(custPost.status).toBe(403);
    expect(custPost.body.error.code).toBe('FORBIDDEN');

    const custPatch = await request(app)
      .patch('/api/operator/catalog/any-id')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ price: 6000 });
    expect(custPatch.status).toBe(403);
    expect(custPatch.body.error.code).toBe('FORBIDDEN');
  });

  it('ADM-07: updating BakeryItem.price does NOT alter OrderItem.unitPriceAtOrder or Order.totalAmount on historical orders (BR-02)', async () => {
    const item = await prisma.bakeryItem.create({
      data: {
        name: `Snapshot Sourdough ${testRunId}`,
        description: 'Historical price snapshot test item',
        price: 8500,
        stockQuantity: 20,
        isAvailable: true,
        category: 'Bread',
      },
    });
    createdItemIds.push(item.id);

    // Customer places order at 8500 satang x 2 = 17000 satang
    const orderRes = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ bakeryItemId: item.id, quantity: 2 }],
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.order.id as string;
    expect(orderRes.body.order.totalAmount).toBe(17000);
    expect(orderRes.body.order.items[0].unitPriceAtOrder).toBe(8500);

    // Operator raises item price to 12000 satang
    const patchRes = await request(app)
      .patch(`/api/operator/catalog/${item.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ price: 12000 });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.item.price).toBe(12000);

    // Re-fetch historical order -> snapshot must remain untouched (BR-02)
    const fetchedOrderRes = await request(app)
      .get(`/api/customer/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(fetchedOrderRes.status).toBe(200);
    expect(fetchedOrderRes.body.order.totalAmount).toBe(17000);
    expect(fetchedOrderRes.body.order.items[0].unitPriceAtOrder).toBe(8500);
  });

  it('ADM-08: setting isAvailable: false hides item and blocks orders (409); restocking from 0 to > 0 re-enables ordering', async () => {
    const item = await prisma.bakeryItem.create({
      data: {
        name: `Restock Canelé ${testRunId}`,
        description: 'Bordeaux rum & vanilla canelé',
        price: 7000,
        stockQuantity: 5,
        isAvailable: true,
        category: 'Pastry',
      },
    });
    createdItemIds.push(item.id);

    // 1. Archive item (isAvailable: false)
    const archiveRes = await request(app)
      .patch(`/api/operator/catalog/${item.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ isAvailable: false });
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.item.isAvailable).toBe(false);

    // Public catalog hides it
    const pubCatalogRes = await request(app)
      .get('/api/catalog')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(pubCatalogRes.status).toBe(200);
    expect(
      pubCatalogRes.body.items.some((i: { id: string }) => i.id === item.id)
    ).toBe(false);

    // Ordering archived item returns 409 CONFLICT
    const orderArchivedRes = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ bakeryItemId: item.id, quantity: 1 }] });
    expect(orderArchivedRes.status).toBe(409);
    expect(orderArchivedRes.body.error.code).toBe('CONFLICT');

    // 2. Re-enable item with 0 stock -> ordering fails with 409 CONFLICT
    const zeroStockRes = await request(app)
      .patch(`/api/operator/catalog/${item.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ isAvailable: true, stockQuantity: 0 });
    expect(zeroStockRes.status).toBe(200);

    const orderZeroRes = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ bakeryItemId: item.id, quantity: 1 }] });
    expect(orderZeroRes.status).toBe(409);
    expect(orderZeroRes.body.error.code).toBe('CONFLICT');

    // 3. Restock from 0 to 10 -> customer can now order cleanly (201)
    const restockRes = await request(app)
      .patch(`/api/operator/catalog/${item.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ stockQuantity: 10 });
    expect(restockRes.status).toBe(200);
    expect(restockRes.body.item.stockQuantity).toBe(10);

    const orderRestockedRes = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ bakeryItemId: item.id, quantity: 3 }] });
    expect(orderRestockedRes.status).toBe(201);
    expect(orderRestockedRes.body.order.totalAmount).toBe(21000);

    const afterOrder = await prisma.bakeryItem.findUnique({
      where: { id: item.id },
    });
    expect(afterOrder?.stockQuantity).toBe(7);
  });
});
