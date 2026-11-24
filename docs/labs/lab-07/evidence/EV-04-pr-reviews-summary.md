# Lab 7 Substantive Pull Request Review Evidence (`EV-04`)

## 1. PR #80 — Part A Pre-Implementation Contract Review (`#74` / `LAB7-ISSUE-01`)
- **Branch:** `docs/lab7-issue-01-impact-and-contract` → `lab-7-staging`
- **Author:** `@poom2548` | **Reviewer:** `@meebotsompurin-stack`
- **Merged:** `2026-11-24T15:47:46Z` (`22:47:46 +07`, merge commit `12c7625`) — **strictly before** first Wave 2 code/test commit (`858d232` at `22:54:06 +07`).
- **Substantive Review Cycle (`CHANGES_REQUESTED` → Follow-up `ee72803` → `APPROVED`):**
  1. `@meebotsompurin-stack` requested 2 required factual fixes against the live codebase:
     - `docs/labs/lab-07/impact-and-contract-review.md` L49 referenced non-existent `error.middleware.ts`; actual global `AppError` handler is inline in `server/src/app.ts` (L80–L105).
     - `docs/sprints/sprint-1/tests.md` §2.6 `E2E-CR01-01` expected `5 ×` on `/orders/:id`, whereas `OrderDetailPage.tsx` renders `฿<price> × 5` (and `OrderSummary.tsx` on `/orders/new` renders `5 ×`).
  2. `@poom2548` addressed both required fixes + 2 optional nits (`ORD-08` remaining stock note `7`, PostgreSQL 16 test DB note) in commit `ee72803`.
  3. `@meebotsompurin-stack` re-verified `ee72803`, confirmed CI `test-and-docker` Run `#45421349712` passed, and approved/merged PR `#80`.

## 2. PR #81 — Part B TDD RED → GREEN Implementation (`#75` / `LAB7-ISSUE-02`)
- **Branch:** `feat/lab7-issue-02-max-qty-cap` → `lab-7-staging`
- **Author:** `@meebotsompurin-stack` | **Reviewer:** `@poom2548`
- **Merged:** `2026-11-24T16:24:41Z` (`23:24:41 +07`, merge commit `c541592`)
- **Substantive Review (`APPROVED` with Follow-Up Action):**
  - `@poom2548` audited TDD RED (`858d232`: `CR01-02/03/06` 3/6 failed; `CR01-UI-01..02` 2/2 failed) → GREEN (`ed45f7f`: `62/62` backend, `2/2` client RTL, `3/3` `E2E-CR01-01`, CI Run `#45434102060` `SUCCESS`) and verified all 4 TA approval conditions + zero `prisma/` changes.
  - `@poom2548` caught that `Closes #75` should be changed to `Part of #75` so Issue `#75` remained open until the `v2.0.0-sprint2` sync, combined regression, Release PR `#82`, `v2.0.1-lab7` tag, and live Cloud Run checks completed. `@meebotsompurin-stack` updated the PR description before merge.

## 3. PR #82 — Lab 7 Release PR `v2.0.1-lab7` (`lab-7-staging` → `main`)
- **Branch:** `lab-7-staging` → `main`
- **Author:** `@meebotsompurin-stack` | **Reviewer:** `@poom2548`
- **Merged:** `2026-11-24T16:42:16Z` (`23:42:16 +07`, merge commit `b80a0d0`, annotated tag `v2.0.1-lab7` `933488a`)
- **Substantive Review (`APPROVED`):**
  - `@poom2548` verified merge commit `e4ea698` conflict resolutions across `.github/workflows/ci-docker.yml`, `docs/srs.md` (`v2.0.1`), `docs/system-sds.md` (`v2.0.1` + `ADR-06`), and `server/src/services/orders.service.ts` preserving 100% of Sprint 2 (`v2.0.0-sprint2`), Lab 6 `#58`, and Lab 7 `CR-01` with zero `prisma/` changes.
  - Verified combined regression (`85/85` backend, `2/2` client RTL, `45/45` Playwright E2E, clean builds) and green CI Run `#45439362395` prior to merge and auto-deploy (`Deploy demo` Run `#45440212465`).
