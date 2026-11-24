import { describe, it, expect } from 'vitest';
import {
  buildSalesSummary,
  type ReportingOrderInput,
} from '../../services/reporting.service';

describe('F-08 Sales Reporting Pure Aggregation Unit Tests (RPT-01 to RPT-02)', () => {
  it('RPT-01: sums totalRevenueSatang exclusively from COMPLETED orders with exact integer satang arithmetic (NFR-06)', () => {
    const orders: ReportingOrderInput[] = [
      {
        id: 'ord-completed-1',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalAmount: 1999,
        items: [
          {
            bakeryItemId: 'item-a',
            quantity: 1,
            unitPriceAtOrder: 1999,
            bakeryItem: { id: 'item-a', name: 'Butter Croissant', category: 'Pastry' },
          },
        ],
      },
      {
        id: 'ord-completed-2',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalAmount: 3333,
        items: [
          {
            bakeryItemId: 'item-b',
            quantity: 1,
            unitPriceAtOrder: 3333,
            bakeryItem: { id: 'item-b', name: 'Sourdough Loaf', category: 'Bread' },
          },
        ],
      },
      {
        id: 'ord-pending-1',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalAmount: 15000,
        items: [
          {
            bakeryItemId: 'item-a',
            quantity: 5,
            unitPriceAtOrder: 3000,
            bakeryItem: { id: 'item-a', name: 'Butter Croissant', category: 'Pastry' },
          },
        ],
      },
      {
        id: 'ord-accepted-1',
        status: 'ACCEPTED',
        paymentStatus: 'PAID',
        totalAmount: 8500,
        items: [],
      },
      {
        id: 'ord-baking-1',
        status: 'BAKING',
        paymentStatus: 'PAID',
        totalAmount: 9500,
        items: [],
      },
      {
        id: 'ord-ready-1',
        status: 'READY_FOR_PICKUP',
        paymentStatus: 'PAID',
        totalAmount: 12000,
        items: [],
      },
      {
        id: 'ord-cancelled-1',
        status: 'CANCELLED',
        paymentStatus: 'FAILED',
        totalAmount: 25000,
        items: [
          {
            bakeryItemId: 'item-c',
            quantity: 10,
            unitPriceAtOrder: 2500,
            bakeryItem: { id: 'item-c', name: 'Lemon Tart', category: 'Tart' },
          },
        ],
      },
    ];

    const summary = buildSalesSummary(orders, {
      from: '2026-11-01',
      to: '2026-11-30',
    });

    // Exact integer sum of COMPLETED orders only: 1999 + 3333 = 5332 satang
    expect(summary.totalRevenueSatang).toBe(5332);
    expect(Number.isInteger(summary.totalRevenueSatang)).toBe(true);
    expect(summary.completedOrderCount).toBe(2);
    expect(summary.totalOrderCount).toBe(7);

    expect(summary.paymentBreakdown).toEqual({
      UNPAID: 1,
      PAID: 5,
      FAILED: 1,
    });

    expect(summary.dateRange).toEqual({
      from: '2026-11-01',
      to: '2026-11-30',
    });
  });

  it('RPT-02: calculates ordersByStatus across all 6 statuses and ranks topSellingItems descending by quantitySold using snapshotted unitPriceAtOrder', () => {
    const orders: ReportingOrderInput[] = [
      {
        id: 'ord-1',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalAmount: 31000,
        items: [
          {
            bakeryItemId: 'item-croissant',
            quantity: 2,
            unitPriceAtOrder: 8500, // Old price snapshot: 17000
            bakeryItem: {
              id: 'item-croissant',
              name: 'Artisan Butter Croissant',
              category: 'Pastry',
            },
          },
          {
            bakeryItemId: 'item-sourdough',
            quantity: 1,
            unitPriceAtOrder: 14000,
            bakeryItem: {
              id: 'item-sourdough',
              name: 'Country Sourdough',
              category: 'Bread',
            },
          },
        ],
      },
      {
        id: 'ord-2',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalAmount: 42500,
        items: [
          {
            bakeryItemId: 'item-croissant',
            quantity: 3,
            unitPriceAtOrder: 9000, // New price snapshot: 27000 -> total 5 units, 44000 satang
            bakeryItem: {
              id: 'item-croissant',
              name: 'Artisan Butter Croissant',
              category: 'Pastry',
            },
          },
          {
            bakeryItemId: 'item-tart',
            quantity: 2,
            unitPriceAtOrder: 7750, // 15500 satang
            bakeryItem: {
              id: 'item-tart',
              name: 'Dark Chocolate Tart',
              category: 'Tart',
            },
          },
        ],
      },
      {
        id: 'ord-3',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalAmount: 90000,
        items: [
          {
            bakeryItemId: 'item-sourdough',
            quantity: 10, // Must NOT count toward topSellingItems because order is PENDING
            unitPriceAtOrder: 9000,
            bakeryItem: {
              id: 'item-sourdough',
              name: 'Country Sourdough',
              category: 'Bread',
            },
          },
        ],
      },
      {
        id: 'ord-4',
        status: 'CANCELLED',
        paymentStatus: 'UNPAID',
        totalAmount: 50000,
        items: [
          {
            bakeryItemId: 'item-tart',
            quantity: 8, // Must NOT count because order is CANCELLED
            unitPriceAtOrder: 6250,
            bakeryItem: {
              id: 'item-tart',
              name: 'Dark Chocolate Tart',
              category: 'Tart',
            },
          },
        ],
      },
      {
        id: 'ord-5',
        status: 'ACCEPTED',
        paymentStatus: 'PAID',
        totalAmount: 10000,
        items: [],
      },
    ];

    const summary = buildSalesSummary(orders);

    expect(summary.ordersByStatus).toEqual({
      PENDING: 1,
      ACCEPTED: 1,
      BAKING: 0,
      READY_FOR_PICKUP: 0,
      COMPLETED: 2,
      CANCELLED: 1,
    });

    expect(summary.topSellingItems).toEqual([
      {
        bakeryItemId: 'item-croissant',
        name: 'Artisan Butter Croissant',
        category: 'Pastry',
        quantitySold: 5,
        revenueSatang: 44000, // (2 * 8500) + (3 * 9000)
      },
      {
        bakeryItemId: 'item-tart',
        name: 'Dark Chocolate Tart',
        category: 'Tart',
        quantitySold: 2,
        revenueSatang: 15500, // 2 * 7750
      },
      {
        bakeryItemId: 'item-sourdough',
        name: 'Country Sourdough',
        category: 'Bread',
        quantitySold: 1,
        revenueSatang: 14000, // 1 * 14000
      },
    ]);

    expect(summary.dateRange).toEqual({ from: null, to: null });
  });

  it('returns zeroed metrics and empty topSellingItems when given an empty order list', () => {
    const summary = buildSalesSummary([]);

    expect(summary).toEqual({
      totalRevenueSatang: 0,
      completedOrderCount: 0,
      totalOrderCount: 0,
      ordersByStatus: {
        PENDING: 0,
        ACCEPTED: 0,
        BAKING: 0,
        READY_FOR_PICKUP: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      },
      paymentBreakdown: {
        UNPAID: 0,
        PAID: 0,
        FAILED: 0,
      },
      topSellingItems: [],
      dateRange: {
        from: null,
        to: null,
      },
    });
  });
});
