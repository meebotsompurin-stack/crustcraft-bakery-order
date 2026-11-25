# Project Deliverable 2 — Continuity, Change Register, Remaining-Work Plan & Release Readiness

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Assessment:** Project Deliverable 2 — Sprint 2 Completion & Sprint 3 Progress (Due **29 November 2026 at 23:59 +07**, 70 points)  
> **System:** CrustCraft Artisan Bakery — Pre-Order & Fulfillment System (Theme 4: E-Commerce / Ordering System)  
> **Repository:** `https://github.com/meebotsompurin-stack/crustcraft-bakery-order`  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)
> **Release Lineage:**
> - Accepted Sprint 1 Baseline: `v1.0.0-sprint1` (`ebcf83b` → `7a1d9db`, PR `#15`)
> - Lab 5/6 Deployed Baseline: `c876686` (PR `#60`, GCP Cloud Run + Cloud SQL PostgreSQL 16 + Lab 6 `#58` fix)
> - Standalone Sprint 2 Release (Part B): `v2.0.0-sprint2` (`c63f876`, PR `#72`)
> - Lab 7 Maintenance Release (`CR-01`): `v2.0.1-lab7` (`b80a0d0`, PR `#82`, Cloud Run `crustcraft-00012-4dq`; Lab 7 report merged at `b371ba8`, PR `#84`)
> - **Target Deliverable 2 Integrated Release Candidate (Part E):** `v2.1.0-s3-progress` (Sprint 1 + Lab 5–7 + Sprint 2 `F-05`–`F-07` + Sprint 3 `F-08`)

---

## 1. Part A — Sprint 1 Continuity & Change/Defect Register

### 1.1 Sprint 1 Continuity Verification
The accepted Sprint 1 baseline (`v1.0.0-sprint1`, commit `7a1d9db`) established `F-01` (Auth/RBAC), `F-02` (Public Catalog), `F-03` (Customer Pre-Order Creation), and `F-04` (Operator Queue & Acceptance). Across all subsequent Lab 5–7 and Sprint 2–3 changes, all original critical journeys remain intact:
- **Backend Regression:** 100% of Sprint 1 unit & API integration tests (`AUTH-01..10`, `CAT-01..05`, `ORD-01..12` with versioned `ORD-08` update for `CR-01`, `OPS-01..08`) pass against PostgreSQL 16 with zero skipped tests.
- **Browser E2E Continuity (`E2E-S2-06`):** `e2e/sprint-1/auth-guard.spec.ts`, `customer-order-flow.spec.ts`, and `operator-acceptance-flow.spec.ts` (`E2E-01`..`E2E-09`) remain green across Desktop (`1280px`), Tablet (`768px`), and Mobile (`375px`).

### 1.2 Change & Defect Register (Labs 5–7)

| ID | Source | Affected Req / Feature | Accepted Decision / Rationale | Status | Fix / Change Release | Re-Test Outcome |
|---|---|---|---|---|---|---|
| **CHG-L5-01** | Lab 5 (`#16`–`#26`) | `NFR-05`, System Base (`ADR-01`) | Migrated database from local SQLite to Cloud SQL PostgreSQL 16 (`prisma/migrations/20261113020711_init_postgres`), containerized unified app in `Dockerfile`, and deployed to GCP Cloud Run with GitHub Actions WIF CI/CD (`ci-docker.yml`, `deploy.yml`). | **Resolved** | `c876686` (Lab 5/6 `main`) | `deploy/tests/test_smoke.py` (`5/5`), CI & Cloud Run persistence + rollback verified (`docs/labs/lab-05/deployment.md`). |
| **DEF-L6-58** | Lab 6 Cross-Team UAT (`#58`, BFteam `UAT-CC-02`) | `FR-03-01` (`AC-03-07`, `F-03`) | `pickupNote > 500` chars was accepted (`201`) and overflowed UI cards. Added server-side `pickupNote.trim().length > 500` guard (`400 VALIDATION_ERROR`) and UI `maxLength={500}` + `break-words`. | **Resolved (`CLOSED`)** | PR `#59` → PR `#60` (`c876686`) | Automated regression in `orders.api.test.ts` (`18/18`) passes continuously on `v2.0.0-sprint2`, `v2.0.1-lab7`, and `v2.1.0-s3-progress`. |
| **CR-01** | Lab 7 Maintenance (`#73`–`#76`, TA Approved 24 Nov 2026) | `BR-03`, `FR-03-01` (`F-03`) | Enforced `1 <= quantity <= 5` (`MAX_QUANTITY_PER_ITEM = 5`) per bakery item per order, duplicate `bakeryItemId` `400` pre-transaction guard, `400`-before-`409` precedence, frontend `Math.min(stockQuantity, 5)` cap + `"Max 5 per item"` notice, and versioned `ORD-08` (L429) update. Zero schema change. | **Resolved (`CLOSED`)** | PR `#77`, `#80`, `#81`, `#82` (`v2.0.1-lab7` / `b80a0d0`) + PR `#83`–`#84` (`b371ba8`) | `CR01-01..06` (`6/6`), `CR01-UI-01..02` (`2/2`), `E2E-CR01-01` (`3/3` viewports), and `13/13` live Cloud Run checks (`EV-01`) passed. |

---

## 2. Part B — Sprint 2 Feature Completion Summary (`v2.0.0-sprint2`)

| Feature ID | Feature Name | Acceptance Criteria | Implementation (Issue / PR) | Executed Verification | Result | Accepted Release |
|---|---|---|---|---|:---:|---|
| **F-05** | Bakery Catalog Administration | `AC-S2-F05-01`..`08` | `S2-ISSUE-03` (`#63`, PR `#70`): `catalogAdmin.service.ts`, `catalogAdmin.controller.ts`, `OperatorCatalogPage.tsx` | `ADM-01..08` (`server/src/__tests__/sprint-2/admin.api.test.ts`), `E2E-S2-01` (`e2e/sprint-2/catalog-admin.spec.ts`) | **PASS** | `v2.0.0-sprint2` (`c63f876`) |
| **F-06** | Order Fulfillment & Cancellation Lifecycle | `AC-S2-F06-01`..`05` | `S2-ISSUE-02` (`#62`, PR `#69`): `orderStatus.ts`, `operator.service.ts`, `orders.service.ts`, `OperatorOrderRow.tsx`, `OrderDetailPage.tsx` | `FUL-01..08` (`server/src/__tests__/sprint-2/fulfillment.api.test.ts`), `E2E-S2-02..03` (`e2e/sprint-2/fulfillment-cancel.spec.ts`) | **PASS** | `v2.0.0-sprint2` (`c63f876`) |
| **F-07** | Simulated Payment Transitions | `AC-S2-DB-01`, `AC-S2-F07-01`..`05` | `S2-ISSUE-02` (`#62`, PR `#69`): Prisma migration `20261123153646_add_order_payment_status`, `payment.service.ts`, `payment.controller.ts`, `PaymentStatusBadge.tsx`, `SimulatedPaymentCard.tsx` | `PAY-01..07` (`server/src/__tests__/sprint-2/payment.api.test.ts`), `E2E-S2-04` (`e2e/sprint-2/payment.spec.ts`) | **PASS** | `v2.0.0-sprint2` (`c63f876`) |

---

## 3. Part C — Sprint 3 Working Progress & Bounded Remaining-Work Plan (By 13 Dec 2026)

### 3.1 Implemented Sprint 3 Progress (`F-08`)
- **`F-08: Bakery Sales & Order Summary Reporting`** (`S2-ISSUE-04` / `#64`, PR `#78` + `S2-ISSUE-05` / `#65`, PR `#79`) is **implemented and verified**:
  - Backend: `server/src/services/reporting.service.ts` (`buildSalesSummary`, `getSalesSummary`), `server/src/controllers/reporting.controller.ts`, `GET /api/operator/reports/summary`.
  - Frontend: `client/src/pages/OperatorReportsPage.tsx` (`/operator/reports`) with THB revenue KPIs, status/payment distribution, top-selling items table, and date range filter.
  - Automated Tests: `RPT-01..02` (`server/src/__tests__/unit/reporting.test.ts`), `RPT-03..06` (`server/src/__tests__/sprint-3/reporting.api.test.ts`), and `E2E-S2-05` (`e2e/sprint-2/reporting.spec.ts` across Desktop/Tablet/Mobile).

### 3.2 Remaining-Work Plan (Planned Around Final Exam Period: 1–11 Dec 2026)

> **Scheduling Strategy:** Because final exams run **1–11 December 2026**, 8 of 9 core features (`F-01`–`F-08` + Lab 7 `CR-01`) are already complete by **29 November 2026**. Only bounded `F-09` filtering/search, non-blocking CI hardening (`TD-01`–`TD-03`), final regression/UAT, and the 10-minute demo video remain for the final sprint window.

| Feature / Debt ID | Current Status | Remaining Action | Dependencies | Owner & Target Date |
|---|---|---|---|---|
| **F-09 (`FR-09-01`)** | **Planned** — Contracted in `docs/sprints/sprint-3/*` (`AC-S3-F09-01`..`04`, `SRCH-01..04`); not yet coded. | Implement query-parameter filtering (`status`, `paymentStatus`, `q`, `from`/`to`, `minTotal`/`maxTotal`) in `operator.service.ts`, add filter bar in `OperatorOrderQueuePage.tsx`, and verify with TDD `SRCH-01..04`. | `v2.1.0-s3-progress` on `main` | Saksorn Buranatananun (`@poom2548`) — **Target: 6 Dec 2026** |
| **TD-01 (CI Frontend Gate)** | **Tracked Debt** — `npm run test --workspace=client` (`2/2` RTL) currently runs locally prior to PR merge. | Add `npm run test --workspace=client` step to `.github/workflows/ci-docker.yml` so PR CI gates frontend RTL tests automatically. | None | Purin Mebotsom (`@meebotsompurin-stack`) — **Target: 7 Dec 2026** |
| **TD-02 (Authenticated Smoke Check)** | **Tracked Debt** — `Deploy demo` logs `SKIP login` due to unset optional smoke secrets. | Provision dedicated least-privilege `SMOKE_EMAIL`/`SMOKE_PASSWORD` GitHub Secrets so post-deploy Cloud Run smoke tests verify authenticated login automatically. | GCP Cloud Run service | Saksorn Buranatananun (`@poom2548`) — **Target: 7 Dec 2026** |
| **TD-03 (Dependabot & Node 24 Actions)** | **Tracked Debt** — 13 automated Dependabot PRs & GitHub Actions Node 20 deprecation notices pending triage. | Triage and merge verified Dependabot action/devDependency upgrades in a dedicated maintenance PR. | `TD-01` | Purin Mebotsom (`@meebotsompurin-stack`) — **Target: 9 Dec 2026** |
| **F-09 (`FR-09-02`) Final Regression & UAT** | **Planned** — `AC-S3-F09-05`, `REGRESS-01..02` scheduled after `F-09` lands. | Run full backend + client RTL + Playwright multi-viewport regression (`REGRESS-01..02`), execute final UAT check on Cloud Run `v3.0.0`, and verify zero open Critical/Major defects. | `F-09 (FR-09-01)` merged | Both (`@meebotsompurin-stack` & `@poom2548`) — **Target: 11 Dec 2026** |
| **Final Delivery Package & Demo Video** | **Planned** — Required by Final Project Delivery rubric (100 pts). | Tag `v3.0.0` on `main`, record 10-minute HD demonstration video covering customer/operator journeys, RBAC, and business rules, and compile Final Report PDF for LEB2 submission. | Final regression green on `v3.0.0` | Both (`@meebotsompurin-stack` & `@poom2548`) — **Target: 13 Dec 2026** |

---

## 4. Part E — Integrated Release Candidate Readiness Review (`v2.1.0-s3-progress`)

| Readiness Dimension | Status | Evidence / Notes |
|---|:---:|---|
| **Scope Completeness** | **READY** | All Sprint 1 (`F-01`–`F-04`), Lab 5–7 (`#58`, `CR-01`), Sprint 2 (`F-05`–`F-07`), and Sprint 3 progress (`F-08`) integrated cleanly on one codebase; `F-09` honestly scoped as Planned. |
| **UI Polish** | **READY** | Temporary `"Release B"` banner removed from `client/src/App.tsx`; responsive layouts verified at `1280px`, `768px`, and `375px` (`NFR-04`). |
| **Database Migrations** | **READY** | Forward-only PostgreSQL migrations (`20261113020711_init_postgres`, `20261123153646_add_order_payment_status`) apply cleanly via `prisma migrate deploy` with zero data loss. |
| **Open Defects** | **READY** | `0` open Critical, `0` open Major, `0` open Minor defects (Lab 6 `#58` resolved and regression-guarded). |
| **Documentation & Setup** | **READY** | `docs/features.md`, `docs/traceability.md` (`v2.1.0`), `docs/sprints/sprint-2/tests.md`, `docs/sprints/sprint-3/tests.md`, and `README.md` updated to match the PostgreSQL + Sprint 2/3 + Lab 7 release. |
| **Release Candidate Verdict** | **`READY FOR RELEASE PR`** | Ready to merge `sprint-2-staging` → `main`, auto-deploy to GCP Cloud Run, tag **`v2.1.0-s3-progress`**, and execute post-deploy smoke & persistence verification. |
