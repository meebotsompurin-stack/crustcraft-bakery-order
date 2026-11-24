# LAB7-ISSUE-00 — Lab 7 Maintenance Master Plan & TA Approval Record (`BR-03` / `FR-03-01` Max 5 Qty Cap)

> **GitHub Issue:** [#73](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/73)  
> **Wave:** 0 (TA Approval Archival, Master Plan Alignment & CI Gate Setup — MUST merge into `lab-7-staging` before Wave 1 Contract Revision)  
> **Branch:** `chore/lab7-issue-00-plan-and-approval` → `lab-7-staging` *(isolated from `sprint-2-staging`)*  
> **Assignee:** `@meebotsompurin-stack` | **Reviewer:** `@poom2548`

---

## Objective
Record official TA approval evidence for Change Request `CR-01` (`BR-03` / `FR-03-01`: `1 <= quantity <= 5` per bakery item per order) in `docs/labs/lab-07/` and GitHub Issue `#73`, enable CI (`test-and-docker`) on PRs targeting the dedicated `lab-7-staging` integration branch, and publish the **Lab 7 Master Execution Plan** (`plan/lab7-issues/`) mapping Issues `#73`–`#76`, baselines (`v1.0.0-sprint1` `ebcf83b`, Lab 6 `c876686`, planned pre-change `v2.0.0-sprint2`), strict branch isolation from Sprint 2, and all 4 TA conditions before any contract revision or code implementation starts.

## TA Approval Summary
- **Approver:** นายรัตนโชติ เพ็ชรพันธ์ศรี (พี่ลูกหมู) — TA Section 131
- **Approval Timestamp:** 24 November 2026, 15:07 (+07)
- **Team:** `TH-035 (BOBCAT)` — Purin Mebotsom (`67070507214`) & Saksorn Buranatananun (`67070507208`)
- **Archived Evidence:** `docs/labs/lab-07/ta-approval-email-2.jpg`, `docs/labs/lab-07/ta-approval-email-1.jpg`, `docs/labs/lab-07/CHANGE_REQUEST_PROPOSAL.md`, and GitHub Issue `#73`

## Acceptance Criteria
- [ ] **AC-LAB7-00-01:** Repository label `lab7`, dedicated integration branch `lab-7-staging` (branched from `main` at `c876686`), and GitHub Issues `#73`, `#74`, `#75`, `#76` are created with clear scope, assignees, and labels.
- [ ] **AC-LAB7-00-02:** `.github/workflows/ci-docker.yml` triggers `test-and-docker` on pull requests targeting `lab-7-staging` (preserving `main`, `lab-5-staging`, and `sprint-2-staging`).
- [ ] **AC-LAB7-00-03:** `docs/labs/lab-07/ta-approval-email-1.jpg`, `docs/labs/lab-07/ta-approval-email-2.jpg`, and `docs/labs/lab-07/CHANGE_REQUEST_PROPOSAL.md` (with completed `Approval Record` referencing approver, timestamp, screenshots, and `#73`) are committed on `chore/lab7-issue-00-plan-and-approval`.
- [ ] **AC-LAB7-00-04:** TA approval email screenshots (`TA-mail-2.jpg` & `TA-mail-1.jpg`) are attached to GitHub Issue `#73` prior to starting Wave 1 contract commits.
- [ ] **AC-LAB7-00-05:** `plan/lab7-issues/INDEX.md` and `LAB7-ISSUE-00.md`..`LAB7-ISSUE-03.md` target `lab-7-staging`, map `#73`–`#76`, all 4 TA conditions, exact Test IDs (`CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`, `ORD-08` intended update), and exact `Files Allowed` whitelists.
- [ ] **AC-LAB7-00-06:** Zero application code, automated test code, or Sprint 2/3 contract files are modified in this Issue, and no Git release tag is created yet.

## Files Allowed
- `.github/workflows/ci-docker.yml`
- `docs/labs/lab-07/CHANGE_REQUEST_PROPOSAL.md`
- `docs/labs/lab-07/ta-approval-email-1.jpg`
- `docs/labs/lab-07/ta-approval-email-2.jpg`
- `plan/lab7-issues/INDEX.md`
- `plan/lab7-issues/LAB7-ISSUE-00.md`
- `plan/lab7-issues/LAB7-ISSUE-01.md`
- `plan/lab7-issues/LAB7-ISSUE-02.md`
- `plan/lab7-issues/LAB7-ISSUE-03.md`
