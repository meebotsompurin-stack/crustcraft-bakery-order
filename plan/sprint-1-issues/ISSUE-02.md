# Issue #2 — Sprint 1 Engineering Contracts (Spec DD Part E)

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-02` — Sprint 1 Engineering Contracts (Feature SDS) |
| **Type** | `docs` |
| **Branch** | `docs/issue-02-sprint1-contracts` |
| **Wave** | 1 (Parallel-safe with ISSUE-01) |
| **Depends on** | None |
| **Parallel-safe** | ✅ Yes — operates exclusively in `docs/sprints/sprint-1/` (non-overlapping with ISSUE-01) |
| **Est** | L |
| **Deliverable** | Part E of Deliverable 1 |

---

## Objective
สร้าง Feature-Level Engineering Contract ครบ 4 ไฟล์สำหรับ Sprint 1 ก่อน implementation เริ่มต้น Part E ของ Deliverable 1 กำหนดให้มี specification.md, api-spec.md, ui-spec.md, และ tests.md พร้อม Git timestamp ว่า Spec existed before code

---

## Acceptance Criteria

- [ ] **AC-02-01:** `docs/sprints/sprint-1/specification.md` ครบถ้วน:
  - Sprint 1 Goal (1 paragraph)
  - Scope (Included / Excluded)
  - Functional Requirements (FR-XX) covering F-01 to F-04 ทั้งหมด
  - Business Rules: BR-01 (Server-Side Pricing), BR-02 (Price Snapshot), BR-03 (Stock Atomicity), BR-04 (Ownership Isolation) + เพิ่มเองอีก ≥2
  - RBAC Authorization Matrix (CUSTOMER vs OPERATOR per action)
  - Data Model: Prisma entity definitions (User, BakeryItem, Order, OrderItem) พร้อม field list
  - Acceptance Criteria (AC-XX) ที่ numbered ครบ สำหรับทุก Feature
  - Product DoD (Definition of Done) checklist
- [ ] **AC-02-02:** `docs/sprints/sprint-1/api-spec.md` ครบถ้วน:
  - Global Auth strategy (JWT httpOnly cookie)
  - Standard error envelope และ error code table
  - ทุก endpoint: method, path, auth requirement, request body shape, success response shape, error responses
  - Endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/catalog, GET /api/catalog/:id, POST /api/customer/orders, GET /api/customer/orders, GET /api/customer/orders/:id, GET /api/operator/orders, GET /api/operator/orders/:id, PATCH /api/operator/orders/:id/status
- [ ] **AC-02-03:** `docs/sprints/sprint-1/ui-spec.md` ครบถ้วน:
  - Page inventory table (all pages/views for Sprint 1)
  - Component specs สำหรับ BakeryItemCard, OrderForm, OrderSummary, OperatorOrderRow
  - Loading state, Empty state, Error state สำหรับทุก data-fetching component
  - Responsive behavior ระบุ: Desktop 1280px, Tablet 768px, Mobile 375px
- [ ] **AC-02-04:** `docs/sprints/sprint-1/tests.md` ครบถ้วน:
  - Test Execution Matrix: Test ID → Type → AC-XX → What It Tests → Expected Result → Test File → Status
  - ครอบคลุม AUTH-01 ถึง AUTH-10, CAT-01 ถึง CAT-05, ORD-01 ถึง ORD-12, OPS-01 ถึง OPS-08, E2E-01 ถึง E2E-09
  - E2E Scenario table (Scenario → Viewports → Steps → Expected)
  - ทุก AC-XX ต้องมี Test ID ≥1 ตัว (ไม่มี orphan AC)
- [ ] **AC-02-05:** Git timestamp ของ PR #2 ต้อง **ก่อน** PR #3 (ISSUE-03 scaffold) โดยเด็ดขาด

---

## Test IDs
Issue นี้ไม่มี automated tests (เป็นเอกสาร) แต่ `tests.md` ที่สร้างจะกำหนด Test IDs ทั้งหมดของ Sprint 1

**Test ID allocation สำหรับ Sprint 1:**
- AUTH-01 to AUTH-10 (ISSUE-03)
- CAT-01 to CAT-05 (ISSUE-04)
- ORD-01 to ORD-12 (ISSUE-04)
- OPS-01 to OPS-08 (ISSUE-05)
- E2E-01 to E2E-09 (ISSUE-06)

---

## Files Allowed (Whitelist)

```
docs/sprints/sprint-1/specification.md   ← สร้างใหม่
docs/sprints/sprint-1/api-spec.md        ← สร้างใหม่
docs/sprints/sprint-1/ui-spec.md         ← สร้างใหม่
docs/sprints/sprint-1/tests.md           ← สร้างใหม่
```

## Out of Scope

- ❌ ห้ามสร้างหรือแก้ไขไฟล์ใดๆ ใน `server/`, `client/`, `e2e/`, `prisma/`
- ❌ ห้ามแก้ไข `docs/srs.md`, `docs/system-sds.md`, หรือไฟล์ใน `docs/` root (อยู่ใน ISSUE-01)
- ❌ ห้ามแก้ไขไฟล์ใน `plan/` หรือ `knowledge/`
- ❌ ห้าม npm install หรือสร้าง package.json

---

## Review Focus

1. **Completeness:** ทุก AC-02-XX ต้องผ่านทุกข้อ
2. **API Accuracy:** Endpoint definitions ต้องตรงกับ Domain Rules (Server-side pricing, stock validation, ownership isolation)
3. **Test Traceability:** ทุก AC-XX ใน specification.md ต้องปรากฏใน Test Execution Matrix
4. **Timestamp:** PR #2 merged ก่อน PR #3
