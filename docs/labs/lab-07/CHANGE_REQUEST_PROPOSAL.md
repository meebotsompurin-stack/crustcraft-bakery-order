# Lab 7 Change Request Proposal — CrustCraft Artisan Bakery

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Assessment:** Group Lab 7 — Maintenance, Metrics, and Release Readiness  
> **Project:** CrustCraft Artisan Bakery — Pre-Order & Fulfillment System (Theme 4: E-Commerce / Ordering System)  
> **Repository:** https://github.com/meebotsompurin-stack/crustcraft-bakery-order  
> **Team Members:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: `@meebotsompurin-stack`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: `@poom2548`)
>
> **Baseline References:**
> - **Accepted Sprint 1 Baseline:** Tag `v1.0.0-sprint1` (Commit `ebcf83b`)
> - **Pre-Change Implementation Baseline (`main`):** Commit `c876686` *(includes Lab 5 Cloud Run / PostgreSQL 16 deployment & Lab 6 Defect `#58` fix)*
>
> **Approval Record:**
> - **Status:** Approved
> - **Approver:** นายรัตนโชติ เพ็ชรพันธ์ศรี (พี่ลูกหมู) — TA Section 131
> - **Approval Date:** 24 November 2026, 15:07 (+07)
> - **Evidence:** `docs/labs/lab-07/ta-approval-email-2.jpg`, `docs/labs/lab-07/ta-approval-email-1.jpg`, and GitHub Issue `#73`

---

## 1. Change Request Summary (`CR-01`)

### 1.1 Existing Implemented Behavior (Sprint 1 — `F-03`, `BR-03`, `FR-03-01`)
In the currently deployed system (`server/src/services/orders.service.ts` — `createCustomerOrder`), when an authenticated `CUSTOMER` submits a pre-order via `POST /api/customer/orders`, the server validates only that each line item's `quantity` is a positive integer (`quantity > 0`) and does not exceed physical inventory (`quantity <= stockQuantity`).
- As a result, a single customer can reserve an entire daily baking batch of an item in one order (e.g., 50 croissants or 80 brioche rolls at once), leaving zero availability for other customers.

### 1.2 Proposed Business Rule Change
Modify **Business Rule `BR-03`** and **Functional Requirement `FR-03-01`** (`F-03: Customer Pre-Order Creation`) to enforce a **per-item quantity cap of 5 units per order**:
- **New Rule:** For every line item in `POST /api/customer/orders`, `quantity` MUST satisfy `1 <= quantity <= 5` (in addition to `quantity <= stockQuantity`).
- **Backend Behavior:** Any request containing a line item with `quantity > 5` is rejected with **`HTTP 400 VALIDATION_ERROR`** using the standard error envelope:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Maximum order quantity is 5 units per item per order.",
      "details": [
        { "field": "items[0].quantity", "issue": "Quantity cannot exceed 5 per item per order" }
      ]
    }
  }
  ```
- **Frontend Behavior:** `BakeryItemCard` caps the `+` quantity selector at `Math.min(item.stockQuantity, 5)` and displays a clear `"Max 5 per item"` notice alongside stock availability.
- **Why this qualifies for Lab 7:** This modifies an **already implemented Sprint 1 business rule (`BR-03`)** based on real small-batch artisan bakery operational constraints. It is **not** a planned feature from the Sprint 2/3 backlog (`F-05`–`F-09`).

---

## 2. Preliminary Change Impact Analysis

| Layer | Affected Artifact / File | Planned Change |
|---|---|---|
| **Requirements (SRS)** | `docs/srs.md` | Revise `BR-03` and `FR-03-01` to specify the `1 <= quantity <= 5` per-item order limit with revision log entry. |
| **Feature & API Contract** | `docs/sprints/sprint-1/specification.md`, `api-spec.md`, `tests.md` *(or `docs/labs/lab-07/`)* | Update `POST /api/customer/orders` validation contract, add Acceptance Criteria (`AC-CR01-*`) and Software Test Specification (`CR01-01`..`CR01-04`) **prior to code changes**. |
| **Backend Domain Logic** | `server/src/services/orders.service.ts` | Add `MAX_QUANTITY_PER_ITEM = 5` constant and validation guard inside `createCustomerOrder()` before starting the stock-deduction transaction. |
| **Frontend UI** | `client/src/components/BakeryItemCard.tsx`, `client/src/components/OrderSummary.tsx` | Cap `+` button at `Math.min(item.stockQuantity, 5)` and render subtle `"Max 5 per item"` rule guidance. |
| **Database Schema** | `prisma/schema.prisma` | **No schema or migration change required** (pure domain validation change; zero risk to existing Cloud SQL data). |
| **Automated Tests** | `server/src/__tests__/sprint-1/orders.api.test.ts` *(or dedicated `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts`)* | Add TDD failing tests first (`RED`), implement rule (`GREEN`), and run full backend + frontend build + regression suite. |

---

## 3. Unchanged System Invariants (Regression Guardrails)

The following existing behaviors MUST remain 100% intact after the change:
- **BR-01 & BR-02:** Authoritative server-side total calculation in integer satang (`Int`) and historical `unitPriceAtOrder` snapshotting.
- **BR-03 (Atomicity):** Transactional `prisma.$transaction` stock deduction and full rollback on insufficient stock (`409 CONFLICT`).
- **BR-04 & BR-06:** Customer order ownership isolation (`403 FORBIDDEN` on cross-customer access) and shared global operator queue.
- **BR-05:** Separation of `isAvailable` and `stockQuantity` (stock reaching `0` stays visible as `"Out of Stock"`).
- **BR-07:** Operator order status transition rules (`PENDING` → `ACCEPTED`).
- **Lab 6 Defect `#58`:** `pickupNote` maximum 500-character validation (`400 VALIDATION_ERROR`) and UI text-overflow protection.
- **Lab 5 CI/CD & Persistence:** GitHub Actions `test-and-docker` quality gate and GCP Cloud Run + Cloud SQL deployment pipeline.

---

## 4. Planned TDD & Verification Cases

| Test ID | Level | Input / Precondition | Expected Result (Before Change → After Change) |
|---|---|---|---|
| **CR01-01** | API Integration | `CUSTOMER` submits `POST /api/customer/orders` with `quantity: 5` (stock = `20`) | Boundary allowed: `201 Created`; stock decremented from `20` → `15`. |
| **CR01-02** | API Integration | `CUSTOMER` submits `POST /api/customer/orders` with `quantity: 6` (stock = `20`) | **Before (RED):** `201 Created` (fails new test) → **After (GREEN):** `400 VALIDATION_ERROR`, stock remains `20`, no order persisted. |
| **CR01-03** | API Integration | `CUSTOMER` submits multi-item order: item A `quantity: 2` + item B `quantity: 6` | Rejected with `400 VALIDATION_ERROR`; neither item A nor item B stock is deducted. |
| **CR01-04** | API Integration | `CUSTOMER` submits `quantity: 5` when item only has `stockQuantity: 3` | Existing stock guard still fires: `409 CONFLICT` (insufficient stock), proving `BR-03` stock check is unaffected. |
| **REGRESS** | Full Suite | `npm test` + `client` build + CI `test-and-docker` | All existing Sprint 1 (44 tests) and Lab 6 `#58` tests pass with zero skipped/weakened assertions. |

---

## 5. Planned Execution Workflow (Post-Approval)

1. Record Instructor/TA approval (Approver name + date) in `docs/labs/lab-07/`.
2. Create a dedicated GitHub Issue and branch labeled `lab7` (kept strictly separate from Sprint 2 feature work).
3. **Contract First:** Commit and review the Change Impact Analysis and updated Contract/AC/STS before code.
4. **TDD Red → Green:** Commit failing tests (`CR01-01`..`CR01-04`), then commit backend/frontend implementation with all tests + regression passing.
5. **Review, CI & Redeploy:** Peer review by teammate → CI `test-and-docker` green → merge to `main` → auto-deploy to GCP Cloud Run → verify live deployment + collect 5 dated engineering metrics and release readiness retrospective.
