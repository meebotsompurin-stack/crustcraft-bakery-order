# Requirements Traceability Matrix (RTM)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Document Version:** `1.0.0` (Sprint 1 Engineering Baseline)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Overview & Verification Strategy

This document establishes bi-directional requirements traceability for the CrustCraft Artisan Bakery platform across all three development sprints. Every system-level Functional Requirement (`FR-XX`), Business Rule (`BR-XX`), and Non-Functional Requirement (`NFR-XX`) links directly to an implementing Feature (`F-XX`), an explicit Acceptance Criteria ID (`AC-XX`), and its corresponding automated verification test suite.

### Testing Level Legend
- **Unit:** Isolated business logic and calculation tests via Vitest (`server/src/__tests__/unit/*.test.ts`).
- **API / DB:** Full HTTP request-response and database persistence tests via Supertest and Vitest (`server/src/__tests__/sprint-1/*.api.test.ts`).
- **E2E:** Browser-driven user journeys across three viewports (Desktop 1280px, Tablet 768px, Mobile 375px) via Playwright (`e2e/sprint-1/*.spec.ts`).
- **Architectural / Config:** Static code analysis, configuration assertion, or container lifecycle validation.

---

## 2. Comprehensive Traceability Matrix

| Requirement / Rule ID | Summary Description | Feature ID | Target Sprint | Acceptance Criteria ID | Test ID(s) | Verification Level & Target File |
|---|---|:---:|:---:|---|---|---|
| **FR-01-01** | User registration with name, email, password, default CUSTOMER role | `F-01` | Sprint 1 | `AC-01-01` / `AC-03-07` | `AUTH-01` | API Integration (`server/src/__tests__/sprint-1/auth.api.test.ts`) |
| **FR-01-02** | User login issuing 24h JWT token in httpOnly cookie & body | `F-01` | Sprint 1 | `AC-01-02` / `AC-03-09` | `AUTH-03` | API Integration (`server/src/__tests__/sprint-1/auth.api.test.ts`) |
| **FR-01-03** | Dual-channel authentication extraction (httpOnly cookie primary, Bearer fallback) | `F-01` | Sprint 1 | `AC-01-04` / `AC-03-12`, `AC-03-18` | `AUTH-06`, `AUTH-08` | API Integration & Unit (`server/src/__tests__/sprint-1/auth.api.test.ts`) |
| **FR-01-04** | Role-based access control via `requireRole` middleware | `F-01` | Sprint 1 | `AC-01-05` / `AC-03-15`, `AC-03-19` | `AUTH-09` | API Integration (`server/src/__tests__/sprint-1/auth.api.test.ts`) |
| **FR-01-05** | User logout revoking session via cookie clearance | `F-01` | Sprint 1 | `AC-03-09` | `AUTH-03`, `E2E-09` | API Integration & E2E (`e2e/sprint-1/auth-guard.spec.ts`) |
| **FR-01-06** | Duplicate email registration rejection with 409 Conflict | `F-01` | Sprint 1 | `AC-03-08` | `AUTH-02` | API Integration (`server/src/__tests__/sprint-1/auth.api.test.ts`) |
| **FR-02-01** | Public menu catalog listing all active items | `F-02` | Sprint 1 | `AC-02-01` / `AC-04-01` | `CAT-01`, `E2E-02` | API Integration (`server/src/__tests__/sprint-1/catalog.api.test.ts`) & E2E |
| **FR-02-02** | Catalog payload schema (id, name, satang price, stock, category) | `F-02` | Sprint 1 | `AC-02-02` / `AC-04-02` | `CAT-02` | API Integration (`server/src/__tests__/sprint-1/catalog.api.test.ts`) |
| **FR-02-03** | Single bakery item detail query by ID | `F-02` | Sprint 1 | `AC-04-04`, `AC-04-05` | `CAT-04`, `CAT-05` | API Integration (`server/src/__tests__/sprint-1/catalog.api.test.ts`) |
| **FR-02-04** | Frontend catalog display in Thai Baht with out-of-stock badge | `F-02` | Sprint 1 | `AC-04-06` | `CAT-02`, `E2E-02` | UI Component & Playwright E2E (`e2e/sprint-1/customer-order-flow.spec.ts`) |
| **FR-03-01** | Multi-item pre-order creation with optional pickup notes | `F-03` | Sprint 1 | `AC-03-01` / `AC-04-07` | `ORD-01`, `E2E-03` | API Integration & Playwright E2E (`e2e/sprint-1/customer-order-flow.spec.ts`) |
| **FR-03-02** | Server-side total calculation in integer satangs from DB prices | `F-03` | Sprint 1 | `AC-04-08` | `ORD-02` | Unit Calculation (`server/src/__tests__/unit/orderCalculation.test.ts`) |
| **FR-03-03** | Unit price snapshotting into OrderItem records at creation time | `F-03` | Sprint 1 | `AC-03-02` / `AC-04-09` | `ORD-03`, `ORD-04` | Unit Calculation & API Integration (`server/src/__tests__/sprint-1/orders.api.test.ts`) |
| **FR-03-04** | Atomic stock deduction within database transaction | `F-03` | Sprint 1 | `AC-03-03` / `AC-04-10`, `AC-04-11` | `ORD-04`, `ORD-05` | API Integration (`server/src/__tests__/sprint-1/orders.api.test.ts`) |
| **FR-03-05** | New pre-orders initialized with PENDING status | `F-03` | Sprint 1 | `AC-04-18` | `ORD-12`, `E2E-04` | API Integration & Playwright E2E (`e2e/sprint-1/customer-order-flow.spec.ts`) |
| **FR-03-06** | Customer retrieves own order history and order details | `F-03` | Sprint 1 | `AC-04-15`, `AC-04-16`, `AC-04-19`, `AC-04-20` | `ORD-09`, `ORD-10`, `E2E-04`, `E2E-05` | API Integration & Playwright E2E (`e2e/sprint-1/customer-order-flow.spec.ts`) |
| **FR-04-01** | Operator shared queue query sorted by PENDING first | `F-04` | Sprint 1 | `AC-04-04` / `AC-05-02`, `AC-05-09` | `OPS-02`, `E2E-06` | API Integration & Playwright E2E (`e2e/sprint-1/operator-acceptance-flow.spec.ts`) |
| **FR-04-02** | Operator order detail view with customer identity and line items | `F-04` | Sprint 1 | `AC-05-03`, `AC-05-10` | `OPS-03`, `E2E-08` | API Integration & Playwright E2E (`e2e/sprint-1/operator-acceptance-flow.spec.ts`) |
| **FR-04-03** | Operator transitions order status from PENDING to ACCEPTED | `F-04` | Sprint 1 | `AC-04-02` / `AC-05-05`, `AC-05-11` | `OPS-05`, `E2E-07` | API Integration & Playwright E2E (`e2e/sprint-1/operator-acceptance-flow.spec.ts`) |
| **FR-04-04** | Rejection of invalid status transitions with 409 Conflict | `F-04` | Sprint 1 | `AC-04-03` / `AC-05-06`, `AC-05-08` | `OPS-06`, `OPS-08` | API Integration (`server/src/__tests__/sprint-1/operator.api.test.ts`) |
| **FR-05-01** | Operator creates new bakery catalog items | `F-05` | Sprint 2 | `AC-S2-F05-01` | `ADM-01` | API Integration (`server/src/__tests__/sprint-2/admin.api.test.ts`) |
| **FR-05-02** | Operator updates pricing, availability, and batch inventory | `F-05` | Sprint 2 | `AC-S2-F05-02` | `ADM-02`, `ADM-03` | API Integration (`server/src/__tests__/sprint-2/admin.api.test.ts`) |
| **FR-06-01** | Multi-stage fulfillment progression (ACCEPTED → BAKING → READY → COMPLETED) | `F-06` | Sprint 2 | `AC-S2-F06-01` | `FUL-01`, `FUL-02` | API Integration & E2E (`e2e/sprint-2/fulfillment.spec.ts`) |
| **FR-06-02** | Order cancellation with automated atomic stock replenishment | `F-06` | Sprint 2 | `AC-S2-F06-02` | `FUL-03`, `FUL-04` | API Integration (`server/src/__tests__/sprint-2/orders.api.test.ts`) |
| **FR-07-01** | Order payment status tracking (UNPAID, PAID, FAILED) | `F-07` | Sprint 2 | `AC-S2-F07-01` | `PAY-01` | API Integration (`server/src/__tests__/sprint-2/payment.api.test.ts`) |
| **FR-07-02** | Synthetic simulated payment execution and status updates | `F-07` | Sprint 2 | `AC-S2-F07-02` | `PAY-02`, `PAY-03` | API Integration & E2E (`e2e/sprint-2/payment.spec.ts`) |
| **FR-08-01** | Operator sales summary and revenue metrics calculation | `F-08` | Sprint 3 | `AC-S3-F08-01` | `RPT-01`, `RPT-02` | API Integration & Unit (`server/src/__tests__/unit/reporting.test.ts`) |
| **FR-09-01** | Multi-criteria order search and filtering | `F-09` | Sprint 3 | `AC-S3-F09-01` | `SRCH-01`, `SRCH-02` | API Integration (`server/src/__tests__/sprint-3/search.api.test.ts`) |
| **FR-09-02** | Maintenance change execution and regression hardening (Lab 7) | `F-09` | Sprint 3 | `AC-S3-F09-02` | `REGRESS-01`, `REGRESS-02` | Regression Test Suite (`e2e/regression/*.spec.ts`) |
| **BR-01** | Authoritative server-side pricing in integer satang | `F-03` | Sprint 1 | `AC-04-08` | `ORD-02` | Unit Calculation (`server/src/__tests__/unit/orderCalculation.test.ts`) |
| **BR-02** | Historical unit price snapshotting on OrderItem | `F-03` | Sprint 1 | `AC-03-02` / `AC-04-09` | `ORD-03` | Unit Calculation (`server/src/__tests__/unit/orderCalculation.test.ts`) |
| **BR-03** | Stock validation and transactional atomicity (`prisma.$transaction`) | `F-03` | Sprint 1 | `AC-03-03` / `AC-04-10`, `AC-04-11` | `ORD-04`, `ORD-05` | API Integration (`server/src/__tests__/sprint-1/orders.api.test.ts`) |
| **BR-04** | Customer data isolation (cross-customer access returns 403) | `F-03` | Sprint 1 | `AC-03-06` / `AC-04-17` | `ORD-11` | API Integration (`server/src/__tests__/sprint-1/orders.api.test.ts`) |
| **BR-05** | `isAvailable` vs. `stockQuantity` separation (stock 0 remains in catalog as Out of Stock, orders return 409) | `F-02`, `F-03` | Sprint 1 | `AC-04-01`, `AC-04-13`, `AC-04-14` | `CAT-01`, `CAT-03`, `ORD-07`, `ORD-08` | API Integration (`server/src/__tests__/sprint-1/catalog.api.test.ts`, `orders.api.test.ts`) |
| **BR-06** | Shared global operator queue for single bakery operations | `F-04` | Sprint 1 | `AC-05-02` | `OPS-02` | API Integration (`server/src/__tests__/sprint-1/operator.api.test.ts`) |
| **BR-07** | Forward-only finite state machine lifecycle and conflict guard | `F-04`, `F-06` | Sprint 1 | `AC-05-06`, `AC-05-08` | `OPS-06`, `OPS-08` | API Integration (`server/src/__tests__/sprint-1/operator.api.test.ts`) |
| **NFR-01** | Catalog response latency < 100ms for up to 100 items | `F-02` | Sprint 1 | `AC-04-01` | `CAT-01` | Performance Benchmark & Integration Test |
| **NFR-02** | Bcrypt password hashing and httpOnly cookie session protection | `F-01` | Sprint 1 | `AC-03-09`, `AC-03-16` | `AUTH-03`, `AUTH-10` | Unit & API Integration (`server/src/__tests__/sprint-1/auth.api.test.ts`) |
| **NFR-03** | Uniform error envelope `{ error: { code, message, details? } }` | `F-01`–`F-04` | Sprint 1 | `AC-03-20` | `AUTH-04`, `CAT-05`, `ORD-06`, `OPS-04` | API Integration Suite across all modules |
| **NFR-04** | Responsive ergonomics across Desktop (1280px), Tablet (768px), and Mobile (375px) | `F-01`–`F-04` | Sprint 1 | `AC-06-01`..`AC-06-04`, `AC-06-06` | `E2E-01`..`E2E-09` | Playwright Multi-Viewport Tests (`e2e/sprint-1/*.spec.ts`) |
| **NFR-05** | Persistent volume durability surviving container lifecycle (Spec 5.1) | System Base | Sprint 1 (Design) / Lab 5 | `AC-01-04` (ADR-01) | `ARCH-01` | Docker Volume Lifecycle Test & GCP Deployment Check |
| **NFR-06** | Monetary arithmetic precision using integer satang representations | `F-03`, `F-08` | Sprint 1 | `AC-04-08` | `ORD-02` | Unit Calculation Tests (`server/src/__tests__/unit/orderCalculation.test.ts`) |

---

## 3. Bi-Directional Coverage Verification Summary

- **Total Baseline Requirements Mapped:**
  - Functional Requirements: 21 (`FR-01-01` through `FR-09-02`)
  - Business Rules: 7 (`BR-01` through `BR-07`)
  - Non-Functional Requirements: 6 (`NFR-01` through `NFR-06`)
- **Coverage Distribution:**
  - Sprint 1 (Deliverable 1 Baseline): 100% of `FR-01` to `FR-04`, `BR-01` to `BR-07`, and `NFR-01` to `NFR-06` mapped to executable test suites (`AUTH-01`–`AUTH-10`, `CAT-01`–`CAT-05`, `ORD-01`–`ORD-12`, `OPS-01`–`OPS-08`, and `E2E-01`–`E2E-09`).
  - Sprint 2 (Core Expansion): 100% of `FR-05` to `FR-07` allocated to planned `ADM-XX`, `FUL-XX`, and `PAY-XX` suites.
  - Sprint 3 (Final Delivery): 100% of `FR-08` to `FR-09` allocated to planned `RPT-XX`, `SRCH-XX`, and `REGRESS-XX` suites.
- **Orphan / Gap Count:** 0 (Zero orphan requirements; zero unmapped Acceptance Criteria).
