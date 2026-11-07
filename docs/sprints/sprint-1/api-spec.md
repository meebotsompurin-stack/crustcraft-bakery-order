# Sprint 1 API Contract & Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 1 — Part E (API Contract Specification)  
> **Sprint 1 Status:** 🟡 In Progress (Engineering Contracts Baseline — Pre-Implementation)  
> **Base URL (Local Development):** `http://localhost:3001` (proxied via Vite `/api` in development)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Global Authentication & Security

- **Frontend Auth Channel:** The React browser client (`client/src/services/api.ts`) authenticates exclusively via an **`httpOnly` cookie named `token`**, transmitted automatically on every request using `fetch(..., { credentials: 'include' })`. The cookie is configured with `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, and `maxAge: 86400000` (`86400` seconds = 24 hours).
- **Backend Credential Resolution:** The `authenticate` middleware (`server/src/middleware/authenticate.middleware.ts`) extracts the JWT from `req.cookies.token` **first**, and falls back to the `Authorization: Bearer <token>` HTTP header (supporting Supertest / automated API test clients). If neither channel provides a valid, non-expired JWT signed with `JWT_SECRET`, the server immediately responds with `401 UNAUTHORIZED`.
- **Authenticated Request Context:** Upon successful verification, `authenticate` attaches `req.user = { userId: string, role: 'CUSTOMER' | 'OPERATOR' }` to the Express `Request` object.
- **Role-Based Access Control (RBAC):** Protected route namespaces enforce role authorization via the `requireRole(allowedRoles: Array<'CUSTOMER' | 'OPERATOR'>)` middleware factory. If `req.user.role` is not in `allowedRoles`, the server responds with `403 FORBIDDEN`.
- **Token Expiration & Logout Revocation:** JWT tokens are signed with a **24-hour expiration (`expiresIn: '24h'`)**. Calling `POST /api/auth/logout` revokes the browser session by clearing the `httpOnly` cookie via `res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' })` (`Max-Age=0`) and resetting client `AuthContext` state.
- **Monetary Contract (`Int` Satang):** Every monetary field across all API request and response payloads (`price`, `unitPriceAtOrder`, `totalAmount`) is represented as a **non-negative integer in satang (`Int`, where `100 satang = 1.00 THB`, e.g., `8500` = `85.00 THB`)**. Floating-point currency values are strictly prohibited.
- **Standard Error Envelope:** Every non-2xx HTTP response returns a uniform JSON error envelope:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable summary of the error",
      "details": [
        { "field": "quantity", "issue": "Quantity must be an integer greater than 0" }
      ]
    }
  }
  ```
  > `details` is optional and included whenever field-level validation errors or specific conflict details are available.

---

## 2. Standard Error Codes

| HTTP Status | `error.code` String | Meaning & Trigger Conditions |
|:---:|---|---|
| `400` | `VALIDATION_ERROR` | Malformed request body, missing required fields, invalid email format, password `< 8` chars, `quantity <= 0`, empty `items` array, or unsupported order status value in request payload. |
| `401` | `UNAUTHORIZED` | Missing authentication credentials (no `req.cookies.token` and no `Authorization: Bearer <token>`), malformed/invalid JWT signature, expired JWT (`> 24h`), or invalid login email/password. |
| `403` | `FORBIDDEN` | Authenticated user lacks required role (`CUSTOMER` calling `/api/operator/*` or `OPERATOR` calling `/api/customer/*`), or `CUSTOMER` attempting to access an order where `order.customerId !== req.user.userId` (`BR-04`). |
| `404` | `NOT_FOUND` | Requested `BakeryItem` ID or `Order` ID does not exist in the database. |
| `409` | `CONFLICT` | Business rule conflict: duplicate email during registration (`FR-01-06`), ordering an item with `isAvailable == false` (`BR-05`), ordering with `stockQuantity == 0` or `quantity > stockQuantity` (`BR-03`, `BR-05`), or invalid order state transition such as `ACCEPTED` → `ACCEPTED` or `ACCEPTED` → `PENDING` (`BR-07`). |
| `500` | `INTERNAL_ERROR` | Unexpected unhandled server or database exception (stack traces are never leaked to the client). |

---

## 3. Shared TypeScript Contract Types

```typescript
// Monetary values MUST be integer satang (100 satang = 1.00 THB, e.g., 8500 = 85.00 THB)
export type Satang = number;

export type Role = 'CUSTOMER' | 'OPERATOR';

// Sprint 1 valid order statuses
export type OrderStatus = 'PENDING' | 'ACCEPTED';

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type BakeryItemResponse = {
  id: string;
  name: string;
  description: string;
  price: Satang;          // Integer satang (Int)
  stockQuantity: number;  // Physical batch inventory remaining (Int >= 0)
  isAvailable: boolean;   // Manual operator catalog listing flag (BR-05)
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderBody = {
  items: Array<{
    bakeryItemId: string;
    quantity: number;     // Positive integer (> 0)
  }>;
  pickupNote?: string;
};

export type OrderItemResponse = {
  id: string;
  bakeryItemId: string;
  bakeryItem?: {
    id: string;
    name: string;
    category: string;
  };
  quantity: number;
  unitPriceAtOrder: Satang; // Snapshot of BakeryItem.price in integer satang (BR-02)
};

export type OrderResponse = {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  status: OrderStatus;
  totalAmount: Satang;      // Server-calculated total in integer satang (BR-01)
  pickupNote: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
};
```

---

## 4. Authentication Endpoints (`/api/auth`)

### 4.1 `POST /api/auth/register`
Registers a new user account, hashes the password using `bcrypt` (10 salt rounds), and returns the created user profile (excluding `passwordHash`).

* **Auth Required:** No (Public)
* **Request Body:**
  ```json
  {
    "name": "SomsakJaidee",
    "email": "somsak@test.com",
    "password": "password123",
    "role": "CUSTOMER"
  }
  ```
  *Validation Rules:*
  * `name`: non-empty string (`trim()`).
  * `email`: valid email format, normalized to lowercase.
  * `password`: string with length `>= 8`.
  * `role`: optional; `'CUSTOMER'` (default) or `'OPERATOR'`.
* **Success Response (`201 Created`):**
  ```json
  {
    "user": {
      "id": "clx1user0001",
      "name": "SomsakJaidee",
      "email": "somsak@test.com",
      "role": "CUSTOMER",
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `400 VALIDATION_ERROR`: Missing `name`, invalid `email`, `password` shorter than 8 characters, or invalid `role`.
  * `409 CONFLICT`: Email address is already registered (`"Email already in use"`).

---

### 4.2 `POST /api/auth/login`
Authenticates a user with `email` and `password`, issues a signed JWT (`expiresIn: '24h'`), sets the `httpOnly` cookie `token`, and returns `{ user, token }`.

* **Auth Required:** No (Public)
* **Request Body:**
  ```json
  {
    "email": "customer1@test.com",
    "password": "customer123"
  }
  ```
* **Success Response (`200 OK`):**
  * **Response Header:**
    `Set-Cookie: token=<jwt_string>; Max-Age=86400; Path=/; HttpOnly; SameSite=Lax`
  * **Response Body:**
    ```json
    {
      "user": {
        "id": "clx1cust0001",
        "name": "Customer One",
        "email": "customer1@test.com",
        "role": "CUSTOMER",
        "createdAt": "2026-11-01T08:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
* **Error Responses:**
  * `400 VALIDATION_ERROR`: Missing `email` or `password`.
  * `401 UNAUTHORIZED`: Email does not exist (`AUTH-05`) or password does not match `bcrypt` hash (`AUTH-04`).

---

### 4.3 `POST /api/auth/logout`
Revokes the client's browser session by clearing the `httpOnly` cookie `token` via `res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' })`.

* **Auth Required:** No / Any Session (idempotent cookie clearance)
* **Request Body:** None (`{}`)
* **Success Response (`200 OK`):**
  * **Response Header:**
    `Set-Cookie: token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
  * **Response Body:**
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

---

## 5. Catalog Endpoints (`/api/catalog`)

### 5.1 `GET /api/catalog`
Returns all bakery items where `isAvailable == true`. Per `BR-05`, items whose `stockQuantity` has reached `0` remain `isAvailable: true` and ARE included in this response so the UI can display them as `"Out of Stock"`. Items with `isAvailable == false` are excluded.

* **Auth Required:** Yes (`CUSTOMER` | `OPERATOR`)
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "items": [
      {
        "id": "clx1item0001",
        "name": "Artisan Butter Croissant",
        "description": "Flaky French-style laminated pastry made with cultured Normandy butter.",
        "price": 8500,
        "stockQuantity": 50,
        "isAvailable": true,
        "category": "Pastry",
        "createdAt": "2026-11-01T08:00:00.000Z",
        "updatedAt": "2026-11-01T08:00:00.000Z"
      },
      {
        "id": "clx1item0002",
        "name": "Classic Sourdough Loaf",
        "description": "36-hour naturally leavened country bread with crisp caramelized crust.",
        "price": 22000,
        "stockQuantity": 0,
        "isAvailable": true,
        "category": "Bread",
        "createdAt": "2026-11-01T08:00:00.000Z",
        "updatedAt": "2026-11-01T09:30:00.000Z"
      }
    ]
  }
  ```
* **Error Responses:**
  * `401 UNAUTHORIZED`: Missing, invalid, or expired JWT in both cookie and Authorization header.

---

### 5.2 `GET /api/catalog/:id`
Returns the full detail of a single `BakeryItem` by its `id`.

* **Auth Required:** Yes (`CUSTOMER` | `OPERATOR`)
* **URL Parameters:**
  * `id` (`string`, required): The unique identifier of the `BakeryItem`.
* **Success Response (`200 OK`):**
  ```json
  {
    "item": {
      "id": "clx1item0001",
      "name": "Artisan Butter Croissant",
      "description": "Flaky French-style laminated pastry made with cultured Normandy butter.",
      "price": 8500,
      "stockQuantity": 50,
      "isAvailable": true,
      "category": "Pastry",
      "createdAt": "2026-11-01T08:00:00.000Z",
      "updatedAt": "2026-11-01T08:00:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `401 UNAUTHORIZED`: Missing, invalid, or expired JWT.
  * `404 NOT_FOUND`: No `BakeryItem` exists with the specified `:id` (`CAT-05`).

---

## 6. Customer Pre-Order Endpoints (`/api/customer`)

### 6.1 `POST /api/customer/orders`
Creates a new customer pre-order. Enforces strict domain validation and transactional atomicity:
1. **Input Validation (`400`):** Verifies `items` is a non-empty array and every entry has a valid `bakeryItemId` and integer `quantity > 0`.
2. **Existence Check (`404`):** Verifies all referenced `bakeryItemId` records exist in `BakeryItem`.
3. **Availability & Stock Guard (`409`, `BR-05`):** Verifies every item has `isAvailable === true` and `stockQuantity >= quantity` (rejecting if `stockQuantity === 0` or `quantity > stockQuantity`).
4. **Server-Side Satang Calculation (`BR-01`, `BR-02`):** Ignores any price fields sent by the client; snapshots `unitPriceAtOrder = bakeryItem.price` (`Int` satang) for each item and computes `totalAmount = sum(bakeryItem.price * quantity)` (`Int` satang).
5. **Atomic Transaction (`BR-03`):** Executes stock decrements (`stockQuantity - quantity`) and order creation inside a single `prisma.$transaction`. Note: If `stockQuantity` becomes `0`, `isAvailable` remains `true` (`BR-05`).

* **Auth Required:** Yes (`requireRole(['CUSTOMER'])`)
* **Request Body:**
  ```json
  {
    "items": [
      { "bakeryItemId": "clx1item0001", "quantity": 2 },
      { "bakeryItemId": "clx1item0004", "quantity": 1 }
    ],
    "pickupNote": "Please pack separately for morning pickup at 09:00."
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "order": {
      "id": "clx1ord0001",
      "customerId": "clx1cust0001",
      "status": "PENDING",
      "totalAmount": 26000,
      "pickupNote": "Please pack separately for morning pickup at 09:00.",
      "items": [
        {
          "id": "clx1oi0001",
          "bakeryItemId": "clx1item0001",
          "bakeryItem": {
            "id": "clx1item0001",
            "name": "Artisan Butter Croissant",
            "category": "Pastry"
          },
          "quantity": 2,
          "unitPriceAtOrder": 8500
        },
        {
          "id": "clx1oi0002",
          "bakeryItemId": "clx1item0004",
          "bakeryItem": {
            "id": "clx1item0004",
            "name": "Pain au Chocolat",
            "category": "Pastry"
          },
          "quantity": 1,
          "unitPriceAtOrder": 9000
        }
      ],
      "createdAt": "2026-11-01T10:15:00.000Z",
      "updatedAt": "2026-11-01T10:15:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `400 VALIDATION_ERROR`: Empty `items` array, missing `bakeryItemId`, or `quantity <= 0` (`ORD-06`).
  * `401 UNAUTHORIZED`: Unauthenticated request.
  * `403 FORBIDDEN`: Authenticated user is an `OPERATOR` (only `CUSTOMER` can place pre-orders).
  * `404 NOT_FOUND`: One or more `bakeryItemId` values do not exist.
  * `409 CONFLICT`: Item has `isAvailable == false` (`ORD-07`), or item has `stockQuantity == 0` / `quantity > stockQuantity` (`ORD-05`, `ORD-08`). Entire transaction rolls back with zero stock deducted.

---

### 6.2 `GET /api/customer/orders`
Returns all orders belonging exclusively to the currently authenticated `CUSTOMER` (`order.customerId === req.user.userId`), ordered by `createdAt` descending (newest first).

* **Auth Required:** Yes (`requireRole(['CUSTOMER'])`)
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "orders": [
      {
        "id": "clx1ord0001",
        "customerId": "clx1cust0001",
        "status": "PENDING",
        "totalAmount": 26000,
        "pickupNote": "Please pack separately for morning pickup at 09:00.",
        "items": [
          {
            "id": "clx1oi0001",
            "bakeryItemId": "clx1item0001",
            "bakeryItem": {
              "id": "clx1item0001",
              "name": "Artisan Butter Croissant",
              "category": "Pastry"
            },
            "quantity": 2,
            "unitPriceAtOrder": 8500
          },
          {
            "id": "clx1oi0002",
            "bakeryItemId": "clx1item0004",
            "bakeryItem": {
              "id": "clx1item0004",
              "name": "Pain au Chocolat",
              "category": "Pastry"
            },
            "quantity": 1,
            "unitPriceAtOrder": 9000
          }
        ],
        "createdAt": "2026-11-01T10:15:00.000Z",
        "updatedAt": "2026-11-01T10:15:00.000Z"
      }
    ]
  }
  ```
* **Error Responses:**
  * `401 UNAUTHORIZED`: Missing or invalid JWT.
  * `403 FORBIDDEN`: Authenticated user does not have role `CUSTOMER`.

---

### 6.3 `GET /api/customer/orders/:id`
Returns the full order breakdown for a single order owned by the authenticated `CUSTOMER`. Enforces strict ownership isolation (`BR-04`).

* **Auth Required:** Yes (`requireRole(['CUSTOMER'])`)
* **URL Parameters:**
  * `id` (`string`, required): The unique identifier of the `Order`.
* **Success Response (`200 OK`):**
  ```json
  {
    "order": {
      "id": "clx1ord0001",
      "customerId": "clx1cust0001",
      "status": "PENDING",
      "totalAmount": 26000,
      "pickupNote": "Please pack separately for morning pickup at 09:00.",
      "items": [
        {
          "id": "clx1oi0001",
          "bakeryItemId": "clx1item0001",
          "bakeryItem": {
            "id": "clx1item0001",
            "name": "Artisan Butter Croissant",
            "category": "Pastry"
          },
          "quantity": 2,
          "unitPriceAtOrder": 8500
        },
        {
          "id": "clx1oi0002",
          "bakeryItemId": "clx1item0004",
          "bakeryItem": {
            "id": "clx1item0004",
            "name": "Pain au Chocolat",
            "category": "Pastry"
          },
          "quantity": 1,
          "unitPriceAtOrder": 9000
        }
      ],
      "createdAt": "2026-11-01T10:15:00.000Z",
      "updatedAt": "2026-11-01T10:15:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `401 UNAUTHORIZED`: Missing or invalid JWT.
  * `403 FORBIDDEN`: Authenticated user is not a `CUSTOMER`, **OR** `order.customerId !== req.user.userId` (cross-customer ownership violation, `BR-04`, `ORD-11`).
  * `404 NOT_FOUND`: Order `:id` does not exist.

---

## 7. Operator Queue & Fulfillment Endpoints (`/api/operator`)

### 7.1 `GET /api/operator/orders`
Returns all incoming customer orders across the store (`BR-06` Shared Global Operator Queue). Orders are sorted with `PENDING` status first, and then by `createdAt` descending (newest first).

* **Auth Required:** Yes (`requireRole(['OPERATOR'])`)
* **Request Body:** None
* **Success Response (`200 OK`):**
  ```json
  {
    "orders": [
      {
        "id": "clx1ord0001",
        "customerId": "clx1cust0001",
        "customer": {
          "id": "clx1cust0001",
          "name": "Customer One",
          "email": "customer1@test.com"
        },
        "status": "PENDING",
        "totalAmount": 26000,
        "pickupNote": "Please pack separately for morning pickup at 09:00.",
        "items": [
          {
            "id": "clx1oi0001",
            "bakeryItemId": "clx1item0001",
            "bakeryItem": {
              "id": "clx1item0001",
              "name": "Artisan Butter Croissant",
              "category": "Pastry"
            },
            "quantity": 2,
            "unitPriceAtOrder": 8500
          },
          {
            "id": "clx1oi0002",
            "bakeryItemId": "clx1item0004",
            "bakeryItem": {
              "id": "clx1item0004",
              "name": "Pain au Chocolat",
              "category": "Pastry"
            },
            "quantity": 1,
            "unitPriceAtOrder": 9000
          }
        ],
        "createdAt": "2026-11-01T10:15:00.000Z",
        "updatedAt": "2026-11-01T10:15:00.000Z"
      }
    ]
  }
  ```
* **Error Responses:**
  * `401 UNAUTHORIZED`: Missing or invalid JWT.
  * `403 FORBIDDEN`: Authenticated user is a `CUSTOMER` (`AUTH-09`, `OPS-01`).

---

### 7.2 `GET /api/operator/orders/:id`
Returns the full order breakdown (including customer identity and line item snapshots) for any order ID in the store (`BR-06`).

* **Auth Required:** Yes (`requireRole(['OPERATOR'])`)
* **URL Parameters:**
  * `id` (`string`, required): The unique identifier of the `Order`.
* **Success Response (`200 OK`):**
  ```json
  {
    "order": {
      "id": "clx1ord0001",
      "customerId": "clx1cust0001",
      "customer": {
        "id": "clx1cust0001",
        "name": "Customer One",
        "email": "customer1@test.com"
      },
      "status": "PENDING",
      "totalAmount": 26000,
      "pickupNote": "Please pack separately for morning pickup at 09:00.",
      "items": [
        {
          "id": "clx1oi0001",
          "bakeryItemId": "clx1item0001",
          "bakeryItem": {
            "id": "clx1item0001",
            "name": "Artisan Butter Croissant",
            "category": "Pastry"
          },
          "quantity": 2,
          "unitPriceAtOrder": 8500
        },
        {
          "id": "clx1oi0002",
          "bakeryItemId": "clx1item0004",
          "bakeryItem": {
            "id": "clx1item0004",
            "name": "Pain au Chocolat",
            "category": "Pastry"
          },
          "quantity": 1,
          "unitPriceAtOrder": 9000
        }
      ],
      "createdAt": "2026-11-01T10:15:00.000Z",
      "updatedAt": "2026-11-01T10:15:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `401 UNAUTHORIZED`: Missing or invalid JWT.
  * `403 FORBIDDEN`: Authenticated user is not an `OPERATOR`.
  * `404 NOT_FOUND`: Order `:id` does not exist (`OPS-04`).

---

### 7.3 `PATCH /api/operator/orders/:id/status`
Transitions an order's status according to the Sprint 1 state machine (`ALLOWED_TRANSITIONS = { PENDING: ['ACCEPTED'], ACCEPTED: [] }`).

* **Auth Required:** Yes (`requireRole(['OPERATOR'])`)
* **URL Parameters:**
  * `id` (`string`, required): The unique identifier of the `Order`.
* **Request Body:**
  ```json
  {
    "status": "ACCEPTED"
  }
  ```
  *Validation vs. Conflict Rules:*
  * If `status` is missing or is not a valid target status string (`'ACCEPTED'` in Sprint 1, or `'PENDING'` when attempting a backward transition), validate as follows:
    * Unknown/invalid status value outside valid `OrderStatus` values (e.g., `"INVALID_STATUS"`, `""`, `123`) → `400 VALIDATION_ERROR` (`OPS-08`).
    * Valid `OrderStatus` enum value that violates `ALLOWED_TRANSITIONS[order.status]` (e.g., transitioning an already `ACCEPTED` order to `ACCEPTED` or back to `PENDING`) → `409 CONFLICT` (`OPS-06`).
* **Success Response (`200 OK`):**
  ```json
  {
    "order": {
      "id": "clx1ord0001",
      "customerId": "clx1cust0001",
      "customer": {
        "id": "clx1cust0001",
        "name": "Customer One",
        "email": "customer1@test.com"
      },
      "status": "ACCEPTED",
      "totalAmount": 26000,
      "pickupNote": "Please pack separately for morning pickup at 09:00.",
      "items": [
        {
          "id": "clx1oi0001",
          "bakeryItemId": "clx1item0001",
          "bakeryItem": {
            "id": "clx1item0001",
            "name": "Artisan Butter Croissant",
            "category": "Pastry"
          },
          "quantity": 2,
          "unitPriceAtOrder": 8500
        },
        {
          "id": "clx1oi0002",
          "bakeryItemId": "clx1item0004",
          "bakeryItem": {
            "id": "clx1item0004",
            "name": "Pain au Chocolat",
            "category": "Pastry"
          },
          "quantity": 1,
          "unitPriceAtOrder": 9000
        }
      ],
      "createdAt": "2026-11-01T10:15:00.000Z",
      "updatedAt": "2026-11-01T10:20:00.000Z"
    }
  }
  ```
* **Error Responses:**
  * `400 VALIDATION_ERROR`: `status` field is missing or not a recognized status value (`OPS-08`).
  * `401 UNAUTHORIZED`: Missing or invalid JWT.
  * `403 FORBIDDEN`: Authenticated user is a `CUSTOMER` (`OPS-07`).
  * `404 NOT_FOUND`: Order `:id` does not exist.
  * `409 CONFLICT`: Order is not in `PENDING` state or transition is disallowed by `ALLOWED_TRANSITIONS` (`OPS-06`).
