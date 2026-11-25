# LAB7-ISSUE-01 — Change Impact Analysis & Pre-Implementation Contract Revision (Part A)

> **GitHub Issue:** [#74](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/74)  
> **Wave:** 1 (Spec-Driven Maintenance Gate — MUST be reviewed & merged into `lab-7-staging` before Wave 2 code)  
> **Depends on:** `#73` (`LAB7-ISSUE-00`) merged into `lab-7-staging` & TA screenshots attached to `#73`  
> **Branch:** `docs/lab7-issue-01-impact-and-contract` → `lab-7-staging` *(isolated from `sprint-2-staging`)*  
> **Assignee:** `@poom2548` | **Reviewer:** `@meebotsompurin-stack`

---

## Objective (Lab 7 Part A — 25 Points)
Author and peer-review the complete **Change Impact Analysis** and **Revised Engineering Contracts** (SRS, System SDS, Sprint 1 Feature/API/UI Specifications, Software Test Specification, and Traceability Matrix) for `CR-01` (`BR-03` / `FR-03-01`: `1 <= quantity <= 5` per bakery item per order) **prior to any code changes**, incorporating all 4 TA approval conditions.

## TA Conditions Locked in This Issue
1. **Duplicate `bakeryItemId` Loophole (TA Condition #1):** Explicitly document in `docs/sprints/sprint-1/api-spec.md` and `specification.md` that duplicate `bakeryItemId` entries in `items[]` (e.g., two lines of `quantity: 5` for the same item) are rejected with `400 VALIDATION_ERROR` before transaction execution, and specify test `CR01-05`.
2. **Validation Precedence & Indexed `details[].field` (TA Condition #2):** Explicitly specify that when `quantity > 5` and `quantity > stockQuantity` simultaneously (e.g., `quantity: 6, stock: 3`), `POST /api/customer/orders` returns `400 VALIDATION_ERROR` **before** `409 CONFLICT` (`CR01-06`), and `details[].field` pinpoints the offending array element (`items[<index>].quantity`, e.g., `items[1].quantity` in `CR01-03`).
3. **Frontend UI, E2E & `ORD-08` Intended Test Update (TA Condition #3):** Specify `CR01-UI-01..02` (`Math.min(stockQuantity, 5)` and `"Max 5 per item"` notice via React Testing Library + `jsdom`), `E2E-CR01-01` (Playwright), and explicitly document & version the intended test update to `ORD-08` in `server/src/__tests__/sprint-1/orders.api.test.ts` (L429: old `quantity: 20` expecting `409` → new valid `quantity <= 5` exceeding lower stock).
4. **Explicit Paths & Sprint 2 Isolation (TA Condition #4):** Enumerate every affected Contract, Test, and `plan/lab7-issues/` file path in `docs/labs/lab-07/impact-and-contract-review.md` and keep this PR strictly isolated from `sprint-2-staging`.

## Acceptance Criteria
- [ ] **AC-LAB7-01-01 (Impact Table):** `docs/labs/lab-07/impact-and-contract-review.md` contains a compact impact table linking `FR-03-01` / `BR-03`, `F-03`, affected SRS/SDS/Feature/API/UI/STS sections, `AC-CR01-*`, Test IDs (`CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`, `ORD-08`), and code modules, covering callers/dependencies, UI/API validation, roles/ownership (`CUSTOMER` vs `OPERATOR`), persistence, historical orders (N/A — immutable existing `OrderItem` records preserved), and Prisma schema/migrations (N/A — pure domain validation change).
- [ ] **AC-LAB7-01-02 (SRS & SDS Revision):** `docs/srs.md` and `docs/system-sds.md` are version-bumped with old-to-new `BR-03` / `FR-03-01` rule definition, error precedence (`400` before `409`), duplicate-item `400` rule, and preserved invariants (`BR-01`, `BR-02`, `BR-03` atomicity, `BR-04`..`BR-07`, Lab 6 `#58`).
- [ ] **AC-LAB7-01-03 (Sprint 1 Contract & STS Revision):** `docs/sprints/sprint-1/specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, and `docs/traceability.md` define exact error JSON envelope, `details[].field` indexing, `"Max 5 per item"` UI behavior, inputs/preconditions/expected results for `CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`, and the versioned revision note for `ORD-08`.
- [ ] **AC-LAB7-01-04 (Pre-Code Review Gate):** Substantive teammate PR review by `@meebotsompurin-stack` is recorded and merged **before** any implementation commit in `LAB7-ISSUE-02` (`#75`).
- [ ] **AC-LAB7-01-05 (No Code Changes):** Zero changes to `server/`, `client/`, `e2e/`, or `prisma/` in this PR.

## Files Allowed
- `docs/labs/lab-07/impact-and-contract-review.md`
- `docs/srs.md`
- `docs/system-sds.md`
- `docs/traceability.md`
- `docs/sprints/sprint-1/specification.md`
- `docs/sprints/sprint-1/api-spec.md`
- `docs/sprints/sprint-1/ui-spec.md`
- `docs/sprints/sprint-1/tests.md`
