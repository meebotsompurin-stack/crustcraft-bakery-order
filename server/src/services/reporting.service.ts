import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import {
  isValidOrderStatus,
  isValidPaymentStatus,
  type OrderStatus,
  type PaymentStatus,
} from '../lib/orderStatus';
import { AppError } from './auth.service';

export interface ReportingOrderItemInput {
  bakeryItemId: string;
  quantity: number;
  unitPriceAtOrder: number; // Integer satang (BR-02, NFR-06)
  bakeryItem: {
    id: string;
    name: string;
    category: string;
  };
}

export interface ReportingOrderInput {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number; // Integer satang (BR-01, NFR-06)
  items: ReportingOrderItemInput[];
}

export interface TopSellingItemSummary {
  bakeryItemId: string;
  name: string;
  category: string;
  quantitySold: number;
  revenueSatang: number;
}

export interface SalesSummaryDateRange {
  from: string | null;
  to: string | null;
}

export interface SalesSummary {
  totalRevenueSatang: number;
  completedOrderCount: number;
  totalOrderCount: number;
  ordersByStatus: Record<OrderStatus, number>;
  paymentBreakdown: Record<PaymentStatus, number>;
  topSellingItems: TopSellingItemSummary[];
  dateRange: SalesSummaryDateRange;
}

export interface SalesSummaryQueryInput {
  from?: unknown;
  to?: unknown;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDateParam(
  value: unknown,
  field: 'from' | 'to',
  details: Array<{ field: string; issue: string }>
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    details.push({
      field,
      issue: `${field} must be a single date string in YYYY-MM-DD format`,
    });
    return null;
  }

  const trimmed = value.trim();
  if (!ISO_DATE_REGEX.test(trimmed)) {
    details.push({
      field,
      issue: `${field} must be in YYYY-MM-DD format`,
    });
    return null;
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    details.push({
      field,
      issue: `${field} is not a valid calendar date`,
    });
    return null;
  }

  return trimmed;
}

export function buildSalesSummary(
  orders: ReportingOrderInput[],
  dateRange?: Partial<SalesSummaryDateRange>
): SalesSummary {
  const ordersByStatus: Record<OrderStatus, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    BAKING: 0,
    READY_FOR_PICKUP: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  const paymentBreakdown: Record<PaymentStatus, number> = {
    UNPAID: 0,
    PAID: 0,
    FAILED: 0,
  };

  let totalRevenueSatang = 0;
  let completedOrderCount = 0;

  const itemTotals = new Map<string, TopSellingItemSummary>();

  for (const order of orders) {
    if (isValidOrderStatus(order.status)) {
      ordersByStatus[order.status] += 1;
    }

    if (isValidPaymentStatus(order.paymentStatus)) {
      paymentBreakdown[order.paymentStatus] += 1;
    }

    // Revenue Recognition Rule (BR-01, NFR-06):
    // Only COMPLETED orders count toward totalRevenueSatang and topSellingItems.
    if (order.status === 'COMPLETED') {
      completedOrderCount += 1;
      totalRevenueSatang += order.totalAmount;

      for (const item of order.items) {
        const lineRevenueSatang = item.unitPriceAtOrder * item.quantity;
        const existing = itemTotals.get(item.bakeryItemId);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenueSatang += lineRevenueSatang;
        } else {
          itemTotals.set(item.bakeryItemId, {
            bakeryItemId: item.bakeryItemId,
            name: item.bakeryItem.name,
            category: item.bakeryItem.category,
            quantitySold: item.quantity,
            revenueSatang: lineRevenueSatang,
          });
        }
      }
    }
  }

  const topSellingItems = Array.from(itemTotals.values()).sort((a, b) => {
    if (b.quantitySold !== a.quantitySold) {
      return b.quantitySold - a.quantitySold;
    }
    if (b.revenueSatang !== a.revenueSatang) {
      return b.revenueSatang - a.revenueSatang;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    totalRevenueSatang,
    completedOrderCount,
    totalOrderCount: orders.length,
    ordersByStatus,
    paymentBreakdown,
    topSellingItems,
    dateRange: {
      from: dateRange?.from ?? null,
      to: dateRange?.to ?? null,
    },
  };
}

export async function getSalesSummary(
  query: SalesSummaryQueryInput = {}
): Promise<SalesSummary> {
  const details: Array<{ field: string; issue: string }> = [];

  const from = validateDateParam(query.from, 'from', details);
  const to = validateDateParam(query.to, 'to', details);

  if (details.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid date range query parameters',
      details
    );
  }

  if (from && to && from > to) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid date range: "from" date must be less than or equal to "to" date',
      [
        {
          field: 'from',
          issue: '"from" date must not be after "to" date',
        },
      ]
    );
  }

  const where: Prisma.OrderWhereInput = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      items: {
        select: {
          bakeryItemId: true,
          quantity: true,
          unitPriceAtOrder: true,
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

  return buildSalesSummary(orders, { from, to });
}
