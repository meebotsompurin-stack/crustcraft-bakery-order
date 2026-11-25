# Sprint 2 Test Plan & Software Test Specification (STS)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part B (Sprint 2 Software Test Specification)  
> **Sprint 2 Status:** 🟢 Verified & Released (`v2.0.0-sprint2` / `c63f876`; `E2E-S2-05` verified in `v2.1.0-s3-progress`)  
> **Total Sprint 2 Test IDs:** 29 (`ADM` × 8, `FUL` × 8, `PAY` × 7, `E2E-S2` × 6 — **29/29 PASS**)

---

## 1. Test Strategy & TDD Discipline
- **TDD Workflow:** For `S2-ISSUE-02` (`#62`) and `S2-ISSUE-03` (`#63`), failing tests MUST be written and committed FIRST (`RED`), followed by implementation and green test verification (`GREEN`).
- **Database Environment:** PostgreSQL 16 test database (`DATABASE_URL`) running `prisma migrate deploy` prior to Vitest/Supertest execution (matching `.github/workflows/ci-docker.yml`).
- **Regression Guarantee:** Every PR into `sprint-2-staging` MUST keep all Sprint 1 tests (44 tests) and Lab 6 defect `#58` regression tests passing.

---

## 2. Test Execution Matrix

> **Status Legend:** `⬜` Planned | `🟢 PASS` Verified | `🔴 FAIL` Failed

### 2.1 F-05: Bakery Catalog Administration (`ADM-01` to `ADM-08` — `S2-ISSUE-03` / `#63`)

| Test ID | Type | AC Reference | Precondition / Input | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **ADM-01** | API Integration | `AC-S2-F05-01` | Authenticated `OPERATOR` calls `POST /api/operator/catalog` with valid new item (`price: 9500`, `stockQuantity: 25`) | Returns `201 Created`; item persisted in PostgreSQL with exact integer satang price and `isAvailable: true`. | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-02** | API Integration | `AC-S2-F05-02` | `OPERATOR` calls `PATCH /api/operator/catalog/:id` updating `price`, `description`, and `category` | Returns `200 OK`; updated fields persisted in DB. | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-03** | API Integration | `AC-S2-F05-02` | `OPERATOR` calls `PATCH /api/operator/catalog/:id` to replenish `stockQuantity` and toggle `isAvailable` | Returns `200 OK`; new `stockQuantity` and `isAvailable` persisted in DB. | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-04** | API Integration | `AC-S2-F05-03` | Catalog contains both `isAvailable: true` and `isAvailable: false` items; call `GET /api/operator/catalog` vs `GET /api/catalog` | Operator endpoint returns ALL items; public `/api/catalog` excludes `isAvailable: false` (`BR-05`). | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-05** | API Integration | `AC-S2-F05-04` | Invalid inputs (`price: 0`, `price: 85.5`, `stockQuantity: -1`), duplicate `name`, and unknown `:id` | Returns `400 VALIDATION_ERROR`, `409 CONFLICT`, and `404 NOT_FOUND` respectively with standard error envelope. | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-06** | API Integration | `AC-S2-F05-05` | Unauthenticated user and authenticated `CUSTOMER` call `GET`/`POST`/`PATCH /api/operator/catalog` | Returns `401 UNAUTHORIZED` and `403 FORBIDDEN` respectively. | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-07** | API Integration | `AC-S2-F05-06` | Customer places order at `8500` satang; `OPERATOR` updates item price to `12000` satang; re-fetch historical order | Historical `OrderItem.unitPriceAtOrder` remains `8500` and `Order.totalAmount` unchanged (`BR-02`). | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |
| **ADM-08** | API Integration | `AC-S2-F05-07` | `OPERATOR` sets `isAvailable: false` → customer tries ordering (`409`); `OPERATOR` re-enables and restocks from `0` to `10` → customer orders (`201`) | Archived item blocked with `409 CONFLICT`; restored & restocked item accepts order cleanly. | `server/src/__tests__/sprint-2/admin.api.test.ts` | 🟢 PASS |

---

### 2.2 F-06: Order Fulfillment & Cancellation (`FUL-01` to `FUL-08` — `S2-ISSUE-02` / `#62`)

| Test ID | Type | AC Reference | Precondition / Input | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **FUL-01** | API Integration | `AC-S2-F06-01` | `OPERATOR` advances a `PENDING` order sequentially through `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED` | Each step returns `200 OK` and persists updated status in PostgreSQL. | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-02** | API Integration | `AC-S2-F06-01` | `OPERATOR` attempts invalid transitions (`PENDING` → `BAKING`, `BAKING` → `ACCEPTED`, `COMPLETED` → `READY_FOR_PICKUP`) | Every invalid transition rejected with `409 CONFLICT` (`BR-07`); DB status unchanged. | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-03** | API Integration | `AC-S2-F06-02` | Owning `CUSTOMER` cancels a `PENDING` multi-item order via `PATCH /api/customer/orders/:id/cancel` | Returns `200 OK` with `status: "CANCELLED"`; every item's `BakeryItem.stockQuantity` is restored to pre-order count. | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-04** | API Integration | `AC-S2-F06-02` | Repeat/concurrent cancel on an already `CANCELLED` order | Second request returns `409 CONFLICT`; `stockQuantity` is NOT restored twice (atomic conditional update). | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-05** | API Integration | `AC-S2-F06-03` | Customer B tries cancelling Customer A's `PENDING` order; Customer A tries cancelling own `ACCEPTED` order | Cross-customer returns `403 FORBIDDEN` (`BR-04`); cancelling `ACCEPTED` returns `409 CONFLICT` with zero stock change. | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-06** | API Integration | `AC-S2-F06-04` | `OPERATOR` calls `PATCH /api/operator/orders/:id/status` with `{ status: "CANCELLED" }` on a `PENDING` order | Returns `200 OK` with `status: "CANCELLED"` and atomically restores `stockQuantity`. | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-07** | API Integration | `AC-S2-F06-04` | `OPERATOR` attempts to cancel an order already in `ACCEPTED` or `BAKING` state | Returns `409 CONFLICT`; status and stock unchanged. | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |
| **FUL-08** | API Integration | `AC-S2-F06-05` | Multiple orders exist across all 6 statuses; `OPERATOR` calls `GET /api/operator/orders` | Orders sorted cleanly by operational priority (`PENDING` → `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED` → `CANCELLED`). | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` | 🟢 PASS |

---

### 2.3 F-07: Simulated Payment Transitions (`PAY-01` to `PAY-07` — `S2-ISSUE-02` / `#62`)

| Test ID | Type | AC Reference | Precondition / Input | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **PAY-01** | API Integration | `AC-S2-F07-01` | Customer creates a new order via `POST /api/customer/orders` | Returned & persisted order has `paymentStatus: "UNPAID"`. | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |
| **PAY-02** | API Integration | `AC-S2-F07-02` | Owning `CUSTOMER` calls `POST /api/customer/orders/:id/pay` (default success) | Returns `200 OK` with `paymentStatus: "PAID"` persisted in PostgreSQL. | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |
| **PAY-03** | API Integration | `AC-S2-F07-02` | Owning `CUSTOMER` sends `{ simulateOutcome: "FAIL" }`, then retries with `{ simulateOutcome: "SUCCESS" }` | First call returns `200 OK` (`paymentStatus: "FAILED"`); retry transitions `FAILED` → `"PAID"`. | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |
| **PAY-04** | API Integration | `AC-S2-F07-03` | Customer B attempts `POST /api/customer/orders/:id/pay` on Customer A's order | Returns `403 FORBIDDEN` (`BR-04`). | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |
| **PAY-05** | API Integration | `AC-S2-F07-03` | Customer attempts to pay an already `PAID` order or a `CANCELLED` order | Returns `409 CONFLICT`; payment status unchanged. | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |
| **PAY-06** | API Integration | `AC-S2-F07-04` | `OPERATOR` calls `PATCH /api/operator/orders/:id/payment` with `{ paymentStatus: "PAID" }` on active order vs `CANCELLED` order | Active order returns `200 OK` (`PAID`); `CANCELLED` order returns `409 CONFLICT`. | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |
| **PAY-07** | API Integration | `AC-S2-F07-04` | `CUSTOMER` calls `PATCH /api/operator/orders/:id/payment`; `OPERATOR` sends invalid `paymentStatus` | Customer gets `403 FORBIDDEN`; invalid status string returns `400 VALIDATION_ERROR`. | `server/src/__tests__/sprint-2/payment.api.test.ts` | 🟢 PASS |

---

### 2.4 Playwright Multi-Viewport E2E & Continuity Suite (`E2E-S2-01` to `E2E-S2-06` — `S2-ISSUE-05` / `#65`)

> **Playwright Config Prerequisite (`e2e/playwright.config.ts`):** Update `testDir` from `./sprint-1` so both `e2e/sprint-1/` and `e2e/sprint-2/` execute, and replace the legacy SQLite `file:./dev.db` fallback with PostgreSQL `DATABASE_URL`.  
> **Two-Stage Release Alignment:** `E2E-S2-01`..`04` and `E2E-S2-06` verify Release 1 (**`v2.0.0-sprint2`**); `E2E-S2-05` (`F-08` reporting) + full regression verify Release 2 (**`v2.1.0-s3-progress`**).

| Test ID | Type | AC Reference | Scenario (Desktop 1280px, Tablet 768px, Mobile 375px) | Test File | Status |
|---|---|---|---|---|:---:|
| **E2E-S2-01** | Playwright E2E | `AC-S2-F05-08` | Operator creates a new bakery item, restocks it, and toggles availability on `/operator/catalog`; customer sees/cannot see it accordingly. | `e2e/sprint-2/catalog-admin.spec.ts` | 🟢 PASS |
| **E2E-S2-02** | Playwright E2E | `AC-S2-F06-02` | Customer places order, navigates to `/orders/:id`, clicks `"Cancel Order"`, confirms `CANCELLED` badge and restored stock on `/catalog`. | `e2e/sprint-2/fulfillment-cancel.spec.ts` | 🟢 PASS |
| **E2E-S2-03** | Playwright E2E | `AC-S2-F06-01` | Operator advances a customer order end-to-end (`PENDING` → `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`) and customer sees `COMPLETED`. | `e2e/sprint-2/fulfillment-cancel.spec.ts` | 🟢 PASS |
| **E2E-S2-04** | Playwright E2E | `AC-S2-F07-05` | Customer simulates payment (`UNPAID` → `PAID`) via `SimulatedPaymentCard`; Operator confirms `Paid` badge on `/operator/orders/:id`. | `e2e/sprint-2/payment.spec.ts` | 🟢 PASS |
| **E2E-S2-05** | Playwright E2E | `AC-S3-F08-07` | Operator views `/operator/reports` and verifies completed order THB revenue and top-selling item appear accurately. | `e2e/sprint-2/reporting.spec.ts` | 🟢 PASS |
| **E2E-S2-06** | Playwright E2E | Deliverable 2 Part A | Sprint 1 continuity regression: original auth, catalog, pre-order, operator acceptance, and role-guard journeys remain green. | `e2e/sprint-1/*.spec.ts` | 🟢 PASS |
