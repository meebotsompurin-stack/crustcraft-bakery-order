# Sprint 2 & Deliverable 2 — Streamlined Issue Breakdown Index

> **Repository:** `https://github.com/meebotsompurin-stack/crustcraft-bakery-order`  
> **Co-Developers:**
> - **Repo Owner:** Purin Mebotsom (`67070507214`, GitHub: `@meebotsompurin-stack`)
> - **Co-Developer:** Saksorn Buranatananun (`67070507208`, GitHub: `@poom2548`)
> **Base Integration Branch:** `sprint-2-staging` (branched from `origin/main` at `c876686` including Lab 5 & Lab 6 `#58` fix)  
> **Target Checkpoint:** Project Deliverable 2 (Due **29 November 2026**, 70 points)  
> **Test ID Categories:** `ADM-01..08`, `FUL-01..08`, `PAY-01..07`, `RPT-01..06`, `E2E-S2-01..06`

---

## 1. Wave Execution Order (Wave 0 Plan + 5 Core Delivery Issues)

> **Rule:** `1 Issue = 1 Branch = 1 PR → sprint-2-staging`, followed by **two reviewed Release PRs (`sprint-2-staging` → `main`)** so the standalone Sprint 2 release (`v2.0.0-sprint2`) remains identifiable separately from the Sprint 3 integrated candidate (`v2.1.0-s3-progress`) per Deliverable 2 Part B.  
> **Hard Stop 1 (Plan Alignment):** `S2-ISSUE-00` (`#67`) merges first so both teammates approve the plan and enable CI on `sprint-2-staging`.  
> **Hard Stop 2 (Spec DD):** `S2-ISSUE-01` (`#61`) MUST be reviewed and merged into `sprint-2-staging` **before** any implementation commits in Wave 2–4 so Git timestamps prove contracts predated code.

| Wave | Issue Code | GitHub Issue | Branch | Assignee (Dev) | Reviewer | Parallel-Safe? | Deliverable 2 Coverage |
|:---:|---|:---:|---|---|---|---|---|
| **0** | [`S2-ISSUE-00`](./S2-ISSUE-00.md) | [#67](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/67) | `chore/s2-issue-00-master-plan` | `@poom2548` | `@meebotsompurin-stack` | ❌ Base Plan & CI | Master Plan & `sprint-2-staging` CI Trigger |
| **1** | [`S2-ISSUE-01`](./S2-ISSUE-01.md) | [#61](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/61) | `docs/s2-issue-01-contracts-and-setup` | `@poom2548` | `@meebotsompurin-stack` | ❌ Spec before Code | Part B & C Contracts, Part D Baseline Sync |
| **2** | [`S2-ISSUE-02`](./S2-ISSUE-02.md) | [#62](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/62) | `feat/s2-issue-02-fulfillment-cancel-payment` | `@meebotsompurin-stack` | `@poom2548` | ✅ Parallel with `#63` | Part B (`F-06` Fulfillment/Cancel + `F-07` Payment + Prisma Migration) |
| **2** | [`S2-ISSUE-03`](./S2-ISSUE-03.md) | [#63](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/63) | `feat/s2-issue-03-catalog-admin` | `@poom2548` | `@meebotsompurin-stack` | ✅ Parallel with `#62` | Part B (`F-05` Bakery Catalog Administration) |
| **3** | [`S2-ISSUE-04`](./S2-ISSUE-04.md) | [#64](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/64) | `feat/s2-issue-04-sales-reporting` | `@poom2548` | `@meebotsompurin-stack` | ❌ After `v2.0.0-sprint2` | Part C (`F-08` Sprint 3 Working Progress — Sales Reporting) |
| **4** | [`S2-ISSUE-05`](./S2-ISSUE-05.md) | [#65](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/65) | `test/s2-issue-05-e2e-traceability-release` | `@meebotsompurin-stack` *(Pair)* | `@poom2548` | ❌ Final Integration | Part A, C (Remaining-Work), D (Traceability), E (`v2.1.0-s3-progress`) |

### Merge & Release Order (Two Identifiable Releases on `main`)
```text
Wave 0:   #67 (chore/s2-issue-00-master-plan)              → sprint-2-staging  [Plan Alignment & CI Trigger]
             ↓
Wave 1:   #61 (docs/s2-issue-01-contracts-and-setup)       → sprint-2-staging  [Spec DD Timestamp Gate!]
             ↓
Wave 2:   #62 (feat/s2-issue-02-fulfillment-cancel-payment) → sprint-2-staging  (Parallel-safe)
          #63 (feat/s2-issue-03-catalog-admin)              → sprint-2-staging  (Parallel-safe)
             ↓
Release 1 (Sprint 2 Standalone — Deliverable 2 Part B):
          Sprint 2 E2E (E2E-S2-01..04, 06) verified on sprint-2-staging
          sprint-2-staging → main (Reviewed Release PR, Tag v2.0.0-sprint2)
             ↓
Wave 3:   #64 (feat/s2-issue-04-sales-reporting)            → sprint-2-staging  [Sprint 3 Progress: F-08]
             ↓
Wave 4:   #65 (test/s2-issue-05-e2e-traceability-release)   → sprint-2-staging  [E2E-S2-05, Traceability & Readiness Docs]
             ↓
Release 2 (Integrated Release Candidate — Deliverable 2 Part C/D/E):
          sprint-2-staging → main (Reviewed Release PR, Tag v2.1.0-s3-progress → GCP Auto-Deploy & Smoke Check)
```

> **Lab 6 Release Guard:** Do NOT merge Release 1 (`v2.0.0-sprint2`) or Release 2 (`v2.1.0-s3-progress`) into `main` until Lab 6 UAT evidence and partner re-test verification on the Lab 6 release are fully captured!

---

## 2. File Conflict Matrix (Wave 2 Parallel Execution)

| File / Directory | `#62` (`S2-ISSUE-02`: F-06/F-07) | `#63` (`S2-ISSUE-03`: F-05) | `#64` (`S2-ISSUE-04`: F-08) |
|---|:---:|:---:|:---:|
| `prisma/schema.prisma`, `prisma/migrations/*` *(note: `prisma/seed.ts` unchanged)* | ✅ owns | ❌ | ❌ |
| `server/src/lib/orderStatus.ts` | ✅ owns | ❌ | ❌ |
| `server/src/services/operator.service.ts` + `orders.service.ts` | ✅ owns | ❌ | ❌ |
| `server/src/services/payment.service.ts` + `payment.controller.ts` | ✅ owns | ❌ | ❌ |
| `server/src/services/catalogAdmin.service.ts` + `catalogAdmin.controller.ts` | ❌ | ✅ owns | ❌ |
| `server/src/services/reporting.service.ts` + `reporting.controller.ts` | ❌ | ❌ | ✅ owns |
| `client/src/components/PaymentStatusBadge.tsx`, `SimulatedPaymentCard.tsx`, `OperatorOrderRow.tsx` | ✅ owns | ❌ | ❌ |
| `client/src/pages/OrderDetailPage.tsx`, `MyOrdersPage.tsx`, `OperatorOrder*.tsx` | ✅ owns | ❌ | ❌ |
| `client/src/pages/OperatorCatalogPage.tsx` | ❌ | ✅ owns | ❌ |
| `client/src/pages/OperatorReportsPage.tsx` | ❌ | ❌ | ✅ owns |
| `server/src/routes/operator.routes.ts`, `client/src/services/api.ts`, `client/src/App.tsx` | ⚠️ append | ⚠️ append | ⚠️ append |

> **Shared Route/Client File Strategy:** The second Wave 2 PR to merge rebases onto `sprint-2-staging` and appends its own route lines / API helpers cleanly.

---

## 3. Test ID Allocation Summary

| Issue | Test ID Range | Count | Category | Target Files |
|---|---|:---:|---|---|
| `#62` (`S2-ISSUE-02`) | `FUL-01`..`FUL-08` | 8 | Fulfillment & Cancellation | `server/src/__tests__/sprint-2/fulfillment.api.test.ts` |
| `#62` (`S2-ISSUE-02`) | `PAY-01`..`PAY-07` | 7 | Simulated Payment | `server/src/__tests__/sprint-2/payment.api.test.ts` |
| `#63` (`S2-ISSUE-03`) | `ADM-01`..`ADM-08` | 8 | Catalog Administration | `server/src/__tests__/sprint-2/admin.api.test.ts` |
| `#64` (`S2-ISSUE-04`) | `RPT-01`..`RPT-06` | 6 | Sales Reporting (`F-08`) | `server/src/__tests__/unit/reporting.test.ts`, `server/src/__tests__/sprint-3/reporting.api.test.ts` |
| `#65` (`S2-ISSUE-05`) | `E2E-S2-01`..`E2E-S2-06` | 6 | Playwright Multi-Viewport E2E | `e2e/sprint-2/*.spec.ts` |
| **Total New Tests** | — | **35** | — | *(Plus all 44 Sprint 1 + Lab 6 `#58` regression tests)* |
