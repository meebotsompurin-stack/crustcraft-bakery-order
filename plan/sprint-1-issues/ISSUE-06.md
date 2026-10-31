# Issue #6 — E2E Tests, Responsive Evidence & Deliverable 1 Release

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-06` — E2E Tests, Responsive Evidence & Deliverable 1 Release |
| **Type** | `test` |
| **Branch** | `test/issue-06-e2e-and-deliverable1-evidence` |
| **Wave** | 4 (Final integration — all feature issues must merge first) |
| **Depends on** | ISSUE-04 AND ISSUE-05 both merged to `sprint-1-staging` |
| **Parallel-safe** | ❌ No — depends on all Sprint 1 features being complete |
| **Est** | L |
| **Deliverable** | Part F + Release PR (Deliverable 1 Submission) |

---

## Objective
Implement Playwright E2E tests covering 3 viewports, capture responsive screenshots for evidence, complete `README.md` setup guide, and create the Release PR (`sprint-1-staging` → `main`) with full Deliverable 1 evidence package

---

## Pre-Implementation Checklist (AI Must Confirm)
1. อ่าน ISSUE-06.md และ plan/01-conventions.md แล้วยืนยัน Files Allowed whitelist
2. ISSUE-04 ถูก merge แล้ว — F-02 (Catalog) และ F-03 (Customer Orders) พร้อมใช้งาน
3. ISSUE-05 ถูก merge แล้ว — F-04 (Operator Acceptance) พร้อมใช้งาน
4. `npm test` (unit + API integration) ผ่านทั้งหมด ก่อนเริ่ม E2E
5. Server และ Client รันได้ด้วย `npm run dev`

---

## Acceptance Criteria

### E2E Tests
- [ ] **AC-06-01 (E2E-01 to E2E-05):** Customer Happy Path — Desktop 1280px:
  - E2E-01: Customer registers successfully
  - E2E-02: Customer logs in and sees Catalog
  - E2E-03: Customer places an order (2+ items), sees order confirmation
  - E2E-04: Customer views My Orders list — order appears with PENDING status
  - E2E-05: Customer views order detail — totalAmount correct, items listed
- [ ] **AC-06-02 (E2E-06 to E2E-08):** Operator Happy Path — Desktop 1280px:
  - E2E-06: Operator logs in and sees Order Queue
  - E2E-07: Operator accepts a PENDING order — status changes to ACCEPTED
  - E2E-08: Operator views order detail — full order information displayed
- [ ] **AC-06-03 (E2E-09):** Auth Guard — unauthenticated access to protected page redirects to Login
- [ ] **AC-06-04:** All E2E tests (E2E-01 to E2E-09) pass on all 3 viewports: Desktop 1280px, Tablet 768px, Mobile 375px
- [ ] **AC-06-05:** No hardcoded `sleep()` or `waitForTimeout()` calls — use `waitForSelector` or `expect(locator).toBeVisible()`

### Responsive Screenshots (Evidence)
- [ ] **AC-06-06:** Screenshots captured at key steps on all 3 viewports (1280px, 768px, 375px):
  - Login page
  - Catalog page (showing bakery items)
  - Order creation form
  - My Orders list (with order)
  - Operator Order Queue
- [ ] **AC-06-07:** Screenshots saved in `e2e/screenshots/sprint-1/` directory

### README & Setup
- [ ] **AC-06-08:** `README.md` updated with complete working setup instructions:
  - Prerequisites (Node.js version, npm)
  - `npm install` (root)
  - `cd server && npx prisma migrate dev && npx prisma db seed`
  - `npm run dev` (starts both server + client)
  - `npm test` (unit + API integration tests)
  - `npm run test:e2e` (Playwright E2E)
  - Default credentials for testing (seeded operator + customer accounts)
- [ ] **AC-06-09:** Another team member can follow README from scratch and run the project successfully

### Deliverable 1 Evidence Checklist
- [ ] **AC-06-10:** Verify Git timestamp order in `sprint-1-staging`:
  - ISSUE-01 PR merge timestamp < ISSUE-03 PR merge timestamp ✅
  - ISSUE-02 PR merge timestamp < ISSUE-03 PR merge timestamp ✅
- [ ] **AC-06-11:** All AC from ISSUE-01 to ISSUE-05 verified as passing
- [ ] **AC-06-12:** `npm test` exits with code 0 (all unit + API integration tests pass)
- [ ] **AC-06-13:** Playwright `npm run test:e2e` exits with code 0 (all E2E tests pass)
- [ ] **AC-06-14:** Release PR created: `sprint-1-staging` → `main` with:
  - Full evidence: test output screenshots, responsive screenshots
  - Link to all 6 Sprint 1 PRs
  - Deliverable 1 submission checklist completed

---

## Test IDs

| Test ID | Type | AC | Viewports | File |
|---|---|---|---|---|
| E2E-01 | E2E | AC-06-01 | Desktop, Tablet, Mobile | `e2e/sprint-1/customer-order-flow.spec.ts` |
| E2E-02 | E2E | AC-06-01 | Desktop, Tablet, Mobile | `e2e/sprint-1/customer-order-flow.spec.ts` |
| E2E-03 | E2E | AC-06-01 | Desktop, Tablet, Mobile | `e2e/sprint-1/customer-order-flow.spec.ts` |
| E2E-04 | E2E | AC-06-01 | Desktop, Tablet, Mobile | `e2e/sprint-1/customer-order-flow.spec.ts` |
| E2E-05 | E2E | AC-06-01 | Desktop, Tablet, Mobile | `e2e/sprint-1/customer-order-flow.spec.ts` |
| E2E-06 | E2E | AC-06-02 | Desktop, Tablet, Mobile | `e2e/sprint-1/operator-acceptance-flow.spec.ts` |
| E2E-07 | E2E | AC-06-02 | Desktop, Tablet, Mobile | `e2e/sprint-1/operator-acceptance-flow.spec.ts` |
| E2E-08 | E2E | AC-06-02 | Desktop, Tablet, Mobile | `e2e/sprint-1/operator-acceptance-flow.spec.ts` |
| E2E-09 | E2E | AC-06-03 | Desktop, Tablet, Mobile | `e2e/sprint-1/auth-guard.spec.ts` |

---

## Files Allowed (Whitelist)

```
# E2E tests
e2e/sprint-1/customer-order-flow.spec.ts       ← สร้างใหม่
e2e/sprint-1/operator-acceptance-flow.spec.ts  ← สร้างใหม่
e2e/sprint-1/auth-guard.spec.ts                ← สร้างใหม่
e2e/screenshots/sprint-1/                      ← directory สำหรับ screenshots

# README
README.md                                      ← แก้ไข (เพิ่ม setup instructions)
```

## Out of Scope

- ❌ ห้ามแก้ไข source code ใน `server/` หรือ `client/` (ถ้าพบ bug ต้องรายงาน เปิด hotfix issue แยก)
- ❌ ห้ามแก้ไข `prisma/schema.prisma` หรือ seed
- ❌ ห้ามแก้ไขไฟล์ใน `docs/`, `plan/`, `knowledge/`
- ❌ ห้ามสร้าง Release PR (`sprint-1-staging` → `main`) จนกว่า AC-06-10 ถึง AC-06-13 จะผ่านทั้งหมด

---

## Review Focus

1. **Stability:** ไม่มี hardcoded sleep — E2E tests ต้อง stable ใน CI
2. **3 Viewports:** ทุก spec ต้อง run บน Desktop + Tablet + Mobile ใน `playwright.config.ts`
3. **Screenshot naming:** ชื่อ screenshot ต้องชัดเจน: `{viewport}-{pagename}-{step}.png`
4. **Timestamp verification:** Git log ต้องแสดงว่า ISSUE-01, ISSUE-02 merge ก่อน ISSUE-03
5. **README accuracy:** ทดสอบ README instructions จริงๆ บน machine ใหม่ก่อน submit
