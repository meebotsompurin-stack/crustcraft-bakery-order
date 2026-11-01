# 00 — Project State Audit: CrustCraft Artisan Bakery

> **โปรเจกต์:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System
> **วิชา:** CPE 334 Introduction to Software Engineering in the Age of AI Agents
> **Theme:** 4 — E-Commerce / Ordering System
> **สถานะ:** 🟡 Initializing (Pre-Sprint 1)
> **วันที่สร้าง:** 2026-10-31

---

## 1. Team & Repository

| Field | Value |
|---|---|
| **Member 1** | Purin Mebotsom (Student ID: `67070507214`, GitHub: `@meebotsompurin-stack`, Role: `Co-Developer`) |
| **Member 2** | Saksorn Buranatananun (Student ID: `67070507208`, GitHub: `@poom2548`, Role: `Co-Developer`) |
| **Repo root** | `crustcraft-bakery-order/` |
| **Main branch** | `main` |
| **Sprint 1 integration branch** | `sprint-1-staging` |

---

## 2. Tech Stack (Sprint 1 Locked)

### Backend — `server/`
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.x | HTTP framework |
| `typescript` | ^5.x | Type safety |
| `@prisma/client` | ^5.x | ORM (SQLite local/persistent volume; PostgreSQL-compatible schema) |
| `prisma` | ^5.x (dev) | CLI + migrations |
| `cookie-parser` | ^1.x | Parse `httpOnly` JWT cookies on incoming requests |
| `bcrypt` | ^5.x | Password hashing |
| `jsonwebtoken` | ^9.x | JWT authentication (`24h` expiry) |
| `express-validator` | ^7.x | Request validation |
| `vitest` | ^1.x (dev) | Unit & integration test runner |
| `supertest` | ^7.x (dev) | HTTP testing |

### Frontend — `client/`
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.x | UI library |
| `react-dom` | ^18.x | DOM renderer |
| `vite` | ^5.x | Build tool + dev server |
| `typescript` | ^5.x | Type safety |
| `tailwindcss` | ^3.x | Utility-first CSS |
| `@testing-library/react` | ^14.x (dev) | Component testing |
| `vitest` | ^1.x (dev) | Test runner (client) |

### E2E — `e2e/`
| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | ^1.x | E2E testing across 3 viewports |

> **หมายเหตุ:** Tech Stack นี้จะถูก Lock หลังจาก `ISSUE-03` scaffold เสร็จ ห้ามเพิ่ม dependency โดยไม่ได้ update ไฟล์นี้

---

## 3. Domain Model (Logical — ก่อน `ISSUE-03` สร้าง Prisma Schema)

### Entities & Relationships
```
User (CUSTOMER | OPERATOR)
  └─ 1─┐
       │ places
       ▼
    Order (PENDING → ACCEPTED → BAKING → READY_FOR_PICKUP → COMPLETED, totalAmount [Int: satang])
       │             [Sprint 1: PENDING → ACCEPTED only]
       │ contains
       ▼
    OrderItem (quantity [Int], unitPriceAtOrder [Int: satang])
       │ references
       ▼
    BakeryItem (name, description, price [Int: satang], stockQuantity [Int], isAvailable [Boolean], category)
```

### Monetary & Inventory Semantics
- **Monetary Representation (`Int` Satang):** All monetary fields (`BakeryItem.price`, `OrderItem.unitPriceAtOrder`, `Order.totalAmount`) are stored and transmitted as **integer satang (`Int`, where `100 satang = 1.00 THB`, e.g., `8500` = `85.00 THB`)** to prevent IEEE 754 floating-point rounding defects. The UI formats satang values into THB (`satang / 100` to 2 decimal places).
- **`isAvailable` vs. `stockQuantity` Relationship:**
  - `isAvailable` (`Boolean`): Explicit catalog visibility toggle controlled by `OPERATOR`. `GET /api/catalog` returns all items where `isAvailable == true`. An operator can set `isAvailable = false` (Sprint 2 `F-05`) to suspend an item even when `stockQuantity > 0`.
  - `stockQuantity` (`Int`): Remaining physical stock. When an order reduces `stockQuantity` to `0`, **`isAvailable` does NOT automatically flip to `false`**. Instead, the item remains visible in `GET /api/catalog` (`isAvailable: true`, `stockQuantity: 0`) so customers see an **"Out of Stock" (`สินค้าหมดชั่วคราว`)** badge with a disabled order action, and any `POST /api/customer/orders` request for `stockQuantity == 0` (or `quantity > stockQuantity`) is rejected with `409 CONFLICT`.

### Roles & Permissions (Sprint 1)
| Action | CUSTOMER | OPERATOR | Notes |
|---|:---:|:---:|---|
| Register / Login / Logout | ✔ | ✔ | Public / Authenticated session |
| Browse catalog (`isAvailable == true`) | ✔ | ✔ | Authenticated users |
| Create pre-order | ✔ | ❌ | `CUSTOMER` only |
| View own order list & detail | ✔ | ❌ | Strictly isolated (`order.customerId === req.user.userId`) |
| View all incoming orders | ❌ | ✔ | Shared global queue across all `OPERATOR` accounts |
| Accept order (`PENDING` → `ACCEPTED`) | ❌ | ✔ | Shared global queue across all `OPERATOR` accounts |

---

## 4. Order Status Lifecycle

### Sprint 1 (Implemented in `ISSUE-03` + `ISSUE-05`)
```
[Create]
   │
   ▼
PENDING ──── OPERATOR ────► ACCEPTED
```

### Sprint 2 (Planned)
```
ACCEPTED ──► BAKING ──► READY_FOR_PICKUP ──► COMPLETED
   │
   └── (CUSTOMER, if PENDING) ──► CANCELLED (stock restored)

Payment: UNPAID ──► PAID | FAILED
```

### Sprint 3 (Planned)
- Full regression validation across all transitions.
- Lab 7 Maintenance: apply one rule change from the pending change request.

---

## 5. Sprint 1 Issue Status Tracker

| Issue | Branch | Developer | Status | PR |
|---|---|---|---|---|
| `ISSUE-00` | `chore/issue-00-master-plan` | Team | 🟡 In Progress | PR #2 |
| `ISSUE-01` | `docs/issue-01-product-baseline` | TBD | ⬜ Not Started | — |
| `ISSUE-02` | `docs/issue-02-sprint1-contracts` | TBD | ⬜ Not Started | — |
| `ISSUE-03` | `feat/issue-03-scaffold-db-and-auth` | TBD | ⬜ Not Started | — |
| `ISSUE-04` | `feat/issue-04-customer-catalog-and-orders` | TBD | ⬜ Not Started | — |
| `ISSUE-05` | `feat/issue-05-operator-order-acceptance` | TBD | ⬜ Not Started | — |
| `ISSUE-06` | `test/issue-06-e2e-and-deliverable1-evidence` | TBD | ⬜ Not Started | — |

---

## 6. Tech Debt Log

> ใช้ Section นี้บันทึก Tech Debt ที่พบระหว่าง implementation — ห้ามปล่อยทิ้งโดยไม่บันทึก

| ID | Description | Found In | Planned Fix |
|---|---|---|---|
| — | (No tech debt logged yet — Sprint 1 has not started) | — | — |

---

## 7. Key Architectural Decisions (ADR Summary)

> **หมายเหตุ:** ADRs ทั้งหมดในตารางนี้ต้องถูกบันทึกอย่างเป็นทางการใน `docs/system-sds.md` (Part C) และอ้างอิงใน `docs/srs.md` (Part A) ใน `ISSUE-01`

| Decision | Rationale |
|---|---|
| **SQLite + Persistent Volume for GCP Deployment (Spec 5.1) & Postgres-Compatible Schema** | **Local Dev & Test:** Zero-config SQLite (`file:./dev.db` / `file:./test.db`) via Prisma (`provider = "sqlite"`), allowing both developers to run tests without local container overhead.<br>**Lab 5 GCP Persistence Strategy (Spec 5.1):**<br>1. **Primary (SQLite on Persistent Volume — Zero Migration Drift):** Deploy container on GCP Compute Engine (Docker Compose with host Persistent Disk volume mounted at `/app/data/crustcraft.db`) or Cloud Run Gen2 with mounted persistent volume (`DATABASE_URL="file:/app/data/crustcraft.db"`). Storing the `.db` file on an external mounted volume ensures data survives container restarts and redeployments while keeping the exact same Prisma `sqlite` provider and migration history.<br>2. **Alternative (Docker Compose PostgreSQL / Cloud SQL):** Because all schema fields use portable types (`Int` satang for money, `String`, `Boolean`, `DateTime`), if switching `provider = "postgresql"` in Lab 5 (`docker-compose.yml` with `postgres:16-alpine` + persistent `pgdata` volume), migrations can be cleanly regenerated from `schema.prisma` in a single deployment step. |
| **JWT Authentication Channel, Expiry (`24h`) & Logout Revocation** | **Frontend Channel:** React client (`client/src/services/api.ts`) exclusively uses **`httpOnly` cookie (`token`)** sent automatically via `fetch(..., { credentials: 'include' })` to mitigate XSS.<br>**Backend Verification:** `authenticate` middleware checks `req.cookies.token` first and falls back to `Authorization: Bearer <token>` header (to support API integration tests via Supertest). Requests lacking a valid, non-expired token in both channels receive `401 UNAUTHORIZED`.<br>**Expiration & Logout:** Tokens are signed with `expiresIn: '24h'` (cookie `maxAge: 86400000`). Calling `POST /api/auth/logout` clears the browser cookie via `res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' })` (`Max-Age=0`) and resets client `AuthContext` state (stateless JWT — no DB token denylist in Sprint 1). |
| **Monetary Values as Integer Satang (`Int`)** | All prices and totals (`price`, `unitPriceAtOrder`, `totalAmount`) are stored in DB and exchanged in API contracts as **integer satang (`Int`, `100 satang = 1.00 THB`)** rather than floating-point numbers, eliminating IEEE 754 precision errors across calculations and database providers. |
| **Separation of `isAvailable` and `stockQuantity`** | `isAvailable` represents manual catalog listing status (`OPERATOR` toggle), while `stockQuantity` tracks physical inventory. Depleting `stockQuantity` to `0` does NOT auto-set `isAvailable = false`; out-of-stock items remain visible in the catalog with an "Out of Stock" badge and are blocked from ordering (`409 CONFLICT`). |
| **Shared Global Operator Queue (Single-Store Model)** | All users with role `OPERATOR` have visibility and status-transition permissions across all orders (`GET /api/operator/orders`), reflecting a single-storefront bakery kitchen workflow. `CUSTOMER` access remains strictly isolated to `order.customerId === req.user.userId`. Recorded in `docs/srs.md` and `docs/system-sds.md`. |
| **Prisma Singleton via `lib/db.ts`** | Prevents connection pool exhaustion in test environments where multiple test files initialize the ORM. |
| **Authoritative Server-Side Total Calculation** | Hard business rule (`BR-01`, `BR-02`) — prevents client-side price tampering; `unitPriceAtOrder` snapshot in satang ensures historical accuracy even if item price changes later. |
| **Stock Deduction in `prisma.$transaction`** | Atomically (`BR-03`) prevents overselling under concurrent order creation. |
| **Tailwind CSS (No Component Library)** | Lighter bundle, full customization control, and avoids dependency conflicts with Vite; consistent with Sprint 2+ theming requirements. |
