import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerOrdersApi, type OrderDto } from '../services/api';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getCustomerOrdersApi();
        if (isMounted) {
          setOrders(data.orders || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to load your orders'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Pending Acceptance / รอยืนยัน
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Accepted / รับออเดอร์แล้ว
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            Cancelled / ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            My Pre-Orders
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Track your artisan batch orders and pickup readiness.
          </p>
        </div>

        <Link
          to="/orders/new"
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-sm transition-colors"
        >
          + New Pre-Order
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading your orders...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <p className="text-base font-semibold text-stone-800">
            You have no active or past pre-orders
          </p>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Browse our fresh bakery catalog to place your first batch reservation.
          </p>
          <Link
            to="/catalog"
            className="inline-block px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedTotal = `฿${(order.totalAmount / 100).toFixed(2)}`;
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-mono text-xs font-bold text-stone-500">
                      #{order.id.slice(-8)}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-stone-500">Placed on {dateStr}</p>
                  <p className="text-sm text-stone-800 font-medium mt-2">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}:{' '}
                    <span className="text-stone-600 font-normal">
                      {order.items
                        .map(
                          (i) =>
                            `${i.quantity}× ${i.bakeryItem?.name || 'Bakery Item'}`
                        )
                        .join(', ')}
                    </span>
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 gap-2">
                  <span className="text-xl font-black text-amber-900">
                    {formattedTotal}
                  </span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
