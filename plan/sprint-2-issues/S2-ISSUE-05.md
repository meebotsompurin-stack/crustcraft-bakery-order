# S2-ISSUE-05 — E2E/Regression Suite, Updated Traceability & Release Candidates (`v2.0.0-sprint2` / `v2.1.0-s3-progress`)

> **GitHub Issue:** [#65](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/65)  
> **Wave:** 4 (Deliverable 2 Integration, Verification & Release)  
> **Depends on:** `#62`, `#63` merged (`v2.0.0-sprint2` standalone release) and `#64` merged into `sprint-2-staging`  
> **Branch:** `test/s2-issue-05-e2e-traceability-release` → `sprint-2-staging` → Release PRs `sprint-2-staging` → `main`  
> **Assignee:** `@meebotsompurin-stack` *(Pair with `@poom2548`)* | **Reviewer:** `@poom2548`

---

## Objective
1. Update `e2e/playwright.config.ts` (broaden `testDir` from `./sprint-1` so both `sprint-1` and `sprint-2` suites execute, and replace the legacy SQLite `file:./dev.db` fallback with PostgreSQL `DATABASE_URL`) and verify the integrated release via Playwright E2E and full regression suites.
2. Execute the **two-stage release cadence** required by Deliverable 2 Part B & E:
   - **Release 1 (`v2.0.0-sprint2`):** Standalone Sprint 2 increment (`#62` + `#63` + Sprint 2 E2E) merged `sprint-2-staging` → `main` so the Sprint 2 release remains cleanly identifiable.
   - **Release 2 (`v2.1.0-s3-progress`):** Integrated Release Candidate (Sprint 1 + Sprint 2 + `#64` `F-08` + updated Deliverable 2 Part A/C/D/E docs) merged `sprint-2-staging` → `main` and verified live on GCP Cloud Run.

> **Lab 6 Guard:** Confirm Lab 6 UAT evidence and partner re-test screenshots on the Lab 6 deployment are archived before merging either Release PR into `main` (which triggers auto-deploy to GCP).

## Acceptance Criteria
- [ ] **AC-S2-REL-01 (`E2E-S2-01`..`06`):** `e2e/playwright.config.ts` supports both `e2e/sprint-1/` and `e2e/sprint-2/` against PostgreSQL `DATABASE_URL`; Playwright E2E suite verifies `F-05` catalog admin, `F-06` cancellation + stock restore & full fulfillment lifecycle, `F-07` simulated payment, `F-08` sales reporting, and Sprint 1 continuity regression across Desktop/Tablet/Mobile.
- [ ] **AC-S2-REL-02:** Full automated build + test suite (`npm test`, frontend `npm run build`, Playwright E2E) passes with zero skipped tests; temporary `"Release B"` banner removed from `client/src/App.tsx`.
- [ ] **AC-S2-REL-03 (Part D):** `docs/traceability.md`, `docs/features.md`, `docs/sprints/plan.md`, `docs/sprints/sprint-2/tests.md`, and `docs/sprints/sprint-3/tests.md` updated with actual test files, commit SHA, and honest PASS / Planned statuses (`F-09` explicitly marked Planned).
- [ ] **AC-S2-REL-04 (Part A & C):** `docs/sprints/sprint-2/deliverable-2-readiness.md` records Change/Defect Register (Lab 5–6 + pending Lab 7) and dated Remaining-Work Plan (`F-09`, final UAT, demo video by 13 Dec 2026).
- [ ] **AC-S2-REL-05 (Part B & E):** Two reviewed Release PRs `sprint-2-staging` → `main` pass CI (`test-and-docker`) and are tagged cleanly: **`v2.0.0-sprint2`** (standalone Sprint 2) and **`v2.1.0-s3-progress`** (integrated Deliverable 2 candidate auto-deployed on GCP Cloud Run with post-deploy smoke & persistence verification).

## Files Allowed
- `e2e/playwright.config.ts` *(broaden `testDir` to cover `sprint-1` + `sprint-2` and replace legacy SQLite `file:./dev.db` fallback with PostgreSQL)*
- `e2e/sprint-2/*`
- `client/src/App.tsx` *(clean up temporary Release B banner text)*
- `docs/traceability.md`, `docs/features.md`, `docs/sprints/plan.md`
- `docs/sprints/sprint-2/tests.md`, `docs/sprints/sprint-3/tests.md`
- `docs/sprints/sprint-2/deliverable-2-readiness.md`
- `README.md`
