# Sprint 2 API Contract & Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part B (Sprint 2 API Contract)  
> **Sprint 2 Status:** 🟡 Planned (Pre-Implementation Contracts Baseline — `S2-ISSUE-01` / `#61`)

---

## 1. Global Conventions (Inherited from Sprint 1)
- **Authentication:** `httpOnly` cookie `token` (primary) or `Authorization: Bearer <token>` (fallback). Missing/invalid JWT → `401 UNAUTHORIZED`.
- **RBAC:** `requireRole(['OPERATOR'])` for `/api/operator/*`; `requireRole(['CUSTOMER'])` for `/api/customer/*`. Wrong role → `403 FORBIDDEN`.
- **Monetary Values:** Strictly **integer satang (`Int`, `100 satang = 1.00 THB`)**.
- **Error Envelope:** `{ "error": { "code": string, "message": string, "details"?: Array<{ field: string, issue: string }> } }`.

---

## 2. Updated TypeScript Contract Types

```typescript
export type Satang = number; // Non-negative integer satang

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'BAKING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED';

export type CreateBakeryItemBody = {
  name: string;
  description: string;
  price: Satang;          // Integer > 0
  stockQuantity: number;  // Integer >= 0
  category: string;
  isAvailable?: boolean;  // Defaults to true
};

export type UpdateBakeryItemBody = Partial<CreateBakeryItemBody>;

export type OrderResponseV2 = {
  id: string;
  customerId: string;
  customer?: { id: string; name: string; email: string };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: Satang;
  pickupNote: string | null;
  items: Array<{
    id: string;
    bakeryItemId: string;
    bakeryItem?: { id: string; name: string; category: string };
    quantity: number;
    unitPriceAtOrder: Satang;
  }>;
  createdAt: string;
  updatedAt: string;
};
```

---

## 3. F-05: Operator Catalog Administration (`/api/operator/catalog`)

### 3.1 `GET /api/operator/catalog`
Returns all `BakeryItem` records (both `isAvailable: true` and `isAvailable: false`), ordered by `category` ascending then `name` ascending.
- **Auth Required:** Yes (`OPERATOR`)
- **Success Response (`200 OK`):**
  ```json
  {
    "items": [
      {
        "id": "clx...",
        "name": "Artisan Butter Croissant",
        "description": "Flaky laminated French butter croissant",
        "price": 8500,
        "stockQuantity": 50,
        "isAvailable": true,
        "category": "Pastry",
        "createdAt": "2026-11-23T06:00:00.000Z",
        "updatedAt": "2026-11-23T06:00:00.000Z"
      }
    ]
  }
  ```
- **Errors:** `401 UNAUTHORIZED`, `403 FORBIDDEN`.

### 3.2 `POST /api/operator/catalog`
Creates a new bakery item in the catalog.
- **Auth Required:** Yes (`OPERATOR`)
- **Request Body:**
  ```json
  {
    "name": "Cardamom Morning Bun",
    "description": "Swirled brioche dough with freshly ground green cardamom",
    "price": 9500,
    "stockQuantity": 25,
    "category": "Sweet Bread",
    "isAvailable": true
  }
  ```
- **Validation Rules:**
  - `name`: non-empty trimmed string (max 120 chars), must be unique.
  - `description`: non-empty trimmed string (max 500 chars).
  - `price`: integer `> 0` (satang).
  - `stockQuantity`: integer `>= 0`.
  - `category`: non-empty trimmed string (max 60 chars).
  - `isAvailable`: optional boolean (defaults to `true`).
- **Success Response (`201 Created`):** `{ "item": { ...BakeryItemResponse } }`
- **Errors:**
  - `400 VALIDATION_ERROR`: invalid/missing fields, non-integer or non-positive price, negative stock.
  - `401 UNAUTHORIZED`, `403 FORBIDDEN`.
  - `409 CONFLICT`: item with the same `name` already exists.

### 3.3 `PATCH /api/operator/catalog/:id`
Partially updates an existing bakery item (pricing, description, category, batch restock `stockQuantity`, or `isAvailable` toggle). Does NOT modify historical `OrderItem.unitPriceAtOrder` (`BR-02`).
- **Auth Required:** Yes (`OPERATOR`)
- **Request Body (at least one field required):**
  ```json
  {
    "price": 10000,
    "stockQuantity": 40,
    "isAvailable": true
  }
  ```
- **Success Response (`200 OK`):** `{ "item": { ...BakeryItemResponse } }`
- **Errors:**
  - `400 VALIDATION_ERROR`: empty body, invalid price/stock/type.
  - `401 UNAUTHORIZED`, `403 FORBIDDEN`.
  - `404 NOT_FOUND`: item ID does not exist.
  - `409 CONFLICT`: updated `name` conflicts with another item's unique `name`.

---

## 4. F-06: Order Fulfillment & Cancellation Lifecycle

### 4.1 `PATCH /api/operator/orders/:id/status` *(Extended from Sprint 1)*
Transitions an order to the next allowed lifecycle state or cancels a `PENDING` order with atomic stock restoration.
- **Auth Required:** Yes (`OPERATOR`)
- **Allowed Transitions (`ALLOWED_TRANSITIONS`):**
  - `PENDING` → `ACCEPTED` | `CANCELLED` *(restores stock atomically)*
  - `ACCEPTED` → `BAKING`
  - `BAKING` → `READY_FOR_PICKUP`
  - `READY_FOR_PICKUP` → `COMPLETED`
  - `COMPLETED` → *(terminal — none)*
  - `CANCELLED` → *(terminal — none)*
- **Request Body:**
  ```json
  { "status": "BAKING" }
  ```
- **Success Response (`200 OK`):** `{ "order": { ...OrderResponseV2 } }`
- **Errors:**
  - `400 VALIDATION_ERROR`: unknown status string.
  - `401 UNAUTHORIZED`, `403 FORBIDDEN`.
  - `404 NOT_FOUND`: order ID does not exist.
  - `409 CONFLICT`: transition violates `ALLOWED_TRANSITIONS` or concurrent update conflict.

### 4.2 `PATCH /api/customer/orders/:id/cancel` *(New)*
Cancels an authenticated customer's own `PENDING` order and atomically restores every line item's `quantity` back to `BakeryItem.stockQuantity` inside `prisma.$transaction`.
- **Auth Required:** Yes (`CUSTOMER` — owner only per `BR-04`)
- **Request Body:** `{}` *(empty or omitted)*
- **Success Response (`200 OK`):** `{ "order": { ...OrderResponseV2, "status": "CANCELLED" } }`
- **Errors:**
  - `401 UNAUTHORIZED`
  - `403 FORBIDDEN`: authenticated user is `OPERATOR` or `order.customerId !== req.user.userId` (`BR-04`).
  - `404 NOT_FOUND`: order ID does not exist.
  - `409 CONFLICT`: order status is not `PENDING` (already accepted/baking/completed/cancelled).

---

## 5. F-07: Simulated Cashless Payment Transitions

### 5.1 `POST /api/customer/orders/:id/pay` *(New)*
Simulates a cashless payment attempt for the customer's own order (no external payment gateway).
- **Auth Required:** Yes (`CUSTOMER` — owner only per `BR-04`)
- **Request Body (optional):**
  ```json
  { "simulateOutcome": "SUCCESS" }
  ```
  - `simulateOutcome`: optional `"SUCCESS"` (default) | `"FAIL"`. Any other value → `400 VALIDATION_ERROR`.
- **State Rules:**
  - Allowed when `order.status !== "CANCELLED"` AND `order.paymentStatus` is `"UNPAID"` or `"FAILED"`.
  - `"SUCCESS"` transitions `paymentStatus` → `"PAID"`.
  - `"FAIL"` transitions `paymentStatus` → `"FAILED"`.
- **Success Response (`200 OK`):** `{ "order": { ...OrderResponseV2 } }`
- **Errors:**
  - `400 VALIDATION_ERROR`: invalid `simulateOutcome` value.
  - `401 UNAUTHORIZED`
  - `403 FORBIDDEN`: non-customer or `order.customerId !== req.user.userId`.
  - `404 NOT_FOUND`: order ID does not exist.
  - `409 CONFLICT`: order is `CANCELLED` or `paymentStatus` is already `"PAID"`.

### 5.2 `PATCH /api/operator/orders/:id/payment` *(New)*
Allows an operator to record or adjust payment status (e.g., cash/QR counter settlement or payment audit).
- **Auth Required:** Yes (`OPERATOR`)
- **Request Body:**
  ```json
  { "paymentStatus": "PAID" }
  ```
  - `paymentStatus`: required `"UNPAID"` | `"PAID"` | `"FAILED"`.
- **Success Response (`200 OK`):** `{ "order": { ...OrderResponseV2 } }`
- **Errors:**
  - `400 VALIDATION_ERROR`: missing or unsupported `paymentStatus`.
  - `401 UNAUTHORIZED`, `403 FORBIDDEN`.
  - `404 NOT_FOUND`: order ID does not exist.
  - `409 CONFLICT`: order is `CANCELLED` (cannot mark a cancelled order as paid).
