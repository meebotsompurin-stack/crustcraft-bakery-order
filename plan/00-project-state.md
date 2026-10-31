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
| `@prisma/client` | ^5.x | ORM |
| `prisma` | ^5.x (dev) | CLI + migrations |
| `better-sqlite3` | ^9.x | SQLite driver (local dev + tests) |
| `bcrypt` | ^5.x | Password hashing |
| `jsonwebtoken` | ^9.x | JWT authentication |
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

> **หมายเหตุ:** Tech Stack นี้จะถูก Lock หลังจาก ISSUE-03 scaffold เสร็จ ห้ามเพิ่ม dependency โดยไม่ได้ update ไฟล์นี้

---

## 3. Domain Model (Logical — ก่อน ISSUE-03 สร้าง Prisma Schema)

### Entities & Relationships
```
User (CUSTOMER | OPERATOR)
  └─ 1─┐
       │ places
       ▼
    Order (PENDING → ACCEPTED → BAKING → READY_FOR_PICKUP → COMPLETED)
       │             [Sprint 1: PENDING → ACCEPTED only]
       │ contains
       ▼
    OrderItem (quantity, unitPriceAtOrder)
       │ references
       ▼
    BakeryItem (name, description, price, stockQuantity, isAvailable, category)
```

### Roles & Permissions (Sprint 1)
| Action | CUSTOMER | OPERATOR |
|---|:---:|:---:|
| Register / Login | ✔ | ✔ |
| Browse catalog (public items) | ✔ | ✔ |
| Create pre-order | ✔ | ❌ |
| View own order detail | ✔ | ❌ |
| View all incoming orders | ❌ | ✔ |
| Accept order (PENDING → ACCEPTED) | ❌ | ✔ |

---

## 4. Order Status Lifecycle

### Sprint 1 (Implemented in ISSUE-03 + ISSUE-05)
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

| Issue | Branch | Developer | Status | PR # |
|---|---|---|---|---|
| ISSUE-00 | `chore/issue-00-master-plan` | Team | 🟡 In Progress | — |
| ISSUE-01 | `docs/issue-01-product-baseline` | TBD | ⬜ Not Started | — |
| ISSUE-02 | `docs/issue-02-sprint1-contracts` | TBD | ⬜ Not Started | — |
| ISSUE-03 | `feat/issue-03-scaffold-db-and-auth` | TBD | ⬜ Not Started | — |
| ISSUE-04 | `feat/issue-04-customer-catalog-and-orders` | TBD | ⬜ Not Started | — |
| ISSUE-05 | `feat/issue-05-operator-order-acceptance` | TBD | ⬜ Not Started | — |
| ISSUE-06 | `test/issue-06-e2e-and-deliverable1-evidence` | TBD | ⬜ Not Started | — |

---

## 6. Tech Debt Log

> ใช้ Section นี้บันทึก Tech Debt ที่พบระหว่าง implementation — ห้ามปล่อยทิ้งโดยไม่บันทึก

| ID | Description | Found In | Planned Fix |
|---|---|---|---|
| — | (No tech debt logged yet — Sprint 1 has not started) | — | — |

---

## 7. Key Architectural Decisions (ADR Summary)

| Decision | Rationale |
|---|---|
| SQLite for Sprint 1 local dev | Zero-config, single-file DB — eliminates Docker dependency during initial development; Prisma supports seamless migration to PostgreSQL for Lab 5 |
| JWT over HTTP-only sessions | Stateless auth suits multi-developer local dev (no shared session store needed); tokens stored in `httpOnly` cookie for XSS mitigation |
| Prisma singleton via `lib/db.ts` | Prevents connection pool exhaustion in test environments where multiple test files initialize the ORM |
| Server-side total calculation | Hard business rule — prevents client-side price manipulation; `unitPriceAtOrder` snapshot ensures historical accuracy even if item price changes later |
| Stock deduction in `prisma.$transaction` | Atomically prevents overselling under concurrent order creation |
| Tailwind CSS (no component library) | Lighter bundle, full customization control, and avoids dependency conflicts with Vite; consistent with Sprint 2+ theming requirements |
