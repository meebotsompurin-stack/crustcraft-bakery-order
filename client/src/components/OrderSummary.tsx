import React from 'react';
import { type BakeryItemDto } from '../services/api';

export interface SelectedOrderLine {
  item: BakeryItemDto;
  quantity: number;
}

export interface OrderSummaryProps {
  selectedLines: SelectedOrderLine[];
  pickupNote: string;
  onPickupNoteChange: (note: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedLines,
  pickupNote,
  onPickupNoteChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}) => {
  const activeLines = selectedLines.filter((line) => line.quantity > 0);

  // Authoritative client estimation for preview display (server enforces exact calculation in satang)
  const estimatedTotalSatang = activeLines.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0
  );

  const formattedEstimatedTotal = `฿${(estimatedTotalSatang / 100).toFixed(2)}`;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
        Order Summary
      </h3>

      {activeLines.length === 0 ? (
        <p className="text-sm text-stone-500 py-6 text-center italic">
          No items selected yet. Choose items from the catalog above.
        </p>
      ) : (
        <div className="divide-y divide-stone-100 my-4 max-h-64 overflow-y-auto">
          {activeLines.map(({ item, quantity }) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-semibold text-stone-800">{item.name}</p>
                <p className="text-xs text-stone-500">
                  {quantity} × ฿{(item.price / 100).toFixed(2)}
                </p>
              </div>
              <span className="font-bold text-stone-900">
                ฿{((item.price * quantity) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-stone-200">
        <label
          htmlFor="pickupNote"
          className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5"
        >
          Special Pickup Instructions (Optional)
        </label>
        <textarea
          id="pickupNote"
          rows={2}
          value={pickupNote}
          onChange={(e) => onPickupNoteChange(e.target.value)}
          placeholder="e.g. Please slice sourdough bread or pack in paper bag"
          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600">
          Estimated Total
        </span>
        <span className="text-2xl font-black text-amber-900">
          {formattedEstimatedTotal}
        </span>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        disabled={activeLines.length === 0 || isSubmitting}
        onClick={onSubmit}
        className="w-full mt-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm tracking-wide disabled:bg-stone-300 disabled:cursor-not-allowed shadow-sm transition-colors"
      >
        {isSubmitting ? 'Submitting Pre-Order...' : 'Confirm Pre-Order'}
      </button>
    </div>
  );
};
