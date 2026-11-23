# S2-ISSUE-03 — F-05 Bakery Catalog Administration (Operator CRUD & Restock)

> **GitHub Issue:** [#63](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/63)  
> **Wave:** 2 (100% Parallel-safe with `S2-ISSUE-02` `#62` — uses existing `BakeryItem` table)  
> **Depends on:** `#61` (`S2-ISSUE-01`) merged into `sprint-2-staging`  
> **Branch:** `feat/s2-issue-03-catalog-admin` → `sprint-2-staging`  
> **Assignee:** `@poom2548` | **Reviewer:** `@meebotsompurin-stack`

---

## Objective
Implement **F-05 (Bakery Catalog Administration)** (`FR-05-01`, `FR-05-02`, `BR-01`, `BR-02`, `BR-05`) enabling authenticated `OPERATOR` users to list all items (including archived `isAvailable: false`), create new bakery products, update prices (in integer satang `Int`), edit descriptions/categories, replenish batch inventory (`stockQuantity`), and toggle availability (`isAvailable`) without mutating historical order snapshots (`BR-02`).

## TDD Rule (Mandatory for Deliverable 2)
1. Commit failing tests (`server/src/__tests__/sprint-2/admin.api.test.ts`) FIRST (`RED`).
2. Implement `catalogAdmin.service.ts`, `catalogAdmin.controller.ts`, routes, and `OperatorCatalogPage.tsx` SECOND (`GREEN`).

## Acceptance Criteria
- [ ] **AC-S2-F05-01 (`ADM-01`):** `POST /api/operator/catalog` creates a new `BakeryItem` (`price > 0` integer satang, `stockQuantity >= 0`) and returns `201 Created`.
- [ ] **AC-S2-F05-02 (`ADM-02`, `ADM-03`):** `PATCH /api/operator/catalog/:id` updates any subset of `name`, `description`, `price`, `stockQuantity`, `category`, `isAvailable`, returning `200 OK`.
- [ ] **AC-S2-F05-03 (`ADM-04`):** `GET /api/operator/catalog` returns ALL items (both `isAvailable: true` and `false`), while `GET /api/catalog` still returns only `isAvailable: true` (`BR-05`).
- [ ] **AC-S2-F05-04 (`ADM-05`):** Rejects invalid input (`price <= 0`, non-integer `price`, `stockQuantity < 0`, blank `name`) with `400 VALIDATION_ERROR`, duplicate `name` with `409 CONFLICT`, and missing ID with `404 NOT_FOUND`.
- [ ] **AC-S2-F05-05 (`ADM-06`):** Rejects unauthenticated (`401`) and `CUSTOMER` (`403`) requests on all `/api/operator/catalog*` routes.
- [ ] **AC-S2-F05-06 (`ADM-07`):** Updating `BakeryItem.price` does NOT alter `OrderItem.unitPriceAtOrder` or `Order.totalAmount` on previously placed orders (`BR-02`).
- [ ] **AC-S2-F05-07 (`ADM-08`):** Toggling `isAvailable: false` hides item from public catalog and blocks new customer orders (`409 CONFLICT`); restocking `stockQuantity` from `0` to `> 0` re-enables ordering.
- [ ] **AC-S2-F05-08:** Responsive `OperatorCatalogPage.tsx` at `/operator/catalog` supports create, edit, restock, and toggle availability across Desktop/Tablet/Mobile.

## Files Allowed
- `server/src/services/catalogAdmin.service.ts`
- `server/src/controllers/catalogAdmin.controller.ts`
- `server/src/routes/operator.routes.ts` *(append `/catalog` routes only)*
- `server/src/__tests__/sprint-2/admin.api.test.ts`
- `client/src/pages/OperatorCatalogPage.tsx`
- `client/src/services/api.ts` *(append catalog admin API helpers only)*
- `client/src/App.tsx` *(append `/operator/catalog` route & navbar link only)*
