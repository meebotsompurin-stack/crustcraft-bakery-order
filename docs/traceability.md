# Requirements Traceability Matrix (RTM)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Document Version:** `2.0.0` (Sprint 2 + Sprint 3 `F-08` Verified Baseline — `S2-ISSUE-05` / `#65`)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Overview & Verification Strategy

This document establishes bi-directional requirements traceability for the CrustCraft Artisan Bakery platform across Sprints 1–3 and Lab 5–6 defect resolutions. Every Functional Requirement (`FR-XX`), Business Rule (`BR-XX`), and Non-Functional Requirement (`NFR-XX`) maps directly to its implementing Feature (`F-XX`), API endpoints / UI routes, Acceptance Criteria (`AC-XX`), automated Test IDs, target test files, and current verification status.

### Testing Level & Status Legend
- **Unit:** Pure domain & calculation logic via Vitest (`server/src/__tests__/unit/*.test.ts`).
- **API / DB:** Full HTTP request-response and PostgreSQL 16 persistence tests via Supertest + Vitest (`server/src/__tests__/sprint-{1,2,3}/*.api.test.ts`).
- **E2E:** Multi-viewport browser user journeys (Desktop `1280px`, Tablet `768px`, Mobile `375px`) via Playwright (`e2e/sprint-{1,2}/*.spec.ts`).
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
| **FR-03-01** | Multi-item pre-order creation with optional `pickupNote` (≤ 500 chars, Lab 6 `#58`) | `F-03` | Sprint 1 (+Lab 6) | `POST /api/customer/orders` · `OrderPage.tsx` (`/orders/new`) | `AC-03-01`, `AC-03-07` | `ORD-01`, `ORD-06 / Issue #58` (`sprint-1/orders.api.test.ts`, `unit/orderCalculation.test.ts`), `E2E-03` | 🟢 PASS |
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
| **FR-09-02** | Lab 7 maintenance change integration & full E2E regression hardening | `F-09` | Sprint 3 (Final) | Full system regression across Sprints 1–3 & Lab 7 | `AC-S3-F09-05` | `REGRESS-01` (`npm test`), `REGRESS-02` (`e2e/regression/*.spec.ts`) | ⬜ Planned |
| **BR-01** | Authoritative server-side pricing & revenue calculation in integer satang | `F-03`, `F-05`, `F-08` | Sprint 1–3 | `orders.service.ts`, `catalogAdmin.service.ts`, `reporting.service.ts` | `AC-04-08`, `AC-S3-F08-01` | `ORD-02`, `ADM-05`, `RPT-01` (`unit/orderCalculation.test.ts`, `unit/reporting.test.ts`) | 🟢 PASS |
| **BR-02** | Historical `OrderItem.unitPriceAtOrder` snapshot unaffected by catalog edits | `F-03`, `F-05`, `F-08` | Sprint 1–3 | `orders.service.ts`, `catalogAdmin.service.ts`, `reporting.service.ts` | `AC-03-02`, `AC-S2-F05-06` | `ORD-03`, `ADM-07`, `RPT-02` (`sprint-2/admin.api.test.ts`, `unit/reporting.test.ts`) | 🟢 PASS |
| **BR-03** | Stock validation & transactional atomicity (deduct & restore via `prisma.$transaction`) | `F-03`, `F-06` | Sprint 1–2 | `orders.service.ts`, `operator.service.ts` | `AC-03-03`, `AC-S2-F06-02` | `ORD-04`, `ORD-05`, `FUL-03`, `FUL-04`, `FUL-06` | 🟢 PASS |
| **BR-04** | Customer ownership & data isolation (`403 FORBIDDEN` on cross-customer access) | `F-03`, `F-06`, `F-07` | Sprint 1–2 | `orders.service.ts`, `payment.service.ts` | `AC-03-06`, `AC-S2-F06-03`, `AC-S2-F07-03` | `ORD-11`, `FUL-05`, `PAY-04` | 🟢 PASS |
| **BR-05** | `isAvailable` vs `stockQuantity` semantics (0 stock stays visible; archived hidden) | `F-02`, `F-03`, `F-05` | Sprint 1–2 | `catalog.service.ts`, `catalogAdmin.service.ts`, `orders.service.ts` | `AC-04-01`, `AC-S2-F05-03`, `AC-S2-F05-07` | `CAT-01`, `CAT-03`, `ORD-07`, `ORD-08`, `ADM-04`, `ADM-08` | 🟢 PASS |
| **BR-06** | Shared global operator queue across all `OPERATOR` accounts | `F-04`, `F-06` | Sprint 1–2 | `GET /api/operator/orders`, `PATCH /api/operator/orders/:id/status` | `AC-05-02` | `OPS-02`, `FUL-06`, `FUL-08` | 🟢 PASS |
| **BR-07** | Forward-only deterministic order state machine & conflict guard (`409 CONFLICT`) | `F-04`, `F-06` | Sprint 1–2 | `server/src/lib/orderStatus.ts`, `operator.service.ts`, `orders.service.ts` | `AC-05-06`, `AC-S2-F06-01`..`04` | `OPS-06`, `FUL-01`, `FUL-02`, `FUL-04`, `FUL-05`, `FUL-07` | 🟢 PASS |
| **NFR-01** | Catalog response latency `< 100ms` for up to 100 items | `F-02` | Sprint 1 | `GET /api/catalog` | `AC-04-01` | `CAT-01` (`sprint-1/catalog.api.test.ts`) | 🟢 PASS |
| **NFR-02** | `bcrypt` (≥ 10 rounds) password hashing & `httpOnly`, `SameSite=Lax` JWT cookie | `F-01` | Sprint 1 | `auth.service.ts`, `auth.controller.ts` | `AC-03-09`, `AC-03-16` | `AUTH-03`, `AUTH-10` (`unit/auth.test.ts`, `sprint-1/auth.api.test.ts`) | 🟢 PASS |
| **NFR-03** | Uniform error envelope `{ error: { code, message, details? } }` without stack traces | `F-01`–`F-08` | Sprint 1–3 | `server/src/app.ts` global error handler | `AC-03-20` | Verified across all API integration suites (`AUTH`, `CAT`, `ORD`, `OPS`, `ADM`, `FUL`, `PAY`, `RPT`) | 🟢 PASS |
| **NFR-04** | Responsive ergonomics & zero horizontal overflow at `1280px`, `768px`, `375px` | `F-01`–`F-08` | Sprint 1–3 | All pages in `client/src/pages/*` | `AC-06-01`..`06`, `AC-S3-F08-07` | `E2E-01`..`09` (`e2e/sprint-1/*`), `E2E-S2-01`..`05` (`e2e/sprint-2/*` with `scrollWidth <= innerWidth` assertions) | 🟢 PASS |
| **NFR-05** | Persistent database durability across container restarts & redeployments | System Base | Lab 5 | Cloud SQL PostgreSQL 16 + Cloud Run (`deploy.yml`, `docker-compose.yml`) | `ADR-01` | Lab 5 Persistence & Rollback Protocol (`docs/labs/lab-05/deployment.md`, `deploy/smoke_test.py`) | 🟢 PASS |
| **NFR-06** | Exact integer satang arithmetic (zero IEEE 754 floating-point drift) | `F-03`, `F-05`, `F-08` | Sprint 1–3 | `orders.service.ts`, `catalogAdmin.service.ts`, `reporting.service.ts` | `AC-04-08`, `AC-S3-F08-01` | `ORD-02` (`unit/orderCalculation.test.ts`), `RPT-01`, `RPT-02` (`unit/reporting.test.ts`) | 🟢 PASS |

---

## 3. Bi-Directional Coverage Verification Summary

- **Total Requirements Mapped:** 21 Functional Requirements (`FR-01-01`..`FR-09-02`), 7 Business Rules (`BR-01`..`BR-07`), 6 Non-Functional Requirements (`NFR-01`..`NFR-06`).
- **Verified Passing (Deliverable 2 Scope):**
  - **Sprint 1 + Lab 6 (`#58`):** 100% PASS (`F-01`–`F-04`, 56 backend tests + `E2E-01`..`09` across 3 viewports).
  - **Sprint 2 (`v2.0.0-sprint2`):** 100% PASS (`F-05` `ADM-01..08`, `F-06` `FUL-01..08`, `F-07` `PAY-01..07`, `E2E-S2-01`..`04`, `E2E-S2-06`).
  - **Sprint 3 Working Progress (`F-08`):** 100% PASS (`RPT-01..06` unit + API + `E2E-S2-05` across Desktop/Tablet/Mobile).
- **Planned for Final Delivery (13 Dec 2026):** `F-09` (`FR-09-01` multi-criteria order search/filtering `SRCH-01..04`; `FR-09-02` Lab 7 maintenance integration & final regression `REGRESS-01..02`).
- **Orphan / Unmapped Requirements:** `0`.
