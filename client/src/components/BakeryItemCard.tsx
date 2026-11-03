import React from 'react';
import { type BakeryItemDto } from '../services/api';

export interface BakeryItemCardProps {
  item: BakeryItemDto;
  onSelect?: (item: BakeryItemDto) => void;
  selectedQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
}

export const BakeryItemCard: React.FC<BakeryItemCardProps> = ({
  item,
  onSelect,
  selectedQuantity,
  onQuantityChange,
}) => {
  const isOutOfStock = item.stockQuantity <= 0;
  const formattedPrice = `฿${(item.price / 100).toFixed(2)}`;

  return (
    <div
      data-testid={`bakery-item-card-${item.id}`}
      className={`flex flex-col justify-between bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
        isOutOfStock
          ? 'border-stone-200 bg-stone-50/70'
          : 'border-stone-200 hover:border-amber-300'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
            {item.category}
          </span>

          {isOutOfStock ? (
            <span
              data-testid="badge-out-of-stock"
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
            >
              Out of Stock / สินค้าหมดชั่วคราว
            </span>
          ) : (
            <span
              data-testid="badge-in-stock"
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
            >
              In Stock: {item.stockQuantity}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-stone-900 leading-snug tracking-tight">
          {item.name}
        </h3>
        <p className="text-sm text-stone-600 mt-1.5 line-clamp-3">
          {item.description}
        </p>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        <div>
          <span className="text-xs text-stone-500 block uppercase font-medium">
            Price
          </span>
          <span className="text-xl font-extrabold text-amber-900">
            {formattedPrice}
          </span>
        </div>

        {onQuantityChange && typeof selectedQuantity === 'number' ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={selectedQuantity <= 0}
              onClick={() => onQuantityChange(Math.max(0, selectedQuantity - 1))}
              className="w-8 h-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-stone-700"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-semibold text-stone-900">
              {selectedQuantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || selectedQuantity >= item.stockQuantity}
              onClick={() => onQuantityChange(selectedQuantity + 1)}
              className="w-8 h-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-stone-700"
            >
              +
            </button>
          </div>
        ) : onSelect ? (
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onSelect(item)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {isOutOfStock ? 'Sold Out' : 'Pre-Order'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
