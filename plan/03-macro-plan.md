# 03 — Macro Plan: CrustCraft Artisan Bakery (3-Sprint Master Plan)

> **อ้างอิง:** `plan/00-project-state.md`, `plan/01-conventions.md`, `plan/02-feature-coverage.md`
> `Docs/group_work_specs_v1.pdf`, `Docs/project_deliverable_1_v1.pdf`, `Docs/project_deliverable_2_v1.pdf`, `Docs/project_final_delivery_v1.pdf`
> **วันที่สร้าง:** 2026-10-31

> **หลักการจัดโครงสร้าง:** GitHub Issues ทั้งหมดเป็นของ Sprint ที่ระบุเท่านั้น ไม่มีการสร้าง Issue แยกสำหรับ Tech Debt — ให้ฝัง Tech Debt เป็น prerequisite sub-task ภายใน Issue ที่เกี่ยวข้อง

---

## 1. Master Timeline

| Sprint | Deliverable | Due Date | Points | Key Milestones |
|:---:|---|---|:---:|---|
| **Sprint 1** | Deliverable 1 | **8 Nov 2026** | 80 pts | SRS + SDS + Sprint 1 Features (F-01 to F-04) + Evidence |
| — | Lab 5: Docker/CI/GCP | **15 Nov 2026** | — | Dockerize + CI pipeline + GCP deploy |
| — | Lab 6: Cross-Team UAT | **22 Nov 2026** | — | UAT with another team (Sprint 1 features) |
| **Sprint 2** | Deliverable 2 | **29 Nov 2026** | 70 pts | Sprint 2 Features (F-05 to F-07) + Updated docs |
| — | Lab 7: Maintenance Change | **29 Nov 2026** | — | Apply 1 rule change from pending change request |
| **Sprint 3** | Final Delivery | **13 Dec 2026** | 100 pts | F-08, F-09, Full Regression, Final UAT verification |

---

## 2. Sprint 1 — Phased Milestones

### 2.1 Sprint 1 Objective
สร้างระบบ Pre-Order พื้นฐาน: Authentication & RBAC, Bakery Catalog, Customer Pre-Order (server-side pricing + stock deduction), Operator Order Queue & Acceptance — พร้อม Engineering Contract ครบถ้วนก่อน implementation

### 2.2 Sprint 1 Phased Milestones

| Phase | Milestone | เป้าหมาย | Deliverable Ref | Output |
|:---:|---|---|---|---|
| **W1** | Wave 1: SDD Product Baseline | สร้าง SRS + Traceability + System SDS + Sprint Plan | Deliverable 1 Parts A-D | `docs/srs.md`, `docs/features.md`, `docs/traceability.md`, `docs/system-sds.md`, `docs/sprints/plan.md` |
| **W1** | Wave 1: Sprint 1 Engineering Contracts | สร้าง Feature SDS + API/UI/Data specs + AC + STS + DoD | Deliverable 1 Part E | `docs/sprints/sprint-1/specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md` |
| **W2** | Wave 2: Scaffold + DB + Auth | Project scaffold, Prisma schema, seed data, F-01 Auth & RBAC | Deliverable 1 Part F | `server/`, `client/`, `prisma/schema.prisma`, seed, auth middleware |
| **W3** | Wave 3: Catalog & Orders (Parallel) | F-02 Catalog API/UI + F-03 Customer Pre-Order API/UI | Deliverable 1 Part F | Customer-facing features, TDD tests |
| **W3** | Wave 3: Operator Queue (Parallel) | F-04 Operator Order Queue & Acceptance API/UI | Deliverable 1 Part F | Operator-facing features, TDD tests |
| **W4** | Wave 4: E2E + Evidence | Playwright E2E across 3 viewports + README + Release PR | Deliverable 1 Part F | `e2e/sprint-1/`, responsive screenshots, Part F evidence |

---

## 3. Sprint 1 Issues Breakdown

---

### Issue #1 — Product Baseline Documentation (Spec DD Part A-D)
> **Wave:** 1 | **Priority:** 🔴 CRITICAL | **Effort:** L | **Deliverable:** Parts A, B, C, D

**Branch:** `docs/issue-01-product-baseline`

**Description:**
สร้าง Engineering Baseline ทั้ง 4 ส่วน **ก่อน** feature implementation — Deliverable 1 กำหนดให้มีหลักฐาน Git timestamp ว่า spec existed before implementation

**Tasks:**
- [ ] `docs/srs.md` — Part A: System Requirements Specification (Problem Context, Stakeholders, Functional Requirements, Non-Functional Requirements, Constraints)
- [ ] `docs/features.md` — Part B: Feature Breakdown (F-01 to F-09, User Story format, Priority)
- [ ] `docs/traceability.md` — Part B: Requirements Traceability Matrix (Requirement → Feature → Test ID)
- [ ] `docs/system-sds.md` — Part C: System-Level Software Design Specification (Architecture diagram, Component interactions, Data flow, Tech stack justification, Deployment model)
- [ ] `docs/sprints/plan.md` — Part D: 3-Sprint Master Plan (Sprint boundaries, features per sprint, milestone dates)

**Acceptance Criteria:**
- AC-01-01: `docs/srs.md` ครบ: Problem Statement, ≥5 Functional Requirements (numbered FR-XX), ≥3 Non-Functional Requirements, Constraints
- AC-01-02: `docs/features.md` ครอบคลุม F-01 ถึง F-09 พร้อม User Story format และ Priority
- AC-01-03: `docs/traceability.md` มี matrix ที่ link ทุก Requirement → Feature → Test ID (ไม่มีช่องว่าง)
- AC-01-04: `docs/system-sds.md` มี Architecture diagram (text/Mermaid), Component breakdown, Data flow, Tech stack rationale, Deployment model (Docker/GCP overview)
- AC-01-05: `docs/sprints/plan.md` มี 3-Sprint roadmap พร้อม due dates และ feature assignments
- AC-01-06: Git timestamp ของ PR นี้ต้อง **ก่อน** feature PRs ทั้งหมด (ISSUE-03 ถึง ISSUE-06)

---

### Issue #2 — Sprint 1 Engineering Contracts (Spec DD Part E)
> **Wave:** 1 | **Priority:** 🔴 CRITICAL | **Effort:** L | **Deliverable:** Part E

**Branch:** `docs/issue-02-sprint1-contracts`

**Description:**
สร้าง Feature-Level Engineering Contract ครบ 4 ไฟล์สำหรับ Sprint 1 **ก่อน** implementation — Part E กำหนดให้มี `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`

**Tasks:**
- [ ] `docs/sprints/sprint-1/specification.md` — Sprint 1 Goal, FR (F-01 to F-04), BR (BR-01 to BR-04+), RBAC Matrix, Data Model (Prisma entities), AC (AC-XX numbered), Product DoD
- [ ] `docs/sprints/sprint-1/api-spec.md` — All endpoints: Auth (Register/Login/Logout), Catalog (GET list/detail), Customer Orders (POST/GET list/GET detail), Operator Orders (GET queue/GET detail/PATCH status)
- [ ] `docs/sprints/sprint-1/ui-spec.md` — Page inventory, component specs, loading/empty/error states, responsive behavior (375/768/1280px)
- [ ] `docs/sprints/sprint-1/tests.md` — Test Execution Matrix (Test ID → AC traceability) สำหรับ AUTH-XX, CAT-XX, ORD-XX, OPS-XX, E2E-XX

**Acceptance Criteria:**
- AC-02-01: `specification.md` ครอบคลุม FR ครบทุก feature (F-01 to F-04) + BR-01 to BR-04 + RBAC Matrix + AC ที่ numbered ครบ
- AC-02-02: `api-spec.md` ระบุทุก endpoint พร้อม method, path, auth requirement, request/response shape, error codes
- AC-02-03: `ui-spec.md` ครอบคลุมทุก page/view ที่ต้องสร้างใน Sprint 1 + responsive specs ครบ 3 viewports
- AC-02-04: `tests.md` มี Test Execution Matrix ที่ map Test ID → AC-XX ทุก pair (ไม่มี orphan)
- AC-02-05: Git timestamp ของ PR นี้ต้อง **ก่อน** feature PRs (ISSUE-03 ถึง ISSUE-06)

---

### Issue #3 — Project Scaffold, Database & Authentication (F-01)
> **Wave:** 2 | **Priority:** 🔴 CRITICAL | **Effort:** XL | **Deliverable:** Part F

**Branch:** `feat/issue-03-scaffold-db-and-auth`
**Depends on:** #1 AND #2 (must merge to `sprint-1-staging` first)

**Description:**
สร้าง Project scaffold ทั้ง backend + frontend, Prisma schema, seed data, และ implement F-01 Authentication & RBAC middleware ครบถ้วน

**Tasks:**

**Scaffold:**
- [ ] `server/` — Express + TypeScript project structure: `src/routes/`, `src/controllers/`, `src/services/`, `src/middleware/`, `src/lib/db.ts` (Prisma singleton), `src/__tests__/`
- [ ] `client/` — React + Vite + TypeScript + Tailwind project structure: `src/components/`, `src/pages/`, `src/services/api.ts`, `src/context/AuthContext.tsx`
- [ ] `e2e/` — Playwright config + `sprint-1/` directory
- [ ] Root `package.json` — scripts: `dev`, `test`, `build`

**Database:**
- [ ] `prisma/schema.prisma` — Models: `User` (id, name, email, passwordHash, role: CUSTOMER|OPERATOR, createdAt), `BakeryItem` (id, name, description, price, stockQuantity, isAvailable, category, createdAt, updatedAt), `Order` (id, customerId FK→User, status: PENDING|ACCEPTED|..., totalAmount, pickupNote, createdAt, updatedAt), `OrderItem` (id, orderId FK→Order, bakeryItemId FK→BakeryItem, quantity, unitPriceAtOrder)
- [ ] `prisma/seed.ts` — Idempotent seed: 1 OPERATOR user, 2 CUSTOMER users, 5 BakeryItems (seeded items from F-02 spec)
- [ ] `npx prisma migrate dev` — initial migration named `init`

**Authentication (F-01):**
- [ ] `server/src/routes/auth.routes.ts` — POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout`
- [ ] `server/src/controllers/auth.controller.ts` — validate, hash password, issue JWT
- [ ] `server/src/middleware/authenticate.middleware.ts` — verify JWT, attach `req.user`
- [ ] `server/src/middleware/requireRole.middleware.ts` — role-based guard factory
- [ ] Unit tests: `server/src/__tests__/unit/auth.test.ts` (password hashing, JWT encode/decode)
- [ ] API integration tests: `server/src/__tests__/sprint-1/auth.api.test.ts` (AUTH-01 to AUTH-10)

**Acceptance Criteria:**
- AC-03-01: `npm run dev` starts both server and client without errors
- AC-03-02: `npx prisma migrate dev` runs cleanly, seed completes without error
- AC-03-03: All AC from F-01 (AC-01-01 to AC-01-05) pass via automated tests (AUTH-01 to AUTH-10)
- AC-03-04: Prisma singleton in `lib/db.ts` — no `new PrismaClient()` elsewhere
- AC-03-05: `authenticate` middleware attaches `req.user` with `{ userId, role }`
- AC-03-06: `requireRole(['OPERATOR'])` middleware returns `403` for CUSTOMER attempting operator routes

---

### Issue #4 — Customer Catalog & Pre-Order Features (F-02, F-03)
> **Wave:** 3 | **Priority:** 🔴 CRITICAL | **Effort:** XL | **Deliverable:** Part F

**Branch:** `feat/issue-04-customer-catalog-and-orders`
**Depends on:** #3 (must merge to `sprint-1-staging` first)
**Parallel-safe with:** ISSUE-05 (zero file conflict — different route files, controller files, and React pages)

**Description:**
Implement F-02 (Bakery Catalog API + UI) and F-03 (Customer Pre-Order Creation with server-side pricing + stock deduction + own order view)

**Tasks:**

**F-02 — Catalog:**
- [ ] `server/src/routes/catalog.routes.ts` — GET `/api/catalog`, GET `/api/catalog/:id`
- [ ] `server/src/controllers/catalog.controller.ts`
- [ ] `server/src/services/catalog.service.ts`
- [ ] `client/src/pages/CatalogPage.tsx` — grid of BakeryItem cards (name, description, price in THB, stock badge, availability)
- [ ] `client/src/components/BakeryItemCard.tsx`
- [ ] API tests: `server/src/__tests__/sprint-1/catalog.api.test.ts` (CAT-01 to CAT-05)

**F-03 — Customer Pre-Order:**
- [ ] `server/src/routes/customer.routes.ts` — POST `/api/customer/orders`, GET `/api/customer/orders`, GET `/api/customer/orders/:id`
- [ ] `server/src/controllers/orders.controller.ts` (customer namespace)
- [ ] `server/src/services/orders.service.ts` — server-side total calculation, `unitPriceAtOrder` snapshot, stock validation + deduction in `prisma.$transaction`
- [ ] `client/src/pages/OrderPage.tsx` — order form (select items from catalog, specify quantity, pickup note)
- [ ] `client/src/pages/MyOrdersPage.tsx` — list of own orders
- [ ] `client/src/pages/OrderDetailPage.tsx` — order detail view
- [ ] Unit tests: `server/src/__tests__/unit/orderCalculation.test.ts` (pricing logic, stock validation)
- [ ] API tests: `server/src/__tests__/sprint-1/orders.api.test.ts` (ORD-01 to ORD-12)

**Acceptance Criteria:**
- AC-04-01: All AC from F-02 (AC-02-01 to AC-02-03) pass
- AC-04-02: All AC from F-03 (AC-03-01 to AC-03-07) pass
- AC-04-03: `totalAmount` is ALWAYS calculated from `BakeryItem.price` in DB (never from client body)
- AC-04-04: `unitPriceAtOrder` equals `BakeryItem.price` at the moment of order creation
- AC-04-05: Stock deduction + Order creation is atomic (fails completely if stock insufficient)

---

### Issue #5 — Operator Order Queue & Acceptance (F-04)
> **Wave:** 3 | **Priority:** 🔴 CRITICAL | **Effort:** L | **Deliverable:** Part F

**Branch:** `feat/issue-05-operator-order-acceptance`
**Depends on:** #3 (must merge to `sprint-1-staging` first)
**Parallel-safe with:** ISSUE-04 (zero file conflict — uses separate route/controller/page files)

**Description:**
Implement F-04: Operator views incoming order queue and accepts orders (PENDING → ACCEPTED transition)

**Tasks:**
- [ ] `server/src/routes/operator.routes.ts` — GET `/api/operator/orders`, GET `/api/operator/orders/:id`, PATCH `/api/operator/orders/:id/status`
- [ ] `server/src/controllers/operator.controller.ts`
- [ ] `server/src/services/operator.service.ts` — status transition validation (allowed: PENDING→ACCEPTED only in Sprint 1)
- [ ] `client/src/pages/OperatorOrderQueuePage.tsx` — list of incoming orders, accept button per order
- [ ] `client/src/pages/OperatorOrderDetailPage.tsx` — full order detail for operator
- [ ] API tests: `server/src/__tests__/sprint-1/operator.api.test.ts` (OPS-01 to OPS-08)

**Acceptance Criteria:**
- AC-05-01: All AC from F-04 (AC-04-01 to AC-04-04) pass
- AC-05-02: CUSTOMER calling `/api/operator/*` receives `403 FORBIDDEN`
- AC-05-03: Invalid status transition (e.g., ACCEPTED → PENDING) returns `409 CONFLICT`
- AC-05-04: Accepted order's status in DB changes to `ACCEPTED`

---

### Issue #6 — E2E Tests, Responsive Evidence & Deliverable 1 Release
> **Wave:** 4 | **Priority:** 🔴 CRITICAL | **Effort:** L | **Deliverable:** Part F + Release PR

**Branch:** `test/issue-06-e2e-and-deliverable1-evidence`
**Depends on:** #4 AND #5 (both must merge to `sprint-1-staging` first)

**Description:**
Playwright E2E tests ครอบคลุม 3 viewports, responsive screenshots, README setup guide, และ Release PR (`sprint-1-staging` → `main`)

**Tasks:**
- [ ] `e2e/sprint-1/customer-order-flow.spec.ts` — E2E-01 ถึง E2E-05: Customer register → login → browse catalog → place order → view order detail (Desktop + Tablet + Mobile)
- [ ] `e2e/sprint-1/operator-acceptance-flow.spec.ts` — E2E-06 ถึง E2E-08: Operator login → view queue → accept order → verify status update (Desktop + Tablet + Mobile)
- [ ] `e2e/sprint-1/auth-guard.spec.ts` — E2E-09: Unauthorized access → redirect to login
- [ ] Responsive screenshots captured: Login, Catalog, Order Form, My Orders, Operator Queue — at 1280px, 768px, 375px
- [ ] `README.md` — complete setup guide: prerequisites, `npm install`, `npx prisma migrate dev && npm run seed`, `npm run dev`, `npm test`
- [ ] Part F Evidence checklist: verify all AC pass, screenshots present, Git timestamps correct
- [ ] Release PR: `sprint-1-staging` → `main`

**Acceptance Criteria:**
- AC-06-01: All E2E tests pass on Desktop (1280px), Tablet (768px), Mobile (375px)
- AC-06-02: Responsive screenshots demonstrate layout correctness on all 3 viewports for all 5 key pages
- AC-06-03: `README.md` contains complete working setup instructions (team member tested)
- AC-06-04: `sprint-1-staging` branch contains all Sprint 1 work with correct Git timestamp order (ISSUE-01 → ISSUE-02 → ISSUE-03 → ISSUE-04/05 → ISSUE-06)
- AC-06-05: All previously passing tests remain passing (no regression)
- AC-06-06: Release PR from `sprint-1-staging` → `main` is created with full evidence

---

## 4. Sprint 2 Plan (High-Level — To be detailed before Sprint 2 start)

### Sprint 2 Objective
เพิ่มระบบ Catalog Administration ให้ OPERATOR, implement Order Fulfillment Lifecycle แบบเต็ม, และ Payment Status Simulation

| Feature | Description | Est |
|---|---|---|
| **F-05** | Bakery Catalog Admin (OPERATOR CRUD + batch stock) | XL |
| **F-06** | Full Fulfillment: `ACCEPTED → BAKING → READY_FOR_PICKUP → COMPLETED` + Customer Cancel + Stock Restore | XL |
| **F-07** | Simulated Payment: `UNPAID → PAID / FAILED` | M |

> Sprint 2 Issues will be designed in a new `plan/sprint-2-issues/ISSUE-07.md` to `ISSUE-XX.md` series, following the same Wave pattern.

---

## 5. Sprint 3 Plan (High-Level — To be detailed before Sprint 3 start)

### Sprint 3 Objective
Reporting Dashboard สำหรับ OPERATOR, Order Search & Filter, Lab 7 Maintenance Rule Change, และ Full Regression + Final UAT

| Feature | Description | Est |
|---|---|---|
| **F-08** | OPERATOR Sales & Summary Dashboard (revenue, status counts, popular items) | L |
| **F-09** | Order Search/Filter + Lab 7 rule change + Regression + Final Delivery docs | XL |
