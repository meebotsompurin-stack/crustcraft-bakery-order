# S2-ISSUE-01 — Sprint 2 & Sprint 3 Contracts, Baseline Sync & CI Setup

> **GitHub Issue:** [#61](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/61)  
> **Wave:** 1 (Spec-Driven Development Gate — MUST merge before Wave 2 code)  
> **Branch:** `docs/s2-issue-01-contracts-and-setup` → `sprint-2-staging`  
> **Assignee:** `@poom2548` | **Reviewer:** `@meebotsompurin-stack`

---

## Objective
Author complete pre-implementation Engineering Contracts for **Sprint 2** (`F-05`, `F-06`, `F-07`) and **Sprint 3** (`F-08`, `F-09`), synchronize product baseline documentation (`docs/srs.md`, `docs/system-sds.md`, `docs/features.md`) with Lab 5 PostgreSQL/Cloud Run deployment and Lab 6 defect `#58`, publish the 5-issue execution plan (`plan/sprint-2-issues/`), and add `sprint-2-staging` to `.github/workflows/ci-docker.yml`.

## Acceptance Criteria
- [ ] **AC-S2-00-01:** `.github/workflows/ci-docker.yml` triggers `test-and-docker` on PRs to `sprint-2-staging`.
- [ ] **AC-S2-00-02:** `plan/sprint-2-issues/` contains `INDEX.md` and `S2-ISSUE-01.md`..`S2-ISSUE-05.md` mapped to GitHub Issues `#61`–`#65`.
- [ ] **AC-S2-00-03:** `docs/sprints/sprint-2/` contains `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md` covering `F-05`, `F-06`, and `F-07`.
- [ ] **AC-S2-00-04:** `docs/sprints/sprint-3/` contains `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md` covering `F-08` and `F-09`.
- [ ] **AC-S2-00-05:** `docs/srs.md`, `docs/system-sds.md`, and `docs/features.md` are updated to `v2.0.0` reflecting PostgreSQL/Cloud SQL (Lab 5), `pickupNote` 500-char validation (Lab 6 `#58`), and `Order.paymentStatus`.

## Files Allowed
- `.github/workflows/ci-docker.yml`
- `plan/sprint-2-issues/*`
- `docs/sprints/sprint-2/*`
- `docs/sprints/sprint-3/*`
- `docs/srs.md`, `docs/system-sds.md`, `docs/features.md`
