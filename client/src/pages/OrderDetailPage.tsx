import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  cancelCustomerOrderApi,
  getCustomerOrderByIdApi,
  type OrderDto,
  type OrderStatus,
} from '../services/api';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { SimulatedPaymentCard } from '../components/SimulatedPaymentCard';

const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'BAKING', label: 'Baking' },
  { status: 'READY_FOR_PICKUP', label: 'Ready' },
  { status: 'COMPLETED', label: 'Completed' },
];

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [confirmingCancel, setConfirmingCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

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

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setIsCancelling(true);
      setCancelError(null);
      const data = await cancelCustomerOrderApi(order.id);
      setOrder(data.order);
      setConfirmingCancel(false);
      setCancelSuccess(
        'Your pre-order has been cancelled and reserved bakery inventory has been restored.'
      );
    } catch (err: unknown) {
      setCancelError(
        err instanceof Error ? err.message : 'Failed to cancel order'
      );
    } finally {
      setIsCancelling(false);
    }
  };

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
      case 'BAKING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            Baking / กำลังอบ
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Ready for Pickup / พร้อมรับสินค้า
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Completed / เสร็จสมบูรณ์
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
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

  const currentStepIndex = order
    ? TIMELINE_STEPS.findIndex((step) => step.status === order.status)
    : -1;

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

      {cancelError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"
        >
          {cancelError}
        </div>
      )}

      {cancelSuccess && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"
        >
          {cancelSuccess}
        </div>
      )}

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

            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <span className="text-xs font-semibold text-stone-500">
                Current Status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(order.status)}
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>

          {/* Fulfillment Progress Timeline */}
          {order.status !== 'CANCELLED' && (
            <div className="px-6 pt-5 pb-2 border-b border-stone-100">
              <div className="grid grid-cols-5 gap-2">
                {TIMELINE_STEPS.map((step, index) => {
                  const isReached = currentStepIndex >= index;
                  return (
                    <div key={step.status} className="flex flex-col items-center text-center">
                      <div
                        className={`w-full h-1.5 rounded-full mb-1.5 ${
                          isReached ? 'bg-amber-600' : 'bg-stone-200'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          isReached ? 'text-amber-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 min-w-0">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Pickup Instructions
                </p>
                <p className="text-sm text-amber-800 mt-1 min-w-0 break-words [overflow-wrap:anywhere]">
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

            {/* Customer Simulated Payment Card */}
            <SimulatedPaymentCard
              mode="CUSTOMER"
              order={order}
              onOrderUpdated={setOrder}
            />

            {/* Customer Cancel Order Control (strictly when PENDING) */}
            {order.status === 'PENDING' && (
              <div className="mt-6 pt-5 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-stone-700">
                    Need to change plans?
                  </p>
                  <p className="text-xs text-stone-500">
                    Orders can be cancelled while still Pending Acceptance. Reserved stock is restored automatically.
                  </p>
                </div>

                {!confirmingCancel ? (
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => setConfirmingCancel(true)}
                    className="self-start sm:self-auto px-4 py-2 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-700 text-xs font-semibold transition"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={handleCancelOrder}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                    >
                      {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => setConfirmingCancel(false)}
                      className="px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
                    >
                      Keep Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
