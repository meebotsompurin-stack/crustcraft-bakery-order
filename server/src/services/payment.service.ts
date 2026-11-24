import { prisma } from '../lib/db';
import {
  isValidPaymentStatus,
  type PaymentStatus,
} from '../lib/orderStatus';
import { AppError } from './auth.service';
import type { OrderDto } from './orders.service';

const SIMULATE_OUTCOMES = ['SUCCESS', 'FAIL'] as const;
type SimulateOutcome = (typeof SIMULATE_OUTCOMES)[number];

const customerOrderInclude = {
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

export async function simulateCustomerPayment(
  orderId: string,
  customerId: string,
  simulateOutcome?: unknown
): Promise<OrderDto> {
  let outcome: SimulateOutcome = 'SUCCESS';

  if (simulateOutcome !== undefined && simulateOutcome !== null) {
    if (
      typeof simulateOutcome !== 'string' ||
      !(SIMULATE_OUTCOMES as readonly string[]).includes(simulateOutcome)
    ) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Invalid simulateOutcome value. Must be "SUCCESS" or "FAIL".',
        [{ field: 'simulateOutcome', issue: 'Must be "SUCCESS" or "FAIL"' }]
      );
    }
    outcome = simulateOutcome as SimulateOutcome;
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  if (existingOrder.customerId !== customerId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to access this order.'
    );
  }

  if (existingOrder.status === 'CANCELLED') {
    throw new AppError(
      409,
      'CONFLICT',
      'Cannot process payment for a cancelled order.'
    );
  }

  if (existingOrder.paymentStatus === 'PAID') {
    throw new AppError(
      409,
      'CONFLICT',
      'Order has already been paid.'
    );
  }

  const nextPaymentStatus: PaymentStatus =
    outcome === 'FAIL' ? 'FAILED' : 'PAID';

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      customerId,
      status: { not: 'CANCELLED' },
      paymentStatus: { in: ['UNPAID', 'FAILED'] },
    },
    data: {
      paymentStatus: nextPaymentStatus,
    },
  });

  if (result.count === 0) {
    throw new AppError(
      409,
      'CONFLICT',
      'Order payment state changed concurrently; please refresh the order.'
    );
  }

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: customerOrderInclude,
  });

  return {
    id: updated.id,
    customerId: updated.customerId,
    status: updated.status,
    paymentStatus: updated.paymentStatus as PaymentStatus,
    totalAmount: updated.totalAmount,
    pickupNote: updated.pickupNote,
    items: updated.items.map((i) => ({
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
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateOperatorOrderPayment(
  orderId: string,
  targetPaymentStatus: unknown
) {
  if (!isValidPaymentStatus(targetPaymentStatus)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid paymentStatus value. Must be "UNPAID", "PAID", or "FAILED".',
      [{ field: 'paymentStatus', issue: 'Must be "UNPAID", "PAID", or "FAILED"' }]
    );
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  if (existingOrder.status === 'CANCELLED') {
    throw new AppError(
      409,
      'CONFLICT',
      'Cannot update payment status for a cancelled order.'
    );
  }

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: { not: 'CANCELLED' },
    },
    data: {
      paymentStatus: targetPaymentStatus,
    },
  });

  if (result.count === 0) {
    throw new AppError(
      409,
      'CONFLICT',
      'Order status changed to CANCELLED; payment cannot be updated.'
    );
  }

  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: operatorOrderInclude,
  });
}
