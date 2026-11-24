# Lab 7 Maintenance, Metrics & Release Readiness — Issue Breakdown Index

> **Repository:** `https://github.com/meebotsompurin-stack/crustcraft-bakery-order`  
> **Team:** `TH-035 (BOBCAT)`  
> **Co-Developers:**
> - **Repo Owner:** Purin Mebotsom (`67070507214`, GitHub: `@meebotsompurin-stack`)
> - **Co-Developer:** Saksorn Buranatananun (`67070507208`, GitHub: `@poom2548`)
> **Base Integration Branch:** `lab-7-staging` (branched from `origin/main` at `c876686` including Lab 5 & Lab 6 `#58` fix)  
> **Change Request:** `CR-01` — Modify Sprint 1 `BR-03` / `FR-03-01` (`F-03: Customer Pre-Order Creation`) to enforce **`1 <= quantity <= 5`** (`MAX_QUANTITY_PER_ITEM = 5`) per bakery item per order  
> **TA Approval:** Approved by **นายรัตนโชติ เพ็ชรพันธ์ศรี (พี่ลูกหมู) — TA Section 131** on **24 November 2026, 15:07 (+07)** ([`CHANGE_REQUEST_PROPOSAL.md`](../../docs/labs/lab-07/CHANGE_REQUEST_PROPOSAL.md), [`ta-approval-email-2.jpg`](../../docs/labs/lab-07/ta-approval-email-2.jpg), [`ta-approval-email-1.jpg`](../../docs/labs/lab-07/ta-approval-email-1.jpg))  
> **Baseline Chain:** `v1.0.0-sprint1` (`ebcf83b`) → Lab 6 `main` (`c876686`) → Planned Pre-Change `v2.0.0-sprint2` → Target Lab 7 Release `v2.0.1-lab7`  
> **Target Checkpoint:** CPE 334 Lab 7 (Due **29 November 2026 at 23:59 +07**, 100 lab points)  
> **Test ID Categories:** `CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`, `ORD-08` *(intended update)*

---

## 1. Wave Execution Order (Wave 0 Plan + 3 Lab 7 Delivery Issues)

> **Branch Isolation Rule (TA Condition #4):** `1 Issue = 1 Branch = 1 Reviewed PR → lab-7-staging` (strictly isolated from `sprint-2-staging` and Sprint 2 feature PRs), followed by a reviewed Release PR (`lab-7-staging` → `main`) tagged `v2.0.1-lab7`.  
> **Hard Stop 1 (TA Approval, Plan & CI Gate):** `LAB7-ISSUE-00` (`#73`) merges into `lab-7-staging` first so both teammates approve the plan, archive TA approval screenshots in `#73` and `docs/labs/lab-07/`, and enable CI (`test-and-docker`) on PRs targeting `lab-7-staging`.  
> **Hard Stop 2 (Contract Before Code — Part A):** `LAB7-ISSUE-01` (`#74`) MUST be substantively reviewed and merged into `lab-7-staging` **before** any implementation commits in `LAB7-ISSUE-02` (`#75`) so Git timestamps prove impact analysis and revised contracts predated code.  
> **Release Sync Gate (`v2.0.0-sprint2` Before Wave 2 Code & Release):** Once standalone Sprint 2 Release 1 (`v2.0.0-sprint2`) is tagged on `main`, sync `main` (`v2.0.0-sprint2`) into `lab-7-staging` so the pre-change codebase reflects the latest release before running Wave 2 RED→GREEN (`#75`) and opening the Release PR `lab-7-staging` → `main` (`v2.0.1-lab7`).  
> **Hard Stop 3 (TDD RED Before GREEN — Part B):** In `LAB7-ISSUE-02` (`#75`), failing tests (`CR01-01..06`, `CR01-UI-01..02`, `E2E-CR01-01`) MUST be committed and executed against the pre-change implementation (`RED`) before the implementation commit (`GREEN`).

| Wave | Issue Code | GitHub Issue | Branch | Target | Assignee (Dev) | Reviewer | Parallel-Safe? | Lab 7 Coverage |
|:---:|---|:---:|---|---|---|---|---|---|
| **0** | [`LAB7-ISSUE-00`](./LAB7-ISSUE-00.md) | [#73](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/73) | `chore/lab7-issue-00-plan-and-approval` | `lab-7-staging` | `@meebotsompurin-stack` | `@poom2548` | ❌ Base Plan & CI | TA Approval Record, Master Plan & `lab-7-staging` CI Trigger |
| **1** | [`LAB7-ISSUE-01`](./LAB7-ISSUE-01.md) | [#74](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/74) | `docs/lab7-issue-01-impact-and-contract` | `lab-7-staging` | `@poom2548` | `@meebotsompurin-stack` | ❌ Contract before Code | Part A (25 pts): Impact Analysis, Revised SRS/SDS/API/UI/STS & Pre-Code Review |
| **2** | [`LAB7-ISSUE-02`](./LAB7-ISSUE-02.md) | [#75](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/75) | `feat/lab7-issue-02-max-qty-cap` | `lab-7-staging` | `@meebotsompurin-stack` | `@poom2548` | ❌ After Part A & `v2.0.0-sprint2` Sync | Part B (50 pts): RED→GREEN Implementation, Regression, `v2.0.1-lab7` & Cloud Run Verification |
| **3** | [`LAB7-ISSUE-03`](./LAB7-ISSUE-03.md) | [#76](https://github.com/meebotsompurin-stack/crustcraft-bakery-order/issues/76) | `docs/lab7-issue-03-metrics-readiness-report` | `lab-7-staging` | `@meebotsompurin-stack`, `@poom2548` *(Pair)* | Peer Cross-Check | ❌ After `v2.0.1-lab7` Deploy | Parts C & D (25 pts): 5 Objective Metrics, Release Readiness, Retrospective & Lab 7 PDF |

### Merge & Release Order (Dedicated `lab-7-staging` Integration Branch)
```text
Wave 0:   #73 (chore/lab7-issue-00-plan-and-approval)     → lab-7-staging  [TA Approval Evidence, Plan & CI Trigger]
             ↓
Wave 1:   #74 (docs/lab7-issue-01-impact-and-contract)    → lab-7-staging  [Part A Hard Stop: Contract Review Before Code!]
             ↓
Pre-Change Baseline Sync (Once Sprint 2 Release 1 lands on main):
          main (v2.0.0-sprint2)                           → lab-7-staging  [Sync pre-change code to latest release]
             ↓
Wave 2:   #75 (feat/lab7-issue-02-max-qty-cap)            → lab-7-staging  [Part B: RED Commit → GREEN Commit → CI Green]
             ↓
Lab 7 Release PR (Part B Deployment Gate):
          lab-7-staging → main (Reviewed Release PR, Tag v2.0.1-lab7 → GCP Cloud Run Auto-Deploy & Post-Deploy Checks)
             ↓
Wave 3:   #76 (docs/lab7-issue-03-metrics-readiness-report) → lab-7-staging → main  [Parts C & D: 5 Metrics, Readiness & Lab 7 PDF]
```

---

## 2. Four TA Conditions Tracking Matrix

| TA Condition | Locked in Contract (`#74`) | Enforced & Verified in Code/Tests (`#75`) |
|---|---|---|
| **1. Duplicate `bakeryItemId` loophole** | Specify duplicate `bakeryItemId` in `items[]` (e.g., two rows of qty 5) is rejected with `400 VALIDATION_ERROR` before transaction. | Preserve existing `seenItemIds` guard in `orders.service.ts` and add explicit test `CR01-05`. |
| **2. Precedence & indexed `details[].field`** | Specify `quantity > 5` + `quantity > stockQuantity` (e.g., qty 6, stock 3) returns `400 VALIDATION_ERROR` before `409 CONFLICT`; `details[].field` reports exact index (e.g., `items[1].quantity`). | Place `quantity > MAX_QUANTITY_PER_ITEM` check inside pre-transaction loop (`items[${index}].quantity`); verify via `CR01-03` & `CR01-06`. |
| **3. E2E, Frontend RTL tests & existing 44-test audit** | Specify `CR01-UI-01..02`, `E2E-CR01-01`, and version the intended test update to `ORD-08` (`orders.api.test.ts` L429). | Configure `jsdom` + Vitest DOM setup in `client/`, implement `Math.min(stockQuantity, 5)` + `"Max 5 per item"`, add `CR01-UI-01..02` & `E2E-CR01-01`, update `ORD-08` cleanly. |
| **4. Exact doc paths & Sprint 2 branch isolation** | Enumerate exact Contract, Test, and `plan/lab7-issues/` paths in `docs/labs/lab-07/impact-and-contract-review.md`. | Keep all Lab 7 branches isolated from `sprint-2-staging`; archive TA email screenshots in `#73` & `docs/labs/lab-07/` before contract commits. |

---

## 3. File Conflict Matrix (Wave Ownership)

| File / Directory | `#73` (`LAB7-ISSUE-00`) | `#74` (`LAB7-ISSUE-01`) | `#75` (`LAB7-ISSUE-02`) | `#76` (`LAB7-ISSUE-03`) |
|---|:---:|:---:|:---:|:---:|
| `.github/workflows/ci-docker.yml` | ✅ owns | ❌ | ❌ | ❌ |
| `docs/labs/lab-07/CHANGE_REQUEST_PROPOSAL.md`, `ta-approval-email-*.jpg` | ✅ owns | ❌ | ❌ | ❌ |
| `plan/lab7-issues/*` | ✅ owns | ❌ | ❌ | ❌ |
| `docs/labs/lab-07/impact-and-contract-review.md` | ❌ | ✅ owns | ❌ | ❌ |
| `docs/srs.md`, `docs/system-sds.md`, `docs/traceability.md` | ❌ | ✅ owns | ❌ | ⚠️ sync SHAs |
| `docs/sprints/sprint-1/specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md` | ❌ | ✅ owns | ❌ | ❌ |
| `server/src/services/orders.service.ts` | ❌ | ❌ | ✅ owns | ❌ |
| `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts` | ❌ | ❌ | ✅ owns | ❌ |
| `server/src/__tests__/sprint-1/orders.api.test.ts` *(intended `ORD-08` update only)* | ❌ | ❌ | ✅ owns | ❌ |
| `client/package.json`, `client/vite.config.ts`, `client/src/test/setup.ts` | ❌ | ❌ | ✅ owns | ❌ |
| `client/src/components/BakeryItemCard.tsx`, `OrderSummary.tsx`, `client/src/pages/OrderPage.tsx` | ❌ | ❌ | ✅ owns | ❌ |
| `client/src/components/__tests__/BakeryItemCard.test.tsx` | ❌ | ❌ | ✅ owns | ❌ |
| `e2e/lab-7/order-quantity-cap.spec.ts`, `e2e/playwright.config.ts` | ❌ | ❌ | ✅ owns | ❌ |
| `docs/labs/lab-07/metrics-and-readiness.md`, `docs/labs/lab-07/evidence/*` | ❌ | ❌ | ❌ | ✅ owns |

---

## 4. Test ID Allocation Summary

| Issue | Test ID Range | Count | Category | Target Files |
|---|---|:---:|---|---|
| `#75` (`LAB7-ISSUE-02`) | `CR01-01`..`CR01-06` | 6 | Backend API Integration (Boundary 5/6, Multi-Item Indexed Field, Stock < 5 `409`, Duplicate `bakeryItemId` `400`, `400` Precedence Before `409`) | `server/src/__tests__/lab-7/order-quantity-cap.api.test.ts` |
| `#75` (`LAB7-ISSUE-02`) | `CR01-UI-01`..`CR01-UI-02` | 2 | Frontend Component Unit/UI (`@testing-library/react` + `jsdom`: `Math.min(stockQuantity, 5)` cap & `"Max 5 per item"` notice) | `client/src/components/__tests__/BakeryItemCard.test.tsx` |
| `#75` (`LAB7-ISSUE-02`) | `E2E-CR01-01` | 1 | Playwright Multi-Viewport E2E (UI `+` cap at 5, `"Max 5 per item"` visible, qty 5 order succeeds) | `e2e/lab-7/order-quantity-cap.spec.ts` |
| `#75` (`LAB7-ISSUE-02`) | `ORD-08` *(update)* | 1 | Intended Sprint 1 Regression Update (L429 `quantity: 20` → valid quantity `<= 5` exceeding lower stock to keep proving `409 CONFLICT`) | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| **Total New + Updated** | — | **9 new + 1 updated** | — | *(Plus all 44 Sprint 1 / Lab 6 `#58` regression tests & coexisting Sprint 2 tests)* |
