# Sprint 1 Feature Engineering Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 1 — Part E (Feature-Level Software Design Specification)  
> **Sprint 1 Status:** 🟡 In Progress (Engineering Contracts Baseline — Pre-Implementation)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Sprint Goal

Sprint 1 delivers the foundational end-to-end vertical slice of the **CrustCraft Artisan Bakery Pre-Order & Fulfillment System**. By the end of this sprint, customers can register, authenticate securely via `httpOnly` JWT sessions, browse the active artisan bakery catalog with real-time batch stock indicators and Thai Baht (`THB`) pricing, submit multi-item pre-orders backed by authoritative server-side integer satang (`Int`) calculations and atomic stock deductions, and track their personal order history. Simultaneously, bakery operators can monitor the shared storewide incoming order queue, inspect full customer order breakdowns, and transition pending pre-orders from `PENDING` to `ACCEPTED`.

---

## 2. Stakeholder Request Interpretation

Artisan bakeries operate under strict daily batch limits due to multi-hour dough fermentation and oven constraints. To prevent overselling, client-side price manipulation, and chaotic counter fulfillment, CrustCraft establishes a strict contract-first engineering baseline for Sprint 1:

1. **Dual-Channel Stateless Authentication (`F-01`):** Browser clients authenticate via `httpOnly` cookies (`token`, `SameSite=Lax`, `Max-Age=86400`, `24h` expiry) to prevent XSS token theft, while backend middleware seamlessly falls back to `Authorization: Bearer <token>` headers to support automated Supertest API verification.
2. **Exact Monetary Arithmetic in Integer Satang (`F-02`, `F-03`):** All prices (`BakeryItem.price`, `OrderItem.unitPriceAtOrder`, `Order.totalAmount`) are stored in the database and transmitted across API payloads as non-negative integer satangs (`Int`, where `100 satang = 1.00 THB`, e.g., `8500 = 85.00 THB`). Conversion to decimal Baht (`(satang / 100).toFixed(2)`) occurs strictly at the UI presentation boundary.
3. **Separation of Catalog Visibility and Batch Stock (`F-02`, `F-03`):** `isAvailable` (`Boolean`) is a manual catalog listing switch controlled by operators, whereas `stockQuantity` (`Int`) tracks remaining daily physical inventory. When a customer order depletes `stockQuantity` to `0`, `isAvailable` remains `true` so the item stays visible on the menu with an **"Out of Stock" (`สินค้าหมดชั่วคราว`)** badge, while any purchase attempt for zero or insufficient stock is rejected with `409 CONFLICT`.
4. **Shared Storewide Operator Queue (`F-04`):** In alignment with a single-workshop artisan bakery workflow, all authenticated `OPERATOR` accounts share visibility and acceptance authority over all incoming customer orders, while `CUSTOMER` accounts are strictly isolated to their own orders (`order.customerId === req.user.userId`).

---

## 3. Scope

* **Included in Sprint 1:**
  * **F-01 (Authentication, Session Lifecycle & RBAC Foundation):** User registration (`CUSTOMER` default), login (`24h` JWT in `httpOnly` cookie + JSON body), logout (`res.clearCookie('token')`), `authenticate` middleware (cookie primary + Bearer header fallback), and `requireRole` middleware guard.
  * **F-02 (Bakery Catalog & Availability View):** Catalog listing (`GET /api/catalog` returning items with `isAvailable == true`), single-item detail (`GET /api/catalog/:id`), seeded artisan bakery menu (5 items priced in `Int` satang), and responsive catalog UI cards with `"Out of Stock"` states when `stockQuantity == 0`.
  * **F-03 (Customer Pre-Order Creation & Authoritative Server Calculation):** Pre-order placement (`POST /api/customer/orders`), authoritative server-side `totalAmount` calculation in `Int` satang (`BR-01`), historical `unitPriceAtOrder` snapshot in `Int` satang (`BR-02`), atomic stock deduction via `prisma.$transaction` (`BR-03`), customer order history (`GET /api/customer/orders`), and isolated order detail retrieval (`GET /api/customer/orders/:id`, `BR-04`).
  * **F-04 (Operator Incoming Order Queue & Acceptance):** Shared global operator order queue (`GET /api/operator/orders` sorted `PENDING` first, `BR-06`), operator order detail inspection (`GET /api/operator/orders/:id`), and strict forward-only status transition from `PENDING` to `ACCEPTED` (`PATCH /api/operator/orders/:id/status`, `BR-07`).
  * **Multi-Viewport Verification:** Unit tests (Vitest), API integration tests (Vitest + Supertest), and Playwright E2E verification across Desktop (`1280px`), Tablet (`768px`), and Mobile (`375px`).

* **Excluded from Sprint 1 (Deferred to Sprints 2–3 or Out of Scope):**
  * Operator catalog CRUD and batch stock replenishment (`F-05` — Sprint 2).
  * Extended fulfillment transitions (`ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`) and customer order cancellation with stock restoration (`F-06` — Sprint 2).
  * Simulated payment status transitions (`UNPAID` → `PAID` | `FAILED`) (`F-07` — Sprint 2).
  * Sales analytics dashboard (`F-08` — Sprint 3) and multi-criteria order search/filtering (`F-09` — Sprint 3).
  * Real third-party payment gateways, external delivery couriers, and multi-branch franchise partitioning.

---

## 4. Functional Requirements (FR)

### 4.1 F-01: Authentication, Session Lifecycle & RBAC Foundation
* **FR-01-01 (User Registration):** A user can register an account via `POST /api/auth/register` providing `name`, `email`, `password` (minimum 8 characters), and optional `role` (defaults to `CUSTOMER`). Password is hashed using `bcrypt` (salt rounds ≥ 10) before persistence.
* **FR-01-02 (User Login & Dual-Channel Token Issuance):** A user can authenticate via `POST /api/auth/login` with `email` and `password`. Upon valid credentials, the server issues a signed JWT (`payload: { userId, role }`, `expiresIn: '24h'`), sets it in an `httpOnly` cookie (`token`, `SameSite=Lax`, `Path=/`, `Max-Age=86400`) for the React frontend (`fetch` with `credentials: 'include'`), and returns `{ user, token }` in the JSON response body for API test clients.
* **FR-01-03 (Dual-Channel Credential Verification):** The `authenticate` middleware extracts the JWT from `req.cookies.token` first and falls back to the `Authorization: Bearer <token>` header before granting access to protected routes. Missing, malformed, or expired tokens in both channels are rejected with `401 UNAUTHORIZED`.
* **FR-01-04 (Role-Based Access Control Enforcement):** Role-restricted routes enforce access exclusively through the `requireRole([...])` middleware factory (`CUSTOMER` vs `OPERATOR`), rejecting unauthorized roles with `403 FORBIDDEN`.
* **FR-01-05 (Session Logout & Cookie Revocation):** A user can terminate their session via `POST /api/auth/logout`, which clears the browser's `httpOnly` cookie via `res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' })` and resets client `AuthContext` state.
* **FR-01-06 (Duplicate Email Guard):** Registering with an email address that already exists in `User.email` is rejected with `409 CONFLICT`.

### 4.2 F-02: Bakery Catalog & Availability View
* **FR-02-01 (Active Catalog Listing):** `GET /api/catalog` returns the list of all `BakeryItem` records where `isAvailable == true` (including items whose `stockQuantity == 0`).
* **FR-02-02 (Catalog Item Payload Schema):** Each item in the catalog response includes `id`, `name`, `description`, `price` (`Int` satang), `stockQuantity` (`Int`), `isAvailable` (`Boolean`), `category` (`String`), `createdAt`, and `updatedAt`.
* **FR-02-03 (Single Bakery Item Detail):** `GET /api/catalog/:id` returns the full details of a single `BakeryItem` by ID, or returns `404 NOT_FOUND` if the ID does not exist.
* **FR-02-04 (Frontend Catalog Card Presentation):** The React client renders a `BakeryItemCard` for each item displaying its name, category, description, price formatted in Thai Baht (`฿(price / 100).toFixed(2)`), remaining stock count, and availability badge (displaying `"Out of Stock"` / `"สินค้าหมดชั่วคราว"` and disabling order selection when `stockQuantity == 0`).

### 4.3 F-03: Customer Pre-Order Creation & Authoritative Server Calculation
* **FR-03-01 (Pre-Order Submission):** An authenticated `CUSTOMER` can create a pre-order via `POST /api/customer/orders` containing `items: Array<{ bakeryItemId: string, quantity: number }>` (non-empty array) and an optional `pickupNote?: string`.
* **FR-03-02 (Server-Side Satang Total Calculation):** The server calculates `Order.totalAmount` (`Int` satang) exclusively as the sum of `(BakeryItem.price * item.quantity)` fetched from the database, ignoring any client-supplied price or total fields (`BR-01`).
* **FR-03-03 (OrderItem Unit Price Snapshot):** Each created `OrderItem` stores `unitPriceAtOrder` (`Int` satang) copied from `BakeryItem.price` at the exact moment of order creation (`BR-02`).
* **FR-03-04 (Atomic Stock Validation & Deduction):** Within a single `prisma.$transaction`, the server verifies `isAvailable == true` and `stockQuantity >= quantity` for every requested item, decrements `BakeryItem.stockQuantity` by `quantity`, and persists the `Order` and `OrderItem` records (`BR-03`, `BR-05`).
* **FR-03-05 (Initial Order Status):** Every newly created pre-order is initialized with `status = 'PENDING'`.
* **FR-03-06 (Customer Order History & Ownership-Isolated Detail):** An authenticated `CUSTOMER` can list their own orders via `GET /api/customer/orders` (newest first) and inspect a specific order via `GET /api/customer/orders/:id`. Accessing an order belonging to another customer returns `403 FORBIDDEN` (`BR-04`).

### 4.4 F-04: Operator Incoming Order Queue & Acceptance
* **FR-04-01 (Shared Global Operator Queue):** `GET /api/operator/orders` returns all orders across the bakery for any authenticated `OPERATOR` (`BR-06`), ordered with `PENDING` status first and newest `createdAt` first.
* **FR-04-02 (Operator Order Detail Inspection):** `GET /api/operator/orders/:id` returns the complete order breakdown for any order ID (including customer `id`, `name`, `email`, line items with `bakeryItem.name`, `quantity`, `unitPriceAtOrder` in satang, `totalAmount` in satang, `pickupNote`, and `status`), or `404 NOT_FOUND` if the order does not exist.
* **FR-04-03 (Operator Order Acceptance):** `PATCH /api/operator/orders/:id/status` with `{ "status": "ACCEPTED" }` transitions a `PENDING` order to `ACCEPTED` and returns `200 OK` with the updated order.
* **FR-04-04 (Invalid Transition & Validation Guard):** Attempting to transition an order that is not `PENDING` (e.g., `ACCEPTED` → `ACCEPTED` or `ACCEPTED` → `PENDING`) returns `409 CONFLICT` (`BR-07`), while supplying an invalid or unsupported status string returns `400 VALIDATION_ERROR`.

---

## 5. Business Rules (BR)

* **BR-01 (Authoritative Server-Side Pricing in Satang):** Order `totalAmount` MUST be calculated exclusively on the server using authoritative `BakeryItem.price` values from the database in **integer satang (`Int`, `100 satang = 1.00 THB`)**. Client-supplied prices or totals are strictly ignored.
* **BR-02 (Price Snapshot in Satang):** Each `OrderItem` MUST capture `unitPriceAtOrder` (`Int` in satang) from `BakeryItem.price` at the moment of order creation so historical order records remain immutable if catalog prices change later.
* **BR-03 (Stock Atomicity):** Valid orders MUST validate and atomically deduct `stockQuantity` for all line items within a single database transaction (`prisma.$transaction`). If any item fails validation, the entire transaction rolls back with zero partial stock deductions.
* **BR-04 (Customer Ownership Isolation):** A `CUSTOMER` MUST only access their own orders (`order.customerId === req.user.userId`). Cross-customer access attempts on `GET /api/customer/orders/:id` MUST return `403 FORBIDDEN`.
* **BR-05 (`isAvailable` vs. `stockQuantity` Separation):** `isAvailable` (`Boolean`) is a manual catalog visibility flag controlled by `OPERATOR` (`GET /api/catalog` returns items with `isAvailable == true`). When `stockQuantity` reaches `0`, `isAvailable` does **NOT** automatically become `false`; the item remains visible in the catalog as `"Out of Stock"` (`stockQuantity: 0`), and any order request with `stockQuantity == 0` or `quantity > stockQuantity` is rejected with `409 CONFLICT`. Ordering an item with `isAvailable == false` is also rejected with `409 CONFLICT`.
* **BR-06 (Shared Global Operator Queue):** All `OPERATOR` accounts have shared visibility and status-transition authority over all incoming orders in the system (single-bakery operational model, documented as ADR-05 in `docs/system-sds.md` and Section 3 of `docs/srs.md`).
* **BR-07 (Forward-Only Order Status State Machine):** In Sprint 1, the only valid state transition is `PENDING` → `ACCEPTED` triggered by an `OPERATOR`. Backward or repeated transitions (e.g., `ACCEPTED` → `PENDING` or `ACCEPTED` → `ACCEPTED`) are rejected with `409 CONFLICT`.

---

## 6. Authorization Matrix (RBAC)

All API endpoints enforce role-based access control via `authenticate` and `requireRole` middlewares:

| Endpoint / Action | Method & Path | Unauthenticated | `CUSTOMER` | `OPERATOR` | Enforcement & Business Rule Notes |
|---|---|:---:|:---:|:---:|---|
| Register User Account | `POST /api/auth/register` | ✔ (`201`) | ✔ (`201`) | ✔ (`201`) | Public endpoint; defaults `role` to `CUSTOMER`. |
| Login & Issue Session | `POST /api/auth/login` | ✔ (`200`) | ✔ (`200`) | ✔ (`200`) | Public endpoint; sets `httpOnly` cookie (`token`, `24h`) + returns token in body. |
| Logout & Clear Cookie | `POST /api/auth/logout` | ✔ (`200`) | ✔ (`200`) | ✔ (`200`) | Clears `httpOnly` cookie `token` via `res.clearCookie('token')`. |
| List Active Catalog | `GET /api/catalog` | ❌ (`401`)* | ✔ (`200`) | ✔ (`200`) | Requires valid JWT (`CUSTOMER` \| `OPERATOR`); returns items where `isAvailable == true` (`BR-05`). |
| View Catalog Item Detail | `GET /api/catalog/:id` | ❌ (`401`)* | ✔ (`200`) | ✔ (`200`) | Requires valid JWT (`CUSTOMER` \| `OPERATOR`); returns `404` if item ID not found. |
| Create Pre-Order | `POST /api/customer/orders` | ❌ (`401`) | ✔ (`201`) | ❌ (`403`) | `requireRole(['CUSTOMER'])`; enforces `BR-01`, `BR-02`, `BR-03`, `BR-05`. |
| List Own Pre-Orders | `GET /api/customer/orders` | ❌ (`401`) | ✔ (`200`) | ❌ (`403`) | `requireRole(['CUSTOMER'])`; filtered by `customerId === req.user.userId` (`BR-04`). |
| View Own Pre-Order Detail | `GET /api/customer/orders/:id` | ❌ (`401`) | ✔ (`200` / `403`) | ❌ (`403`) | `requireRole(['CUSTOMER'])`; returns `403 FORBIDDEN` if `order.customerId !== req.user.userId` (`BR-04`). |
| View Shared Operator Queue | `GET /api/operator/orders` | ❌ (`401`) | ❌ (`403`) | ✔ (`200`) | `requireRole(['OPERATOR'])`; returns all store orders sorted `PENDING` first (`BR-06`). |
| View Any Order Detail (Operator) | `GET /api/operator/orders/:id` | ❌ (`401`) | ❌ (`403`) | ✔ (`200`) | `requireRole(['OPERATOR'])`; full order + customer details (`BR-06`). |
| Accept Pending Order | `PATCH /api/operator/orders/:id/status` | ❌ (`401`) | ❌ (`403`) | ✔ (`200`) | `requireRole(['OPERATOR'])`; transitions `PENDING` → `ACCEPTED` (`BR-07`). |

> \* **Note on `/api/catalog` Authentication:** Per `plan/01-conventions.md` Section B, `/api/catalog/*` routes sit behind `authenticate` middleware (`CUSTOMER` | `OPERATOR`), ensuring every API request in the protected namespace carries a verified session (and supporting `E2E-09` auth-guard redirection on protected client routes).

---

## 7. Data Model Changes

Sprint 1 establishes the core relational schema in `prisma/schema.prisma` using SQLite (`provider = "sqlite"`) for zero-config local development and persistent volume deployment, while strictly adhering to portable data types (`String`, `Int`, `Boolean`, `DateTime`) compatible with PostgreSQL.

### 7.1 Prisma Schema Definition (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         String   @default("CUSTOMER") // "CUSTOMER" | "OPERATOR"
  orders       Order[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model BakeryItem {
  id            String      @id @default(cuid())
  name          String      @unique
  description   String
  price         Int         // Authoritative unit price in integer satang (100 satang = 1.00 THB)
  stockQuantity Int         // Physical batch inventory remaining (>= 0)
  isAvailable   Boolean     @default(true) // Operator catalog visibility flag (BR-05)
  category      String      // "Pastry" | "Bread" | "Sweet Bread" | "Tart"
  orderItems    OrderItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Order {
  id          String      @id @default(cuid())
  customerId  String
  customer    User        @relation(fields: [customerId], references: [id])
  status      String      @default("PENDING") // Sprint 1: "PENDING" | "ACCEPTED"
  totalAmount Int         // Server-calculated total in integer satang (BR-01)
  pickupNote  String?
  items       OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([customerId])
  @@index([status, createdAt])
}

model OrderItem {
  id               String     @id @default(cuid())
  orderId          String
  order            Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  bakeryItemId     String
  bakeryItem       BakeryItem @relation(fields: [bakeryItemId], references: [id])
  quantity         Int        // Number of units ordered (> 0)
  unitPriceAtOrder Int        // Snapshot of BakeryItem.price in integer satang at order time (BR-02)

  @@index([orderId])
  @@index([bakeryItemId])
}
```

### 7.2 Entity Field & Monetary Type Reference

| Entity | Field | Prisma Type | Domain Constraint & Description |
|---|---|---|---|
| `User` | `id` | `String` | Primary key (`@default(cuid())`). |
| `User` | `name` | `String` | Non-empty display name of customer or operator. |
| `User` | `email` | `String` | Unique email address (`@unique`); duplicate registration returns `409 CONFLICT`. |
| `User` | `passwordHash` | `String` | `bcrypt` hash of user password; never serialized in API responses. |
| `User` | `role` | `String` | Role enum value: `'CUSTOMER'` (default) or `'OPERATOR'`. |
| `BakeryItem` | `id` | `String` | Primary key (`@default(cuid())`). |
| `BakeryItem` | `name` | `String` | Unique bakery product title. |
| `BakeryItem` | `description` | `String` | Detailed product description and tasting notes. |
| `BakeryItem` | `price` | **`Int`** | **Monetary (`Int` satang):** Unit price in satang (`100 satang = 1.00 THB`, e.g., `8500` = `฿85.00`). |
| `BakeryItem` | `stockQuantity` | `Int` | Remaining physical batch count (`>= 0`). Decremented atomically on order creation (`BR-03`). |
| `BakeryItem` | `isAvailable` | `Boolean` | Manual catalog visibility flag (`BR-05`). Does NOT flip to `false` when `stockQuantity == 0`. |
| `BakeryItem` | `category` | `String` | Product category (`Pastry`, `Bread`, `Sweet Bread`, `Tart`). |
| `Order` | `id` | `String` | Primary key (`@default(cuid())`). |
| `Order` | `customerId` | `String` | Foreign key referencing `User.id`. Enforces ownership isolation (`BR-04`). |
| `Order` | `status` | `String` | Order lifecycle state: `'PENDING'` (initial) → `'ACCEPTED'` (Sprint 1). |
| `Order` | `totalAmount` | **`Int`** | **Monetary (`Int` satang):** Authoritative server-calculated sum $\sum (\text{unitPriceAtOrder} \times \text{quantity})$ (`BR-01`). |
| `Order` | `pickupNote` | `String?` | Optional customer instruction for counter pickup. |
| `OrderItem` | `id` | `String` | Primary key (`@default(cuid())`). |
| `OrderItem` | `orderId` | `String` | Foreign key referencing `Order.id` (`onDelete: Cascade`). |
| `OrderItem` | `bakeryItemId` | `String` | Foreign key referencing `BakeryItem.id`. |
| `OrderItem` | `quantity` | `Int` | Positive integer (`> 0`) representing units ordered. |
| `OrderItem` | `unitPriceAtOrder` | **`Int`** | **Monetary (`Int` satang):** Immutable snapshot of `BakeryItem.price` at order creation time (`BR-02`). |

### 7.3 Idempotent Seed Data (`prisma/seed.ts`)

* **Seeded Users:**
  * `operator@crustcraft.com` — Role: `OPERATOR`, Password: `operator123`
  * `customer1@test.com` — Role: `CUSTOMER`, Password: `customer123`
  * `customer2@test.com` — Role: `CUSTOMER`, Password: `customer123`
* **Seeded Bakery Catalog Items (All `isAvailable: true`):**
  1. **Artisan Butter Croissant** (`Pastry`) — `price: 8500` satang (`฿85.00`), `stockQuantity: 50`
  2. **Classic Sourdough Loaf** (`Bread`) — `price: 22000` satang (`฿220.00`), `stockQuantity: 20`
  3. **Cinnamon Brioche Roll** (`Sweet Bread`) — `price: 6500` satang (`฿65.00`), `stockQuantity: 80`
  4. **Pain au Chocolat** (`Pastry`) — `price: 9000` satang (`฿90.00`), `stockQuantity: 40`
  5. **Matcha Almond Tart** (`Tart`) — `price: 14500` satang (`฿145.00`), `stockQuantity: 30`

---

## 8. API Contract Summary

Full request/response schemas and error payloads are specified in [`api-spec.md`](./api-spec.md).

| Method | Path | Auth & Role Guard | Summary Description | Success Status |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account (`CUSTOMER` by default) with `bcrypt` password hash. | `201 Created` |
| `POST` | `/api/auth/login` | Public | Authenticate user, set `httpOnly` cookie (`token`, `24h`), and return `{ user, token }`. | `200 OK` |
| `POST` | `/api/auth/logout` | Public / Auth | Clear `httpOnly` cookie (`res.clearCookie('token')`) to revoke browser session. | `200 OK` |
| `GET` | `/api/catalog` | Auth (`CUSTOMER` \| `OPERATOR`) | List all catalog items where `isAvailable == true` (including `stockQuantity == 0`). | `200 OK` |
| `GET` | `/api/catalog/:id` | Auth (`CUSTOMER` \| `OPERATOR`) | Retrieve single bakery item detail by ID. | `200 OK` |
| `POST` | `/api/customer/orders` | `requireRole(['CUSTOMER'])` | Create pre-order with server-side `Int` satang pricing, snapshot, and atomic stock deduction. | `201 Created` |
| `GET` | `/api/customer/orders` | `requireRole(['CUSTOMER'])` | List all pre-orders belonging exclusively to the authenticated customer. | `200 OK` |
| `GET` | `/api/customer/orders/:id` | `requireRole(['CUSTOMER'])` | Retrieve full detail of customer's own order (`403` if owned by another customer). | `200 OK` |
| `GET` | `/api/operator/orders` | `requireRole(['OPERATOR'])` | List all incoming orders in the shared global store queue (`PENDING` first). | `200 OK` |
| `GET` | `/api/operator/orders/:id` | `requireRole(['OPERATOR'])` | Retrieve full order detail (with customer info and line items) for any order. | `200 OK` |
| `PATCH` | `/api/operator/orders/:id/status` | `requireRole(['OPERATOR'])` | Transition order status from `PENDING` to `ACCEPTED` (`409` on invalid state transition). | `200 OK` |

---

## 9. Acceptance Criteria (AC)

To maintain seamless bi-directional traceability across `docs/traceability.md`, `plan/02-feature-coverage.md`, and `plan/sprint-1-issues/ISSUE-03.md` through `ISSUE-06.md`, each Acceptance Criterion below lists both its Feature-level identifier (`AC-01-XX` to `AC-04-XX`) and its Issue-level implementation identifier (`AC-03-XX` to `AC-06-XX`).

### 9.1 F-01: Authentication, Session Lifecycle & RBAC (`ISSUE-03`)
* **AC-01-01 (`AC-03-07`):** Given valid registration data (`name`, `email`, `password`), when `POST /api/auth/register` is called, then a new `User` is created with a `bcrypt`-hashed password (`AC-03-16`) and the server returns `201 Created` with user profile fields excluding `passwordHash` (`AUTH-01`, `AUTH-10`).
* **AC-01-02 (`AC-03-09`):** Given valid registered credentials, when `POST /api/auth/login` is called, then the server returns `200 OK`, sets an `httpOnly` cookie named `token` (`expiresIn: '24h'`, `maxAge: 86400000`, `sameSite: 'lax'`, `path: '/'`), and returns `{ user, token }`; when `POST /api/auth/logout` is called, the server clears the `token` cookie and returns `200 OK` (`AUTH-03`).
* **AC-01-03 (`AC-03-10`, `AC-03-11`):** Given an incorrect password or a non-existent email address, when `POST /api/auth/login` is called, then the server rejects the request with `401 UNAUTHORIZED` using the standard error envelope (`AUTH-04`, `AUTH-05`).
* **AC-01-04 (`AC-03-12`, `AC-03-13`, `AC-03-14`, `AC-03-18`):** Given any protected endpoint, when a request arrives with a valid JWT in either `req.cookies.token` (primary) or `Authorization: Bearer <token>` (fallback), then `authenticate` attaches `req.user = { userId, role }` (`AUTH-08`); when neither channel contains a valid, non-expired JWT, the server responds with `401 UNAUTHORIZED` (`AUTH-06`, `AUTH-07`).
* **AC-01-05 (`AC-03-15`, `AC-03-19`):** Given an authenticated user with role `CUSTOMER`, when they request any endpoint guarded by `requireRole(['OPERATOR'])` (`/api/operator/*`), then the server responds with `403 FORBIDDEN` (`AUTH-09`).
* **AC-01-06 (`AC-03-08`):** Given an email address that is already registered, when `POST /api/auth/register` is called with that email, then the server responds with `409 CONFLICT` (`AUTH-02`).

### 9.2 F-02: Bakery Catalog & Availability View (`ISSUE-04`)
* **AC-02-01 (`AC-04-01`):** Given seeded `BakeryItem` records in the database, when `GET /api/catalog` is called, then the server returns `200 OK` containing only items where `isAvailable == true` (including items where `stockQuantity == 0`, per `BR-05`) (`CAT-01`).
* **AC-02-02 (`AC-04-02`, `AC-04-06`):** Given the response from `GET /api/catalog`, each item object includes `id`, `name`, `description`, `price` (`Int` satang), `stockQuantity` (`Int`), `isAvailable` (`Boolean`), and `category` (`CAT-02`), and the Catalog UI renders each item card with Thai Baht price `(price / 100).toFixed(2)` and an `"Out of Stock"` badge when `stockQuantity == 0` (`E2E-02`).
* **AC-02-03 (`AC-04-03`):** Given a `BakeryItem` with `isAvailable == false`, when `GET /api/catalog` is called, then that item is excluded from the returned catalog list (`CAT-03`).
* **AC-02-04 (`AC-04-04`, `AC-04-05`):** Given a request to `GET /api/catalog/:id`, when the ID exists, the server returns `200 OK` with the single item detail (`CAT-04`); when the ID does not exist, the server returns `404 NOT_FOUND` (`CAT-05`).

### 9.3 F-03: Customer Pre-Order Creation & Authoritative Server Calculation (`ISSUE-04`)
* **AC-03-01 (`AC-04-07`, `AC-04-08`, `AC-04-18`):** Given an authenticated `CUSTOMER` submitting valid line items to `POST /api/customer/orders`, then the server returns `201 Created` with `status: "PENDING"` (`ORD-12`) and an authoritative `totalAmount` (`Int` satang) calculated strictly from database `BakeryItem.price × quantity`, ignoring any client-supplied prices (`ORD-01`, `ORD-02`, `E2E-03`).
* **AC-03-02 (`AC-04-09`):** Given a newly created order, each `OrderItem.unitPriceAtOrder` (`Int` satang) equals the database `BakeryItem.price` at the moment of order creation (`ORD-03`).
* **AC-03-03 (`AC-04-10`, `AC-04-11`):** Given a valid order submission, `BakeryItem.stockQuantity` is atomically decremented inside `prisma.$transaction` (`ORD-04`); if any line item in a multi-item order fails stock validation, the entire transaction rolls back and no item's stock is modified (`ORD-05`). When `stockQuantity` reaches `0`, `isAvailable` remains `true` (`BR-05`).
* **AC-03-04 (`AC-04-13`):** Given an order containing a `BakeryItem` with `isAvailable == false`, when `POST /api/customer/orders` is called, then the server rejects the order with `409 CONFLICT` (`ORD-07`).
* **AC-03-05 (`AC-04-14`):** Given an order requesting `quantity > stockQuantity` or targeting an item with `stockQuantity == 0`, when `POST /api/customer/orders` is called, then the server rejects the order with `409 CONFLICT` (`ORD-08`).
* **AC-03-06 (`AC-04-15`, `AC-04-16`, `AC-04-17`, `AC-04-19`, `AC-04-20`):** Given an authenticated `CUSTOMER`, `GET /api/customer/orders` returns only their own orders (`ORD-09`, `E2E-04`) and `GET /api/customer/orders/:id` returns `200 OK` for their own order (`ORD-10`, `E2E-05`), whereas requesting another customer's order ID returns `403 FORBIDDEN` (`ORD-11`).
* **AC-03-07 (`AC-04-12`):** Given an order request with `quantity <= 0` or an empty `items` array, when `POST /api/customer/orders` is called, then the server rejects the request with `400 VALIDATION_ERROR` (`ORD-06`).

### 9.4 F-04: Operator Incoming Order Queue & Acceptance (`ISSUE-05`)
* **AC-04-01 (`AC-05-01`, `AC-05-07`):** Given an authenticated `CUSTOMER`, when they call `GET /api/operator/orders` or `PATCH /api/operator/orders/:id/status`, then the server rejects the request with `403 FORBIDDEN` (`OPS-01`, `OPS-07`).
* **AC-04-02 (`AC-05-05`, `AC-05-11`):** Given an authenticated `OPERATOR` and an order in `PENDING` status, when `PATCH /api/operator/orders/:id/status` is called with `{ "status": "ACCEPTED" }`, then the server updates the order status to `ACCEPTED`, returns `200 OK` with the updated order (`OPS-05`), and the Operator Queue UI reflects the `ACCEPTED` status without a full page reload (`E2E-07`).
* **AC-04-03 (`AC-05-06`, `AC-05-08`):** Given an order already in `ACCEPTED` status, when `PATCH /api/operator/orders/:id/status` is called to transition it again or backwards to `PENDING`, the server returns `409 CONFLICT` (`OPS-06`); when called with an invalid status value outside the allowed schema, the server returns `400 VALIDATION_ERROR` (`OPS-08`).
* **AC-04-04 (`AC-05-02`, `AC-05-03`, `AC-05-04`, `AC-05-09`, `AC-05-10`):** Given an authenticated `OPERATOR`, `GET /api/operator/orders` returns `200 OK` with all storewide orders sorted `PENDING` first (`OPS-02`, `E2E-06`), and `GET /api/operator/orders/:id` returns `200 OK` with full order and customer details (`OPS-03`, `E2E-08`) or `404 NOT_FOUND` for a non-existent order ID (`OPS-04`).

### 9.5 End-to-End Multi-Viewport Journeys (`ISSUE-06`)
* **AC-06-01:** Customer complete E2E journey (Register → Login → Browse Catalog → Create Multi-Item Pre-Order → View My Orders & Order Detail with accurate THB totals) passes across Desktop (`1280px`), Tablet (`768px`), and Mobile (`375px`) (`E2E-01` to `E2E-05`).
* **AC-06-02:** Operator complete E2E journey (Login → View Shared Order Queue → Accept `PENDING` Order → Inspect Order Detail) passes across Desktop (`1280px`), Tablet (`768px`), and Mobile (`375px`) (`E2E-06` to `E2E-08`).
* **AC-06-03:** Unauthenticated browser access to protected routes automatically redirects to `/login` across all 3 viewports (`E2E-09`).

---

## 10. Assumptions & Architectural Decisions

1. **Integer Satang Monetary Standard (`ADR-03`):** All database columns and JSON payload fields representing money (`price`, `unitPriceAtOrder`, `totalAmount`) use integer satangs (`Int`, `100 satang = 1.00 THB`). This eliminates floating-point rounding drift during server-side summation.
2. **Dual-Channel JWT Authentication (`ADR-02`):** Browser requests rely on an `httpOnly` cookie (`token`) sent via `fetch(..., { credentials: 'include' })` to mitigate XSS, while `authenticate.middleware.ts` falls back to `Authorization: Bearer <token>` so Supertest integration suites can test endpoints directly.
3. **Catalog Visibility vs. Inventory Depletion (`ADR-04` / `BR-05`):** Depleting `stockQuantity` to `0` never mutates `isAvailable`. Out-of-stock items remain visible in `GET /api/catalog` so customers see the full artisan menu with an `"Out of Stock"` badge, while the order service blocks purchases with `409 CONFLICT`.
4. **Shared Storewide Operator Queue (`ADR-05` / `BR-06`):** All `OPERATOR` users view and manage the same global order queue, matching the operational reality of a single artisan bakery kitchen and pickup counter.
5. **Prisma Client Singleton (`lib/db.ts`):** All database operations import the shared `prisma` instance from `server/src/lib/db.ts` to prevent connection pool exhaustion during test execution.

---

## 11. Product Definition of Done (DoD)

* [ ] All Sprint 1 Engineering Contract files (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) are committed and merged into `sprint-1-staging` **before** any implementation PR (`ISSUE-03` to `ISSUE-06`).
* [ ] All Functional Requirements (`FR-01-01` through `FR-04-04`) and Business Rules (`BR-01` through `BR-07`) are implemented according to specification.
* [ ] All Acceptance Criteria (`AC-01-01` through `AC-06-03`) are verified and passing.
* [ ] All 44 Test IDs (`AUTH-01`–`AUTH-10`, `CAT-01`–`CAT-05`, `ORD-01`–`ORD-12`, `OPS-01`–`OPS-08`, `E2E-01`–`E2E-09`) in [`tests.md`](./tests.md) achieve `PASS` status.
* [ ] Responsive UI layouts are verified with Playwright screenshot evidence across Desktop (`1280px`), Tablet (`768px`), and Mobile (`375px`).
* [ ] Every Pull Request is reviewed and approved by the cross-pair partner with zero regressions.
