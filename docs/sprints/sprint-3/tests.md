# Sprint 3 Test Plan & Software Test Specification (STS)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part C (Sprint 3 Software Test Specification)  
> **Sprint 3 Status:** 🟡 In Progress (`F-08` `RPT-01..06` **6/6 PASS** in `S2-ISSUE-04` / `#64` & `v2.1.0-s3-progress`; `F-09` `SRCH-01..04` & `REGRESS-01..02` Planned for Final Delivery 13 Dec 2026)  
> **Total Sprint 3 Test IDs:** 12 (`RPT` × 6 **PASS**, `SRCH` × 4 Planned, `REGRESS` × 2 Planned)

---

## 1. Test Execution Matrix

> **Status Legend:** `⬜` Planned | `🟢 PASS` Verified | `🔴 FAIL` Failed

### 1.1 F-08: Sales & Order Summary Reporting (`RPT-01` to `RPT-06` — `S2-ISSUE-04` / `#64`)

| Test ID | Type | AC Reference | Precondition / Input | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **RPT-01** | Unit | `AC-S3-F08-01` | Mixed orders (`COMPLETED`, `PENDING`, `CANCELLED`) with integer satang totals passed to `buildSalesSummary()` | `totalRevenueSatang` sums ONLY `COMPLETED` orders with exact integer precision (`NFR-06`). | `server/src/__tests__/unit/reporting.test.ts` | 🟢 PASS |
| **RPT-02** | Unit | `AC-S3-F08-02` | Multiple `COMPLETED` orders containing overlapping bakery items at different `unitPriceAtOrder` snapshots | `ordersByStatus` counts all 6 statuses accurately; `topSellingItems` aggregates `quantitySold` and `revenueSatang` from `unitPriceAtOrder * quantity` and sorts descending. | `server/src/__tests__/unit/reporting.test.ts` | 🟢 PASS |
| **RPT-03** | API Integration | `AC-S3-F08-03` | Seeded + newly completed/cancelled orders in PostgreSQL; `OPERATOR` calls `GET /api/operator/reports/summary` (full and with `?from=&to=`) | Returns `200 OK` with matching DB revenue, status distribution, payment breakdown, and top-selling items. | `server/src/__tests__/sprint-3/reporting.api.test.ts` | 🟢 PASS |
| **RPT-04** | API Integration | `AC-S3-F08-04` | `OPERATOR` calls `GET /api/operator/reports/summary?from=invalid` or `?from=2026-12-10&to=2026-12-01` | Returns `400 VALIDATION_ERROR` with standard error envelope. | `server/src/__tests__/sprint-3/reporting.api.test.ts` | 🟢 PASS |
| **RPT-05** | API Integration | `AC-S3-F08-05` | Unauthenticated user and `CUSTOMER` call `GET /api/operator/reports/summary` | Returns `401 UNAUTHORIZED` and `403 FORBIDDEN` respectively. | `server/src/__tests__/sprint-3/reporting.api.test.ts` | 🟢 PASS |
| **RPT-06** | API Integration | `AC-S3-F08-06` | `OPERATOR` queries a future date range with zero orders (`?from=2099-01-01&to=2099-01-31`) | Returns `200 OK` with `totalRevenueSatang: 0`, zeroed status/payment counts, and `topSellingItems: []`. | `server/src/__tests__/sprint-3/reporting.api.test.ts` | 🟢 PASS |

---

### 1.2 F-09: Order Search, Filtering & Regression Hardening (`SRCH-01` to `SRCH-04`, `REGRESS-01` to `REGRESS-02` — Final Delivery)

| Test ID | Type | AC Reference | Precondition / Input | Expected Result | Test File | Status |
|---|---|---|---|---|---|:---:|
| **SRCH-01** | API Integration | `AC-S3-F09-01` | `OPERATOR` queries `GET /api/operator/orders?status=READY_FOR_PICKUP` and `?paymentStatus=PAID` | Returns only orders matching the requested status / paymentStatus. | `server/src/__tests__/sprint-3/search.api.test.ts` | ⬜ |
| **SRCH-02** | API Integration | `AC-S3-F09-02` | `OPERATOR` queries `GET /api/operator/orders?q=customer1` or `?q=<partialOrderId>` | Case-insensitive match returns only orders matching customer name/email or order ID. | `server/src/__tests__/sprint-3/search.api.test.ts` | ⬜ |
| **SRCH-03** | API Integration | `AC-S3-F09-03` | Combined filters (`status`, `minTotal`, `maxTotal`, `from`, `to`) and invalid filter bounds (`minTotal > maxTotal`) | Valid combined filters intersect accurately; invalid bounds return `400 VALIDATION_ERROR`. | `server/src/__tests__/sprint-3/search.api.test.ts` | ⬜ |
| **SRCH-04** | Playwright E2E | `AC-S3-F09-04` | Operator filters queue on `/operator/orders` by status & search text and resets filters across viewports | Table updates live with matching rows and shows resettable empty state when zero rows match. | `e2e/sprint-3/search-filter.spec.ts` | ⬜ |
| **REGRESS-01** | API + Unit Suite | `AC-S3-F09-05` | Full backend regression run after Lab 7 maintenance change | All Sprint 1, Sprint 2, Sprint 3, Lab 6, and Lab 7 tests pass (`0` failed, `0` skipped). | `npm test` | ⬜ |
| **REGRESS-02** | Playwright E2E | `AC-S3-F09-05` | Full multi-viewport E2E regression across Desktop/Tablet/Mobile against deployed release | All critical customer & operator journeys pass end-to-end. | `e2e/regression/*.spec.ts` | ⬜ |
