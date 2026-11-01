# 02 — Feature Coverage & Requirement Traceability

> **โปรเจกต์:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System
> **อ้างอิง:** `Docs/group_work_specs_v1.pdf`, `Docs/project_deliverable_1_v1.pdf`, `Docs/project_deliverable_2_v1.pdf`, `Docs/project_final_delivery_v1.pdf`
> **วันที่สร้าง:** 2026-10-31

---

## 1. Master Feature Registry

| Feature ID | Feature Name | Sprint | Status | Issues |
|---|---|:---:|---|---|
| **F-01** | Authentication, Session Lifecycle & RBAC Foundation | 1 | ⬜ Planned | `ISSUE-03` |
| **F-02** | Bakery Catalog & Availability View | 1 | ⬜ Planned | `ISSUE-04` |
| **F-03** | Customer Pre-Order Creation & Authoritative Server Calculation | 1 | ⬜ Planned | `ISSUE-04` |
| **F-04** | Operator Incoming Order Queue & Acceptance | 1 | ⬜ Planned | `ISSUE-05` |
| **F-05** | Bakery Catalog Administration (OPERATOR) | 2 | ⬜ Planned | TBD Sprint 2 |
| **F-06** | Order Fulfillment & Cancellation Lifecycle | 2 | ⬜ Planned | TBD Sprint 2 |
| **F-07** | Simulated Payment Transitions | 2 | ⬜ Planned | TBD Sprint 2 |
| **F-08** | Bakery Sales & Order Summary Reporting | 3 | ⬜ Planned | TBD Sprint 3 |
| **F-09** | Order Search, Filtering & Release Hardening | 3 | ⬜ Planned | TBD Sprint 3 |

---

## 2. Sprint 1 — Feature Detail

### F-01: Authentication, Session Lifecycle & RBAC Foundation
**Objective:** ให้ผู้ใช้ Register, Login, Logout ได้ และระบบรู้จัก Role (`CUSTOMER` vs `OPERATOR`) ในทุก API Request

**Functional Requirements:**
- FR-01-01: User สามารถ Register ด้วย `name`, `email`, `password` และ `role` (default: `CUSTOMER`)
- FR-01-02: User สามารถ Login ด้วย `email` + `password` โดยระบบออก JWT token (`expiresIn: '24h'`) ตั้งค่าใน `httpOnly` cookie (`token`, `SameSite=Lax`, `Path=/`, `Max-Age=86400`) สำหรับ Frontend (`fetch` พร้อม `credentials: 'include'`) และส่งคืนใน response body สำหรับ API test clients
- FR-01-03: `authenticate` middleware ตรวจสอบ JWT จาก `req.cookies.token` เป็นหลัก และรองรับ `Authorization: Bearer <token>` header เป็น fallback ก่อนเข้า protected routes
- FR-01-04: Role-based access ต้องถูก enforce ผ่าน `requireRole([...])` middleware
- FR-01-05: User สามารถ Logout ได้ผ่าน `POST /api/auth/logout` ซึ่งเพิกถอน session ฝั่ง browser โดยล้าง `httpOnly` cookie (`res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' })`) และล้าง state ใน `AuthContext`

**Acceptance Criteria:**
- AC-01-01: POST `/api/auth/register` สร้าง User ใหม่ ส่งคืน `201` + user data (ไม่รวม `passwordHash`)
- AC-01-02: POST `/api/auth/login` ด้วย credential ถูกต้อง ส่งคืน `200`, ตั้งค่า `httpOnly` cookie (`token`, อายุ `24h`) และส่งคืน user + JWT token
- AC-01-03: POST `/api/auth/login` ด้วย credential ผิด ส่งคืน `401 UNAUTHORIZED`
- AC-01-04: ทุก protected endpoint ที่ถูกเรียกโดยไม่มี credential ที่ถูกต้อง (ไม่มีทั้ง `httpOnly` cookie ที่ valid และ `Authorization: Bearer <token>` header ที่ valid/ยังไม่หมดอายุ) ส่งคืน `401 UNAUTHORIZED`
- AC-01-05: `CUSTOMER` เรียก `/api/operator/*` ส่งคืน `403 FORBIDDEN`

**Test IDs:** AUTH-01 ถึง AUTH-10

---

### F-02: Bakery Catalog & Availability View
**Objective:** แสดงรายการสินค้า Artisan Bakery ที่มีจำหน่าย พร้อมราคาและสต็อก

**Seeded Bakery Items (Sprint 1 Initial Data):**
> **หมายเหตุ:** ราคาในฐานข้อมูลและ API Contract เก็บเป็นจำนวนเต็มสตางค์ (`Int`, `100 satang = 1.00 THB`) เพื่อป้องกันปัญหาทศนิยมคลาดเคลื่อน และแสดงผลบน UI เป็นหน่วยบาท (THB)

| Name | Category | Price (THB Display) | Price (`Int` Satang in DB/API) | Initial Stock |
|---|---|---|---|---|
| Artisan Butter Croissant | Pastry | 85.00 | `8500` | 50 |
| Classic Sourdough Loaf | Bread | 220.00 | `22000` | 20 |
| Cinnamon Brioche Roll | Sweet Bread | 65.00 | `6500` | 80 |
| Pain au Chocolat | Pastry | 90.00 | `9000` | 40 |
| Matcha Almond Tart | Tart | 145.00 | `14500` | 30 |

**`isAvailable` vs. `stockQuantity` Semantics (`BR-05`):**
- `isAvailable` (`Boolean`): สถานะเปิด/ปิดการแสดงสินค้าในหน้าเมนูโดย `OPERATOR` (`GET /api/catalog` ส่งคืนเฉพาะสินค้าที่ `isAvailable == true`)
- `stockQuantity` (`Int`): จำนวนสต็อกคงเหลือจริง เมื่อมีการสั่งซื้อจน `stockQuantity` ลดลงเหลือ `0` **ค่า `isAvailable` จะไม่เปลี่ยนเป็น `false` อัตโนมัติ** — สินค้ายังคงปรากฏใน `GET /api/catalog` (`isAvailable: true`, `stockQuantity: 0`) เพื่อให้ UI แสดงป้าย **"Out of Stock" (`สินค้าหมดชั่วคราว`)** และปิดปุ่มสั่งซื้อ

**Functional Requirements:**
- FR-02-01: GET `/api/catalog` ส่งคืน list ของ `BakeryItem` ที่ `isAvailable == true` (รวมถึงรายการที่ `stockQuantity == 0`)
- FR-02-02: GET `/api/catalog/:id` ส่งคืน detail ของสินค้าชิ้นเดียว
- FR-02-03: Frontend แสดง Card ต่อ 1 Item: ชื่อ, คำอธิบาย, ราคาที่แปลงเป็น THB (`satang / 100`), stock ที่เหลือ, และ availability / out-of-stock badge

**Acceptance Criteria:**
- AC-02-01: Endpoint ส่งคืน items ที่ `isAvailable == true` เท่านั้น (แม้ `stockQuantity == 0` ก็ยังแสดงใน catalog พร้อมสถานะสินค้าหมด)
- AC-02-02: Response รวม `id`, `name`, `description`, `price` (`Int` satang), `stockQuantity`, `isAvailable`, `category`
- AC-02-03: Items ที่ `isAvailable == false` ไม่ปรากฏใน catalog list

**Test IDs:** CAT-01 ถึง CAT-05

---

### F-03: Customer Pre-Order Creation & Authoritative Server Calculation
**Objective:** ลูกค้าสั่ง Pre-Order พร้อม 1+ สินค้า ระบบคำนวณราคาฝั่ง Server (หน่วยสตางค์ `Int`) และหักสต็อกอัตโนมัติ

**Functional Requirements:**
- FR-03-01: POST `/api/customer/orders` รับ `items: [{bakeryItemId, quantity}]` + `pickupNote?`
- FR-03-02: Server คำนวณ `totalAmount` (`Int` satang) จาก `BakeryItem.price` ใน DB — ห้ามรับราคาจาก client (`BR-01`)
- FR-03-03: `unitPriceAtOrder` (`Int` satang) ถูก snapshot จาก `BakeryItem.price` ณ เวลา creation (`BR-02`)
- FR-03-04: `stockQuantity` ถูกหักอัตโนมัติภายใน `prisma.$transaction` (`BR-03`)
- FR-03-05: GET `/api/customer/orders/:id` ส่งคืน order detail เฉพาะ order ของ `CUSTOMER` นั้น (`BR-04`)
- FR-03-06: GET `/api/customer/orders` ส่งคืน list ของ orders ของ `CUSTOMER` ที่ login อยู่

**Stock & Availability Validation (`BR-05`):**
- `quantity <= 0` → reject `400 VALIDATION_ERROR`
- `item.isAvailable == false` → reject `409 CONFLICT` (item not available / closed for sale)
- `item.stockQuantity == 0` หรือ `quantity > item.stockQuantity` → reject `409 CONFLICT` (insufficient stock)

**Acceptance Criteria:**
- AC-03-01: POST สำเร็จส่งคืน `201` + order detail พร้อม `totalAmount` (`Int` satang) ที่คำนวณจาก server
- AC-03-02: `unitPriceAtOrder` (`Int` satang) ใน OrderItems ตรงกับ `BakeryItem.price` ณ เวลา order
- AC-03-03: `stockQuantity` ของ BakeryItem ถูกหักหลัง order สำเร็จ (หากเหลือ `0` ค่า `isAvailable` ยังคงเป็น `true`)
- AC-03-04: Order ที่มี item `isAvailable == false` ถูก reject ด้วย `409`
- AC-03-05: Order ที่มี `quantity > stockQuantity` (หรือ `stockQuantity == 0`) ถูก reject ด้วย `409`
- AC-03-06: `CUSTOMER` ดู order ของ `CUSTOMER` อื่นได้รับ `403`
- AC-03-07: Stock deduction และ Order creation อยู่ใน single transaction (atomic)

**Test IDs:** ORD-01 ถึง ORD-12

---

### F-04: Operator Incoming Order Queue & Acceptance
**Objective:** Operator ดูคิว Order ทั้งหมดที่เข้ามาในร้าน (Shared Global Queue — `BR-06`) และ Accept Order (เปลี่ยน status จาก `PENDING` → `ACCEPTED`)

**Functional Requirements:**
- FR-04-01: GET `/api/operator/orders` ส่งคืน orders ทั้งหมดของร้านให้ `OPERATOR` ทุกคนเห็นร่วมกัน (default filter: `PENDING` first)
- FR-04-02: GET `/api/operator/orders/:id` ส่งคืน detail ของ order ใดก็ได้สำหรับ `OPERATOR`
- FR-04-03: PATCH `/api/operator/orders/:id/status` เปลี่ยน status `PENDING` → `ACCEPTED`
- FR-04-04: Transition ที่ไม่ถูกต้อง (เช่น `ACCEPTED` → `PENDING`) ถูก reject ด้วย `409 CONFLICT`

**Acceptance Criteria:**
- AC-04-01: GET `/api/operator/orders` โดย `CUSTOMER` ส่งคืน `403 FORBIDDEN`
- AC-04-02: `OPERATOR` accept order ที่ `PENDING` สำเร็จ ส่งคืน `200` + updated order
- AC-04-03: `OPERATOR` พยายาม accept order ที่ไม่ใช่ `PENDING` ส่งคืน `409 CONFLICT`
- AC-04-04: Order list แสดง `PENDING` orders ก่อน

**Test IDs:** OPS-01 ถึง OPS-08

---

## 3. Sprint 2 — Feature Summary (Planned)

### F-05: Bakery Catalog Administration
**Objective:** OPERATOR จัดการ Catalog (สร้าง/แก้ไข item, ราคา `Int` satang, เปิด/ปิด `isAvailable`, เติม stock batch)
**Status:** ⬜ Planned — details TBD in Sprint 2 planning

### F-06: Order Fulfillment & Cancellation Lifecycle
**Objective:** Full lifecycle `ACCEPTED → BAKING → READY_FOR_PICKUP → COMPLETED`; Customer cancel `PENDING → CANCELLED` with stock restoration
**Status:** ⬜ Planned — details TBD in Sprint 2 planning

### F-07: Simulated Payment Transitions
**Objective:** `UNPAID → PAID | FAILED` payment status tracking alongside order lifecycle
**Status:** ⬜ Planned — details TBD in Sprint 2 planning

---

## 4. Sprint 3 — Feature Summary (Planned)

### F-08: Bakery Sales & Order Summary Reporting
**Objective:** OPERATOR dashboard แสดง revenue summary, status breakdown, popular items
**Status:** ⬜ Planned — details TBD in Sprint 3 planning

### F-09: Order Search, Filtering & Release Hardening
**Objective:** Search/filter orders by status/date/customer; Lab 7 maintenance rule change; full regression
**Status:** ⬜ Planned — details TBD in Sprint 3 planning

---

## 5. Deliverable Requirement Mapping

| Deliverable | Due | Sections Required | Features |
|---|---|---|---|
| **Deliverable 1** | 8 Nov 2026 | Part A: SRS (`docs/srs.md`), Part B: Features & Traceability (`docs/features.md`, `docs/traceability.md`), Part C: System SDS (`docs/system-sds.md`), Part D: Sprint Plan (`docs/sprints/plan.md`), Part E: Feature SDS (`docs/sprints/sprint-1/*`), Part F: Evidence | F-01, F-02, F-03, F-04 |
| **Deliverable 2** | 29 Nov 2026 | Part A update, Part B update, Sprint 2 SDS, Part F: Evidence | F-05, F-06, F-07 |
| **Lab 5** | 15 Nov 2026 | Docker + CI/CD + GCP Deployment (Persistent Volume for Spec 5.1 durability) | F-01 to F-04 (deployed) |
| **Lab 6** | 22 Nov 2026 | Cross-Team UAT Report | F-01 to F-04 (UAT-ready) |
| **Lab 7** | 29 Nov 2026 | Maintenance Change Request | F-09 (partial) |
| **Final Delivery** | 13 Dec 2026 | All parts complete + Lab 7 change applied | F-01 to F-09 |
