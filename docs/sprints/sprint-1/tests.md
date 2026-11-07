# Sprint 1 Test Plan & Execution Matrix

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 1 — Part E (System Test Specification & Traceability Matrix)  
> **Sprint 1 Status:** 🟡 In Progress (Engineering Contracts Baseline — Pre-Implementation)  
> **Total Sprint 1 Test IDs:** 44 (`AUTH` × 10, `CAT` × 5, `ORD` × 12, `OPS` × 8, `E2E` × 9)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Test Strategy & Verification Pyramid

CrustCraft enforces strict **Test-Driven Development (TDD)** across all feature issues (`ISSUE-03` through `ISSUE-06`). In every feature branch, test suites are authored and committed **before** the corresponding business logic and route handlers are implemented.

1. **Unit Tests (Vitest — `server/src/__tests__/unit/*.test.ts`):**
   - Verify isolated domain logic without HTTP transport overhead: `bcrypt` password hashing and verification (`AUTH-10`), JWT payload encoding/decoding and `req.user` extraction (`AUTH-08`), authoritative server-side integer satang total calculation (`ORD-02`), and `unitPriceAtOrder` satang price snapshotting (`ORD-03`).
2. **API & Database Integration Tests (Vitest + Supertest — `server/src/__tests__/sprint-1/*.api.test.ts`):**
   - Execute full HTTP requests against the Express application backed by an isolated test SQLite database (`file:./test.db`).
   - Verify HTTP status codes, standard error envelopes (`{ error: { code, message, details? } }`), dual-channel JWT resolution (`httpOnly` cookie primary + `Authorization: Bearer <token>` fallback), role guards (`requireRole`), atomic database stock deductions (`prisma.$transaction`), `isAvailable` vs. `stockQuantity` separation (`BR-05`), customer ownership isolation (`BR-04`), and shared operator queue state transitions (`BR-06`, `BR-07`).
3. **End-to-End Multi-Viewport Browser Tests (Playwright — `e2e/sprint-1/*.spec.ts`):**
   - Verify complete user journeys in real headless browsers across three mandatory responsive viewports:
     - **Desktop:** `1280px × 720px`
     - **Tablet:** `768px × 1024px`
     - **Mobile:** `375px × 667px`
   - Zero hardcoded `sleep()` or `waitForTimeout()` calls; all assertions use Playwright auto-retrying web-first locators (`expect(locator).toBeVisible()`) and capture responsive evidence screenshots in `e2e/screenshots/sprint-1/`.

---

## 2. Test Execution Matrix (All 44 Sprint 1 Test IDs)

> **Status Legend:** `⬜` Planned (Pre-Implementation Baseline) | `🟢 PASS` Verified | `🔴 FAIL` Failed

### 2.1 Authentication & RBAC Suite (`AUTH-01` to `AUTH-10` — `ISSUE-03`)

| Test ID | Type | AC-XX Reference | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **AUTH-01** | API Integration | `AC-01-01` (`AC-03-07`) | `POST /api/auth/register` with valid `name`, `email`, `password` | Returns `201 Created` with created `user` object (`id`, `name`, `email`, `role: "CUSTOMER"`); `passwordHash` is omitted from response body. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-02** | API Integration | `AC-01-06` (`AC-03-08`) | `POST /api/auth/register` with an already-registered email address | Returns `409 CONFLICT` with `{ error: { code: "CONFLICT", message: ... } }`. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-03** | API Integration | `AC-01-02` (`AC-03-09`) | `POST /api/auth/login` with valid credentials & `POST /api/auth/logout` session revocation | Login returns `200 OK`, sets `Set-Cookie: token=...; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`, and returns `{ user, token }`. Logout returns `200 OK` and clears `token` cookie (`Max-Age=0` / empty value). | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-04** | API Integration | `AC-01-03` (`AC-03-10`) | `POST /api/auth/login` with wrong password for existing email | Returns `401 UNAUTHORIZED` with `{ error: { code: "UNAUTHORIZED", message: ... } }`. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-05** | API Integration | `AC-01-03` (`AC-03-11`) | `POST /api/auth/login` with non-existent email address | Returns `401 UNAUTHORIZED` with `{ error: { code: "UNAUTHORIZED", message: ... } }`. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-06** | API Integration | `AC-01-04` (`AC-03-12`) | Request to protected endpoint without `token` cookie and without `Authorization` header | Returns `401 UNAUTHORIZED` with standard error envelope. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-07** | API Integration | `AC-01-04` (`AC-03-13`) | Request to protected endpoint with malformed or expired JWT in cookie or Bearer header | Returns `401 UNAUTHORIZED` with standard error envelope. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-08** | Unit | `AC-01-04` (`AC-03-14`, `AC-03-18`) | JWT sign/verify helper & `authenticate` middleware token extraction (`req.cookies.token` primary, `Bearer` fallback) | Valid JWT resolves `{ userId, role }` and attaches it to `req.user` in both cookie and Bearer modes. | `server/src/__tests__/unit/auth.test.ts` | ⬜ |
| **AUTH-09** | API Integration | `AC-01-05` (`AC-03-15`, `AC-03-19`) | Authenticated `CUSTOMER` calling `requireRole(['OPERATOR'])` protected route | Returns `403 FORBIDDEN` with `{ error: { code: "FORBIDDEN", message: ... } }`. | `server/src/__tests__/sprint-1/auth.api.test.ts` | ⬜ |
| **AUTH-10** | Unit | `AC-01-01` (`AC-03-16`) | Password hashing with `bcrypt` before database persistence | Hashed string `!==` plaintext password; `bcrypt.compare(plaintext, hash)` returns `true`. | `server/src/__tests__/unit/auth.test.ts` | ⬜ |

---

### 2.2 Bakery Catalog Suite (`CAT-01` to `CAT-05` — `ISSUE-04`)

| Test ID | Type | AC-XX Reference | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **CAT-01** | API Integration | `AC-02-01` (`AC-04-01`) | `GET /api/catalog` returns active catalog items including items with `stockQuantity == 0` (`BR-05`) | Returns `200 OK` with all items where `isAvailable === true`; an item with `isAvailable: true` and `stockQuantity: 0` remains present in the list. | `server/src/__tests__/sprint-1/catalog.api.test.ts` | ⬜ |
| **CAT-02** | API Integration | `AC-02-02` (`AC-04-02`) | `GET /api/catalog` response schema and integer satang price representation | Returns `200 OK`; each item contains `id`, `name`, `description`, `price` (integer satang `Int`, e.g., `8500`), `stockQuantity` (`Int`), `isAvailable` (`Boolean`), and `category`. | `server/src/__tests__/sprint-1/catalog.api.test.ts` | ⬜ |
| **CAT-03** | API Integration | `AC-02-03` (`AC-04-03`) | `GET /api/catalog` excludes items where `isAvailable == false` | Items with `isAvailable: false` are omitted from the returned `items` array. | `server/src/__tests__/sprint-1/catalog.api.test.ts` | ⬜ |
| **CAT-04** | API Integration | `AC-02-04` (`AC-04-04`) | `GET /api/catalog/:id` for an existing `BakeryItem` ID | Returns `200 OK` with `{ item: { id, name, description, price, stockQuantity, isAvailable, category, ... } }`. | `server/src/__tests__/sprint-1/catalog.api.test.ts` | ⬜ |
| **CAT-05** | API Integration | `AC-02-04` (`AC-04-05`) | `GET /api/catalog/:id` for a non-existent item ID | Returns `404 NOT_FOUND` with `{ error: { code: "NOT_FOUND", message: ... } }`. | `server/src/__tests__/sprint-1/catalog.api.test.ts` | ⬜ |

---

### 2.3 Customer Pre-Orders Suite (`ORD-01` to `ORD-12` — `ISSUE-04`)

| Test ID | Type | AC-XX Reference | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **ORD-01** | API Integration | `AC-03-01` (`AC-04-07`) | `POST /api/customer/orders` with valid multi-item payload and `pickupNote` | Returns `201 Created` with created order, line items, and authoritative server-calculated `totalAmount` in integer satang (`Int`). | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-02** | Unit | `AC-03-01` (`AC-04-08`) | Authoritative server-side order total calculation in integer satang (`BR-01`) | `totalAmount` equals $\sum (\text{dbItem.price} \times \text{quantity})$ in satang; any client-supplied `price` or `totalAmount` in payload is completely ignored. | `server/src/__tests__/unit/orderCalculation.test.ts` | ⬜ |
| **ORD-03** | Unit | `AC-03-02` (`AC-04-09`) | Historical unit price snapshotting into `OrderItem.unitPriceAtOrder` (`BR-02`) | Each line item's `unitPriceAtOrder` (`Int` satang) equals `BakeryItem.price` at the moment of order creation. | `server/src/__tests__/unit/orderCalculation.test.ts` | ⬜ |
| **ORD-04** | API Integration | `AC-03-03` (`AC-04-10`) | Stock deduction in DB after successful `POST /api/customer/orders` (`BR-03`, `BR-05`) | `BakeryItem.stockQuantity` is decremented by ordered `quantity`; if `stockQuantity` reaches `0`, `isAvailable` remains `true`. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-05** | API Integration | `AC-03-03` (`AC-04-11`) | Transactional atomicity (`prisma.$transaction`) when one item in a multi-item order has insufficient stock (`BR-03`) | Returns `409 CONFLICT`; transaction rolls back completely — first item's `stockQuantity` is NOT decremented and no `Order` record is persisted. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-06** | API Integration | `AC-03-07` (`AC-04-12`) | `POST /api/customer/orders` with `quantity <= 0` or empty `items` array | Returns `400 VALIDATION_ERROR` with `{ error: { code: "VALIDATION_ERROR", ... } }`. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-07** | API Integration | `AC-03-04` (`AC-04-13`) | `POST /api/customer/orders` containing an item with `isAvailable == false` (`BR-05`) | Returns `409 CONFLICT` with `{ error: { code: "CONFLICT", ... } }`. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-08** | API Integration | `AC-03-05` (`AC-04-14`) | `POST /api/customer/orders` with `quantity > stockQuantity` or `stockQuantity == 0` (`BR-05`) | Returns `409 CONFLICT` with `{ error: { code: "CONFLICT", ... } }`; stock remains unchanged. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-09** | API Integration | `AC-03-06` (`AC-04-15`) | `GET /api/customer/orders` returns only orders belonging to authenticated `CUSTOMER` (`BR-04`) | Returns `200 OK`; every returned order has `customerId === req.user.userId` (orders from other customers are excluded). | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-10** | API Integration | `AC-03-06` (`AC-04-16`) | `GET /api/customer/orders/:id` for customer's own order | Returns `200 OK` with full order detail including `items`, `unitPriceAtOrder` (`Int` satang), and `totalAmount` (`Int` satang). | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-11** | API Integration | `AC-03-06` (`AC-04-17`) | `GET /api/customer/orders/:id` when Customer A requests Customer B's order (`BR-04`) | Returns `403 FORBIDDEN` with `{ error: { code: "FORBIDDEN", ... } }`. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |
| **ORD-12** | API Integration | `AC-03-01` (`AC-04-18`) | Newly created order initial status verification | Created order returned by `POST /api/customer/orders` and persisted in DB has `status === "PENDING"`. | `server/src/__tests__/sprint-1/orders.api.test.ts` | ⬜ |

---

### 2.4 Operator Order Queue & Acceptance Suite (`OPS-01` to `OPS-08` — `ISSUE-05`)

| Test ID | Type | AC-XX Reference | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **OPS-01** | API Integration | `AC-04-01` (`AC-05-01`) | `GET /api/operator/orders` called by an authenticated `CUSTOMER` | Returns `403 FORBIDDEN` with standard error envelope. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-02** | API Integration | `AC-04-04` (`AC-05-02`) | `GET /api/operator/orders` called by an authenticated `OPERATOR` (`BR-06` Shared Global Queue) | Returns `200 OK` with all storewide orders sorted with `PENDING` orders first, then newest `createdAt` first. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-03** | API Integration | `AC-04-04` (`AC-05-03`) | `GET /api/operator/orders/:id` called by `OPERATOR` | Returns `200 OK` with full order detail including `customer` (`name`, `email`), `items`, `unitPriceAtOrder` (`Int` satang), `totalAmount` (`Int` satang), and `status`. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-04** | API Integration | `AC-04-04` (`AC-05-04`) | `GET /api/operator/orders/:id` for a non-existent order ID | Returns `404 NOT_FOUND` with `{ error: { code: "NOT_FOUND", ... } }`. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-05** | API Integration | `AC-04-02` (`AC-05-05`) | `PATCH /api/operator/orders/:id/status` with `{ status: "ACCEPTED" }` on a `PENDING` order | Returns `200 OK`; order `status` updates to `"ACCEPTED"` in response and database. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-06** | API Integration | `AC-04-03` (`AC-05-06`) | `PATCH /api/operator/orders/:id/status` on a non-`PENDING` order (e.g., already `ACCEPTED` → `ACCEPTED` or `ACCEPTED` → `PENDING`) (`BR-07`) | Returns `409 CONFLICT` with `{ error: { code: "CONFLICT", ... } }`. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-07** | API Integration | `AC-04-01` (`AC-05-07`) | `PATCH /api/operator/orders/:id/status` called by a `CUSTOMER` | Returns `403 FORBIDDEN` with `{ error: { code: "FORBIDDEN", ... } }`. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |
| **OPS-08** | API Integration | `AC-04-03` (`AC-05-08`) | `PATCH /api/operator/orders/:id/status` with an invalid status string (e.g., `{ status: "INVALID" }`) | Returns `400 VALIDATION_ERROR` with `{ error: { code: "VALIDATION_ERROR", ... } }`. | `server/src/__tests__/sprint-1/operator.api.test.ts` | ⬜ |

---

### 2.5 End-to-End Multi-Viewport Suite (`E2E-01` to `E2E-09` — `ISSUE-06`)

| Test ID | Type | AC-XX Reference | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **E2E-01** | Playwright E2E | `AC-01-01`, `AC-06-01` | Customer self-registration flow on `/register` | Customer submits registration form and is redirected to login/catalog with active account created. | `e2e/sprint-1/customer-order-flow.spec.ts` | ⬜ |
| **E2E-02** | Playwright E2E | `AC-02-02` (`AC-04-06`), `AC-06-01` | Customer login and catalog browsing on `/catalog` | Customer logs in (`httpOnly` cookie set), sees seeded bakery items with prices formatted in THB (`฿85.00`, `฿220.00`) and stock counts. | `e2e/sprint-1/customer-order-flow.spec.ts` | ⬜ |
| **E2E-03** | Playwright E2E | `AC-03-01`, `AC-06-01` | Customer places a multi-item pre-order on `/orders/new` | Customer selects 2+ items, enters pickup note, submits order, and receives order confirmation with server-calculated THB total. | `e2e/sprint-1/customer-order-flow.spec.ts` | ⬜ |
| **E2E-04** | Playwright E2E | `AC-03-06` (`AC-04-19`), `AC-06-01` | Customer views own order list on `/orders` | Newly created order appears in My Orders list with `PENDING` status badge and matching THB total. | `e2e/sprint-1/customer-order-flow.spec.ts` | ⬜ |
| **E2E-05** | Playwright E2E | `AC-03-06` (`AC-04-20`), `AC-06-01` | Customer inspects order detail on `/orders/:id` | Order Detail page displays line items, quantities, snapshot unit prices in THB, pickup note, and total amount in THB. | `e2e/sprint-1/customer-order-flow.spec.ts` | ⬜ |
| **E2E-06** | Playwright E2E | `AC-04-04` (`AC-05-09`), `AC-06-02` | Operator logs in and views shared incoming order queue on `/operator/orders` | Operator sees incoming customer orders sorted with `PENDING` orders at the top of the queue. | `e2e/sprint-1/operator-acceptance-flow.spec.ts` | ⬜ |
| **E2E-07** | Playwright E2E | `AC-04-02` (`AC-05-11`), `AC-06-02` | Operator accepts a `PENDING` order from the queue | Clicking `"Accept Order"` transitions the row status badge to `ACCEPTED` in-place without full page reload. | `e2e/sprint-1/operator-acceptance-flow.spec.ts` | ⬜ |
| **E2E-08** | Playwright E2E | `AC-04-04` (`AC-05-10`), `AC-06-02` | Operator inspects full order detail on `/operator/orders/:id` | Operator detail view displays customer name/email, line items, THB totals, and `ACCEPTED` status. | `e2e/sprint-1/operator-acceptance-flow.spec.ts` | ⬜ |
| **E2E-09** | Playwright E2E | `AC-01-04`, `AC-06-03` | Unauthenticated guard & post-logout redirect protection | Navigating to `/catalog`, `/orders`, or `/operator/orders` without a valid session redirects immediately to `/login`. | `e2e/sprint-1/auth-guard.spec.ts` | ⬜ |

---

## 3. Playwright E2E Scenarios & Multi-Viewport Matrix

All Playwright E2E scenarios (`E2E-01` to `E2E-09`) are configured in `e2e/playwright.config.ts` to execute across all three target viewports:
- **Desktop:** `1280 × 720`
- **Tablet:** `768 × 1024`
- **Mobile:** `375 × 667`

| Test ID | Scenario | Viewports | Step-by-Step Execution Flow | Expected Verification Outcome |
|---|---|---|---|---|
| **E2E-01** | Customer Account Registration | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Navigate to `/register` → 2. Fill `name`, unique `email`, `password` → 3. Click Register button | User account is created (`201`), no validation errors appear, and browser navigates to `/login` (or authenticated `/catalog`). |
| **E2E-02** | Customer Login & Catalog Display | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Navigate to `/login` → 2. Enter customer credentials → 3. Submit → 4. Inspect `/catalog` cards | `httpOnly` cookie `token` is set; all 5 seeded `BakeryItemCard` items render with THB prices (`฿85.00`, `฿220.00`, etc.) and stock badges. |
| **E2E-03** | Multi-Item Pre-Order Submission | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Navigate to `/orders/new` → 2. Select 2× Artisan Butter Croissant (`8500` satang) + 1× Pain au Chocolat (`9000` satang) → 3. Enter `pickupNote` → 4. Click Submit | Order is created (`201`), stock is decremented in DB, and confirmation view shows authoritative total `฿260.00` (`26000` satang). |
| **E2E-04** | Customer My Orders History | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Navigate to `/orders` → 2. Locate newly created order card | Order card is visible with status badge `PENDING`, formatted total `฿260.00`, and link to order detail. |
| **E2E-05** | Customer Order Detail Receipt | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Click order link from `/orders` to `/orders/:id` → 2. Inspect `OrderSummary` breakdown | Displays `PENDING` badge, pickup note, `2 × ฿85.00 = ฿170.00`, `1 × ฿90.00 = ฿90.00`, and total `฿260.00`. |
| **E2E-06** | Operator Queue Inspection | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Log in as `operator@crustcraft.com` → 2. Navigate to `/operator/orders` | Shared operator queue loads (`200`), displaying incoming customer orders sorted with `PENDING` orders first. |
| **E2E-07** | Operator Order Acceptance (`PENDING` → `ACCEPTED`) | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. On `/operator/orders`, locate `PENDING` order row → 2. Click `"Accept Order"` button | `PATCH /api/operator/orders/:id/status` succeeds (`200`); row status badge updates in-place to `ACCEPTED` and `"Accept Order"` button disables/hides. |
| **E2E-08** | Operator Order Detail View | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Click `"View Details"` on accepted order (`/operator/orders/:id`) → 2. Inspect detail fields | Displays customer name & email, pickup note, itemized satang-to-THB breakdown, and `ACCEPTED` status badge. |
| **E2E-09** | Unauthenticated Route Guard & Redirect | Desktop (`1280px`), Tablet (`768px`), Mobile (`375px`) | 1. Clear cookies / logout → 2. Attempt direct navigation to `/catalog`, `/orders`, and `/operator/orders` | `ProtectedRoute` intercepts unauthenticated state and redirects browser URL to `/login` on every protected route. |

### 3.1 Responsive Screenshot Evidence Matrix (`e2e/screenshots/sprint-1/`)

During Playwright execution in `ISSUE-06`, the test suite captures 15 verification screenshots (`5 views × 3 viewports`):

| View / Step | Desktop (`1280px`) Filename | Tablet (`768px`) Filename | Mobile (`375px`) Filename |
|---|---|---|---|
| **1. Login Page** | `desktop-login-page.png` | `tablet-login-page.png` | `mobile-login-page.png` |
| **2. Catalog Page** | `desktop-catalog-page.png` | `tablet-catalog-page.png` | `mobile-catalog-page.png` |
| **3. Order Creation Form** | `desktop-order-form.png` | `tablet-order-form.png` | `mobile-order-form.png` |
| **4. Customer My Orders** | `desktop-my-orders.png` | `tablet-my-orders.png` | `mobile-my-orders.png` |
| **5. Operator Order Queue** | `desktop-operator-queue.png` | `tablet-operator-queue.png` | `mobile-operator-queue.png` |

---

## 4. AC-to-Test Traceability Verification (Zero Orphan ACs)

Every Acceptance Criterion defined in [`specification.md`](./specification.md) is mapped to at least one automated Test ID:

| Feature | Specification AC ID | Issue AC ID(s) | Mapped Automated Test ID(s) | Coverage Status |
|---|---|---|---|---|
| **F-01: Auth & RBAC** | `AC-01-01` | `AC-03-07`, `AC-03-16` | `AUTH-01`, `AUTH-10`, `E2E-01` | ✅ Covered (Unit + API + E2E) |
| **F-01: Auth & RBAC** | `AC-01-02` | `AC-03-09` | `AUTH-03`, `E2E-02` | ✅ Covered (API + E2E) |
| **F-01: Auth & RBAC** | `AC-01-03` | `AC-03-10`, `AC-03-11` | `AUTH-04`, `AUTH-05` | ✅ Covered (API) |
| **F-01: Auth & RBAC** | `AC-01-04` | `AC-03-12`, `AC-03-13`, `AC-03-14`, `AC-03-18` | `AUTH-06`, `AUTH-07`, `AUTH-08`, `E2E-09` | ✅ Covered (Unit + API + E2E) |
| **F-01: Auth & RBAC** | `AC-01-05` | `AC-03-15`, `AC-03-19` | `AUTH-09`, `OPS-01`, `OPS-07` | ✅ Covered (API) |
| **F-01: Auth & RBAC** | `AC-01-06` | `AC-03-08` | `AUTH-02` | ✅ Covered (API) |
| **F-02: Bakery Catalog** | `AC-02-01` | `AC-04-01` | `CAT-01`, `E2E-02` | ✅ Covered (API + E2E) |
| **F-02: Bakery Catalog** | `AC-02-02` | `AC-04-02`, `AC-04-06` | `CAT-02`, `E2E-02` | ✅ Covered (API + E2E) |
| **F-02: Bakery Catalog** | `AC-02-03` | `AC-04-03` | `CAT-03` | ✅ Covered (API) |
| **F-02: Bakery Catalog** | `AC-02-04` | `AC-04-04`, `AC-04-05` | `CAT-04`, `CAT-05` | ✅ Covered (API) |
| **F-03: Customer Pre-Order** | `AC-03-01` | `AC-04-07`, `AC-04-08`, `AC-04-18` | `ORD-01`, `ORD-02`, `ORD-12`, `E2E-03` | ✅ Covered (Unit + API + E2E) |
| **F-03: Customer Pre-Order** | `AC-03-02` | `AC-04-09` | `ORD-03` | ✅ Covered (Unit) |
| **F-03: Customer Pre-Order** | `AC-03-03` | `AC-04-10`, `AC-04-11` | `ORD-04`, `ORD-05` | ✅ Covered (API) |
| **F-03: Customer Pre-Order** | `AC-03-04` | `AC-04-13` | `ORD-07` | ✅ Covered (API) |
| **F-03: Customer Pre-Order** | `AC-03-05` | `AC-04-14` | `ORD-08` | ✅ Covered (API) |
| **F-03: Customer Pre-Order** | `AC-03-06` | `AC-04-15`, `AC-04-16`, `AC-04-17`, `AC-04-19`, `AC-04-20` | `ORD-09`, `ORD-10`, `ORD-11`, `E2E-04`, `E2E-05` | ✅ Covered (API + E2E) |
| **F-03: Customer Pre-Order** | `AC-03-07` | `AC-04-12` | `ORD-06` | ✅ Covered (API) |
| **F-04: Operator Queue** | `AC-04-01` | `AC-05-01`, `AC-05-07` | `OPS-01`, `OPS-07` | ✅ Covered (API) |
| **F-04: Operator Queue** | `AC-04-02` | `AC-05-05`, `AC-05-11` | `OPS-05`, `E2E-07` | ✅ Covered (API + E2E) |
| **F-04: Operator Queue** | `AC-04-03` | `AC-05-06`, `AC-05-08` | `OPS-06`, `OPS-08` | ✅ Covered (API) |
| **F-04: Operator Queue** | `AC-04-04` | `AC-05-02`, `AC-05-03`, `AC-05-04`, `AC-05-09`, `AC-05-10` | `OPS-02`, `OPS-03`, `OPS-04`, `E2E-06`, `E2E-08` | ✅ Covered (API + E2E) |
| **E2E Journeys** | `AC-06-01` | `AC-06-01`, `AC-06-04` | `E2E-01`, `E2E-02`, `E2E-03`, `E2E-04`, `E2E-05` | ✅ Covered (E2E 3 Viewports) |
| **E2E Journeys** | `AC-06-02` | `AC-06-02`, `AC-06-04` | `E2E-06`, `E2E-07`, `E2E-08` | ✅ Covered (E2E 3 Viewports) |
| **E2E Journeys** | `AC-06-03` | `AC-06-03`, `AC-06-04` | `E2E-09` | ✅ Covered (E2E 3 Viewports) |
