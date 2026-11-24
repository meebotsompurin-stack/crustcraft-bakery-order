export type Role = 'CUSTOMER' | 'OPERATOR';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

const API_BASE = '/api';

async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorShape;

  if (!response.ok) {
    const message =
      data?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function registerUserApi(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: UserResponse }> {
  return requestJson<{ user: UserResponse }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginUserApi(input: {
  email: string;
  password: string;
}): Promise<{ user: UserResponse; token: string }> {
  return requestJson<{ user: UserResponse; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function logoutUserApi(): Promise<{ message: string }> {
  return requestJson<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getCurrentUserApi(): Promise<{ user: UserResponse }> {
  return requestJson<{ user: UserResponse }>('/auth/me', {
    method: 'GET',
  });
}

// -------------------------------------------------------------
// F-02 Catalog & F-03 Customer Pre-Order API Clients
// -------------------------------------------------------------

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'BAKING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED';

export type SimulatePaymentOutcome = 'SUCCESS' | 'FAIL';

export interface BakeryItemDto {
  id: string;
  name: string;
  description: string;
  price: number; // integer satang
  stockQuantity: number;
  isAvailable: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  id: string;
  orderId?: string;
  bakeryItemId: string;
  bakeryItem?: {
    id: string;
    name: string;
    category: string;
  };
  quantity: number;
  unitPriceAtOrder: number; // integer satang
}

export type OrderItemResponse = OrderItemDto;

export interface OrderDto {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number; // integer satang
  pickupNote: string | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

export type OrderResponse = OrderDto;

export interface CreateOrderPayload {
  items: Array<{
    bakeryItemId: string;
    quantity: number;
  }>;
  pickupNote?: string;
}

export async function getCatalogItemsApi(): Promise<{ items: BakeryItemDto[] }> {
  return requestJson<{ items: BakeryItemDto[] }>('/catalog', {
    method: 'GET',
  });
}

export async function getCatalogItemByIdApi(
  id: string
): Promise<{ item: BakeryItemDto }> {
  return requestJson<{ item: BakeryItemDto }>(`/catalog/${id}`, {
    method: 'GET',
  });
}

export async function createCustomerOrderApi(
  payload: CreateOrderPayload
): Promise<{ order: OrderDto }> {
  return requestJson<{ order: OrderDto }>('/customer/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCustomerOrdersApi(): Promise<{ orders: OrderDto[] }> {
  return requestJson<{ orders: OrderDto[] }>('/customer/orders', {
    method: 'GET',
  });
}

export async function getCustomerOrderByIdApi(
  id: string
): Promise<{ order: OrderDto }> {
  return requestJson<{ order: OrderDto }>(`/customer/orders/${id}`, {
    method: 'GET',
  });
}

// -------------------------------------------------------------
// F-04 Operator Order Queue & Acceptance API Clients
// -------------------------------------------------------------

export async function getOperatorOrdersApi(): Promise<{ orders: OrderResponse[] }> {
  return requestJson<{ orders: OrderResponse[] }>('/operator/orders', {
    method: 'GET',
  });
}

export async function getOperatorOrderByIdApi(
  orderId: string
): Promise<{ order: OrderResponse }> {
  return requestJson<{ order: OrderResponse }>(`/operator/orders/${orderId}`, {
    method: 'GET',
  });
}

export async function updateOperatorOrderStatusApi(
  orderId: string,
  status: OrderStatus
): Promise<{ order: OrderResponse }> {
  return requestJson<{ order: OrderResponse }>(
    `/operator/orders/${orderId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
}

// -------------------------------------------------------------
// F-06 Cancellation & F-07 Simulated Payment API Clients
// -------------------------------------------------------------

export async function cancelCustomerOrderApi(
  orderId: string
): Promise<{ order: OrderDto }> {
  return requestJson<{ order: OrderDto }>(`/customer/orders/${orderId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export async function simulateCustomerPaymentApi(
  orderId: string,
  simulateOutcome: SimulatePaymentOutcome = 'SUCCESS'
): Promise<{ order: OrderDto }> {
  return requestJson<{ order: OrderDto }>(`/customer/orders/${orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ simulateOutcome }),
  });
}

export async function updateOperatorOrderPaymentApi(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<{ order: OrderResponse }> {
  return requestJson<{ order: OrderResponse }>(
    `/operator/orders/${orderId}/payment`,
    {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    }
  );
}

// -------------------------------------------------------------
// F-05 Operator Catalog Administration API Clients
// -------------------------------------------------------------

export interface CreateBakeryItemPayload {
  name: string;
  description: string;
  price: number; // integer satang (> 0)
  stockQuantity: number; // integer (>= 0)
  category: string;
  isAvailable?: boolean;
}

export type UpdateBakeryItemPayload = Partial<CreateBakeryItemPayload>;

export async function getOperatorCatalogApi(): Promise<{
  items: BakeryItemDto[];
}> {
  return requestJson<{ items: BakeryItemDto[] }>('/operator/catalog', {
    method: 'GET',
  });
}

export async function createOperatorCatalogItemApi(
  payload: CreateBakeryItemPayload
): Promise<{ item: BakeryItemDto }> {
  return requestJson<{ item: BakeryItemDto }>('/operator/catalog', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOperatorCatalogItemApi(
  itemId: string,
  payload: UpdateBakeryItemPayload
): Promise<{ item: BakeryItemDto }> {
  return requestJson<{ item: BakeryItemDto }>(`/operator/catalog/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// -------------------------------------------------------------
// F-08 Operator Sales & Order Summary Reporting API Client
// -------------------------------------------------------------

export interface TopSellingItemDto {
  bakeryItemId: string;
  name: string;
  category: string;
  quantitySold: number;
  revenueSatang: number; // integer satang
}

export interface SalesSummaryDto {
  totalRevenueSatang: number; // integer satang (COMPLETED orders only)
  completedOrderCount: number;
  totalOrderCount: number;
  ordersByStatus: Record<OrderStatus, number>;
  paymentBreakdown: Record<PaymentStatus, number>;
  topSellingItems: TopSellingItemDto[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface SalesSummaryQueryParams {
  from?: string;
  to?: string;
}

export async function getOperatorSalesSummaryApi(
  params?: SalesSummaryQueryParams
): Promise<{ summary: SalesSummaryDto }> {
  const searchParams = new URLSearchParams();
  if (params?.from) {
    searchParams.set('from', params.from);
  }
  if (params?.to) {
    searchParams.set('to', params.to);
  }
  const queryString = searchParams.toString();
  const path = queryString
    ? `/operator/reports/summary?${queryString}`
    : '/operator/reports/summary';

  return requestJson<{ summary: SalesSummaryDto }>(path, {
    method: 'GET',
  });
}
