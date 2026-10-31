# Issue #5 — Operator Incoming Order Queue & Acceptance (F-04)

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-05` — Operator Incoming Order Queue & Acceptance |
| **Type** | `feat` |
| **Branch** | `feat/issue-05-operator-order-acceptance` |
| **Wave** | 3 (Parallel-safe with ISSUE-04) |
| **Depends on** | ISSUE-03 merged to `sprint-1-staging` |
| **Parallel-safe** | ✅ Yes — zero file conflict with ISSUE-04 (see INDEX.md conflict matrix) |
| **Est** | L |
| **Deliverable** | Part F of Deliverable 1 |

---

## Objective
Implement F-04: Operator views all incoming orders (queue view), views individual order detail, and transitions an order from `PENDING` to `ACCEPTED`. Invalid transitions must be rejected with `409 CONFLICT`.

---

## Pre-Implementation Checklist (AI Must Confirm)
1. อ่าน ISSUE-05.md และ plan/01-conventions.md แล้วยืนยัน Files Allowed whitelist
2. ISSUE-03 ถูก merge แล้ว — `requireRole(['OPERATOR'])` middleware พร้อมใช้งาน
3. ยืนยัน: `client/src/services/api.ts` และ `client/src/App.tsx` จาก ISSUE-03/04 ต้องถูก rebase ก่อน add operator functions

---

## Acceptance Criteria

- [ ] **AC-05-01 (OPS-01):** GET `/api/operator/orders` by CUSTOMER returns `403 FORBIDDEN`
- [ ] **AC-05-02 (OPS-02):** GET `/api/operator/orders` by OPERATOR returns `200` + list of all orders (default sort: PENDING first, newest first)
- [ ] **AC-05-03 (OPS-03):** GET `/api/operator/orders/:id` by OPERATOR returns `200` + full order detail (customer name, items, quantities, unitPriceAtOrder, totalAmount, status)
- [ ] **AC-05-04 (OPS-04):** GET `/api/operator/orders/:id` for non-existent order returns `404 NOT_FOUND`
- [ ] **AC-05-05 (OPS-05):** PATCH `/api/operator/orders/:id/status` with `{ status: 'ACCEPTED' }` on a `PENDING` order returns `200` + updated order
- [ ] **AC-05-06 (OPS-06):** PATCH `/api/operator/orders/:id/status` with `{ status: 'ACCEPTED' }` on a non-`PENDING` order (e.g., already ACCEPTED) returns `409 CONFLICT`
- [ ] **AC-05-07 (OPS-07):** PATCH `/api/operator/orders/:id/status` by CUSTOMER returns `403 FORBIDDEN`
- [ ] **AC-05-08 (OPS-08):** PATCH `/api/operator/orders/:id/status` with invalid status value (not in allowed transition list) returns `400 VALIDATION_ERROR`
- [ ] **AC-05-09:** Operator Order Queue page UI shows list of orders with status badges, customer name, order total, and Accept button (disabled/hidden for non-PENDING orders)
- [ ] **AC-05-10:** Operator Order Detail page UI shows full order breakdown and current status
- [ ] **AC-05-11:** After accepting an order, the queue UI reflects the status change without full page reload

---

## Test IDs

| Test ID | Type | AC | File |
|---|---|---|---|
| OPS-01 | API Integration | AC-05-01 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-02 | API Integration | AC-05-02 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-03 | API Integration | AC-05-03 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-04 | API Integration | AC-05-04 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-05 | API Integration | AC-05-05 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-06 | API Integration | AC-05-06 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-07 | API Integration | AC-05-07 | `server/src/__tests__/sprint-1/operator.api.test.ts` |
| OPS-08 | API Integration | AC-05-08 | `server/src/__tests__/sprint-1/operator.api.test.ts` |

**TDD Order:** Write `operator.api.test.ts` FIRST → STOP for confirmation → implement routes/controller/service

---

## Files Allowed (Whitelist)

```
# Server
server/src/routes/operator.routes.ts
server/src/controllers/operator.controller.ts
server/src/services/operator.service.ts
server/src/__tests__/sprint-1/operator.api.test.ts

# Client
client/src/pages/OperatorOrderQueuePage.tsx
client/src/pages/OperatorOrderDetailPage.tsx
client/src/components/OperatorOrderRow.tsx
client/src/services/api.ts              ← APPEND operator API functions only
client/src/App.tsx                      ← APPEND operator routes only
```

## Out of Scope

- ❌ ห้ามสร้างหรือแก้ไข catalog, customer order routes/controllers/pages (อยู่ใน ISSUE-04)
- ❌ ห้ามแก้ไข `prisma/schema.prisma`
- ❌ ห้ามสร้าง Sprint 2 lifecycle transitions (BAKING, READY_FOR_PICKUP, COMPLETED, CANCELLED) — Sprint 1 only allows PENDING→ACCEPTED
- ❌ ห้ามแก้ไขไฟล์ใน `docs/`, `plan/`, `knowledge/`

---

## Status Transition Rules (Sprint 1)

```
Allowed transitions (Sprint 1 only):
  PENDING  →  ACCEPTED   (OPERATOR only)

All other transitions are INVALID → return 409 CONFLICT

Implement as a transition validation function in operator.service.ts:
  const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['ACCEPTED'],
    ACCEPTED: [],       // Sprint 1: no further transitions
    // Sprint 2 transitions will be added in future issues
  };
```

---

## Review Focus

1. **RBAC:** All `/api/operator/*` routes MUST use `requireRole(['OPERATOR'])` — no exceptions
2. **Transition validation:** Must be in `operator.service.ts` as an explicit allowed-transitions map (not ad-hoc if/else)
3. **409 accuracy:** Distinguish between `409 CONFLICT` (wrong status for transition) and `400 VALIDATION_ERROR` (invalid status string)
4. **TDD:** Test file commits must precede implementation commits
