import React from 'react';
import { Link } from 'react-router-dom';
import type { OrderResponse, OrderStatus } from '../services/api';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export interface OperatorOrderRowProps {
  order: OrderResponse;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  isUpdating: boolean;
}

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 border border-blue-300',
  BAKING: 'bg-orange-100 text-orange-800 border border-orange-300',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-800 border border-purple-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-800 border border-rose-300',
};

const NEXT_STEP_CONFIG: Partial<
  Record<OrderStatus, { nextStatus: OrderStatus; label: string; pendingLabel: string; buttonClass: string }>
> = {
  PENDING: {
    nextStatus: 'ACCEPTED',
    label: 'Accept Order',
    pendingLabel: 'Accepting...',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
  },
  ACCEPTED: {
    nextStatus: 'BAKING',
    label: 'Start Baking',
    pendingLabel: 'Updating...',
    buttonClass: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800',
  },
  BAKING: {
    nextStatus: 'READY_FOR_PICKUP',
    label: 'Mark Ready',
    pendingLabel: 'Updating...',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
  },
  READY_FOR_PICKUP: {
    nextStatus: 'COMPLETED',
    label: 'Complete',
    pendingLabel: 'Completing...',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
  },
};

export const OperatorOrderRow: React.FC<OperatorOrderRowProps> = ({
  order,
  onUpdateStatus,
  isUpdating,
}) => {
  const formattedTotal = `฿${(order.totalAmount / 100).toFixed(2)}`;
  const itemSummary =
    order.items && order.items.length > 0
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

  const badgeClass =
    STATUS_BADGE_CLASSES[order.status] ||
    'bg-stone-100 text-stone-700 border border-stone-300';
  const nextStep = NEXT_STEP_CONFIG[order.status];

  return (
    <div
      data-order-id={order.id}
      className="bg-white rounded-xl border border-stone-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
    >
      {/* Left info column */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-stone-500">
            #{order.id.slice(-8)}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
          >
            {order.status}
          </span>
          <PaymentStatusBadge status={order.paymentStatus} />
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
            <p className="text-xs italic text-amber-700 mt-1 bg-amber-50 p-1.5 rounded border border-amber-100 break-words [overflow-wrap:anywhere]">
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

        {nextStep ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(order.id, nextStep.nextStatus)}
            className={`inline-flex justify-center items-center px-4 py-2 rounded-lg disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm ${nextStep.buttonClass}`}
          >
            {isUpdating ? nextStep.pendingLabel : nextStep.label}
          </button>
        ) : order.status === 'COMPLETED' ? (
          <span className="inline-flex justify-center items-center px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            Completed ✓
          </span>
        ) : (
          <span className="inline-flex justify-center items-center px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
};
