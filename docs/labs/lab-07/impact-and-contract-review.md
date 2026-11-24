# Lab 7 Change Impact Analysis & Pre-Implementation Contract Review (`CR-01`)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Assessment:** Group Lab 7 — Part A (Change Impact Analysis & Pre-Implementation Contract Revision, 25 pts)  
> **System:** CrustCraft Artisan Bakery — Pre-Order & Fulfillment System  
> **GitHub Issue:** [#74 (`LAB7-ISSUE-01`)](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/74)  
> **Branch:** `docs/lab7-issue-01-impact-and-contract` → `lab-7-staging` *(strictly isolated from `sprint-2-staging`)*  
> **Document Version:** `1.0.0` (Pre-Implementation Contract Gate — `CR-01`)  
> **Author (Dev):** Saksorn Buranatananun (`67070507208`, `@poom2548`)  
> **Peer Reviewer:** Purin Mebotsom (`67070507214`, `@meebotsompurin-stack`)  
> **TA Approval Reference:** Approved by **นายรัตนโชติ เพ็ชรพันธ์ศรี (พี่ลูกหมู) — TA Section 131** on **24 November 2026, 15:07 (+07)** ([`CHANGE_REQUEST_PROPOSAL.md`](./CHANGE_REQUEST_PROPOSAL.md), [`ta-approval-email-1.jpg`](./ta-approval-email-1.jpg), [`ta-approval-email-2.jpg`](./ta-approval-email-2.jpg), GitHub Issue `#73`)  
> **Baselines:** Accepted Sprint 1 `v1.0.0-sprint1` (`ebcf83b`) → Lab 5/6 `main` (`c876686`) → Lab 7 Plan `lab-7-staging` (`ec79c18`)

---

## 1. Change Request Definition (`CR-01`: Before vs. After)

| Dimension | Baseline Behavior (Pre-Change `v1.0.0-sprint1` / `c876686`) | Revised Behavior (`CR-01` — Lab 7) |
|---|---|---|
| **Affected Rule / Req** | `BR-03`, `FR-03-01` (`F-03: Customer Pre-Order Creation`) | `BR-03` (v1.1.0), `FR-03-01` (v1.1.0) |
| **Per-Item Quantity Rule** | Integer `quantity > 0` and `quantity <= stockQuantity` (no upper bound per order; one customer could buy 50 croissants in a single order). | Integer **`1 <= quantity <= 5`** (`MAX_QUANTITY_PER_ITEM = 5`) per bakery item per order, in addition to `quantity <= stockQuantity`. |
| **Duplicate `bakeryItemId` Rule (TA Condition #1)** | Enforced in `orders.service.ts` (`seenItemIds`), not formally locked in Sprint 1 API/Feature contract as an anti-bypass guard. | Explicitly locked in contract & tests (`CR01-05`): duplicate `bakeryItemId` entries in `items[]` (e.g., two lines of `quantity: 5` for the same item) are rejected with `400 VALIDATION_ERROR` (`details[0].field === "items[1].bakeryItemId"`) **before** starting `prisma.$transaction`. |
| **Error Precedence & Indexed Field (TA Condition #2)** | `quantity <= 0` returns `400`; `quantity > stockQuantity` returns `409`. No upper-cap precedence defined. | When `quantity > 5` and `quantity > stockQuantity` simultaneously (e.g., `quantity: 6`, `stockQuantity: 3`), `POST /api/customer/orders` **MUST** return `400 VALIDATION_ERROR` **before** `409 CONFLICT` (`CR01-06`). `details[0].field` pinpoints the offending index (`items[<index>].quantity`, e.g., `items[1].quantity` in `CR01-03`). |
| **Backend Error Payload** | N/A for upper bound. | `HTTP 400`, `code: "VALIDATION_ERROR"`, `message: "Maximum order quantity is 5 units per item per order."`, `details: [{ field: "items[<index>].quantity", issue: "Quantity cannot exceed 5 per item per order" }]`. |
| **Frontend UI (`BakeryItemCard` / `OrderPage`)** | `+` button disabled only when `selectedQuantity >= item.stockQuantity`; no cap notice. | `+` button disabled when `isOutOfStock \|\| selectedQuantity >= Math.min(item.stockQuantity, 5)`; `OrderPage.handleQuantityChange` clamps to `[0, Math.min(item.stockQuantity, 5)]`; renders `"Max 5 per item"` notice (`CR01-UI-01..02`, `E2E-CR01-01`). |
| **Historical Orders & DB Schema** | `OrderItem.quantity` stored as `Int`. | **No schema or migration change.** Existing historical `OrderItem` records remain immutable and readable regardless of prior quantity. |

---

## 2. Compact Change Impact Table

| Req / Rule | Feature | Affected Contract / Doc Section | New / Revised AC IDs | Test IDs | Affected Code / Test Modules | Risk & Mitigation |
|---|---|---|---|---|---|---|
| **`BR-03`**, **`FR-03-01`** | `F-03` | `docs/srs.md` (§3 `BR-03`, §4.3 `FR-03-01`, Revision Log) | `AC-CR01-01`..`AC-CR01-06` | `CR01-01`..`06`, `CR01-UI-01..02`, `E2E-CR01-01`, `ORD-08` | Contract specification | Low — explicit v1.1.0 diff & invariants preserved |
| **`BR-03`**, **`FR-03-01`** | `F-03` | `docs/system-sds.md` (§3.1 Request Lifecycle, §4.1 ER Diagram, §6 `ADR-06`) | `AC-CR01-01`..`AC-CR01-06` | `CR01-01`..`06` | Architecture & design contract | Low — zero schema/infra impact |
| **`BR-03`**, **`FR-03-01`** | `F-03` | `docs/sprints/sprint-1/specification.md` (§4.3 `FR-03-01`, §5 `BR-03`, §7.2 `OrderItem.quantity`, §9.3 `AC-CR01-*`) | `AC-CR01-01`..`AC-CR01-06` | `CR01-01`..`06`, `CR01-UI-01..02`, `E2E-CR01-01`, `ORD-08` | Feature contract | Low — pre-code peer review gate |
| **`BR-03`**, **`FR-03-01`** | `F-03` | `docs/sprints/sprint-1/api-spec.md` (§2 Error Codes, §3 `CreateOrderBody`, §6.1 `POST /api/customer/orders`) | `AC-CR01-01`..`AC-CR01-04` | `CR01-01`..`06`, `ORD-08` | `server/src/services/orders.service.ts` (`createCustomerOrder`), `server/src/controllers/orders.controller.ts` (caller — unchanged) | Medium — precedence (`400` before `409`) & duplicate-item bypass verified by `CR01-05`, `CR01-06` |
| **`FR-03-01`** | `F-03` | `docs/sprints/sprint-1/ui-spec.md` (§2 `OrderPage`, §3.1 `BakeryItemCard`, §3.2 `OrderForm`) | `AC-CR01-05`, `AC-CR01-06` | `CR01-UI-01..02`, `E2E-CR01-01` | `client/src/components/BakeryItemCard.tsx`, `client/src/pages/OrderPage.tsx`, `client/src/components/OrderSummary.tsx` | Low — `Math.min(stockQuantity, 5)` cap + `"Max 5 per item"` notice verified by RTL & Playwright |
| **`BR-03`**, **`FR-03-01`** | `F-03` | `docs/sprints/sprint-1/tests.md` (§1 Pyramid, §2.3 `ORD-08` revision note, §2.6 `CR-01` Suite, §4 AC Traceability) | `AC-CR01-01`..`AC-CR01-06` | `CR01-01`..`06`, `CR01-UI-01..02`, `E2E-CR01-01`, `ORD-08` | `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`, `server/src/__tests__/sprint-1/orders.api.test.ts` (L429), `client/src/components/__tests__/BakeryItemCard.test.tsx`, `e2e/lab-7/order-quantity-cap.spec.ts` | Medium — `ORD-08` L429 conflict identified upfront & versioned before code |
| **Traceability** | `F-03` | `docs/traceability.md` (§2 Matrix `FR-03-01`, `BR-03`, `CR-01` rows, §3 Coverage Summary) | `AC-CR01-01`..`AC-CR01-06` | All 44 Sprint 1 + Lab 6 `#58` + 9 new `CR-01` tests | Requirements Traceability Matrix | Low — 0 orphan requirements or ACs |

---

## 3. Architectural & Cross-Cutting Impact Dimensions

### 3.1 Callers & Dependencies
- **Backend Call Chain:**
  - `server/src/routes/customer.routes.ts` → `authenticate` → `requireRole(['CUSTOMER'])` → `orders.controller.ts::createOrderHandler` → `orders.service.ts::createCustomerOrder`.
  - `createOrderHandler` delegates all payload/domain validation to `createCustomerOrder` and forwards `AppError` instances to the global Express error handler registered inline in `server/src/app.ts` (L80–L105). Therefore, adding `MAX_QUANTITY_PER_ITEM = 5` inside `createCustomerOrder` automatically protects `POST /api/customer/orders` with zero controller or route signature changes.
  - Pure calculation helpers (`calculateOrderTotals`, `snapshotItemPrices`) and read paths (`getCustomerOrders`, `getCustomerOrderById`, `operator.service.ts`) are **unaffected**.
- **Frontend Call Chain:**
  - `OrderPage.tsx` fetches `getCatalogItemsApi()`, renders `BakeryItemCard` with `selectedQuantity` and `onQuantityChange`, and renders `OrderSummary` with `selectedLines`, `pickupNote`, and `handleOrderSubmit` (`createCustomerOrderApi`).
  - `CatalogPage.tsx` renders `BakeryItemCard` in browse mode (`onSelect` without `onQuantityChange`); displaying `"Max 5 per item"` (when in-stock or in order mode) does not break catalog browsing or `E2E-02`.
  - `OrderSummary.tsx` receives already-clamped `selectedLines` and displays server error messages returned via `errorMessage` if a direct API/stale-UI submission triggers `400 VALIDATION_ERROR`.

### 3.2 UI & API Validation Rules (TA Conditions #1 & #2)
1. **Pre-Transaction Loop Order (`server/src/services/orders.service.ts`):**
   - Step 1: Non-empty `items` array (`400 VALIDATION_ERROR`).
   - Step 2: `pickupNote` type & `<= 500` chars (`400 VALIDATION_ERROR`, Lab 6 `#58` preserved).
   - Step 3: Per-element loop (`for (let index = 0; index < items.length; index++)`):
     - Non-null plain object check (`items[${index}]`).
     - Non-empty trimmed string `bakeryItemId` check (`items[${index}].bakeryItemId`).
     - **Duplicate `bakeryItemId` check (`seenItemIds` — TA Condition #1):** Rejects duplicate `bakeryItemId` with `400 VALIDATION_ERROR`, `details: [{ field: "items[<index>].bakeryItemId", issue: "Duplicate bakeryItemId entries are not allowed in a single order" }]`. Prevents bypassing the 5-unit cap by splitting e.g. `5 + 5` across two array entries.
     - Positive integer `quantity` check (`typeof !== 'number' || !Number.isInteger || <= 0`) → `400 VALIDATION_ERROR`, `details: [{ field: "items[<index>].quantity", issue: "Must be an integer greater than 0" }]`.
     - **Maximum quantity cap check (`quantity > MAX_QUANTITY_PER_ITEM` where `MAX_QUANTITY_PER_ITEM = 5` — TA Condition #2):** Rejects with `400 VALIDATION_ERROR`, `message: "Maximum order quantity is 5 units per item per order."`, `details: [{ field: "items[<index>].quantity", issue: "Quantity cannot exceed 5 per item per order" }]`.
   - Step 4: Only after **all** pre-transaction validations pass does `prisma.$transaction` begin to check existence (`404 NOT_FOUND`), `isAvailable` (`409 CONFLICT`), and `stockQuantity >= quantity` (`409 CONFLICT`).
   - **Precedence Guarantee:** Because Step 3 executes before Step 4, a payload with `quantity: 6` on an item with `stockQuantity: 3` deterministically returns `400 VALIDATION_ERROR` before `409 CONFLICT` (`CR01-06`).
2. **Frontend Enforcement (`client/`):**
   - Define `MAX_QUANTITY_PER_ITEM = 5`.
   - `BakeryItemCard.tsx`: compute `maxOrderQuantity = Math.min(item.stockQuantity, MAX_QUANTITY_PER_ITEM)`. Disable `+` button when `isOutOfStock || selectedQuantity >= maxOrderQuantity`. Render `"Max 5 per item"` notice alongside stock availability.
   - `OrderPage.tsx`: clamp `handleQuantityChange(itemId, newQty)` to `[0, Math.min(item.stockQuantity, MAX_QUANTITY_PER_ITEM)]`.

### 3.3 Roles & Ownership
- **`CUSTOMER`:** Subject to the `1 <= quantity <= 5` cap on `POST /api/customer/orders`. Ownership isolation (`BR-04`: `403 FORBIDDEN` on cross-customer `GET /api/customer/orders/:id`) is untouched.
- **`OPERATOR`:** Cannot place customer orders (`requireRole(['CUSTOMER'])` still rejects with `403 FORBIDDEN`). Shared global operator queue (`BR-06`) and order status transitions (`BR-07`) are untouched.
- **Unauthenticated Guest:** Still receives `401 UNAUTHORIZED` on `/api/customer/orders` before validation runs.

### 3.4 Persistence, Concurrency & Historical Orders
- **Persistence & Atomicity:** `prisma.$transaction` and conditional `tx.bakeryItem.updateMany({ where: { id, isAvailable: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } })` remain untouched. Invalid `quantity > 5` or duplicate `bakeryItemId` requests fail fast before acquiring any database connection or transaction lock.
- **Historical Orders (N/A — Immutable):** Any pre-existing `Order` and `OrderItem` rows stored in SQLite / Cloud SQL PostgreSQL 16 prior to `CR-01` (including any historical order with `quantity > 5`) remain completely intact and readable via `GET /api/customer/orders`, `GET /api/customer/orders/:id`, `GET /api/operator/orders`, and `GET /api/operator/orders/:id`. No retroactive mutation or data backfill is performed.
- **Prisma Schema & Migrations (N/A — No Schema Change):** `prisma/schema.prisma` and `prisma/migrations/` require **zero changes**. `OrderItem.quantity` remains `Int`, guaranteeing zero migration risk to production Cloud SQL data.

---

## 4. Audit of Existing Automated Tests (44 Sprint 1 + Lab 6 `#58`)

An exhaustive audit of all existing test files under `server/src/__tests__/` and `e2e/sprint-1/` confirms:
- **43 of 44 Sprint 1 tests + all Lab 6 `#58` tests:** Use valid quantities (`1`, `2`, `3`, or `<= 5`) or test non-quantity paths (`AUTH-*`, `CAT-*`, `OPS-*`, `E2E-01..09`). **Zero changes required.**
- **1 Intended Test Update Identified (`ORD-08` in `server/src/__tests__/sprint-1/orders.api.test.ts`, Line 429 — TA Condition #3):**
  - **Existing Code (L424–L434):** Sends `{ items: [{ bakeryItemId: itemInStockA, quantity: 20 }] }` at L429 against `itemInStockA` (actual remaining stock `7` = `10 - 2 - 1` after the Lab 6 `#58` test at L389, even though the inline comment at L424 says `8`) expecting `409 CONFLICT` (`Insufficient stock`).
  - **Why It Conflicts with `CR-01`:** Under the approved `CR-01` rule and `400`-before-`409` precedence (TA Condition #2), `quantity: 20` exceeds `MAX_QUANTITY_PER_ITEM = 5` and will now be rejected with `400 VALIDATION_ERROR` before reaching the `409 CONFLICT` stock check.
  - **Documented Intended Update (Deferred to `LAB7-ISSUE-02` `#75` Commit 2):** Update `ORD-08` sub-case 2 to target an item with low stock (e.g., `stockQuantity: 3`) and request a valid per-item quantity `<= 5` that still exceeds stock (e.g., `quantity: 5`, or `quantity: 4`), preserving the exact `409 CONFLICT` + `"Insufficient stock"` assertion without weakening test coverage.

---

## 5. Complete Enumeration of Affected & Referenced File Paths (TA Condition #4)

### 5.1 Lab 7 Plan & Approval Artifacts (`#73` — Merged in `lab-7-staging`)
- `plan/lab7-issues/INDEX.md`
- `plan/lab7-issues/LAB7-ISSUE-00.md`
- `plan/lab7-issues/LAB7-ISSUE-01.md`
- `plan/lab7-issues/LAB7-ISSUE-02.md`
- `plan/lab7-issues/LAB7-ISSUE-03.md`
- `docs/labs/lab-07/CHANGE_REQUEST_PROPOSAL.md`
- `docs/labs/lab-07/ta-approval-email-1.jpg`
- `docs/labs/lab-07/ta-approval-email-2.jpg`
- `.github/workflows/ci-docker.yml`

### 5.2 Engineering Contracts Revised in This PR (`#74` / `LAB7-ISSUE-01` — Part A)
- `docs/labs/lab-07/impact-and-contract-review.md` *(this document)*
- `docs/srs.md`
- `docs/system-sds.md`
- `docs/traceability.md`
- `docs/sprints/sprint-1/specification.md`
- `docs/sprints/sprint-1/api-spec.md`
- `docs/sprints/sprint-1/ui-spec.md`
- `docs/sprints/sprint-1/tests.md`

### 5.3 Implementation & Test Files Scoped for Wave 2 (`#75` / `LAB7-ISSUE-02` — Part B, Untouched in `#74`)
- **Backend Service:** `server/src/services/orders.service.ts`
- **Backend Tests:**
  - `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts` *(new: `CR01-01`..`CR01-06`)*
  - `server/src/__tests__/sprint-1/orders.api.test.ts` *(intended update to `ORD-08` L429 only)*
- **Frontend Components & Pages:**
  - `client/src/components/BakeryItemCard.tsx`
  - `client/src/pages/OrderPage.tsx`
  - `client/src/components/OrderSummary.tsx` *(if rule guidance label is added)*
- **Frontend Test Infrastructure & RTL Tests:**
  - `client/package.json`, `package-lock.json` *(`jsdom` devDependency)*
  - `client/vite.config.ts`, `client/src/test/setup.ts`
  - `client/src/components/__tests__/BakeryItemCard.test.tsx` *(new: `CR01-UI-01`..`CR01-UI-02`)*
- **Playwright E2E Tests:**
  - `e2e/lab-7/order-quantity-cap.spec.ts` *(new: `E2E-CR01-01`)*
  - `e2e/playwright.config.ts` *(if testDir update is needed)*

### 5.4 Explicitly Unaffected Paths (Zero Changes)
- `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- `server/src/controllers/orders.controller.ts`, `server/src/routes/*`, `server/src/middleware/*`
- `server/src/services/auth.service.ts`, `catalog.service.ts`, `operator.service.ts`
- All Sprint 2 branches (`sprint-2-staging`, `feat/s2-*`) — strictly isolated per TA Condition #4.

---

## 6. Unchanged System Invariants (Regression Guardrails)

The following invariants MUST remain 100% preserved after `CR-01` implementation:
- **`BR-01` & `BR-02`:** Server-side `totalAmount` calculation in integer satang (`Int`) and immutable `OrderItem.unitPriceAtOrder` snapshots.
- **`BR-03` (Atomicity):** Full `prisma.$transaction` rollback when any item fails stock/availability validation (`ORD-05`).
- **`BR-04`:** Customer ownership isolation (`403 FORBIDDEN` on cross-customer `GET /api/customer/orders/:id`, `ORD-11`).
- **`BR-05`:** Separation of `isAvailable` and `stockQuantity` (stock reaching `0` leaves `isAvailable: true` and renders `"Out of Stock"`).
- **`BR-06` & `BR-07`:** Shared global operator queue and forward-only order status transitions (`PENDING` → `ACCEPTED`).
- **Lab 6 Defect `#58`:** `pickupNote` maximum 500-character validation (`400 VALIDATION_ERROR`) and UI text-overflow wrapping.
- **Lab 5 CI/CD & Cloud Persistence:** `test-and-docker` GitHub Actions gate and GCP Cloud Run + Cloud SQL PostgreSQL 16 persistence.

---

## 7. Pre-Implementation Review Gate (`LAB7-ISSUE-01` Hard Stop)

- [x] Branch isolated on `docs/lab7-issue-01-impact-and-contract` targeting `lab-7-staging` (no Sprint 2 feature files touched).
- [x] Zero application code, test code, or Prisma schema changes in this PR (`AC-LAB7-01-05`).
- [x] All 4 TA approval conditions formally locked across SRS, System SDS, Sprint 1 Feature/API/UI/Test specs, and RTM.
- [ ] Substantive teammate PR review recorded by `@meebotsompurin-stack` and merged into `lab-7-staging` **before** any commit is created on `feat/lab7-issue-02-max-qty-cap` (`#75`).
