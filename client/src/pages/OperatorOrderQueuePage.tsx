import React, { useEffect, useState } from 'react';
import {
  getOperatorOrdersApi,
  updateOperatorOrderStatusApi,
  type OrderResponse,
  type OrderStatus,
} from '../services/api';
import { OperatorOrderRow } from '../components/OperatorOrderRow';

const STATUS_PRIORITY: Record<OrderStatus, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  BAKING: 2,
  READY_FOR_PICKUP: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

function sortOperatorOrders(orders: OrderResponse[]): OrderResponse[] {
  return [...orders].sort((a, b) => {
    const pA = STATUS_PRIORITY[a.status] ?? 99;
    const pB = STATUS_PRIORITY[b.status] ?? 99;
    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export const OperatorOrderQueuePage: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOperatorOrdersApi();
      setOrders(data.orders);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load operator orders';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionError(null);
      setUpdatingId(orderId);
      const res = await updateOperatorOrderStatusApi(orderId, nextStatus);

      setOrders((prev) =>
        sortOperatorOrders(
          prev.map((order) => (order.id === orderId ? res.order : order))
        )
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update order status';
      setActionError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Incoming Order Queue
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Storewide incoming orders ({pendingCount} pending fulfillment)
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold"
        >
          ↻ Refresh Queue
        </button>
      </div>

      {/* Action error banner */}
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

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-xl border border-stone-200 p-6 animate-pulse flex flex-col gap-3"
            >
              <div className="h-4 bg-stone-200 rounded w-1/4"></div>
              <div className="h-3 bg-stone-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800"
        >
          <p className="font-semibold">Unable to load orders</p>
          <p className="text-xs mt-1 text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="text-4xl mb-2">📦</div>
          <h3 className="text-base font-semibold text-stone-800">
            No incoming orders in the queue right now.
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            New customer pre-orders will appear here automatically.
          </p>
        </div>
      )}

      {/* Orders list */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <OperatorOrderRow
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updatingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
