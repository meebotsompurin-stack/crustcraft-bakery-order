# Lab 7 Objective Engineering Metrics, Release Readiness & Retrospective (Parts C & D)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Assessment:** Group Lab 7 — Parts C & D (Objective Engineering Metrics, Release Readiness & Retrospective, 25 pts)  
> **System:** CrustCraft Artisan Bakery — Pre-Order & Fulfillment System (Theme 4: E-Commerce / Ordering System)  
> **Repository:** `https://github.com/meebotsompurin-stack/crustcraft-bakery-order`  
> **Team:** `TH-035 (BOBCAT)` — Purin Mebotsom (`67070507214`, `@meebotsompurin-stack`) & Saksorn Buranatananun (`67070507208`, `@poom2548`)  
> **GitHub Issue:** [#76 (`LAB7-ISSUE-03`)](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/76)  
> **Target Release Assessed:** Tag **`v2.0.1-lab7`** (annotated tag `933488a` → `main` commit `b80a0d0492b9fa4cf3b9cfcb24a7455c2dfb9242`)  
> **Live Cloud Run Deployment:** `https://crustcraft-d7wyiqxska-as.a.run.app` (Service `crustcraft`, Revision `crustcraft-00012-4dq`, `asia-southeast1`)  
> **Metric Snapshot Timestamp:** `2026-11-24 23:50 (+07)` (`2026-11-24T16:50:00Z`)

---

## Part C — Five Dated Objective Engineering Metrics (15 Points)

### C.1 Summary Table of Five Verifiable Engineering Metrics

| # | Metric Name | Operational Definition & Numerator/Denominator | Scope & Observation Window | Snapshot Timestamp | Observed Value | Source / Evidence ID |
|:---:|---|---|---|---|---|---|
| **M1** | **Completed Issues** | GitHub issues closed with `stateReason = COMPLETED` divided by total tracked issues (distinguishing `0` duplicates and `0` `NOT_PLANNED`/cancelled). | Repository-wide (`2026-11-01`–`2026-11-24`) & Lab 7 slice (`label:lab7`) | `2026-11-24 23:50 +07` | **27/28 (96.4%)** repo-wide (`1` open: `#76`); **3/4 (75.0%)** Lab 7 (`#73`, `#74`, `#75` closed; `#76` open) | Table C.2.1 (`gh issue list --state all`) |
| **M2** | **Merged Pull Requests** | Team-authored PRs merged divided by total team-authored PRs (excluding `13` automated Dependabot PRs). | Repository-wide (`2026-11-01`–`2026-11-24`) & Lab 7 slice (`#77`, `#80`, `#81`, `#82`) | `2026-11-24 23:50 +07` | **40/41 (97.6%)** repo-wide (`1` closed unmerged); **4/4 (100.0%)** Lab 7 PRs merged | Table C.2.2 (`gh pr list --state all`), `EV-04` |
| **M3** | **Automated Test Results** | Automated tests passed divided by total executed tests across Deploy/Smoke unit, Backend Vitest (PostgreSQL 16), Client RTL (`jsdom`), and Playwright E2E (3 viewports), with `0` skipped/weakened tests. | Release `v2.0.1-lab7` (`b80a0d0` / `e4ea698`) snapshot | `2026-11-24 23:52 +07` | **137/137 (100.0%)** passed (`0` failed, `0` skipped): `5/5` deploy unit + `85/85` backend (`62/62` S1+Lab6+Lab7, `23/23` S2) + `2/2` client RTL + `45/45` E2E | Table C.2.3, `EV-02`, `EV-05`, PR `#82` |
| **M4** | **UAT Defect Status** | UAT defects resolved divided by total UAT defects filed. **Definition of Resolved:** fix merged to `main`, deployed to Cloud Run, verified by automated regression test, and issue closed on GitHub. | Lab 6 UAT + Lab 7 regression (`label:bug`, `2026-11-21`–`2026-11-24`) | `2026-11-24 23:50 +07` | **1/1 (100.0%)** resolved (`#58` Major closed `2026-11-23`; **0/1 (0.0%)** open) | Table C.2.4, GitHub Issue `#58`, PR `#59`–`#60`, `EV-02` |
| **M5** | **CI & Deploy Run Outcomes** | Completed `CI & Docker Build` and `Deploy demo` workflow runs with `conclusion = success` divided by total non-Dependabot runs. | All non-Dependabot runs (`2026-11-13`–`2026-11-24`) & Lab 7 slice (`2026-11-24`) | `2026-11-24 23:50 +07` | **49/51 (96.1%)** overall (`2/51` = `3.9%` failed, `0` cancelled); **6/6 (100.0%)** Lab 7 runs succeeded | Table C.2.5 (`gh run list`), `EV-02` |

---

### C.2 Embedded Reconcilable Source Tables

#### Table C.2.1 — Completed Issues Source Table (Reconciles M1)
*Repository total at `2026-11-24 23:50 +07`: **28 issues** (`27` closed `COMPLETED`, `0` duplicates, `0` cancelled/`NOT_PLANNED`, `1` open `#76`).*

| Phase / Scope | Issue IDs | Count | Closed (`COMPLETED`) | Duplicates / Cancelled | Open | Completion Date Range (UTC) |
|---|---|:---:|:---:|:---:|:---:|---|
| Sprint 1 Baseline (`F-01`–`F-04`) | `#1`, `#3`, `#4`, `#5`, `#6`, `#7`, `#8` | 7 | 7 | 0 | 0 | `2026-11-01` – `2026-11-05` |
| Lab 5 GCP Cloud Run & CI/CD | `#16`, `#18`–`#26` | 10 | 10 | 0 | 0 | `2026-11-10` – `2026-11-19` |
| Lab 6 UAT Defect (`bug`) | `#58` | 1 | 1 | 0 | 0 | `2026-11-23T15:18:55Z` |
| Sprint 2 & Sprint 3 Progress (`F-05`–`F-08`) | `#61`, `#62`, `#63`, `#64`, `#65`, `#67` | 6 | 6 | 0 | 0 | `2026-11-23` – `2026-11-24` |
| **Lab 7 Maintenance (`lab7`)** | **`#73`, `#74`, `#75`, `#76`** | **4** | **3** (`#73`, `#74`, `#75`) | **0** | **1** (`#76`) | `2026-11-24T16:42:18Z` – `16:44:34Z` |
| **Total** | **28 tracked issues** | **28** | **27 (96.4%)** | **0 (0.0%)** | **1 (3.6%)** | `2026-11-01` – `2026-11-24` |

#### Table C.2.2 — Merged Pull Requests Source Table (Reconciles M2)
*Repository team PR summary: **41 team PRs** (`40` merged = `97.6%`, `1` closed unmerged; `13` Dependabot PRs excluded). Target branch totals for the 40 merged team PRs: `sprint-1-staging` (`7`), `lab-5-staging` (`13`), `sprint-2-staging` (`7`), `lab-7-staging` (`3`), `main` (`10`). Below is the complete reconcilable list for the Lab 6 / Sprint 2 / Lab 7 maintenance window (`2026-11-21`–`2026-11-24`, **15/15 merged**):*

| PR # | Scope | Author | Target Branch | Source Branch | Merge Commit | Merged At (UTC) | Status |
|:---:|---|---|---|---|---|---|---|
| `#57` | Lab 6 | `@poom2548` | `main` | `lab-5-staging` | `4ffa2a5` | `2026-11-21T13:03:58Z` | `MERGED` |
| `#59` | Lab 6 (`#58`) | `@poom2548` | `lab-5-staging` | `fix/issue-58-pickup-note-max-length` | `1ea466f` | `2026-11-22T03:34:20Z` | `MERGED` |
| `#60` | Lab 6 Release | `@poom2548` | `main` | `lab-5-staging` | `c876686` | `2026-11-22T04:09:46Z` | `MERGED` |
| `#68` | Sprint 2 | `@poom2548` | `sprint-2-staging` | `chore/s2-issue-00-master-plan` | `dd8f5aa` | `2026-11-23T15:10:45Z` | `MERGED` |
| `#66` | Sprint 2 | `@poom2548` | `sprint-2-staging` | `docs/s2-issue-01-contracts-and-setup` | `79723d8` | `2026-11-23T15:24:31Z` | `MERGED` |
| `#69` | Sprint 2 | `@meebotsompurin-stack` | `sprint-2-staging` | `feat/s2-issue-02-fulfillment-cancel-payment` | `89edce1` | `2026-11-23T16:06:04Z` | `MERGED` |
| `#70` | Sprint 2 | `@poom2548` | `sprint-2-staging` | `feat/s2-issue-03-catalog-admin` | `2a53a7d` | `2026-11-23T23:47:37Z` | `MERGED` |
| `#71` | Sprint 2 | `@meebotsompurin-stack` | `sprint-2-staging` | `test/sprint-2-e2e-and-release` | `e8ca56c` | `2026-11-24T08:41:07Z` | `MERGED` |
| `#72` | Sprint 2 Release | `@meebotsompurin-stack` | `main` | `sprint-2-staging` (`v2.0.0-sprint2`) | `c63f876` | `2026-11-24T12:52:04Z` | `MERGED` |
| **`#77`** | **Lab 7 (`#73`)** | `@meebotsompurin-stack` | **`lab-7-staging`** | `chore/lab7-issue-00-plan-and-approval` | `ec79c18` | `2026-11-24T13:30:58Z` | **`MERGED`** |
| `#78` | Sprint 3 (`F-08`) | `@poom2548` | `sprint-2-staging` | `feat/s2-issue-04-sales-reporting` | `cabf4da` | `2026-11-24T13:45:26Z` | `MERGED` |
| `#79` | Sprint 3 E2E | `@meebotsompurin-stack` | `sprint-2-staging` | `test/sprint-2-e2e-s2-05-and-traceability` | `b71922f` | `2026-11-24T14:40:48Z` | `MERGED` |
| **`#80`** | **Lab 7 (`#74`)** | `@poom2548` | **`lab-7-staging`** | `docs/lab7-issue-01-impact-and-contract` | `12c7625` | `2026-11-24T15:47:46Z` | **`MERGED`** |
| **`#81`** | **Lab 7 (`#75`)** | `@meebotsompurin-stack` | **`lab-7-staging`** | `feat/lab7-issue-02-max-qty-cap` | `c541592` | `2026-11-24T16:24:41Z` | **`MERGED`** |
| **`#82`** | **Lab 7 Release** | `@meebotsompurin-stack` | **`main`** | `lab-7-staging` (`v2.0.1-lab7`) | `b80a0d0` | `2026-11-24T16:42:16Z` | **`MERGED`** |

#### Table C.2.3 — Automated Test Results Source Table (Reconciles M3)

| Suite / Layer | Exact Command Executed | Commit SHA | Execution Context | Passed | Failed | Skipped | Breakdown / Evidence |
|---|---|---|---|:---:|:---:|:---:|---|
| **Deploy / Smoke Unit** | `python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'` | `b80a0d0` | GitHub Actions (`#45440212465`) | **5** | 0 | 0 | `test_smoke.py` + `test_deploy_stub.sh` + `test_release_stub.sh` (`EV-02`) |
| **Backend Vitest (PostgreSQL 16)** | `npm test` | `b80a0d0` | GitHub Actions (`#45440212465`) | **85** | 0 | 0 | **10 files:** `orders.api` (18), `operator.api` (11), `auth.api` (8), `catalog.api` (6), `unit/orderCalculation` (8), `unit/auth` (5), `lab-7/order-quantity-cap` (6) = **62** S1+Lab6+Lab7; `admin.api` (8), `fulfillment.api` (8), `payment.api` (7) = **23** S2 (`EV-02`) |
| **Client RTL (`jsdom`)** | `npm run test --workspace=client` | `b80a0d0` | Local Vitest `1.6.1` | **2** | 0 | 0 | `BakeryItemCard.test.tsx`: `CR01-UI-01`, `CR01-UI-02` (`EV-05`) |
| **Playwright Multi-Viewport E2E** | `npm run test:e2e` | `e4ea698` *(identical tree to `b80a0d0`)* | Local Chromium (1280px, 768px, 375px) | **45** | 0 | 0 | Sprint 1 (`E2E-01`..`09`), Sprint 2 (`E2E-S2-01`..`04,06`), Lab 7 (`E2E-CR01-01`: 3/3 viewports) (PR `#82`) |
| **Total Automated Suite** | — | **`b80a0d0` (`v2.0.1-lab7`)** | **CI + Local** | **137** | **0** | **0** | **137/137 (100.0% pass rate; 0 skipped)** |

*Note on TDD RED → GREEN Proof (`#75`): Prior to implementation, commit `858d232` (`RED`) executed `CR01-01..06` and `CR01-UI-01..02` against pre-change code, producing genuine assertion failures (`3/6` backend failed: `CR01-02`, `CR01-03`, `CR01-06`; `2/2` client RTL failed: `CR01-UI-01`, `CR01-UI-02`). Commit `ed45f7f` (`GREEN`) turned all suites 100% green (`62/62` backend + `2/2` RTL + `3/3` `E2E-CR01-01`).*

#### Table C.2.4 — UAT Defect Status Source Table (Reconciles M4)

| Issue ID | Severity | Reported By | Linked UAT Case | Summary | Fix PR(s) & Commit | Verification Evidence | Closed At (UTC) | Status |
|:---:|---|---|---|---|---|---|---|---|
| **`#58`** | `Major` | BFteam (`@Theerawat82`) | `UAT-CC-02` (`AC-03-07`) | `pickupNote > 500` chars accepted (`201`) & overflowed order detail card | PR `#59` → PR `#60` (`c876686`) | Automated regression in `orders.api.test.ts` (passing `18/18` at `b80a0d0` in `EV-02`) | `2026-11-23T15:18:55Z` | **Resolved (`CLOSED`)** |

#### Table C.2.5 — CI & Deploy Run Outcomes Source Table (Reconciles M5)
*Repository non-Dependabot CI/Deploy totals (`2026-11-13`–`2026-11-24`): **51 runs** = `38` `CI & Docker Build` success + `11` `Deploy demo` success + `1` `CI & Docker Build` failure (`#43597740315` intentional `test/prove-gate` branch-protection proof on `2026-11-14`) + `1` `Deploy demo` failure (`#43605527913` Lab 5 WIF SHA pin fix on `2026-11-14`) + `0` cancelled = **49/51 (96.1% success)**. Lab 7-scoped runs (`2026-11-24`): **6/6 (100.0% success)**:*

| Run ID | Workflow | Branch | Head SHA | Created At (UTC) | Conclusion | Trigger / Purpose |
|---|---|---|---|---|---|---|
| `45382265191` | `CI & Docker Build` | `chore/lab7-issue-00-plan-and-approval` | `becf9ca` | `2026-11-24T11:13:57Z` | `success` | PR `#77` (`#73` plan & CI trigger) |
| `45418443510` | `CI & Docker Build` | `docs/lab7-issue-01-impact-and-contract` | `0d0e0f1` | `2026-11-24T14:49:43Z` | `success` | PR `#80` initial Part A contract review |
| `45421349712` | `CI & Docker Build` | `docs/lab7-issue-01-impact-and-contract` | `ee72803` | `2026-11-24T15:05:03Z` | `success` | PR `#80` post-review fix verification |
| `45434102060` | `CI & Docker Build` | `feat/lab7-issue-02-max-qty-cap` | `ed45f7f` | `2026-11-24T16:10:55Z` | `success` | PR `#81` TDD GREEN implementation (`#75`) |
| `45439362395` | `CI & Docker Build` | `lab-7-staging` | `e4ea698` | `2026-11-24T16:37:49Z` | `success` | PR `#82` Release PR synced with `v2.0.0-sprint2` |
| `45440212465` | `Deploy demo` | `main` | `b80a0d0` | `2026-11-24T16:42:18Z` | `success` | Auto-deploy `v2.0.1-lab7` → `crustcraft-00012-4dq` (`EV-02`) |

---

### C.3 Evidence-Based Interpretation & Concrete Action (`<= 100` Words)

Although `v2.0.1-lab7` passed 137/137 automated checks and 6/6 Lab 7 CI runs, `.github/workflows/ci-docker.yml` executes only backend tests (85/85) and deploy checks (5/5), leaving client RTL (2/2) and Playwright E2E (45/45) reliant on local developer runs; `Deploy demo` also skips authenticated smoke login (`SKIP login`). **Concrete Action:** Before the Final Release (`v3.0.0`, Sprint 3), `@meebotsompurin-stack` will add `npm run test --workspace=client` to `ci-docker.yml` and `@poom2548` will provision a dedicated least-privilege `SMOKE_EMAIL`/`SMOKE_PASSWORD` GitHub Secret so CI/CD gates frontend behavior and authenticated Cloud Run login automatically.

*(Word count: **83 words**, strictly `<= 100` words.)*

---

## Part D — Release Readiness Assessment & Retrospective (10 Points)

### D.1 Scope Boundary Clarification
This Release Readiness assessment evaluates the **maintained Sprint 1 scope** deployed on GCP Cloud Run at **`v2.0.1-lab7`** (`F-01` Auth & RBAC, `F-02` Public Catalog, `F-03` Customer Pre-Order with Lab 6 `#58` `pickupNote <= 500` fix and Lab 7 `CR-01` `1 <= quantity <= 5` cap, and `F-04` Operator Queue & Acceptance). Coexisting Sprint 2 features (`F-05`–`F-07`, released at `v2.0.0-sprint2`) are verified non-regressive (`23/23` backend tests passing) and are separated from Sprint 1 release scope; Sprint 3 `F-08` Sales Reporting (`PR #78`–`#79`) resides on `sprint-2-staging` and is intentionally excluded from `v2.0.1-lab7`.

### D.2 Honest Release Readiness Checklist (`v2.0.1-lab7`)

| Checklist Area | Status | Verifiable Evidence / Honest Assessment |
|---|:---:|---|
| **1. Deployed Version & Revision** | **PASS** | Git annotated tag `v2.0.1-lab7` (`933488a` → `main` `b80a0d0`), Cloud Run service `crustcraft`, revision `crustcraft-00012-4dq` (100% traffic), image digest `sha256:95ba462a...`, URL `https://crustcraft-d7wyiqxska-as.a.run.app` (`EV-02`). |
| **2. Defects by Severity & Status** | **PASS** | **Critical:** `0` open (`0` total). **Major:** `0` open (`1` total: Lab 6 `#58`, resolved `2026-11-23` & regression-verified at `b80a0d0`). **Minor:** `0` open. |
| **3. Automated Test Suite Results** | **PASS** | **137/137 (100.0%)** passed, `0` failed, `0` skipped (`85/85` backend Vitest + `5/5` deploy unit in CI Run `#45440212465`; `2/2` client RTL locally in `EV-05`; `45/45` Playwright E2E locally in PR `#82`). |
| **4. Selected User / Live Verification** *(Explicitly Manual/Scripted)* | **PASS** | **13/13** live checks executed against `https://crustcraft-d7wyiqxska-as.a.run.app` at `2026-11-24 23:48 +07` (`EV-01`): `/api/health` (`200`), `/api/ready` (`200`, DB connected), unauth `/api/customer/orders` (`401`), `CR-01` `qty=6` (`400 VALIDATION_ERROR` `items[0].quantity`), duplicate `bakeryItemId` (`400`), `qty=5` (`201`, stock `50 -> 45`), cross-customer `GET` (`403`), customer on operator route (`403`), and cleanup cancel restoring stock to `50`. |
| **5. Technical Debt Register** | **TRACKED** | `4` non-blocking technical debt items explicitly documented in Table D.3 (separated from defects) with owners and target milestone (`v3.0.0`). |
| **6. Configuration & Secrets** | **PASS** | Production secrets (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `DEMO_USER_PASSWORD`) injected via GCP Secret Manager; CI/CD uses Workload Identity Federation (keyless OIDC); zero secrets or `.env` files committed in repository. |
| **7. Documentation & Run Instructions** | **PASS** | `README.md`, `docs/labs/lab-05/deployment.md`, `docs/labs/lab-07/impact-and-contract-review.md`, `docs/srs.md` (`v2.0.1`), `docs/system-sds.md` (`v2.0.1`, `ADR-06`), `docs/sprints/sprint-1/*`, and `docs/traceability.md` synced to `v2.0.1-lab7`. |
| **8. Deployment & Smoke Status** | **PASS** | `Deploy demo` Run `#45440212465` succeeded (`2m24s` deploy, zero schema migration errors, `4/4` public smoke checks passed; authenticated smoke login `SKIP` compensated by `EV-01` and tracked as `TD-02`). |
| **Release Readiness Verdict** | **`READY`** | **`READY`** for the **maintained Sprint 1 scope** (`F-01`–`F-04` + Lab 6 `#58` + Lab 7 `CR-01`) at **`v2.0.1-lab7`**. Zero open defects, 100% automated regression pass rate, and verified live Cloud Run behavior (`EV-01`, `EV-02`). Non-blocking CI/CD automation gaps (`TD-01`–`TD-03`) are tracked for Sprint 3 Final Release (`v3.0.0`). |

---

### D.3 Technical Debt Register (Separated from Defects)

| Debt ID | Technical Debt Item | Impact | Priority | Disposition / Action & Owner |
|:---:|---|---|---|
| **TD-01** | Client RTL (`2/2`) and Playwright E2E (`45/45`) run locally prior to PR merge rather than inside `.github/workflows/ci-docker.yml`. | Medium — risk of frontend regression slipping past PR CI if a developer forgets local UI test execution. | **High** | Add `npm run test --workspace=client` to `ci-docker.yml` before `v3.0.0` (Owner: `@meebotsompurin-stack`). |
| **TD-02** | `Deploy demo` public smoke script logs `SKIP login: optional smoke credentials not configured`. | Medium — authenticated post-deploy login check currently requires manual/scripted execution (`EV-01`). | **Medium** | Configure dedicated least-privilege `SMOKE_EMAIL`/`SMOKE_PASSWORD` GitHub Secrets before `v3.0.0` (Owner: `@poom2548`). |
| **TD-03** | GitHub Actions Node 20 runtime deprecation warnings on `actions/checkout`, `setup-python`, `google-github-actions/auth`, and `setup-gcloud`; 13 Dependabot PRs pending batch triage. | Low — workflows currently succeed on forced Node 24 fallback, but unpinned major upgrades could break future runners. | **Low** | Triage and merge verified Dependabot action/devDependency PRs in a dedicated Sprint 3 maintenance PR (Owner: `@meebotsompurin-stack`). |
| **TD-04** | Sprint 3 `F-08` Sales Reporting (`PR #78`–`#79`) sits on `sprint-2-staging` ahead of `main`. | Low — intentional release isolation; requires clean rebase/merge after Lab 7 closes. | **Low** | Integrate into `main` during Sprint 3 Final Release (`v3.0.0`) after syncing `v2.0.1-lab7` (Owner: `@poom2548`). |

---

### D.4 Brief Retrospective (3 Questions — 1 to 2 Sentences Each)

1. **What helped?**
   Locking all four TA approval conditions into pre-implementation contracts (PR `#80`) and following strict TDD RED (`858d232`) → GREEN (`ed45f7f`) caught two contract-to-code mismatches (`server/src/app.ts` inline error handler and `OrderDetailPage.tsx` `× 5` formatting) before coding and prevented `ORD-08` from causing surprise regressions.
2. **What hurt?**
   Developing Sprint 2 (`v2.0.0-sprint2`) and Lab 7 (`lab-7-staging`) in parallel required manual merge conflict resolution (`e4ea698`) across `ci-docker.yml`, `srs.md`, `system-sds.md`, and `orders.service.ts`, while executing client RTL and Playwright E2E only locally added manual verification overhead before PR `#82`.
3. **What will change for the final release?**
   For Final Release (`v3.0.0`), we will add `npm run test --workspace=client` to `ci-docker.yml`, configure least-privilege `SMOKE_EMAIL`/`SMOKE_PASSWORD` secrets for automated post-deploy login checks, and immediately sync `main` into active staging branches after every release tag to avoid multi-file merge conflicts.

---

### D.5 Release Version Lineage Table

| Release / Milestone | Git Tag | Commit SHA (`main`) | Cloud Run Revision | Summary |
|---|---|---|---|---|
| **Accepted Sprint 1 Baseline** | `v1.0.0-sprint1` (`ebcf83b`) | `7a1d9db` (PR `#15`, `2026-11-07`) | N/A (Local Docker) | Core Sprint 1 (`F-01`–`F-04`, 44 automated tests) |
| **Lab 5/6 Maintenance Baseline** | — | `c876686` (PR `#60`, `2026-11-22`) | `crustcraft-00010-*` | GCP Cloud Run + Cloud SQL PostgreSQL 16 + Lab 6 UAT Defect `#58` fix |
| **Pre-Change Sprint 2 Release** | `v2.0.0-sprint2` (`2bf8d19`) | `c63f876` (PR `#72`, `2026-11-24`) | `crustcraft-00011-*` | Standalone Sprint 2 (`F-05`–`F-07`) integrated prior to Lab 7 release |
| **Lab 7 Maintained Release** | **`v2.0.1-lab7`** (`933488a`) | **`b80a0d0`** (PR `#82`, `2026-11-24`) | **`crustcraft-00012-4dq`** | `CR-01` (`BR-03` / `FR-03-01` max 5 per item), 9 new tests + `ORD-08` update, zero schema changes |

### D.6 Pair Contribution Table (Lab 7)

| Member | Student ID | GitHub Handle | Lab 7 Issues Owned | PRs Authored | PRs Substantively Reviewed | Key Deliverables |
|---|---|---|---|---|---|---|
| **Purin Mebotsom** | `67070507214` | `@meebotsompurin-stack` | `#73`, `#75`, `#76` *(Pair)* | PR `#77`, PR `#81`, PR `#82` | PR `#80` *(Requested Changes → Verified `ee72803` → Approved)* | Master plan & TA archival, TDD RED (`858d232`) → GREEN (`ed45f7f`) API/UI/E2E implementation, `v2.0.0-sprint2` sync (`e4ea698`), `v2.0.1-lab7` tag & live Cloud Run verification (`EV-01`) |
| **Saksorn Buranatananun** | `67070507208` | `@poom2548` | `#74`, `#76` *(Pair)* | PR `#80` | PR `#77`, PR `#81` *(Caught `Closes` → `Part of #75`)*, PR `#82` | Part A Change Impact Analysis (`impact-and-contract-review.md`), pre-implementation contract revisions across SRS/SDS/API/UI/Tests/RTM (`0d0e0f1`, `ee72803`), peer cross-check of metrics, readiness & Lab 7 PDF |

### D.7 AI-Use Declaration & Known Limitations
- **AI-Use Declaration:** Both team members used an AI coding assistant (Antigravity / Gemini) to help draft the Lab 7 execution plan, contract revision templates, TDD test scaffolding (`CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`), GitHub metrics extraction scripts, and PDF formatting. All business rules, TA approval correspondence, PR reviews (`CHANGES_REQUESTED` / `APPROVED`), conflict resolutions (`e4ea698`), git tags, and live GCP Cloud Run verification results were independently reviewed, executed, and verified by both students.
- **Known Limitations:**
  1. `CR-01` intentionally enforces the `5`-unit cap **per bakery item per order** (not a cross-order daily quota per customer account), matching the TA-approved `CHANGE_REQUEST_PROPOSAL.md` scope.
  2. Client RTL (`2/2`) and Playwright E2E (`45/45`) currently execute locally before PR merge rather than inside GitHub Actions CI (`TD-01`).
  3. Authenticated smoke login in `Deploy demo` is currently skipped (`TD-02`) and was compensated via scripted live Cloud Run verification (`EV-01`).
