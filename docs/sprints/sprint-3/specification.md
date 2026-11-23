# Sprint 3 Feature Engineering Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part C (Sprint 3 Contracts & Working Progress) & Final Delivery  
> **Sprint 3 Status:** 🟡 Contracts Defined (`F-08` scheduled for Deliverable 2 progress in `S2-ISSUE-04` / `#64`; `F-09` scheduled for 1–13 Dec completion)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Sprint Goal

Sprint 3 completes and hardens the CrustCraft Artisan Bakery platform for **Final Project Delivery (13 December 2026)**. It adds operational decision-support insights through **F-08 (Bakery Sales & Order Summary Reporting)** and streamlines daily counter lookup through **F-09 (Multi-Criteria Order Search, Filtering & Release Hardening)**, alongside full regression verification, Lab 7 maintenance change integration, and final QA sign-off.

---

## 2. Scope & Delivery Split

* **Implemented as Deliverable 2 Working Progress (by 29 November 2026 — `S2-ISSUE-04` / `#64`):**
  * **F-08 (Bakery Sales & Order Summary Reporting):** `GET /api/operator/reports/summary` (revenue in integer satang from `COMPLETED` orders, order count distribution by status, payment status breakdown, top-selling bakery items, optional date range filtering) + `OperatorReportsPage.tsx` + Unit & API TDD tests (`RPT-01`..`RPT-06`).
* **Bounded Remaining Work for Final Delivery (1–13 December 2026):**
  * **F-09 (Order Search, Filtering & Release Hardening):**
    * `FR-09-01`: Multi-criteria query filtering (`status`, `paymentStatus`, customer `q` search, `from`/`to` date range, `minTotal`/`maxTotal` satang bounds) on `GET /api/operator/orders` + UI filter bar on `OperatorOrderQueuePage.tsx` (`SRCH-01`..`SRCH-04`).
    * `FR-09-02`: Final regression hardening, Lab 7 maintenance verification integration, final UAT re-test, and production release readiness (`REGRESS-01`..`REGRESS-02`).

---

## 3. Functional Requirements (FR)

### 3.1 F-08: Bakery Sales & Order Summary Reporting
* **FR-08-01 (Sales & Fulfillment Summary Aggregation):** An authenticated `OPERATOR` can query `GET /api/operator/reports/summary` (with optional `from` and `to` `YYYY-MM-DD` date filters) to retrieve:
  1. `totalRevenueSatang` (`Int`): exact sum of `Order.totalAmount` across `COMPLETED` orders only (`BR-01`, `NFR-06`).
  2. `completedOrderCount` and `totalOrderCount` (`Int`).
  3. `ordersByStatus`: counts for each of the 6 lifecycle statuses (`PENDING`, `ACCEPTED`, `BAKING`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`).
  4. `paymentBreakdown`: counts for `UNPAID`, `PAID`, and `FAILED`.
  5. `topSellingItems`: ranked descending by total `quantitySold` across `COMPLETED` orders, returning `{ bakeryItemId, name, category, quantitySold, revenueSatang }` where `revenueSatang = sum(OrderItem.unitPriceAtOrder * OrderItem.quantity)`.

### 3.2 F-09: Order Search, Filtering & Release Hardening
* **FR-09-01 (Multi-Criteria Order Filtering):** `GET /api/operator/orders` accepts optional query parameters (`status`, `paymentStatus`, `q` matching customer name/email or order ID substring case-insensitively, `from`, `to`, `minTotal`, `maxTotal`) while retaining default operational priority sorting when no filter is supplied.
* **FR-09-02 (Maintenance & Final Regression Hardening):** The full integrated system incorporates the instructor/TA-approved Lab 7 maintenance change without regressing Sprint 1–3 workflows, verified by automated regression suites and independent UAT re-testing.

---

## 4. Business Rules & Authorization Matrix (RBAC)

- **Revenue Recognition Rule (`BR-01`, `NFR-06`):** Only `COMPLETED` orders count toward `totalRevenueSatang` and `topSellingItems`. `PENDING`, `ACCEPTED`, `BAKING`, `READY_FOR_PICKUP`, and `CANCELLED` orders are excluded from revenue calculations to prevent overstating sales. All summations execute in exact integer satang (`Int`).
- **No Schema Changes Required:** Both `F-08` and `F-09` query existing indexed columns on `Order` (`status`, `paymentStatus`, `totalAmount`, `createdAt`), `OrderItem` (`quantity`, `unitPriceAtOrder`), `BakeryItem`, and `User`.

| Action | Method & Path | Unauth | `CUSTOMER` | `OPERATOR` | Notes |
|---|---|:---:|:---:|:---:|---|
| View Sales & Order Summary | `GET /api/operator/reports/summary` | ❌ `401` | ❌ `403` | ✔ `200` | Supports `?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| Search & Filter Operator Orders | `GET /api/operator/orders?...` | ❌ `401` | ❌ `403` | ✔ `200` | Optional multi-criteria filters (`F-09`) |

---

## 5. Acceptance Criteria (AC)

### 5.1 F-08: Bakery Sales & Order Summary Reporting
* **AC-S3-F08-01 (`RPT-01`):** Pure reporting calculation helper sums `totalRevenueSatang` exclusively from `COMPLETED` orders using integer satang arithmetic (zero floating-point drift).
* **AC-S3-F08-02 (`RPT-02`):** Pure reporting calculation helper computes exact `ordersByStatus` counts for all 6 statuses and ranks `topSellingItems` descending by `quantitySold` using snapshotted `unitPriceAtOrder`.
* **AC-S3-F08-03 (`RPT-03`):** `GET /api/operator/reports/summary` (with and without `from`/`to` filters) returns `200 OK` with accurate PostgreSQL-backed summary metrics.
* **AC-S3-F08-04 (`RPT-04`):** Invalid date format or `from > to` returns `400 VALIDATION_ERROR`.
* **AC-S3-F08-05 (`RPT-05`):** Unauthenticated requests return `401`; `CUSTOMER` requests return `403 FORBIDDEN`.
* **AC-S3-F08-06 (`RPT-06`):** Empty dataset or date window with zero matching orders returns `200 OK` with `totalRevenueSatang: 0`, zeroed status/payment maps, and `topSellingItems: []`.
* **AC-S3-F08-07:** Responsive `/operator/reports` UI displays THB revenue KPIs, status distribution, top-selling items table, and date range filter controls.

### 5.2 F-09: Order Search, Filtering & Release Hardening
* **AC-S3-F09-01 (`SRCH-01`):** `GET /api/operator/orders?status=READY_FOR_PICKUP` and `?paymentStatus=PAID` return only matching orders.
* **AC-S3-F09-02 (`SRCH-02`):** `GET /api/operator/orders?q=<name-or-id>` filters orders case-insensitively by customer name, email, or order ID substring.
* **AC-S3-F09-03 (`SRCH-03`):** Combined filters (`from`, `to`, `minTotal`, `maxTotal`, `status`) compose with logical AND; invalid filter values return `400 VALIDATION_ERROR`.
* **AC-S3-F09-04 (`SRCH-04`):** `OperatorOrderQueuePage.tsx` provides filter controls (search input, status dropdown, payment dropdown, clear button) without breaking mobile layout.
* **AC-S3-F09-05 (`REGRESS-01`, `REGRESS-02`):** Full unit, API integration, and multi-viewport Playwright E2E regression suites pass across Sprints 1–3 after Lab 7 maintenance changes.

---

## 6. Product Definition of Done (Sprint 3 DoD)
* [ ] All Sprint 3 contracts committed BEFORE Sprint 3 implementation (`S2-ISSUE-01` / `#61`).
* [ ] By 29 Nov (Deliverable 2): `F-08` implemented, tested (`RPT-01`..`RPT-06` + `E2E-S2-05`), and deployed on GCP; `F-09` explicitly tracked in Remaining-Work Plan.
* [ ] By 13 Dec (Final Delivery): `F-09` implemented and verified (`SRCH-01`..`04`, `REGRESS-01`..`02`), final UAT re-test completed, deployed on GCP, and demonstrated in final video.
