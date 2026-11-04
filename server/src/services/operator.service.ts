import { prisma } from '../lib/db';
import { AppError } from './auth.service';

export type OrderStatus = 'PENDING' | 'ACCEPTED';

export const KNOWN_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED'];

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['ACCEPTED'],
  ACCEPTED: [], // Sprint 1: no further transitions allowed
};

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  ACCEPTED: 1,
};

export async function listOperatorOrders() {
  const orders = await prisma.order.findMany({
    include: {
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] ?? 99;
    const priorityB = STATUS_PRIORITY[b.status] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getOperatorOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
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
    },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  return order;
}

export async function updateOrderStatus(orderId: string, targetStatus: unknown) {
  if (
    !targetStatus ||
    typeof targetStatus !== 'string' ||
    !KNOWN_ORDER_STATUSES.includes(targetStatus as OrderStatus)
  ) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status value provided');
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  const currentStatus = existingOrder.status as OrderStatus;
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(targetStatus as OrderStatus)) {
    throw new AppError(
      409,
      'CONFLICT',
      `Cannot transition order from ${existingOrder.status} to ${targetStatus}`
    );
  }

  // Atomic conditional update: only succeeds if the row still has the status we validated,
  // so concurrent operators cannot both accept the same order (BR-06, BR-07).
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

  const updatedOrder = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
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
    },
  });

  return updatedOrder;
}
