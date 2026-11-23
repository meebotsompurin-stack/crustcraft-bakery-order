import { prisma } from '../lib/db';
import {
  ORDER_STATUSES,
  ALLOWED_TRANSITIONS,
  isValidOrderStatus,
  canTransitionOrderStatus,
  getStatusSortPriority,
  type OrderStatus,
} from '../lib/orderStatus';
import { AppError } from './auth.service';

export type { OrderStatus };
export { ORDER_STATUSES as KNOWN_ORDER_STATUSES, ALLOWED_TRANSITIONS };

const operatorOrderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
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
} as const;

export async function listOperatorOrders() {
  const orders = await prisma.order.findMany({
    include: operatorOrderInclude,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.sort((a, b) => {
    const priorityA = getStatusSortPriority(a.status);
    const priorityB = getStatusSortPriority(b.status);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getOperatorOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: operatorOrderInclude,
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  return order;
}

export async function updateOrderStatus(orderId: string, targetStatus: unknown) {
  if (!isValidOrderStatus(targetStatus)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status value provided');
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  if (!canTransitionOrderStatus(existingOrder.status, targetStatus)) {
    throw new AppError(
      409,
      'CONFLICT',
      `Cannot transition order from ${existingOrder.status} to ${targetStatus}`
    );
  }

  // Atomic cancellation from PENDING: conditionally update status and restore inventory (BR-03, BR-07)
  if (targetStatus === 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      if (result.count === 0) {
        throw new AppError(
          409,
          'CONFLICT',
          'Order status was changed concurrently and can no longer be cancelled'
        );
      }

      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        await tx.bakeryItem.update({
          where: { id: item.bakeryItemId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: operatorOrderInclude,
      });
    });
  }

  // Atomic conditional update: only succeeds if the row still has the status we validated,
  // so concurrent operators cannot double-advance the same order (BR-06, BR-07).
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: existingOrder.status },
    data: { status: targetStatus },
  });

  if (result.count === 0) {
    throw new AppError(
      409,
      'CONFLICT',
      'Order status was changed by another operator; please refresh the queue'
    );
  }

  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: operatorOrderInclude,
  });
}
