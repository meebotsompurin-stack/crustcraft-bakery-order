export const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'BAKING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'FAILED'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['BAKING'],
  BAKING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const STATUS_SORT_PRIORITY: Record<OrderStatus, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  BAKING: 2,
  READY_FOR_PICKUP: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === 'string' &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === 'string' &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

export function canTransitionOrderStatus(
  fromStatus: string,
  toStatus: OrderStatus
): boolean {
  if (!isValidOrderStatus(fromStatus)) {
    return false;
  }
  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getStatusSortPriority(status: string): number {
  if (isValidOrderStatus(status)) {
    return STATUS_SORT_PRIORITY[status];
  }
  return 99;
}
