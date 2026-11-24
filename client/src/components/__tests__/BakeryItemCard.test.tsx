import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BakeryItemCard } from '../BakeryItemCard';
import type { BakeryItemDto } from '../../services/api';

const makeItem = (overrides: Partial<BakeryItemDto> = {}): BakeryItemDto => ({
  id: 'item-croissant-ui-test',
  name: 'Artisan Butter Croissant',
  description: 'Flaky French-style butter croissant baked fresh every morning.',
  price: 8500,
  stockQuantity: 20,
  isAvailable: true,
  category: 'Pastry',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

describe('Lab 7 CR-01 — BakeryItemCard Per-Item Max 5 Cap (CR01-UI-01, CR01-UI-02)', () => {
  afterEach(() => {
    cleanup();
  });

  it('CR01-UI-01: disables "+" button at Math.min(stockQuantity, 5) — at 5 when stock is 20 and at 3 when stock is 3', () => {
    const onQuantityChange = vi.fn();

    // (a) stockQuantity = 20, selectedQuantity = 4 -> "+" enabled
    const { rerender } = render(
      <BakeryItemCard
        item={makeItem({ stockQuantity: 20 })}
        selectedQuantity={4}
        onQuantityChange={onQuantityChange}
      />
    );
    expect(screen.getByRole('button', { name: '+' })).not.toBeDisabled();

    // (a) stockQuantity = 20, selectedQuantity = 5 -> "+" disabled at per-item cap 5
    rerender(
      <BakeryItemCard
        item={makeItem({ stockQuantity: 20 })}
        selectedQuantity={5}
        onQuantityChange={onQuantityChange}
      />
    );
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();

    // (b) stockQuantity = 3, selectedQuantity = 3 -> "+" disabled at Math.min(3, 5) = 3
    rerender(
      <BakeryItemCard
        item={makeItem({ stockQuantity: 3 })}
        selectedQuantity={3}
        onQuantityChange={onQuantityChange}
      />
    );
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
  });

  it('CR01-UI-02: renders "Max 5 per item" notice on in-stock BakeryItemCard', () => {
    render(
      <BakeryItemCard
        item={makeItem({ stockQuantity: 20 })}
        selectedQuantity={0}
        onQuantityChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Max 5 per item/i)).toBeInTheDocument();
  });
});
