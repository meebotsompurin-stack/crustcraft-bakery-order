import { describe, it, expect, vi, afterEach } from 'vitest';
import { prisma } from '../../lib/db';
import { AppError } from '../../services/auth.service';
import {
  calculateOrderTotals,
  snapshotItemPrices,
  createCustomerOrder,
  type CalculationItemInput,
} from '../../services/orders.service';

describe('F-03 Order Price Calculation Unit Tests (ORD-02, ORD-03)', () => {
  describe('ORD-02: Server-side total calculation in integer satang ignoring client prices (AC-04-08, BR-01)', () => {
    it('calculates totalAmount correctly as sum of (BakeryItem.price * quantity) in satang', () => {
      const items: CalculationItemInput[] = [
        {
          bakeryItemId: 'item-croissant',
          quantity: 2,
          authoritativePrice: 8500, // 85.00 THB in satang
        },
        {
          bakeryItemId: 'item-pain-au-chocolat',
          quantity: 1,
          authoritativePrice: 9000, // 90.00 THB in satang
        },
      ];

      const result = calculateOrderTotals(items);

      // (8500 * 2) + (9000 * 1) = 17000 + 9000 = 26000 satang (260.00 THB)
      expect(result.totalAmount).toBe(26000);
      expect(Number.isInteger(result.totalAmount)).toBe(true);
    });

    it('ignores client-supplied prices entirely and strictly uses authoritative DB prices', () => {
      const itemsWithTamperedClientPrice: (CalculationItemInput & { clientSuppliedPrice?: number })[] = [
        {
          bakeryItemId: 'item-sourdough',
          quantity: 2,
          authoritativePrice: 22000, // 220.00 THB in DB
          clientSuppliedPrice: 100, // Client attempts to buy for 1.00 THB
        },
      ];

      const result = calculateOrderTotals(itemsWithTamperedClientPrice);

      // 22000 * 2 = 44000 satang (440.00 THB) — client-supplied 100 is completely disregarded
      expect(result.totalAmount).toBe(44000);
      expect(result.totalAmount).not.toBe(200);
    });

    it('correctly handles multi-item orders with diverse categories and satang amounts', () => {
      const items: CalculationItemInput[] = [
        { bakeryItemId: 'item-brioche', quantity: 3, authoritativePrice: 6500 }, // 19500
        { bakeryItemId: 'item-tart', quantity: 2, authoritativePrice: 14500 }, // 29000
        { bakeryItemId: 'item-croissant', quantity: 4, authoritativePrice: 8500 }, // 34000
      ];

      const result = calculateOrderTotals(items);

      // 19500 + 29000 + 34000 = 82500 satang (825.00 THB)
      expect(result.totalAmount).toBe(82500);
    });
  });

  describe('ORD-03: Historical unit price snapshotting on OrderItem (AC-04-09, BR-02)', () => {
    it('snapshots unitPriceAtOrder from current BakeryItem.price for every line item', () => {
      const items: CalculationItemInput[] = [
        { bakeryItemId: 'item-croissant', quantity: 2, authoritativePrice: 8500 },
        { bakeryItemId: 'item-sourdough', quantity: 1, authoritativePrice: 22000 },
      ];

      const snapshots = snapshotItemPrices(items);

      expect(snapshots).toHaveLength(2);
      expect(snapshots[0]).toEqual({
        bakeryItemId: 'item-croissant',
        quantity: 2,
        unitPriceAtOrder: 8500,
      });
      expect(snapshots[1]).toEqual({
        bakeryItemId: 'item-sourdough',
        quantity: 1,
        unitPriceAtOrder: 22000,
      });
      expect(Number.isInteger(snapshots[0].unitPriceAtOrder)).toBe(true);
      expect(Number.isInteger(snapshots[1].unitPriceAtOrder)).toBe(true);
    });

    it('preserves historical snapshot even if the original item price changes later', () => {
      const originalPrice = 8500;
      const initialItem: CalculationItemInput = {
        bakeryItemId: 'item-croissant',
        quantity: 1,
        authoritativePrice: originalPrice,
      };

      const initialSnapshot = snapshotItemPrices([initialItem])[0];
      expect(initialSnapshot.unitPriceAtOrder).toBe(8500);

      // Later, the bakery owner increases price to 95.00 THB (9500 satang)
      const updatedCatalogItem: CalculationItemInput = {
        bakeryItemId: 'item-croissant',
        quantity: 1,
        authoritativePrice: 9500,
      };

      const newOrderSnapshot = snapshotItemPrices([updatedCatalogItem])[0];
      expect(newOrderSnapshot.unitPriceAtOrder).toBe(9500);

      // The previous order snapshot MUST remain 8500 satang (immutable historical record)
      expect(initialSnapshot.unitPriceAtOrder).toBe(8500);
    });
  });

  describe('ORD-06 / Issue #58 (UAT-CC-02): pickupNote 500-character boundary validation (AC-03-07)', () => {
    const expectedDetails = [{ field: 'pickupNote', issue: 'Cannot exceed 500 characters' }];
    const items = [{ bakeryItemId: 'cmweuf2oh0005dh1czk35zvh1', quantity: 1 }];

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([501, 505])(
      'rejects pickupNote of %i characters with exact 400 VALIDATION_ERROR and never opens prisma.$transaction',
      async (length) => {
        const txSpy = vi.spyOn(prisma, '$transaction');

        const error = await createCustomerOrder({
          customerId: 'uat-cust-1',
          items,
          pickupNote: 'A'.repeat(length),
        }).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(AppError);
        const appError = error as AppError;
        expect(appError.statusCode).toBe(400);
        expect(appError.code).toBe('VALIDATION_ERROR');
        expect(appError.message).toBe('Pickup note cannot exceed 500 characters.');
        expect(appError.details).toEqual(expectedDetails);
        expect(txSpy).not.toHaveBeenCalled();
      }
    );

    it('does not reject a pickupNote of exactly 500 characters at the validation stage (proceeds to prisma.$transaction)', async () => {
      const txSpy = vi
        .spyOn(prisma, '$transaction')
        .mockRejectedValue(new Error('TX_REACHED'));

      await expect(
        createCustomerOrder({
          customerId: 'uat-cust-1',
          items,
          pickupNote: 'A'.repeat(500),
        })
      ).rejects.toThrow('TX_REACHED');
      expect(txSpy).toHaveBeenCalledTimes(1);
    });
  });
});
