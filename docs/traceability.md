# Requirements Traceability Matrix (RTM)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Document Version:** `2.1.0` (Deliverable 2 Integrated Release Candidate — Sprint 1 + Sprint 2 + Sprint 3 `F-08` + Lab 7 `CR-01`)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

### Revision History
| Version | Date | Issue / PR | Summary of Changes |
|---|---|---|---|
| `1.0.0` | 2026-11-01 | Sprint 1 Baseline (`v1.0.0-sprint1`) | Initial Requirements Traceability Matrix mapping `FR-01`–`FR-09`, `BR-01`–`BR-07`, and `NFR-01`–`NFR-06`. |
| `1.1.0` | 2026-11-24 | Lab 7 `CR-01` (`#74` / `LAB7-ISSUE-01`) | Added `CR-01` traceability for revised `BR-03` & `FR-03-01` (`AC-CR01-01`..`AC-CR01-06` → `CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`) and recorded intended revision of `ORD-08` (L429). |
| `1.1.1` | 2026-11-24 | Lab 7 Release (`#75` / `#76`, `v2.0.1-lab7`) | Synced final verified release tag `v2.0.1-lab7` (annotated tag `933488a` → `main` commit `b80a0d0`, Cloud Run revision `crustcraft-00012-4dq`, `137/137` automated tests passing). |
| `2.0.0` | 2026-11-24 | Sprint 2 & `F-08` (`#65` / `S2-ISSUE-05`, PR `#79`) | Mapped verified Sprint 2 (`F-05`–`F-07`, `v2.0.0-sprint2`) and Sprint 3 progress (`F-08` Sales Reporting, `RPT-01..06`, `E2E-S2-05`) with explicit `🟢 PASS` / `⬜ Planned` statuses. |
| `2.1.0` | 2026-11-25 | Deliverable 2 Integrated Candidate (`v2.1.0-s3-progress`) | Unified Sprint 1, Lab 5–7 (`#58`, `CR-01`), Sprint 2 (`F-05`–`F-07`), and Sprint 3 progress (`F-08`) into one integrated Requirements Traceability Matrix; `F-09` explicitly retained as `⬜ Planned` for Final Delivery (13 Dec 2026). |

---

## 1. Overview & Verification Strategy

This document establishes bi-directional requirements traceability for the CrustCraft Artisan Bakery platform across Sprints 1–3 and Labs 5–7 (Cloud CI/CD, UAT defect resolution `#58`, and `CR-01` maintenance). Every Functional Requirement (`FR-XX`), Business Rule (`BR-XX`), and Non-Functional Requirement (`NFR-XX`) maps directly to its implementing Feature (`F-XX`), API endpoints / UI routes, Acceptance Criteria (`AC-XX`), automated Test IDs, target test files, and honest verification status.

### Testing Level & Status Legend
- **Unit (Server):** Pure domain & calculation logic via Vitest (`server/src/__tests__/unit/*.test.ts`).
- **Component UI (Client):** React component unit/DOM tests via Vitest + React Testing Library + `jsdom` (`client/src/components/__tests__/*.test.tsx`).
- **API / DB:** Full HTTP request-response and PostgreSQL 16 persistence tests via Supertest + Vitest (`server/src/__tests__/sprint-{1,2,3}/*.api.test.ts`, `server/src/__tests__/lab-7/*.api.test.ts`).
- **E2E:** Multi-viewport browser user journeys (Desktop `1280px`, Tablet `768px`, Mobile `375px`) via Playwright (`e2e/sprint-{1,2}/*.spec.ts`, `e2e/lab-7/*.spec.ts`).
- **Architectural / Config:** Static code analysis, container lifecycle validation, and GCP Cloud Run post-deploy checks (`deploy/tests/*`, `deploy/smoke_test.py`).
- **Status:** `🟢 PASS` Verified | `⬜ Planned` Contracted for Final Delivery (13 Dec 2026).

---

## 2. Comprehensive Traceability Matrix

| Requirement / Rule ID | Summary Description | Feature | Sprint | API Endpoint(s) & UI Route / Component | AC ID | Test ID(s) & Verification File | Status |
|---|---|:---:|:---:|---|---|---|:---:|
| **FR-01-01** | User registration (`name`, unique `email`, `password` ≥ 8, default `CUSTOMER`) | `F-01` | Sprint 1 | `POST /api/auth/register` · `RegisterPage.tsx` (`/register`) | `AC-01-01` | `AUTH-01` (`sprint-1/auth.api.test.ts`), `E2E-01` (`e2e/sprint-1/customer-order-flow.spec.ts`) | 🟢 PASS |
| **FR-01-02** | User login issuing 24h JWT (`bcrypt` verify) in `httpOnly` cookie & body | `F-01` | Sprint 1 | `POST /api/auth/login` · `LoginPage.tsx` (`/login`) | `AC-01-02` | `AUTH-03` (`sprint-1/auth.api.test.ts`), `unit/auth.test.ts` | 🟢 PASS |
| **FR-01-03** | Dual-channel JWT extraction (`httpOnly` cookie primary, `Bearer` fallback) | `F-01` | Sprint 1 | `GET /api/auth/me` · `authenticate.middleware.ts` | `AC-01-04` | `AUTH-06`, `AUTH-08` (`sprint-1/auth.api.test.ts`) | 🟢 PASS |
| **FR-01-04** | Role-based access control via `requireRole` middleware | `F-01` | Sprint 1 | `requireRole.middleware.ts` · `ProtectedRoute.tsx` | `AC-01-05` | `AUTH-09` (`sprint-1/auth.api.test.ts`), `E2E-09` (`e2e/sprint-1/auth-guard.spec.ts`) | 🟢 PASS |
| **FR-01-05** | User logout revoking session via cookie clearance | `F-01` | Sprint 1 | `POST /api/auth/logout` · `AuthContext.tsx` | `AC-03-09` | `AUTH-03` (`sprint-1/auth.api.test.ts`), `E2E-09` (`e2e/sprint-1/auth-guard.spec.ts`) | 🟢 PASS |
| **FR-01-06** | Duplicate email registration rejected with `409 CONFLICT` | `F-01` | Sprint 1 | `POST /api/auth/register` · `auth.service.ts` | `AC-03-08` | `AUTH-02` (`sprint-1/auth.api.test.ts`) | 🟢 PASS |
| **FR-02-01** | Active menu catalog listing (`isAvailable == true`) | `F-02` | Sprint 1 | `GET /api/catalog` · `CatalogPage.tsx` (`/catalog`) | `AC-02-01` | `CAT-01` (`sprint-1/catalog.api.test.ts`), `E2E-02` (`e2e/sprint-1/customer-order-flow.spec.ts`) | 🟢 PASS |
| **FR-02-02** | Catalog payload schema (`id`, `name`, satang `price`, `stockQuantity`, `category`) | `F-02` | Sprint 1 | `GET /api/catalog` · `catalog.service.ts` | `AC-02-02` | `CAT-02` (`sprint-1/catalog.api.test.ts`) | 🟢 PASS |
| **FR-02-03** | Single bakery item detail lookup by ID (`404 NOT_FOUND` if missing) | `F-02` | Sprint 1 | `GET /api/catalog/:id` · `catalog.service.ts` | `AC-04-04` | `CAT-04`, `CAT-05` (`sprint-1/catalog.api.test.ts`) | 🟢 PASS |
| **FR-02-04** | Frontend THB display (`฿(price/100).toFixed(2)`) & Out-of-Stock badge | `F-02` | Sprint 1 | `BakeryItemCard.tsx` · `CatalogPage.tsx` | `AC-04-06` | `CAT-02`, `E2E-02` (`e2e/sprint-1/customer-order-flow.spec.ts`) | 🟢 PASS |
| **FR-03-01** | Multi-item pre-order creation with `1 <= quantity <= 5` cap (Lab 7 `CR-01`), unique `bakeryItemId`, and optional `pickupNote` (≤ 500 chars, Lab 6 `#58`) | `F-03` | Sprint 1 (+Lab 6/7) | `POST /api/customer/orders` · `OrderPage.tsx` (`/orders/new`), `BakeryItemCard.tsx` | `AC-03-01`, `AC-03-07`, `AC-CR01-01`..`06` | `ORD-01`, `ORD-06 / #58` (`sprint-1/orders.api.test.ts`), `CR01-01..06` (`lab-7/order-quantity-cap.api.test.ts`), `CR01-UI-01..02` (`BakeryItemCard.test.tsx`), `E2E-03`, `E2E-CR01-01` (`e2e/lab-7/order-quantity-cap.spec.ts`) | 🟢 PASS |
| **FR-03-02** | Server-side total calculation in integer satangs from DB prices | `F-03` | Sprint 1 | `POST /api/customer/orders` · `orders.service.ts` | `AC-04-08` | `ORD-02` (`unit/orderCalculation.test.ts`) | 🟢 PASS |
| **FR-03-03** | Unit price snapshotting into `OrderItem.unitPriceAtOrder` | `F-03` | Sprint 1 | `POST /api/customer/orders` · `orders.service.ts` | `AC-03-02` | `ORD-03`, `ORD-04` (`unit/orderCalculation.test.ts`, `sprint-1/orders.api.test.ts`) | 🟢 PASS |
| **FR-03-04** | Atomic stock deduction inside `prisma.$transaction` | `F-03` | Sprint 1 | `POST /api/customer/orders` · `orders.service.ts` | `AC-03-03` | `ORD-04`, `ORD-05` (`sprint-1/orders.api.test.ts`) | 🟢 PASS |
| **FR-03-05** | New pre-orders initialized with `PENDING` status | `F-03` | Sprint 1 | `POST /api/customer/orders` · `OrderDetailPage.tsx` | `AC-04-18` | `ORD-12` (`sprint-1/orders.api.test.ts`), `E2E-04` | 🟢 PASS |
| **FR-03-06** | Customer retrieves own order history & detail (ownership isolated) | `F-03` | Sprint 1 | `GET /api/customer/orders`, `GET /api/customer/orders/:id` · `MyOrdersPage.tsx`, `OrderDetailPage.tsx` | `AC-04-15`..`20` | `ORD-09`, `ORD-10`, `ORD-11` (`sprint-1/orders.api.test.ts`), `E2E-04`, `E2E-05` | 🟢 PASS |
| **FR-04-01** | Operator shared queue sorted by active priority (`PENDING` first, `createdAt DESC`) | `F-04` | Sprint 1 | `GET /api/operator/orders` · `OperatorOrderQueuePage.tsx` (`/operator/orders`) | `AC-05-02` | `OPS-02` (`sprint-1/operator.api.test.ts`), `FUL-08` (`sprint-2/fulfillment.api.test.ts`), `E2E-06` | 🟢 PASS |
| **FR-04-02** | Operator order detail inspection with customer identity & line items | `F-04` | Sprint 1 | `GET /api/operator/orders/:id` · `OperatorOrderDetailPage.tsx` (`/operator/orders/:id`) | `AC-05-03` | `OPS-03`, `OPS-04` (`sprint-1/operator.api.test.ts`), `E2E-08` | 🟢 PASS |
| **FR-04-03** | Operator transitions `PENDING` → `ACCEPTED` | `F-04` | Sprint 1 | `PATCH /api/operator/orders/:id/status` · `OperatorOrderRow.tsx` | `AC-05-05` | `OPS-05` (`sprint-1/operator.api.test.ts`), `E2E-07` (`e2e/sprint-1/operator-acceptance-flow.spec.ts`) | 🟢 PASS |
| **FR-04-04** | Reject invalid status transitions (`409`) or non-operator access (`403`) | `F-04` | Sprint 1 | `PATCH /api/operator/orders/:id/status` · `operator.service.ts` | `AC-05-06`, `AC-05-08` | `OPS-06`, `OPS-07`, `OPS-08` (`sprint-1/operator.api.test.ts`) | 🟢 PASS |
| **FR-05-01** | Operator creates new bakery catalog items (integer satang price, unique name) | `F-05` | Sprint 2 | `POST /api/operator/catalog` · `OperatorCatalogPage.tsx` (`/operator/catalog`) | `AC-S2-F05-01`, `AC-S2-F05-04` | `ADM-01`, `ADM-05`, `ADM-06` (`sprint-2/admin.api.test.ts`), `E2E-S2-01` (`e2e/sprint-2/catalog-admin.spec.ts`) | 🟢 PASS |
| **FR-05-02** | Operator lists all items (active + archived), edits price/details, restocks & toggles `isAvailable` | `F-05` | Sprint 2 | `GET /api/operator/catalog`, `PATCH /api/operator/catalog/:id` · `OperatorCatalogPage.tsx` | `AC-S2-F05-02`..`08` | `ADM-02`, `ADM-03`, `ADM-04`, `ADM-07`, `ADM-08` (`sprint-2/admin.api.test.ts`), `E2E-S2-01` | 🟢 PASS |
| **FR-06-01** | Multi-stage fulfillment lifecycle (`ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`) | `F-06` | Sprint 2 | `PATCH /api/operator/orders/:id/status` · `OperatorOrderRow.tsx`, `OperatorOrderDetailPage.tsx` | `AC-S2-F06-01`, `AC-S2-F06-05` | `FUL-01`, `FUL-02`, `FUL-08` (`sprint-2/fulfillment.api.test.ts`), `E2E-S2-03` (`e2e/sprint-2/fulfillment-cancel.spec.ts`) | 🟢 PASS |
| **FR-06-02** | Order cancellation (`PENDING` → `CANCELLED`) with atomic stock restoration (Customer & Operator) | `F-06` | Sprint 2 | `PATCH /api/customer/orders/:id/cancel`, `PATCH /api/operator/orders/:id/status` · `OrderDetailPage.tsx` | `AC-S2-F06-02`..`04` | `FUL-03`, `FUL-04`, `FUL-05`, `FUL-06`, `FUL-07` (`sprint-2/fulfillment.api.test.ts`), `E2E-S2-02` | 🟢 PASS |
| **FR-07-01** | Persistent `Order.paymentStatus` (`UNPAID`, `PAID`, `FAILED`) + `@@index([paymentStatus])` | `F-07` | Sprint 2 | `prisma/schema.prisma` (`20261123153646_add_order_payment_status`) · `PaymentStatusBadge.tsx` | `AC-S2-DB-01`, `AC-S2-F07-01` | `PAY-01` (`sprint-2/payment.api.test.ts`) | 🟢 PASS |
| **FR-07-02** | Simulated customer payment (`SUCCESS`/`FAIL`) & operator counter settlement | `F-07` | Sprint 2 | `POST /api/customer/orders/:id/pay`, `PATCH /api/operator/orders/:id/payment` · `SimulatedPaymentCard.tsx` | `AC-S2-F07-02`..`05` | `PAY-02`..`PAY-07` (`sprint-2/payment.api.test.ts`), `E2E-S2-04` (`e2e/sprint-2/payment.spec.ts`) | 🟢 PASS |
| **FR-08-01** | Operator sales summary: `COMPLETED`-only integer satang revenue, status/payment breakdown, top-selling items, date filters | `F-08` | Sprint 3 (Deliv. 2) | `GET /api/operator/reports/summary` · `OperatorReportsPage.tsx` (`/operator/reports`) | `AC-S3-F08-01`..`07` | `RPT-01`, `RPT-02` (`unit/reporting.test.ts`); `RPT-03`..`06` (`sprint-3/reporting.api.test.ts`); `E2E-S2-05` (`e2e/sprint-2/reporting.spec.ts`) | 🟢 PASS |
| **FR-09-01** | Multi-criteria order search & filtering (`status`, `paymentStatus`, `q`, `from`/`to`, `minTotal`/`maxTotal`) | `F-09` | Sprint 3 (Final) | `GET /api/operator/orders?...` · `OperatorOrderQueuePage.tsx` filter bar | `AC-S3-F09-01`..`04` | `SRCH-01`..`03` (`sprint-3/search.api.test.ts`), `SRCH-04` (`e2e/sprint-3/search-filter.spec.ts`) | ⬜ Planned |
| **FR-09-02** | Final release regression hardening across Sprints 1–3 & Lab 7 (`CR-01` already integrated at `v2.0.1-lab7`) | `F-09` | Sprint 3 (Final) | Full system regression across Sprints 1–3 & Lab 7 | `AC-S3-F09-05` | `REGRESS-01` (`npm test`), `REGRESS-02` (`e2e/regression/*.spec.ts`) | ⬜ Planned |
| **BR-01** | Authoritative server-side pricing & revenue calculation in integer satang | `F-03`, `F-05`, `F-08` | Sprint 1–3 | `orders.service.ts`, `catalogAdmin.service.ts`, `reporting.service.ts` | `AC-04-08`, `AC-S3-F08-01` | `ORD-02`, `ADM-05`, `RPT-01` (`unit/orderCalculation.test.ts`, `unit/reporting.test.ts`) | 🟢 PASS |
| **BR-02** | Historical `OrderItem.unitPriceAtOrder` snapshot unaffected by catalog edits | `F-03`, `F-05`, `F-08` | Sprint 1–3 | `orders.service.ts`, `catalogAdmin.service.ts`, `reporting.service.ts` | `AC-03-02`, `AC-S2-F05-06` | `ORD-03`, `ADM-07`, `RPT-02` (`sprint-2/admin.api.test.ts`, `unit/reporting.test.ts`) | 🟢 PASS |
| **BR-03** | Per-item quantity cap (`1 <= quantity <= 5`), duplicate `bakeryItemId` `400` guard, `400`-before-`409` precedence, stock validation & transactional atomicity (deduct & restore via `prisma.$transaction`) *(revised v1.1.0 / `CR-01`)* | `F-03`, `F-06` | Sprint 1–2 / Lab 7 | `orders.service.ts`, `operator.service.ts`, `BakeryItemCard.tsx`, `OrderPage.tsx` | `AC-03-03`, `AC-S2-F06-02`, `AC-CR01-01`..`06` | `ORD-04`, `ORD-05`, `ORD-08` *(updated L429)*, `FUL-03`, `FUL-04`, `FUL-06`, `CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01` | 🟢 PASS |
| **BR-04** | Customer ownership & data isolation (`403 FORBIDDEN` on cross-customer access) | `F-03`, `F-06`, `F-07` | Sprint 1–2 | `orders.service.ts`, `payment.service.ts` | `AC-03-06`, `AC-S2-F06-03`, `AC-S2-F07-03` | `ORD-11`, `FUL-05`, `PAY-04` | 🟢 PASS |
| **BR-05** | `isAvailable` vs `stockQuantity` semantics (0 stock stays visible; archived hidden) | `F-02`, `F-03`, `F-05` | Sprint 1–2 | `catalog.service.ts`, `catalogAdmin.service.ts`, `orders.service.ts` | `AC-04-01`, `AC-S2-F05-03`, `AC-S2-F05-07` | `CAT-01`, `CAT-03`, `ORD-07`, `ORD-08`, `ADM-04`, `ADM-08` | 🟢 PASS |
| **BR-06** | Shared global operator queue across all `OPERATOR` accounts | `F-04`, `F-06` | Sprint 1–2 | `GET /api/operator/orders`, `PATCH /api/operator/orders/:id/status` | `AC-05-02` | `OPS-02`, `FUL-06`, `FUL-08` | 🟢 PASS |
| **BR-07** | Forward-only deterministic order state machine & conflict guard (`409 CONFLICT`) | `F-04`, `F-06` | Sprint 1–2 | `server/src/lib/orderStatus.ts`, `operator.service.ts`, `orders.service.ts` | `AC-05-06`, `AC-S2-F06-01`..`04` | `OPS-06`, `FUL-01`, `FUL-02`, `FUL-04`, `FUL-05`, `FUL-07` | 🟢 PASS |
| **NFR-01** | Catalog response latency `< 100ms` for up to 100 items | `F-02` | Sprint 1 | `GET /api/catalog` | `AC-04-01` | `CAT-01` (`sprint-1/catalog.api.test.ts`) | 🟢 PASS |
| **NFR-02** | `bcrypt` (≥ 10 rounds) password hashing & `httpOnly`, `SameSite=Lax` JWT cookie | `F-01` | Sprint 1 | `auth.service.ts`, `auth.controller.ts` | `AC-03-09`, `AC-03-16` | `AUTH-03`, `AUTH-10` (`unit/auth.test.ts`, `sprint-1/auth.api.test.ts`) | 🟢 PASS |
| **NFR-03** | Uniform error envelope `{ error: { code, message, details? } }` without stack traces | `F-01`–`F-08` | Sprint 1–3 | `server/src/app.ts` global error handler | `AC-03-20` | Verified across all API integration suites (`AUTH`, `CAT`, `ORD`, `OPS`, `ADM`, `FUL`, `PAY`, `RPT`, `CR01`) | 🟢 PASS |
| **NFR-04** | Responsive ergonomics & zero horizontal overflow at `1280px`, `768px`, `375px` | `F-01`–`F-08` | Sprint 1–3 | All pages in `client/src/pages/*` | `AC-06-01`..`06`, `AC-S3-F08-07`, `AC-CR01-06` | `E2E-01`..`09` (`e2e/sprint-1/*`), `E2E-S2-01`..`05` (`e2e/sprint-2/*`), `E2E-CR01-01` (`e2e/lab-7/*`) | 🟢 PASS |
| **NFR-05** | Persistent database durability across container restarts & redeployments | System Base | Lab 5 | Cloud SQL PostgreSQL 16 + Cloud Run (`deploy.yml`, `docker-compose.yml`) | `ADR-01` | Lab 5 Persistence & Rollback Protocol (`docs/labs/lab-05/deployment.md`, `deploy/smoke_test.py`) | 🟢 PASS |
| **NFR-06** | Exact integer satang arithmetic (zero IEEE 754 floating-point drift) | `F-03`, `F-05`, `F-08` | Sprint 1–3 | `orders.service.ts`, `catalogAdmin.service.ts`, `reporting.service.ts` | `AC-04-08`, `AC-S3-F08-01` | `ORD-02` (`unit/orderCalculation.test.ts`), `RPT-01`, `RPT-02` (`unit/reporting.test.ts`) | 🟢 PASS |

---

## 2.1 Lab 7 Maintenance Change Traceability (`CR-01`: `BR-03` / `FR-03-01` Max 5 Per-Item Cap)

| CR AC ID | Linked Rule / Req | TA Condition | Summary Description | Test ID(s) | Verification Level & Target File | Status |
|---|---|---|---|---|---|:---:|
| **AC-CR01-01** | `BR-03`, `FR-03-01` | Core `CR-01` | Boundary allowed (`quantity: 5` → `201 Created`, stock decremented by 5) and exceeded (`quantity: 6` → `400 VALIDATION_ERROR`, `details[0].field === "items[0].quantity"`, zero stock deducted, no order persisted) | `CR01-01`, `CR01-02` | API Integration (`server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`) | 🟢 PASS |
| **AC-CR01-02** | `BR-03`, `FR-03-01` | TA Condition #2 | Multi-item payload (`items[0].quantity: 2`, `items[1].quantity: 6`) fails with `400 VALIDATION_ERROR` and exact indexed `details[0].field === "items[1].quantity"`, with zero stock deducted for either item | `CR01-03` | API Integration (`server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`) | 🟢 PASS |
| **AC-CR01-03** | `BR-03`, `BR-05`, `FR-03-01` | TA Conditions #2 & #3 | Stock < 5 (`quantity: 5`, `stockQuantity: 3`) still returns `409 CONFLICT` (`CR01-04`, `ORD-08` updated L429); simultaneous `quantity > 5` and `quantity > stockQuantity` (`quantity: 6`, `stockQuantity: 3`) returns `400 VALIDATION_ERROR` **before** `409 CONFLICT` (`CR01-06`) | `CR01-04`, `CR01-06`, `ORD-08` *(updated L429)* | API Integration (`server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`, `server/src/__tests__/sprint-1/orders.api.test.ts`) | 🟢 PASS |
| **AC-CR01-04** | `BR-03`, `FR-03-01` | TA Condition #1 | Duplicate `bakeryItemId` entries in `items[]` (e.g., two rows of `quantity: 5` for the same item) are rejected with `400 VALIDATION_ERROR` (`details[0].field === "items[1].bakeryItemId"`) before transaction execution, deducting zero stock | `CR01-05` | API Integration (`server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`) | 🟢 PASS |
| **AC-CR01-05** | `FR-03-01` | TA Condition #3 | Frontend `BakeryItemCard` caps `+` at `Math.min(item.stockQuantity, 5)` (and `OrderPage.handleQuantityChange` clamps to `[0, Math.min(stockQuantity, 5)]`) and displays `"Max 5 per item"` notice | `CR01-UI-01`, `CR01-UI-02` | Client Component RTL (`client/src/components/__tests__/BakeryItemCard.test.tsx`) | 🟢 PASS |
| **AC-CR01-06** | `BR-03`, `FR-03-01`, `NFR-04` | TA Condition #3 | End-to-end browser verification across viewports: `+` button disables at 5, `"Max 5 per item"` notice is visible, and submitting a `quantity: 5` pre-order succeeds (`201`) | `E2E-CR01-01` | Playwright E2E (`e2e/lab-7/order-quantity-cap.spec.ts`) | 🟢 PASS |

---

## 3. Bi-Directional Coverage Verification Summary

- **Total Requirements Mapped:** 21 Functional Requirements (`FR-01-01`..`FR-09-02`), 7 Business Rules (`BR-01`..`BR-07`, with `BR-03` revised in v1.1.0 for Lab 7 `CR-01`), 6 Non-Functional Requirements (`NFR-01`..`NFR-06`).
- **Verified Passing (Deliverable 2 Integrated Candidate Scope):**
  - **Sprint 1 + Lab 6 (`#58`):** 100% PASS (`F-01`–`F-04`, 56 backend tests + `E2E-01`..`09` across 3 viewports).
  - **Sprint 2 (`v2.0.0-sprint2`):** 100% PASS (`F-05` `ADM-01..08`, `F-06` `FUL-01..08`, `F-07` `PAY-01..07`, `E2E-S2-01`..`04`, `E2E-S2-06`).
  - **Lab 7 Maintenance (`v2.0.1-lab7` — `CR-01`):** 100% PASS (`AC-CR01-01`..`06` → `CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`, plus intended `ORD-08` update).
  - **Sprint 3 Working Progress (`F-08`):** 100% PASS (`RPT-01..06` unit + API + `E2E-S2-05` across Desktop/Tablet/Mobile).
- **Explicitly Planned for Final Delivery (13 Dec 2026):** `F-09` (`FR-09-01` multi-criteria order search/filtering `SRCH-01..04`; `FR-09-02` final release regression hardening `REGRESS-01..02`).
- **Orphan / Unmapped Requirements:** `0`.
