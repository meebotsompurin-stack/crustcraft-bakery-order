import React from 'react';
import { Link } from 'react-router-dom';
import type { OrderResponse } from '../services/api';

export interface OperatorOrderRowProps {
  order: OrderResponse;
  onAcceptOrder: (orderId: string) => Promise<void>;
  isAccepting: boolean;
}

export const OperatorOrderRow: React.FC<OperatorOrderRowProps> = ({
  order,
  onAcceptOrder,
  isAccepting,
}) => {
  const formattedTotal = `฿${(order.totalAmount / 100).toFixed(2)}`;
  const itemSummary = order.items && order.items.length > 0
    ? order.items
        .map(
          (item) =>
            `${item.quantity}x ${item.bakeryItem?.name || 'Bakery Item'}`
        )
        .join(', ')
    : 'No items';

  const formattedDate = new Date(order.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      data-order-id={order.id}
      className="bg-white rounded-xl border border-stone-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
    >
      {/* Left info column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <span className="font-mono text-xs font-semibold text-stone-500">
            #{order.id.slice(-8)}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              order.status === 'PENDING'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {order.status}
          </span>
          <span className="text-xs text-stone-400 hidden sm:inline">
            {formattedDate}
          </span>
        </div>

        <div className="mt-2">
          <div className="text-sm font-semibold text-stone-900">
            {order.customer?.name || 'Customer'}{' '}
            <span className="text-xs font-normal text-stone-500">
              ({order.customer?.email || 'N/A'})
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 line-clamp-1">
            {itemSummary}
          </p>
          {order.pickupNote && (
            <p className="text-xs italic text-amber-700 mt-1 bg-amber-50 p-1.5 rounded border border-amber-100">
              Note: {order.pickupNote}
            </p>
          )}
        </div>
      </div>

      {/* Middle/Total THB */}
      <div className="text-left lg:text-right flex items-center justify-between lg:block lg:min-w-[120px]">
        <span className="text-xs text-stone-500 lg:hidden">Order Total:</span>
        <div>
          <div className="text-base font-bold text-amber-900">
            {formattedTotal}
          </div>
          <span className="text-xs text-stone-400 sm:hidden">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:min-w-[240px] justify-end">
        <Link
          to={`/operator/orders/${order.id}`}
          className="inline-flex justify-center items-center px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold text-center transition"
        >
          View Details
        </Link>

        {order.status === 'PENDING' ? (
          <button
            type="button"
            disabled={isAccepting}
            onClick={() => onAcceptOrder(order.id)}
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm"
          >
            {isAccepting ? 'Accepting...' : 'Accept Order'}
          </button>
        ) : (
          <span className="inline-flex justify-center items-center px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            Accepted ✓
          </span>
        )}
      </div>
    </div>
  );
};
