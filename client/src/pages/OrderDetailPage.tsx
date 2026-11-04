import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCustomerOrderByIdApi, type OrderDto } from '../services/api';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDetail() {
      if (!id) return;
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getCustomerOrderByIdApi(id);
        if (isMounted) {
          setOrder(data.order);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to load order details'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrderDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Pending Acceptance / รอยืนยัน
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Accepted / รับออเดอร์แล้ว
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-300">
            Cancelled / ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 mb-2"
        >
          &larr; Back to My Pre-Orders
        </button>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Pre-Order Details
        </h1>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading order details...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold">{errorMessage}</p>
          <Link
            to="/orders"
            className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold"
          >
            Back to Orders
          </Link>
        </div>
      ) : !order ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <p className="text-base font-semibold">Order not found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          {/* Header Bar */}
          <div className="p-6 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Order Identifier
              </p>
              <p className="text-lg font-mono font-bold text-stone-900">
                #{order.id}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-stone-500">
                Current Status
              </span>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Line Items Breakdown */}
          <div className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4">
              Items Ordered
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items.map((line) => {
                const unitFormatted = `฿${(line.unitPriceAtOrder / 100).toFixed(2)}`;
                const lineTotalFormatted = `฿${(
                  (line.unitPriceAtOrder * line.quantity) /
                  100
                ).toFixed(2)}`;

                return (
                  <div
                    key={line.id}
                    className="py-3.5 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-bold text-stone-900">
                        {line.bakeryItem?.name || 'Bakery Item'}
                      </p>
                      <p className="text-xs text-stone-500">
                        Unit Price:{' '}
                        <span className="font-semibold">{unitFormatted}</span> ×{' '}
                        {line.quantity}
                      </p>
                    </div>

                    <span className="text-base font-bold text-stone-900">
                      {lineTotalFormatted}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Special Instructions */}
            {order.pickupNote && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/60">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Pickup Instructions
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  {order.pickupNote}
                </p>
              </div>
            )}

            {/* Total Amount (Server-calculated in satang) */}
            <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Total Amount (รวมทั้งสิ้น)
                </p>
                <p className="text-xs text-stone-400">
                  Calculated server-side in integer satangs
                </p>
              </div>

              <span className="text-3xl font-black text-amber-900">
                ฿{(order.totalAmount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
