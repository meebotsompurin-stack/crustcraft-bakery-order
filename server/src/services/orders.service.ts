import { prisma } from '../lib/db';
import { AppError } from './auth.service';

export interface CalculationItemInput {
  bakeryItemId: string;
  quantity: number;
  authoritativePrice: number; // integer satang from DB
}

export interface CalculationResult {
  totalAmount: number; // integer satang
}

export interface ItemSnapshotResult {
  bakeryItemId: string;
  quantity: number;
  unitPriceAtOrder: number; // integer satang
}

export interface CreateOrderInput {
  customerId: string;
  items: Array<{
    bakeryItemId: string;
    quantity: number;
  }>;
  pickupNote?: string;
}

export interface OrderItemDto {
  id: string;
  bakeryItemId: string;
  bakeryItem?: {
    id: string;
    name: string;
    category: string;
  };
  quantity: number;
  unitPriceAtOrder: number;
}

export interface OrderDto {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  totalAmount: number;
  pickupNote: string | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Pure calculation helper:
 * Calculates totalAmount in integer satangs exclusively from authoritative DB prices.
 * Disregards any client-supplied prices (BR-01, ORD-02).
 */
export function calculateOrderTotals(
  items: CalculationItemInput[]
): CalculationResult {
  const totalAmount = items.reduce((sum, item) => {
    return sum + item.authoritativePrice * item.quantity;
  }, 0);

  return { totalAmount };
}

/**
 * Pure calculation helper:
 * Snapshots unitPriceAtOrder from current BakeryItem.price for each line item (BR-02, ORD-03).
 */
export function snapshotItemPrices(
  items: CalculationItemInput[]
): ItemSnapshotResult[] {
  return items.map((item) => ({
    bakeryItemId: item.bakeryItemId,
    quantity: item.quantity,
    unitPriceAtOrder: item.authoritativePrice,
  }));
}

/**
 * Creates a customer pre-order within an atomic Prisma transaction:
 * 1. Validates line item quantities (> 0).
 * 2. Fetches authoritative BakeryItems from DB.
 * 3. Enforces isAvailable === true and stockQuantity >= quantity (rejects 409 if unavailable or out of stock).
 * 4. Decrements BakeryItem.stockQuantity (leaves isAvailable === true even if stock reaches 0 per BR-05).
 * 5. Creates Order (status: PENDING) and OrderItems with unitPriceAtOrder snapshots.
 */
export async function createCustomerOrder(
  input: CreateOrderInput
): Promise<OrderDto> {
  const { customerId, items, pickupNote } = input;

  // 1. Validation: non-empty items and quantity > 0
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Order must contain at least one item.',
      [{ field: 'items', issue: 'Items array cannot be empty' }]
    );
  }

  for (const item of items) {
    if (!item.bakeryItemId || typeof item.bakeryItemId !== 'string') {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Each item must have a valid bakeryItemId.',
        [{ field: 'bakeryItemId', issue: 'Missing or invalid bakeryItemId' }]
      );
    }

    if (
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Quantity must be an integer greater than 0.',
        [{ field: 'quantity', issue: 'Must be an integer greater than 0' }]
      );
    }
  }

  // Execute atomic transactional checkout
  const createdOrder = await prisma.$transaction(async (tx) => {
    const itemIds = items.map((i) => i.bakeryItemId);
    const dbItems = await tx.bakeryItem.findMany({
      where: { id: { in: itemIds } },
    });

    const dbItemsMap = new Map(dbItems.map((item) => [item.id, item]));

    // Check existence
    for (const item of items) {
      const dbItem = dbItemsMap.get(item.bakeryItemId);
      if (!dbItem) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Bakery item '${item.bakeryItemId}' does not exist.`
        );
      }

      // Check isAvailable
      if (!dbItem.isAvailable) {
        throw new AppError(
          409,
          'CONFLICT',
          `Bakery item '${dbItem.name}' is not available for order.`
        );
      }

      // Check stock sufficiency
      if (dbItem.stockQuantity < item.quantity || dbItem.stockQuantity <= 0) {
        throw new AppError(
          409,
          'CONFLICT',
          `Insufficient stock for '${dbItem.name}'. Requested ${item.quantity}, but only ${dbItem.stockQuantity} available.`
        );
      }
    }

    // Decrement stock for all items
    for (const item of items) {
      const dbItem = dbItemsMap.get(item.bakeryItemId)!;
      await tx.bakeryItem.update({
        where: { id: dbItem.id },
        data: {
          stockQuantity: dbItem.stockQuantity - item.quantity,
          // BR-05: isAvailable is NOT automatically changed to false
        },
      });
    }

    // Calculate authoritative totals and price snapshots
    const calculationInputs: CalculationItemInput[] = items.map((item) => ({
      bakeryItemId: item.bakeryItemId,
      quantity: item.quantity,
      authoritativePrice: dbItemsMap.get(item.bakeryItemId)!.price,
    }));

    const { totalAmount } = calculateOrderTotals(calculationInputs);
    const snapshots = snapshotItemPrices(calculationInputs);

    // Create Order with nested OrderItems
    const order = await tx.order.create({
      data: {
        customerId,
        status: 'PENDING',
        totalAmount,
        pickupNote: pickupNote?.trim() || null,
        items: {
          create: snapshots.map((s) => ({
            bakeryItemId: s.bakeryItemId,
            quantity: s.quantity,
            unitPriceAtOrder: s.unitPriceAtOrder,
          })),
        },
      },
      include: {
        items: {
          include: {
            bakeryItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    return order;
  });

  return {
    id: createdOrder.id,
    customerId: createdOrder.customerId,
    status: createdOrder.status,
    totalAmount: createdOrder.totalAmount,
    pickupNote: createdOrder.pickupNote,
    items: createdOrder.items.map((i) => ({
      id: i.id,
      bakeryItemId: i.bakeryItemId,
      bakeryItem: i.bakeryItem
        ? {
            id: i.bakeryItem.id,
            name: i.bakeryItem.name,
            category: i.bakeryItem.category,
          }
        : undefined,
      quantity: i.quantity,
      unitPriceAtOrder: i.unitPriceAtOrder,
    })),
    createdAt: createdOrder.createdAt.toISOString(),
    updatedAt: createdOrder.updatedAt.toISOString(),
  };
}

/**
 * Returns all orders belonging exclusively to the given customer (BR-04, ORD-09).
 */
export async function getCustomerOrders(
  customerId: string
): Promise<OrderDto[]> {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          bakeryItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.map((order) => ({
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    totalAmount: order.totalAmount,
    pickupNote: order.pickupNote,
    items: order.items.map((i) => ({
      id: i.id,
      bakeryItemId: i.bakeryItemId,
      bakeryItem: i.bakeryItem
        ? {
            id: i.bakeryItem.id,
            name: i.bakeryItem.name,
            category: i.bakeryItem.category,
          }
        : undefined,
      quantity: i.quantity,
      unitPriceAtOrder: i.unitPriceAtOrder,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));
}

/**
 * Returns single order detail for the given orderId.
 * Enforces ownership isolation (BR-04, ORD-11):
 * If order exists but belongs to a different customer, throws 403 FORBIDDEN.
 * If order does not exist, throws 404 NOT_FOUND.
 */
export async function getCustomerOrderById(
  orderId: string,
  customerId: string
): Promise<OrderDto> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          bakeryItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  if (order.customerId !== customerId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to access this order.'
    );
  }

  return {
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    totalAmount: order.totalAmount,
    pickupNote: order.pickupNote,
    items: order.items.map((i) => ({
      id: i.id,
      bakeryItemId: i.bakeryItemId,
      bakeryItem: i.bakeryItem
        ? {
            id: i.bakeryItem.id,
            name: i.bakeryItem.name,
            category: i.bakeryItem.category,
          }
        : undefined,
      quantity: i.quantity,
      unitPriceAtOrder: i.unitPriceAtOrder,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
