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

export type OrderStatus = 'PENDING' | 'ACCEPTED';

export interface OrderItemResponse {
  id: string;
  orderId?: string;
  bakeryItemId: string;
  bakeryItem?: {
    id: string;
    name: string;
    category?: string;
  };
  quantity: number;
  unitPriceAtOrder: number; // satang
}

export interface OrderResponse {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  status: OrderStatus;
  totalAmount: number; // satang
  pickupNote?: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

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
