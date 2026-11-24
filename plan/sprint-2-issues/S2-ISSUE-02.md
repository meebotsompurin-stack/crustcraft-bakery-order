# S2-ISSUE-02 — DB Migration + F-06 Fulfillment/Cancellation + F-07 Simulated Payment

> **GitHub Issue:** [#62](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/62)  
> **Wave:** 2 (Parallel-safe with `S2-ISSUE-03` `#63`)  
> **Depends on:** `#61` (`S2-ISSUE-01`) merged into `sprint-2-staging`  
> **Branch:** `feat/s2-issue-02-fulfillment-cancel-payment` → `sprint-2-staging`  
> **Assignee:** `@meebotsompurin-stack` | **Reviewer:** `@poom2548`

---

## Objective
1. Apply Prisma PostgreSQL migration adding `Order.paymentStatus` (`UNPAID` | `PAID` | `FAILED`, default `"UNPAID"`) with `@@index([paymentStatus])` on `Order` (required by Sprint 3 `F-08`/`F-09` queries) and create shared state constants (`server/src/lib/orderStatus.ts`). `prisma/seed.ts` remains **unchanged** (non-destructive, idempotent seeding of Users & 5 `BakeryItem` records only — no sample orders seeded; automated tests create isolated order fixtures per suite).
2. Implement **F-06** (`FR-06-01`, `FR-06-02`, `BR-03`, `BR-04`, `BR-07`): forward-only fulfillment progression (`PENDING` → `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`) and atomic order cancellation (`PENDING` → `CANCELLED`) with inventory restoration for both `CUSTOMER` (own order) and `OPERATOR`.
3. Implement **F-07** (`FR-07-01`, `FR-07-02`): simulated payment transitions for customers (`POST /api/customer/orders/:id/pay`) and operators (`PATCH /api/operator/orders/:id/payment`), plus UI components (`PaymentStatusBadge`, `SimulatedPaymentCard`, updated `OperatorOrderRow`).

## TDD Rule (Mandatory for Deliverable 2)
1. Commit failing tests (`fulfillment.api.test.ts`, `payment.api.test.ts`) FIRST (`RED`).
2. Implement migration, services, controllers, routes, and React UI SECOND (`GREEN`).

## Acceptance Criteria
- [ ] **AC-S2-DB-01:** PostgreSQL Prisma migration adds `Order.paymentStatus` (`@default("UNPAID")`) and `@@index([paymentStatus])` on `Order`; `prisma/seed.ts` remains unchanged (no sample orders seeded, preserving idempotent Cloud SQL seeding).
- [ ] **AC-S2-F06-01 (`FUL-01`, `FUL-02`):** Sequential operator fulfillment `PENDING` → `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED` works; invalid/skip/backward transitions return `409 CONFLICT`.
- [ ] **AC-S2-F06-02 (`FUL-03`, `FUL-04`):** `PATCH /api/customer/orders/:id/cancel` cancels own `PENDING` order and atomically restores `BakeryItem.stockQuantity` inside `prisma.$transaction`.
- [ ] **AC-S2-F06-03 (`FUL-05`):** Cross-customer cancel returns `403 FORBIDDEN`; cancelling non-`PENDING` order returns `409 CONFLICT` with zero stock mutation.
- [ ] **AC-S2-F06-04 (`FUL-06`, `FUL-07`):** Operator cancelling `PENDING` order restores stock atomically; cancelling `ACCEPTED`+ returns `409 CONFLICT`.
- [ ] **AC-S2-F06-05 (`FUL-08`):** Operator queue sorts active statuses cleanly and UI displays next-step transition buttons & customer Cancel button (when `PENDING`).
- [ ] **AC-S2-F07-01 (`PAY-01`):** New orders default to `paymentStatus: "UNPAID"` and appear on all order endpoints.
- [ ] **AC-S2-F07-02 (`PAY-02`, `PAY-03`):** `POST /api/customer/orders/:id/pay` transitions `UNPAID`/`FAILED` → `PAID` (or `FAILED` when `simulateOutcome: "FAIL"`).
- [ ] **AC-S2-F07-03 (`PAY-04`, `PAY-05`):** Paying another customer's order returns `403 FORBIDDEN`; paying `CANCELLED` or already `PAID` order returns `409 CONFLICT`.
- [ ] **AC-S2-F07-04 (`PAY-06`, `PAY-07`):** `PATCH /api/operator/orders/:id/payment` updates payment status for `OPERATOR`; `CUSTOMER` gets `403 FORBIDDEN`.
- [ ] **AC-S2-F07-05:** Customer & Operator Order Detail views render `PaymentStatusBadge` and `SimulatedPaymentCard`.

## Files Allowed
- `prisma/schema.prisma`, `prisma/migrations/*` *(Note: `prisma/seed.ts` remains unchanged — no sample orders seeded)*
- `server/src/lib/orderStatus.ts`
- `server/src/services/operator.service.ts`, `server/src/controllers/operator.controller.ts`
- `server/src/services/orders.service.ts`, `server/src/controllers/orders.controller.ts`
- `server/src/services/payment.service.ts`, `server/src/controllers/payment.controller.ts`
- `server/src/routes/operator.routes.ts` *(append order/payment routes)*, `server/src/routes/customer.routes.ts` *(append cancel/pay routes)*
- `server/src/__tests__/sprint-2/fulfillment.api.test.ts`, `server/src/__tests__/sprint-2/payment.api.test.ts`
- `client/src/components/PaymentStatusBadge.tsx`, `client/src/components/SimulatedPaymentCard.tsx`, `client/src/components/OperatorOrderRow.tsx`
- `client/src/pages/OrderDetailPage.tsx`, `client/src/pages/MyOrdersPage.tsx`, `client/src/pages/OperatorOrderQueuePage.tsx`, `client/src/pages/OperatorOrderDetailPage.tsx`
- `client/src/services/api.ts` *(append fulfillment/cancel/payment API helpers)*
