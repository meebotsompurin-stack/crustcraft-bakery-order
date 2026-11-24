# LAB7-ISSUE-02 — Implement `BR-03` Max 5 Quantity Cap, TDD RED/GREEN, Regression & Cloud Run Release (Part B)

> **GitHub Issue:** [#75](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/75)  
> **Wave:** 2 (Test-First Maintenance Delivery & Release `v2.0.1-lab7`)  
> **Depends on:** `#74` (`LAB7-ISSUE-01`) reviewed & merged on `main` after `v2.0.0-sprint2`  
> **Branch:** `feat/lab7-issue-02-max-qty-cap` → `main` *(isolated from `sprint-2-staging`)*  
> **Assignee:** `@meebotsompurin-stack` | **Reviewer:** `@poom2548`

---

## Objective (Lab 7 Part B — 50 Points)
Deliver the approved `CR-01` (`BR-03` / `FR-03-01`: `1 <= quantity <= 5` per bakery item per order) via verifiable **TDD RED → GREEN** commits, preserving all existing Sprint 1 (44 tests), Lab 6 (`#58`), and coexisting Sprint 2 behavior through CI, substantive peer review, release tag **`v2.0.1-lab7`**, and live GCP Cloud Run post-deployment verification.

## Mandatory TDD Commit Sequence
1. **Commit 1 (`RED` — Failing Tests on Pre-Change Implementation):**
   - Configure `jsdom` + Vitest DOM environment in `client/` (`client/package.json`, `client/vite.config.ts`, `client/src/test/setup.ts`) so React Testing Library executes cleanly.
   - Add `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts` (`CR01-01..06`), `client/src/components/__tests__/BakeryItemCard.test.tsx` (`CR01-UI-01..02`), and `e2e/lab-7/order-quantity-cap.spec.ts` (`E2E-CR01-01`).
   - Run tests against the actual pre-change implementation (`v2.0.0-sprint2` code) and preserve full RED failure logs + tested commit SHA (failures must be assertion failures due to missing `<= 5` rule, never compile/fixture errors).
2. **Commit 2 (`GREEN` — Bounded Implementation + Intended `ORD-08` Update):**
   - Implement backend `MAX_QUANTITY_PER_ITEM = 5` validation in `server/src/services/orders.service.ts` and frontend UI cap + `"Max 5 per item"` notice in `client/`.
   - Apply the documented intended update to `ORD-08` in `server/src/__tests__/sprint-1/orders.api.test.ts` (L429).
   - Run all automated test suites and preserve full GREEN outputs + commit SHA.

## Acceptance Criteria
- [ ] **AC-LAB7-02-01 (`CR01-01`, `CR01-02`):** `POST /api/customer/orders` accepts `quantity: 5` (`201 Created`, decrements stock by 5) and rejects `quantity: 6` with `400 VALIDATION_ERROR` (`message: "Maximum order quantity is 5 units per item per order."`, `details: [{ field: "items[0].quantity", issue: "Quantity cannot exceed 5 per item per order" }]`), persisting no order and leaving stock unchanged.
- [ ] **AC-LAB7-02-02 (`CR01-03` — Indexed Field & Atomicity):** Multi-item payload (`items[0].quantity: 2`, `items[1].quantity: 6`) fails with `400 VALIDATION_ERROR` and exact `details[0].field === "items[1].quantity"`, with zero stock deducted for either item.
- [ ] **AC-LAB7-02-03 (`CR01-04`, `CR01-06` — `400` Before `409` Precedence):** `quantity: 5` when `stockQuantity: 3` still returns `409 CONFLICT` (`CR01-04`); `quantity: 6` when `stockQuantity: 3` returns `400 VALIDATION_ERROR` **before** `409 CONFLICT` (`CR01-06`).
- [ ] **AC-LAB7-02-04 (`CR01-05` — Duplicate `bakeryItemId` Loophole):** Submitting two entries for the same `bakeryItemId` (e.g., `quantity: 5` + `quantity: 5`) is rejected with `400 VALIDATION_ERROR` (`details[0].field === "items[1].bakeryItemId"`) and deducts zero stock.
- [ ] **AC-LAB7-02-05 (`CR01-UI-01`, `CR01-UI-02` — Frontend Cap & RTL):** `BakeryItemCard` caps `+` at `Math.min(item.stockQuantity, 5)` (and `OrderPage` clamps `handleQuantityChange` to `[0, Math.min(stockQuantity, 5)]`), displays `"Max 5 per item"`, and passes Vitest + React Testing Library (`jsdom`) tests.
- [ ] **AC-LAB7-02-06 (`E2E-CR01-01` & `ORD-08` Intended Update):** Playwright `E2E-CR01-01` verifies UI cap at 5 and `"Max 5 per item"` notice across viewports; `ORD-08` in `server/src/__tests__/sprint-1/orders.api.test.ts` (L429) is updated from `quantity: 20` to a valid `quantity <= 5` exceeding lower stock so `409 CONFLICT` stock enforcement remains tested without weakening assertions.
- [ ] **AC-LAB7-02-07 (Regression & CI):** All backend tests (`npm test`), client RTL tests (`npm test --workspace=client`), frontend build (`npm run build --workspace=client`), Playwright E2E, and GitHub Actions `test-and-docker` pass with zero skipped or weakened tests; no Prisma schema/migration changes are introduced.
- [ ] **AC-LAB7-02-08 (Peer Review, Release Tag & Cloud Run Verification):** PR receives substantive review from `@poom2548`, merges into `main` (after `v2.0.0-sprint2`), is tagged **`v2.0.1-lab7`**, auto-deploys via Lab 5 CD pipeline to GCP Cloud Run (`https://crustcraft-d7wyiqxska-as.a.run.app`), and passes post-deployment verification for both changed behavior (`qty 5` → `201`, `qty 6` → `400`) and preserved Sprint 1 domain/access paths (`403` cross-customer isolation / `OPERATOR` denial).

## Files Allowed
- `server/src/services/orders.service.ts`
- `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`
- `server/src/__tests__/sprint-1/orders.api.test.ts` *(intended `ORD-08` L429 update only)*
- `client/package.json` *(add `jsdom` devDependency)*, `package-lock.json`
- `client/vite.config.ts` *(add Vitest `jsdom` test config)*, `client/src/test/setup.ts`
- `client/src/components/BakeryItemCard.tsx`, `client/src/components/OrderSummary.tsx`, `client/src/pages/OrderPage.tsx`
- `client/src/components/__tests__/BakeryItemCard.test.tsx`
- `e2e/lab-7/order-quantity-cap.spec.ts`, `e2e/playwright.config.ts` *(include `lab-7` if needed)*
