# LAB7-ISSUE-03 — Objective Engineering Metrics, Release Readiness & Retrospective Report (Parts C & D)

> **GitHub Issue:** [#76](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/76)  
> **Wave:** 3 (Post-Deployment Metrics, Readiness Assessment & Final PDF Submission)  
> **Depends on:** `#75` (`LAB7-ISSUE-02`) merged via `lab-7-staging` → `main`, tagged `v2.0.1-lab7`, and verified live on GCP Cloud Run  
> **Branch:** `docs/lab7-issue-03-metrics-readiness-report` → `lab-7-staging` *(→ `main` after final review; isolated from `sprint-2-staging`)*  
> **Assignees:** `@meebotsompurin-stack`, `@poom2548` *(Pair)* | **Reviewer:** Peer Cross-Check

---

## Objective (Lab 7 Parts C & D — 25 Points + Final PDF)
Collect five dated, verifiable engineering metrics with embedded reconcilable source tables, write a concise evidence-based action interpretation (`<= 100 words`), complete an honest Release Readiness Checklist and 3-question retrospective for the **maintained Sprint 1 scope** deployed at `v2.0.1-lab7`, and compile the self-contained Lab 7 PDF for LEB2 submission by **29 November 2026 at 23:59 (+07)**.

## Acceptance Criteria
- [ ] **AC-LAB7-03-01 (Part C — 5 Objective Metrics):** `docs/labs/lab-07/metrics-and-readiness.md` defines and reports 5 dated metrics with exact scope, observation window/snapshot timestamp, value, source/evidence ID, and embedded reconcilable tables (so a TA can reconcile >= 2 values without opening external links; all percentages state numerator/denominator):
  1. Completed Issues (IDs, completion dates, distinguishing duplicates/cancelled)
  2. Merged PRs (PR IDs, merge dates, target branches)
  3. Automated Test Results (exact commands, commit SHA, passed/failed/skipped counts across server, client RTL, and Playwright E2E)
  4. UAT Defect Status (Issue IDs, statuses, explicit definition of resolved)
  5. CI Run Outcomes (workflow/branch scope, run IDs, success/fail/cancel outcomes)
- [ ] **AC-LAB7-03-02 (Part C — Interpretation <= 100 Words):** Evidence-based risk/action interpretation is strictly **<= 100 words**, names a concrete owner and next milestone, and avoids generic advice.
- [ ] **AC-LAB7-03-03 (Part D — Release Readiness Checklist):** Records deployed Cloud Run revision & Git tag (`v2.0.1-lab7`), defects by severity/status, automated & selected manual user-test results (explicitly labeling manual checks), technical debt table (item, impact, priority, disposition/action — separated from defects), configuration/secrets status, documentation/run instructions, deployment/smoke results, and an explicit `READY` or `NOT READY` verdict scoped to maintained Sprint 1 functionality (distinguishing coexisting Sprint 2/3 features).
- [ ] **AC-LAB7-03-04 (Part D — Brief Retrospective & Metadata):** Answers What helped, What hurt, and What will change for the final release (1–2 sentences each), plus short version table (`v1.0.0-sprint1` `ebcf83b` → Lab 6 `c876686` → pre-change `v2.0.0-sprint2` → `v2.0.1-lab7`), pair contribution table, AI-use declaration, and known limitations.
- [ ] **AC-LAB7-03-05 (Self-Contained Lab 7 PDF):** Compiled PDF contains Parts A–D, contents table with page ranges and evidence IDs, readable embedded TA approval, contract excerpts, RED/GREEN test logs, code diff, PR reviews, CI/deploy checks, and zero secrets/real passwords.

## Files Allowed
- `docs/labs/lab-07/metrics-and-readiness.md`
- `docs/labs/lab-07/evidence/*`
- `docs/traceability.md` *(final commit SHA / `v2.0.1-lab7` sync only)*
