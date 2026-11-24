import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getOperatorOrderByIdApi,
  updateOperatorOrderStatusApi,
  type OrderResponse,
  type OrderStatus,
} from '../services/api';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { SimulatedPaymentCard } from '../components/SimulatedPaymentCard';

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
    label: 'Mark Ready for Pickup',
    pendingLabel: 'Updating...',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
  },
  READY_FOR_PICKUP: {
    nextStatus: 'COMPLETED',
    label: 'Mark Completed',
    pendingLabel: 'Completing...',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
  },
};

export const OperatorOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [confirmingCancel, setConfirmingCancel] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOperatorOrderByIdApi(orderId);
      setOrder(data.order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order not found';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail(id);
    }
  }, [id]);

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!order) return;
    try {
      setActionError(null);
      setActionSuccess(null);
      setIsUpdating(true);
      const data = await updateOperatorOrderStatusApi(order.id, nextStatus);
      setOrder(data.order);
      setConfirmingCancel(false);
      if (nextStatus === 'CANCELLED') {
        setActionSuccess('Order cancelled and reserved inventory has been restored.');
      } else {
        setActionSuccess(`Order status updated to ${nextStatus}.`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update order status';
      setActionError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const nextStep = order ? NEXT_STEP_CONFIG[order.status] : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {/* Top back navigation */}
      <div className="mb-6">
        <Link
          to="/operator/orders"
          className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1"
        >
          ← Back to Order Queue
        </Link>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-900 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between"
        >
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 animate-pulse space-y-4">
          <div className="h-6 bg-stone-200 rounded w-1/3"></div>
          <div className="h-4 bg-stone-100 rounded w-1/2"></div>
          <div className="h-32 bg-stone-50 rounded"></div>
        </div>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-800"
        >
          <h2 className="text-lg font-bold">Failed to load order</h2>
          <p className="text-xs mt-2 text-red-600">{error}</p>
          <Link
            to="/operator/orders"
            className="mt-4 inline-block px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-semibold hover:bg-stone-900"
          >
            Return to Queue
          </Link>
        </div>
      )}

      {!isLoading && !error && order && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          {/* Order Header */}
          <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-50/50">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-stone-900">
                  Order #{order.id.slice(-8)}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    STATUS_BADGE_CLASSES[order.status] ||
                    'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {order.status}
                </span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <p className="text-xs text-stone-500 mt-1 font-mono">
                Full ID: {order.id}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Fulfillment & Cancel Controls in Header */}
            <div className="flex flex-wrap items-center gap-2">
              {nextStep ? (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate(nextStep.nextStatus)}
                  className={`w-full sm:w-auto px-5 py-2.5 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm ${nextStep.buttonClass}`}
                >
                  {isUpdating ? nextStep.pendingLabel : nextStep.label}
                </button>
              ) : order.status === 'COMPLETED' ? (
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold">
                  Completed ✓
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm font-semibold">
                  Cancelled
                </span>
              )}

              {order.status === 'PENDING' && !confirmingCancel && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setConfirmingCancel(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-700 text-sm font-semibold transition"
                >
                  Cancel Order
                </button>
              )}

              {order.status === 'PENDING' && confirmingCancel && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                  >
                    {isUpdating ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setConfirmingCancel(false)}
                    className="px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
                  >
                    Keep Order
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="p-6 border-b border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-stone-500 font-medium">Customer Name</span>
              <p className="font-semibold text-stone-900 mt-0.5">
                {order.customer?.name || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium">Customer Email</span>
              <p className="font-semibold text-stone-900 mt-0.5">
                {order.customer?.email || 'N/A'}
              </p>
            </div>
            {order.pickupNote && (
              <div className="sm:col-span-2 bg-amber-50/60 p-3 rounded-lg border border-amber-100 min-w-0">
                <span className="text-xs text-amber-800 font-medium">Customer Pickup Note</span>
                <p className="text-xs italic text-stone-700 mt-0.5 min-w-0 break-words [overflow-wrap:anywhere]">
                  "{order.pickupNote}"
                </p>
              </div>
            )}
          </div>

          {/* Order Items Breakdown */}
          <div className="p-6">
            <h2 className="text-sm font-bold text-stone-900 mb-3">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500">
                    <th className="py-2.5">Item</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {order.items.map((item) => {
                    const unitPriceThb = (item.unitPriceAtOrder / 100).toFixed(2);
                    const subtotalThb = (
                      (item.unitPriceAtOrder * item.quantity) /
                      100
                    ).toFixed(2);
                    return (
                      <tr key={item.id}>
                        <td className="py-3">
                          <div className="font-medium text-stone-900">
                            {item.bakeryItem?.name || 'Bakery Item'}
                          </div>
                          {item.bakeryItem?.category && (
                            <div className="text-xs text-stone-500">
                              {item.bakeryItem.category}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono text-xs">
                          ฿{unitPriceThb}
                        </td>
                        <td className="py-3 text-center font-semibold">
                          × {item.quantity}
                        </td>
                        <td className="py-3 text-right font-mono font-medium">
                          ฿{subtotalThb}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-200">
                    <td colSpan={3} className="py-4 text-right font-bold text-stone-900 text-base">
                      Total Amount
                    </td>
                    <td className="py-4 text-right font-bold text-amber-900 text-lg font-mono">
                      ฿{(order.totalAmount / 100).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Operator Payment Controls */}
            <SimulatedPaymentCard
              mode="OPERATOR"
              order={order}
              onOrderUpdated={setOrder}
            />
          </div>
        </div>
      )}
    </div>
  );
};
