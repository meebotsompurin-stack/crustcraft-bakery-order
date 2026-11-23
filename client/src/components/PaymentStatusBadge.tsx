import React from 'react';
import type { PaymentStatus } from '../services/api';

export interface PaymentStatusBadgeProps {
  status: PaymentStatus | string | undefined;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
}) => {
  switch (status) {
    case 'PAID':
      return (
        <span
          data-payment-status="PAID"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
        >
          Paid
        </span>
      );
    case 'FAILED':
      return (
        <span
          data-payment-status="FAILED"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300"
        >
          Payment Failed
        </span>
      );
    case 'UNPAID':
    default:
      return (
        <span
          data-payment-status="UNPAID"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
        >
          Unpaid
        </span>
      );
  }
};
