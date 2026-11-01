# ISSUE-04 — Customer Catalog & Pre-Order Features (F-02, F-03)

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-04` — Customer Catalog & Pre-Order Features |
| **Type** | `feat` |
| **Branch** | `feat/issue-04-customer-catalog-and-orders` |
| **Wave** | 3 (Parallel-safe with `ISSUE-05`) |
| **Depends on** | `ISSUE-03` (`feat/issue-03-scaffold-db-and-auth`) merged to `sprint-1-staging` |
| **Parallel-safe** | ✅ Yes — zero file conflict with `ISSUE-05` (see `INDEX.md` conflict matrix) |
| **Est** | XL |
| **Deliverable** | Part F of Deliverable 1 |

---

## Objective
Implement F-02 (Bakery Catalog API + UI) and F-03 (Customer Pre-Order Creation with authoritative server-side pricing in integer satang `Int`, `unitPriceAtOrder` snapshot, atomic stock deduction, and customer's own order view) using TDD

---

## Pre-Implementation Checklist (AI Must Confirm)
1. อ่าน `ISSUE-04.md` และ `plan/01-conventions.md` แล้วยืนยัน Files Allowed whitelist
2. `ISSUE-03` ถูก merge แล้ว — `server/src/lib/db.ts`, `authenticate`, `requireRole` middleware พร้อมใช้งาน
3. ยืนยัน: `client/src/services/api.ts` และ `client/src/App.tsx` จาก `ISSUE-03` ต้องถูก rebase ก่อน add functions ใหม่

---

## Acceptance Criteria

### F-02: Bakery Catalog
- [ ] **AC-04-01 (CAT-01):** GET `/api/catalog` returns only items with `isAvailable == true` (including items where `stockQuantity == 0`, since depleting stock does NOT auto-set `isAvailable = false`)
- [ ] **AC-04-02 (CAT-02):** Response includes `id`, `name`, `description`, `price` (`Int` satang), `stockQuantity` (`Int`), `isAvailable` (`Boolean`), `category` per item
- [ ] **AC-04-03 (CAT-03):** Items with `isAvailable == false` do NOT appear in catalog list response
- [ ] **AC-04-04 (CAT-04):** GET `/api/catalog/:id` returns single item detail
- [ ] **AC-04-05 (CAT-05):** GET `/api/catalog/:id` for non-existent ID returns `404 NOT_FOUND`
- [ ] **AC-04-06:** Catalog page UI renders BakeryItem Cards with name, description, price formatted in THB (`(price / 100).toFixed(2)`), stock count, and availability badge (shows "Out of Stock" and disables ordering when `stockQuantity == 0`)

### F-03: Customer Pre-Order
- [ ] **AC-04-07 (ORD-01):** POST `/api/customer/orders` with valid items returns `201` + order detail including server-calculated `totalAmount` (`Int` satang)
- [ ] **AC-04-08 (ORD-02):** `totalAmount` (`Int` satang) equals sum of (`BakeryItem.price` × `quantity`) per line item — never uses client-supplied price
- [ ] **AC-04-09 (ORD-03):** Each `OrderItem.unitPriceAtOrder` (`Int` satang) equals `BakeryItem.price` at time of order creation
- [ ] **AC-04-10 (ORD-04):** `BakeryItem.stockQuantity` is decremented after successful order (if `stockQuantity` reaches `0`, `isAvailable` remains `true`)
- [ ] **AC-04-11 (ORD-05):** Order creation is atomic: if stock insufficient for any item, entire order fails (no partial deductions)
- [ ] **AC-04-12 (ORD-06):** Order with `quantity <= 0` returns `400 VALIDATION_ERROR`
- [ ] **AC-04-13 (ORD-07):** Order with `isAvailable == false` item returns `409 CONFLICT`
- [ ] **AC-04-14 (ORD-08):** Order with `quantity > stockQuantity` (or `stockQuantity == 0`) returns `409 CONFLICT`
- [ ] **AC-04-15 (ORD-09):** GET `/api/customer/orders` returns only orders belonging to the authenticated CUSTOMER
- [ ] **AC-04-16 (ORD-10):** GET `/api/customer/orders/:id` for own order returns `200` + full order detail
- [ ] **AC-04-17 (ORD-11):** GET `/api/customer/orders/:id` for another customer's order returns `403 FORBIDDEN`
- [ ] **AC-04-18 (ORD-12):** Order initial status is `PENDING`
- [ ] **AC-04-19:** My Orders page UI shows list of customer's own orders with status badges and totals formatted in THB
- [ ] **AC-04-20:** Order Detail page UI shows full order breakdown (items, quantities, `unitPriceAtOrder` and `totalAmount` formatted in THB)

---

## Test IDs

| Test ID | Type | AC | File |
|---|---|---|---|
| CAT-01 | API Integration | AC-04-01 | `server/src/__tests__/sprint-1/catalog.api.test.ts` |
| CAT-02 | API Integration | AC-04-02 | `server/src/__tests__/sprint-1/catalog.api.test.ts` |
| CAT-03 | API Integration | AC-04-03 | `server/src/__tests__/sprint-1/catalog.api.test.ts` |
| CAT-04 | API Integration | AC-04-04 | `server/src/__tests__/sprint-1/catalog.api.test.ts` |
| CAT-05 | API Integration | AC-04-05 | `server/src/__tests__/sprint-1/catalog.api.test.ts` |
| ORD-01 | API Integration | AC-04-07 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-02 | Unit | AC-04-08 | `server/src/__tests__/unit/orderCalculation.test.ts` |
| ORD-03 | Unit | AC-04-09 | `server/src/__tests__/unit/orderCalculation.test.ts` |
| ORD-04 | API Integration | AC-04-10 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-05 | API Integration | AC-04-11 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-06 | API Integration | AC-04-12 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-07 | API Integration | AC-04-13 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-08 | API Integration | AC-04-14 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-09 | API Integration | AC-04-15 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-10 | API Integration | AC-04-16 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-11 | API Integration | AC-04-17 | `server/src/__tests__/sprint-1/orders.api.test.ts` |
| ORD-12 | API Integration | AC-04-18 | `server/src/__tests__/sprint-1/orders.api.test.ts` |

**TDD Order:** Write test stubs (`catalog.api.test.ts`, `orderCalculation.test.ts`, `orders.api.test.ts`) FIRST → STOP for confirmation → implement

---

## Files Allowed (Whitelist)

```
# Server
server/src/routes/catalog.routes.ts
server/src/controllers/catalog.controller.ts
server/src/services/catalog.service.ts
server/src/routes/customer.routes.ts
server/src/controllers/orders.controller.ts
server/src/services/orders.service.ts
server/src/__tests__/unit/orderCalculation.test.ts
server/src/__tests__/sprint-1/catalog.api.test.ts
server/src/__tests__/sprint-1/orders.api.test.ts

# Client
client/src/pages/CatalogPage.tsx
client/src/pages/OrderPage.tsx
client/src/pages/MyOrdersPage.tsx
client/src/pages/OrderDetailPage.tsx
client/src/components/BakeryItemCard.tsx
client/src/components/OrderSummary.tsx
client/src/services/api.ts              ← APPEND catalog/order API functions only
client/src/App.tsx                      ← APPEND customer routes only
```

## Out of Scope

- ❌ ห้ามสร้างหรือแก้ไข operator routes/controllers/pages (อยู่ใน `ISSUE-05`)
- ❌ ห้ามแก้ไข `prisma/schema.prisma` (schema fixed ใน `ISSUE-03`)
- ❌ ห้ามแก้ไขไฟล์ใน `docs/`, `plan/`, `knowledge/`
- ❌ ห้ามเพิ่ม npm dependency โดยไม่ได้รับการ approve ใน issue นี้

---

## Critical Domain Rules Reminder

> The AI MUST follow these rules exactly — violations cause PR rejection:

1. **NEVER** use price from request body to calculate total — always fetch `BakeryItem.price` (`Int` satang) from DB
2. **ALWAYS** snapshot `unitPriceAtOrder = bakeryItem.price` (`Int` satang) at order creation time inside the service
3. **ALWAYS** wrap stock deduction + order creation in `prisma.$transaction([...])`
4. **ALWAYS** verify `order.customerId === req.user.userId` before returning order detail to customer
5. **Availability vs. Stock (`BR-05`):** Do NOT set `isAvailable = false` when `stockQuantity` becomes `0`. Validation order on order creation: `quantity > 0` (`400`) → `isAvailable === true` (`409`) → `stockQuantity >= quantity` (`409`) → proceed

---

## Review Focus

1. **Server-side pricing (`Int` satang):** `totalAmount` calculation must come exclusively from DB integer satang prices
2. **Atomicity:** Transaction test — if second item has insufficient stock, first item stock must NOT be decremented
3. **Ownership isolation:** ORD-11 test must explicitly verify cross-customer 403
4. **TDD:** Test file commits must precede implementation commits in Git history
