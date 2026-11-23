import React, { useState } from 'react';
import {
  simulateCustomerPaymentApi,
  updateOperatorOrderPaymentApi,
  type OrderDto,
  type PaymentStatus,
  type SimulatePaymentOutcome,
} from '../services/api';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export interface SimulatedPaymentCardProps {
  mode: 'CUSTOMER' | 'OPERATOR';
  order: OrderDto;
  onOrderUpdated: (updatedOrder: OrderDto) => void;
}

export const SimulatedPaymentCard: React.FC<SimulatedPaymentCardProps> = ({
  mode,
  order,
  onOrderUpdated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const formattedTotal = `฿${(order.totalAmount / 100).toFixed(2)}`;
  const isCancelled = order.status === 'CANCELLED';
  const isPaid = order.paymentStatus === 'PAID';

  const handleCustomerPay = async (outcome: SimulatePaymentOutcome) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setFeedbackMsg(null);
      const res = await simulateCustomerPaymentApi(order.id, outcome);
      onOrderUpdated(res.order);
      setFeedbackMsg(
        outcome === 'SUCCESS'
          ? 'Simulated payment succeeded. Order marked as Paid.'
          : 'Simulated payment failed. You may retry payment at any time.'
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to process simulated payment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOperatorUpdate = async (paymentStatus: PaymentStatus) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setFeedbackMsg(null);
      const res = await updateOperatorOrderPaymentApi(order.id, paymentStatus);
      onOrderUpdated(res.order);
      setFeedbackMsg(`Payment status updated to ${paymentStatus}.`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to update payment status'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            {mode === 'CUSTOMER'
              ? 'Simulated Cashless Payment'
              : 'Payment Settlement Controls'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Amount due: <span className="font-semibold text-stone-800">{formattedTotal}</span>
          </p>
        </div>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
        >
          {errorMsg}
        </div>
      )}

      {feedbackMsg && (
        <div
          role="status"
          className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
        >
          {feedbackMsg}
        </div>
      )}

      {isCancelled ? (
        <p className="mt-3 text-xs text-stone-500">
          Payment actions are closed because this order has been cancelled.
        </p>
      ) : mode === 'CUSTOMER' ? (
        isPaid ? (
          <p className="mt-3 text-xs font-medium text-emerald-700">
            Payment confirmed. No further payment action is required.
          </p>
        ) : (
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleCustomerPay('SUCCESS')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm"
            >
              {isSubmitting ? 'Processing...' : 'Pay Now (Simulated)'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleCustomerPay('FAIL')}
              className="px-4 py-2 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-700 text-xs font-semibold transition"
            >
              Simulate Failed Payment
            </button>
          </div>
        )
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSubmitting || order.paymentStatus === 'PAID'}
            onClick={() => handleOperatorUpdate('PAID')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition"
          >
            Mark Paid
          </button>
          <button
            type="button"
            disabled={isSubmitting || order.paymentStatus === 'UNPAID'}
            onClick={() => handleOperatorUpdate('UNPAID')}
            className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 disabled:opacity-50 text-amber-800 text-xs font-semibold transition"
          >
            Mark Unpaid
          </button>
          <button
            type="button"
            disabled={isSubmitting || order.paymentStatus === 'FAILED'}
            onClick={() => handleOperatorUpdate('FAILED')}
            className="px-3.5 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-700 text-xs font-semibold transition"
          >
            Mark Failed
          </button>
        </div>
      )}
    </div>
  );
};
