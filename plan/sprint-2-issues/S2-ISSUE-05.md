# S2-ISSUE-05 — E2E/Regression Suite, Updated Traceability & Release Candidate (v2.0.0)

> **GitHub Issue:** [#65](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/65)  
> **Wave:** 4 (Final Deliverable 2 Integration, Verification & Release)  
> **Depends on:** `#62`, `#63`, `#64` merged into `sprint-2-staging`  
> **Branch:** `test/s2-issue-05-e2e-traceability-release` → `sprint-2-staging` → Release PR `sprint-2-staging` → `main`  
> **Assignee:** `@meebotsompurin-stack` *(Pair with `@poom2548`)* | **Reviewer:** `@poom2548`

---

## Objective
Verify the integrated Sprint 1 + Sprint 2 + Sprint 3 (`F-08`) release candidate via Playwright E2E and full regression suites, update all Deliverable 2 Part A/C/D/E documentation (`docs/traceability.md`, `docs/features.md`, `docs/sprints/plan.md`, Change/Defect Register, Remaining-Work Plan for `F-09`), merge the reviewed Release PR into `main`, tag `v2.0.0`, and validate live GCP Cloud Run deployment and database persistence.

> **Lab 6 Guard:** Confirm Lab 6 UAT evidence and partner re-test screenshots on the Lab 6 deployment are archived before merging `sprint-2-staging` → `main` (which triggers auto-deploy to GCP).

## Acceptance Criteria
- [ ] **AC-S2-REL-01 (`E2E-S2-01`..`06`):** Playwright E2E suite in `e2e/sprint-2/` verifies `F-05` catalog admin, `F-06` cancellation + stock restore & full fulfillment lifecycle, `F-07` simulated payment, `F-08` sales reporting, and Sprint 1 continuity regression across Desktop/Tablet/Mobile.
- [ ] **AC-S2-REL-02:** Full automated build + test suite (`npm test`, frontend `npm run build`, Playwright E2E) passes with zero skipped tests; temporary `"Release B"` banner removed from `client/src/App.tsx`.
- [ ] **AC-S2-REL-03 (Part D):** `docs/traceability.md`, `docs/features.md`, `docs/sprints/plan.md`, `docs/sprints/sprint-2/tests.md`, and `docs/sprints/sprint-3/tests.md` updated with actual test files, commit SHA, and honest PASS / Planned statuses (`F-09` explicitly marked Planned).
- [ ] **AC-S2-REL-04 (Part A & C):** `docs/sprints/sprint-2/deliverable-2-readiness.md` records Change/Defect Register (Lab 5–6 + pending Lab 7) and dated Remaining-Work Plan (`F-09`, final UAT, demo video by 13 Dec 2026).
- [ ] **AC-S2-REL-05 (Part E):** Reviewed Release PR `sprint-2-staging` → `main` passes CI (`test-and-docker`), merges, tags `v2.0.0`, auto-deploys on GCP Cloud Run, and passes post-deploy smoke & persistence verification.

## Files Allowed
- `e2e/sprint-2/*`
- `client/src/App.tsx` *(clean up temporary Release B banner text)*
- `docs/traceability.md`, `docs/features.md`, `docs/sprints/plan.md`
- `docs/sprints/sprint-2/tests.md`, `docs/sprints/sprint-3/tests.md`
- `docs/sprints/sprint-2/deliverable-2-readiness.md`
- `README.md`
