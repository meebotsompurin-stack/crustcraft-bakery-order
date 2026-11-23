# S2-ISSUE-04 — F-08 (Sprint 3 Progress): Sales & Order Summary Reporting

> **GitHub Issue:** [#64](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/64)  
> **Wave:** 3 (Sprint 3 Working Progress for Deliverable 2 Part C — 15 pts)  
> **Depends on:** `#61` (`S2-ISSUE-01`) & `#62` (`S2-ISSUE-02`) merged into `sprint-2-staging`  
> **Branch:** `feat/s2-issue-04-sales-reporting` → `sprint-2-staging`  
> **Assignee:** `@poom2548` | **Reviewer:** `@meebotsompurin-stack`

---

## Objective
Implement and verify **F-08 (Bakery Sales & Order Summary Reporting)** (`FR-08-01`, `BR-01`, `NFR-06`) as genuine tested Sprint 3 working progress for Project Deliverable 2 Part C.

## TDD Rule (Mandatory for Deliverable 2)
1. Commit failing tests (`server/src/__tests__/unit/reporting.test.ts` and `server/src/__tests__/sprint-3/reporting.api.test.ts`) FIRST (`RED`).
2. Implement `reporting.service.ts`, `reporting.controller.ts`, route, and `OperatorReportsPage.tsx` SECOND (`GREEN`).

## Acceptance Criteria
- [ ] **AC-S3-F08-01 (`RPT-01`):** Pure unit aggregation helper sums `totalRevenueSatang` exclusively from `COMPLETED` orders using exact integer satang arithmetic (`NFR-06`).
- [ ] **AC-S3-F08-02 (`RPT-02`):** Pure unit aggregation helper calculates `ordersByStatus` across all 6 statuses and ranks `topSellingItems` descending by `quantitySold` (with `revenueSatang = sum(unitPriceAtOrder * quantity)` from `COMPLETED` orders).
- [ ] **AC-S3-F08-03 (`RPT-03`):** `GET /api/operator/reports/summary` (optional `?from=YYYY-MM-DD&to=YYYY-MM-DD`) returns `200 OK` with `{ summary: { totalRevenueSatang, completedOrderCount, totalOrderCount, ordersByStatus, paymentBreakdown, topSellingItems, dateRange } }`.
- [ ] **AC-S3-F08-04 (`RPT-04`):** Invalid date query params (malformed date or `from > to`) return `400 VALIDATION_ERROR`.
- [ ] **AC-S3-F08-05 (`RPT-05`):** Unauthenticated (`401`) and `CUSTOMER` (`403`) requests are rejected by backend RBAC guards.
- [ ] **AC-S3-F08-06 (`RPT-06`):** Empty dataset or date range with zero orders returns `200 OK` with zeroed metrics and `topSellingItems: []`.
- [ ] **AC-S3-F08-07:** Responsive `OperatorReportsPage.tsx` at `/operator/reports` renders THB KPI cards, status distribution, top-selling items table, and date filters.

## Files Allowed
- `server/src/services/reporting.service.ts`
- `server/src/controllers/reporting.controller.ts`
- `server/src/routes/operator.routes.ts` *(append `/reports/summary` route only)*
- `server/src/__tests__/unit/reporting.test.ts`
- `server/src/__tests__/sprint-3/reporting.api.test.ts`
- `client/src/pages/OperatorReportsPage.tsx`
- `client/src/services/api.ts` *(append reporting API helper only)*
- `client/src/App.tsx` *(append `/operator/reports` route & navbar link only)*
