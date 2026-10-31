# 04 — Issue Breakdown Index (Sprint 1)

> **อ้างอิง:** `plan/03-macro-plan.md`, `plan/01-conventions.md`, `plan/02-feature-coverage.md`
> **Test ID Sprint 1 Categories:** `AUTH-01…`, `CAT-01…`, `ORD-01…`, `OPS-01…`, `E2E-01…`

---

## 1. Wave Execution Order

> กฎ: **1 Issue = 1 Branch = 1 PR**
> "Parallel-safe" = งานที่ไม่มี file conflict กับ Issue ที่ทำงานอยู่พร้อมกัน

| Wave | Issue | Branch | Depends on | Est | Parallel-safe? |
|:---:|---|---|---|:---:|---|
| **0** | [ISSUE-00](./ISSUE-00.md) Repo Init & Master Plan | `chore/issue-00-master-plan` | None | M | N/A (Initial repository setup baseline) |
| **1** | [ISSUE-01](./ISSUE-01.md) Product Baseline | `docs/issue-01-product-baseline` | #0 merged | L | ✅ ทำงานขนานกับ ISSUE-02 ได้ (ต่างไฟล์กันทั้งหมด) |
| **1** | [ISSUE-02](./ISSUE-02.md) Sprint 1 Contracts | `docs/issue-02-sprint1-contracts` | #0 merged | L | ✅ ทำงานขนานกับ ISSUE-01 ได้ (ต่างไฟล์กันทั้งหมด) |
| **2** | [ISSUE-03](./ISSUE-03.md) Scaffold + DB + Auth | `feat/issue-03-scaffold-db-and-auth` | #1 AND #2 merged | XL | ❌ ต้องรอ Wave 1 merge ก่อน (Spec DD must predate code) |
| **3** | [ISSUE-04](./ISSUE-04.md) Customer Catalog & Orders | `feat/issue-04-customer-catalog-and-orders` | #3 merged | XL | ✅ Parallel-safe กับ ISSUE-05 (zero file conflict) |
| **3** | [ISSUE-05](./ISSUE-05.md) Operator Order Acceptance | `feat/issue-05-operator-order-acceptance` | #3 merged | L | ✅ Parallel-safe กับ ISSUE-04 (zero file conflict) |
| **4** | [ISSUE-06](./ISSUE-06.md) E2E + Evidence + Release | `test/issue-06-e2e-and-deliverable1-evidence` | #4 AND #5 merged | L | ❌ ต้อง merge ทุก feature ก่อน (Integration phase) |

### Merge Order (ต้องตามลำดับ)

```
Wave 0: #0 merge → sprint-1-staging (Base setup)
           ↓
Wave 1: #1 merge → sprint-1-staging (timestamp critical!)
         #2 merge → sprint-1-staging (timestamp critical!)
           ↓
Wave 2: #3 merge → sprint-1-staging
           ↓
Wave 3: #4 merge → sprint-1-staging  (หรือ #5 ก่อนก็ได้ — ไม่ conflict)
         #5 merge → sprint-1-staging
           ↓
Wave 4: #6 merge → sprint-1-staging
           ↓
Release: sprint-1-staging → main  (Release PR สร้างใน ISSUE-06)
```

---

## 2. File Conflict Matrix (Wave 3 Parallel Issues)

> ตรวจสอบก่อนเริ่มทำงาน Wave 3 — ISSUE-04 และ ISSUE-05 ต้องไม่แตะไฟล์เดียวกัน

| File / Directory | ISSUE-04 | ISSUE-05 |
|---|:---:|:---:|
| `server/src/routes/catalog.routes.ts` | ✅ ISSUE-04 owns | ❌ |
| `server/src/routes/customer.routes.ts` | ✅ ISSUE-04 owns | ❌ |
| `server/src/controllers/catalog.controller.ts` | ✅ ISSUE-04 owns | ❌ |
| `server/src/controllers/orders.controller.ts` | ✅ ISSUE-04 owns | ❌ |
| `server/src/services/catalog.service.ts` | ✅ ISSUE-04 owns | ❌ |
| `server/src/services/orders.service.ts` | ✅ ISSUE-04 owns | ❌ |
| `server/src/routes/operator.routes.ts` | ❌ | ✅ ISSUE-05 owns |
| `server/src/controllers/operator.controller.ts` | ❌ | ✅ ISSUE-05 owns |
| `server/src/services/operator.service.ts` | ❌ | ✅ ISSUE-05 owns |
| `client/src/pages/CatalogPage.tsx` | ✅ ISSUE-04 owns | ❌ |
| `client/src/pages/OrderPage.tsx` | ✅ ISSUE-04 owns | ❌ |
| `client/src/pages/MyOrdersPage.tsx` | ✅ ISSUE-04 owns | ❌ |
| `client/src/pages/OrderDetailPage.tsx` | ✅ ISSUE-04 owns | ❌ |
| `client/src/pages/OperatorOrderQueuePage.tsx` | ❌ | ✅ ISSUE-05 owns |
| `client/src/pages/OperatorOrderDetailPage.tsx` | ❌ | ✅ ISSUE-05 owns |
| `client/src/services/api.ts` | ⚠️ add catalog/order fns | ⚠️ add operator fns |
| `client/src/App.tsx` (routing) | ⚠️ add customer routes | ⚠️ add operator routes |

> **⚠️ หมายเหตุ:** `client/src/services/api.ts` และ `client/src/App.tsx` ถูกแตะโดยทั้ง 2 Issues ให้ใช้กลยุทธ์ตามนี้:
> - Developer ที่ merge ก่อนจะ add functions ของตัวเอง
> - Developer ที่ merge ทีหลังต้อง **rebase บน branch ที่ merge แล้ว** และ merge ส่วนของตัวเองเพิ่มเติม (append functions, append routes)

---

## 3. Cross-Pair Review Queue

> ทำงานเป็นคู่กับ Partner — สลับ Developer/Reviewer ตามตาราง
> หลักการ: Developer สร้าง PR → Partner review → ระหว่างรอ review ให้ pickup Wave ถัดไป

| My PR (Developer) | Partner Peer Reviews | Pickup while waiting |
|---|---|---|
| PR #0 (ISSUE-00 Setup) | Partner's review | ร่วม review baseline ก่อนเริ่ม Wave 1 |
| PR #1 (ISSUE-01 Docs) | Partner's ISSUE-02 equivalent | ทำ ISSUE-02 ขนาน ถ้าเป็น Wave 1 |
| PR #2 (ISSUE-02 Contracts) | Partner's ISSUE-01 equivalent | รอ review → Wave 2 |
| PR #3 (ISSUE-03 Scaffold) | Partner's ISSUE-03 equivalent | รอ review → Wave 3 |
| PR #4 or #5 (Wave 3 issue) | Partner's Wave 3 issue | ทำ Wave 3 issue อีกตัว ถ้า Parallel-safe |
| PR #6 (ISSUE-06 E2E) | Partner's ISSUE-06 equivalent | รอ review → Prepare Deliverable 1 evidence |

---

## 4. Test ID Allocation

| Issue | Test ID Range | Test Category |
|---|---|---|
| ISSUE-03 (Auth) | AUTH-01 to AUTH-10 | Authentication & RBAC |
| ISSUE-04 (Catalog) | CAT-01 to CAT-05 | Bakery Catalog |
| ISSUE-04 (Orders) | ORD-01 to ORD-12 | Customer Pre-Orders |
| ISSUE-05 (Operator) | OPS-01 to OPS-08 | Operator Actions |
| ISSUE-06 (E2E) | E2E-01 to E2E-09 | End-to-End Flows |

**Total Sprint 1 Test IDs:** 44 (AUTH x10, CAT x5, ORD x12, OPS x8, E2E x9)

---

## 5. Traceability Matrix

| Feature | Issue | Test IDs | Deliverable |
|---|---|---|---|
| **Phase 0: Baseline & Plan** | #0 | (manual: Repo integrity check) | Phase 0 Setup |
| **F-01: Auth & RBAC** | #3 | AUTH-01 to AUTH-10 | Part F |
| **F-02: Bakery Catalog** | #4 | CAT-01 to CAT-05 | Part F |
| **F-03: Customer Pre-Order** | #4 | ORD-01 to ORD-12 | Part F |
| **F-04: Operator Acceptance** | #5 | OPS-01 to OPS-08 | Part F |
| **E2E: Full User Journeys** | #6 | E2E-01 to E2E-09 | Part F |
| **Spec DD: Product Baseline** | #1 | (manual: Git timestamp) | Parts A-D |
| **Spec DD: Sprint 1 Contracts** | #2 | (manual: Git timestamp) | Part E |
