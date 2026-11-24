# S2-ISSUE-00 — Sprint 2 Master Plan, Issue Breakdown & CI Branch Trigger

> **GitHub Issue:** [#67](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/67)  
> **Wave:** 0 (Master Plan Review & CI Gate Setup — MUST merge before Wave 1 Contracts)  
> **Branch:** `chore/s2-issue-00-master-plan` → `sprint-2-staging`  
> **Assignee:** `@poom2548` | **Reviewer:** `@meebotsompurin-stack`

---

## Objective
Publish the **Sprint 2 + Deliverable 2 Master Execution Plan** (`plan/sprint-2-issues/`) so both teammates review and agree on task division, merge order, parallel file boundaries, and Test IDs before merging Engineering Contracts (`#61`), and enable CI checks on PRs targeting `sprint-2-staging`.

## Acceptance Criteria
- [ ] **AC-S2-00-01:** `.github/workflows/ci-docker.yml` triggers `test-and-docker` on pull requests targeting `sprint-2-staging`.
- [ ] **AC-S2-00-02:** `plan/sprint-2-issues/INDEX.md` maps `S2-ISSUE-00`..`S2-ISSUE-05` to GitHub Issues `#67`, `#61`–`#65` with wave order, conflict matrix, and Test ID allocation.
- [ ] **AC-S2-00-03:** `plan/sprint-2-issues/S2-ISSUE-00.md`..`S2-ISSUE-05.md` are reviewed and approved by `@meebotsompurin-stack` prior to Wave 1 merge.

## Files Allowed
- `.github/workflows/ci-docker.yml`
- `plan/sprint-2-issues/*`
