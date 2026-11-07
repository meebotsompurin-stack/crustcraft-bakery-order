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

export type OrderStatus = 'PENDING' | 'ACCEPTED';

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