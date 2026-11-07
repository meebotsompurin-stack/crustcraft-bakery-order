# 01 — Conventions & Patterns: CrustCraft Artisan Bakery

> **Goal:** Define the team's working standards so all Engineering Contract documents and source code look consistent across all Sprints.

---

## A) Engineering Contract Document Patterns

### 0. Document Location & Responsibility Mapping (Deliverable 1 Parts A–E)

| File Path | Deliverable Section | Created In | Core Contents & Responsibilities |
|---|---|---|---|
| `docs/srs.md` | **Part A:** System Requirements Specification (SRS) | `ISSUE-01` | Problem Statement, Stakeholders, System-wide Functional Requirements (`FR-XX`), System-wide Business Rules (`BR-01` to `BR-06`), **System-Level Role & Permission Matrix (RBAC)**, Non-Functional Requirements (`NFR-XX`), and Constraints |
| `docs/features.md` | **Part B:** Feature Breakdown | `ISSUE-01` | Master Feature list (`F-01` to `F-09`) with User Stories, Priorities, and Sprint assignments |
| `docs/traceability.md` | **Part B:** Requirement Traceability Matrix | `ISSUE-01` | End-to-end mapping: `FR-XX` / `BR-XX` → `F-XX` → `AC-XX` → `Test ID` |
| `docs/system-sds.md` | **Part C:** System-Level Software Design Specification (System SDS) | `ISSUE-01` | System Architecture Diagram, Component Breakdown (`client/`, `server/`, `prisma/`, `e2e/`), Request/Data Flow, GCP Persistent Volume & Docker Deployment Model (Spec 5.1), and **System-Level Architecture Decision Records (ADRs)** (including Shared Operator Queue, Stateless JWT Cookie + Expiry/Logout, Integer Satang Pricing, and `isAvailable` vs. `stockQuantity` semantics) |
| `docs/sprints/plan.md` | **Part D:** 3-Sprint Master Plan | `ISSUE-01` | 3-Sprint roadmap, milestone dates, feature dependencies, and delivery schedule |
| `docs/sprints/sprint-[N]/specification.md` | **Part E:** Sprint Feature SDS | `ISSUE-02` | Sprint Goal, Scope, Sprint Feature FRs (`F-01` to `F-04`), Sprint Business Rules (`BR-01` to `BR-06`), **Endpoint-Level RBAC Authorization Matrix**, Prisma Data Model (`Int` satang pricing), Sprint `AC-XX`, and Product DoD |
| `docs/sprints/sprint-[N]/api-spec.md` | **Part E:** API Contract | `ISSUE-02` | Auth contract (`httpOnly` cookie primary + Bearer header fallback, `24h` expiry, logout cookie clearing), error envelope, and detailed endpoint schemas |
| `docs/sprints/sprint-[N]/ui-spec.md` | **Part E:** UI/UX Specification | `ISSUE-02` | Page inventory, component specs, loading/empty/error/out-of-stock states, and 3-viewport responsive rules |
| `docs/sprints/sprint-[N]/tests.md` | **Part E:** Test Plan & Execution Matrix | `ISSUE-02` | Unit, API Integration, and Playwright E2E test matrices mapped to `AC-XX` |

---

### 1. `specification.md` Template
> Located at: `docs/sprints/sprint-[N]/specification.md`

```markdown
# Sprint [N] Feature Engineering Specification

> **Sprint [N] Status:** [Brief status — e.g., In Progress / Complete]

## 1. Sprint Goal
[One short paragraph stating the delivered value to the user]

## 2. Stakeholder Request Interpretation
[Concise interpretation of what the requirements mean for CrustCraft]

## 3. Scope
* **Included:**
    * [Item]
* **Excluded:**
    * [Item]

## 4. Functional Requirements (FR)
### 4.1 [Category — e.g., Authentication]
* **FR-[XX] ([Name]):** [Description]

## 5. Business Rules (BR)
* **BR-01 (Authoritative Server-Side Pricing in Satang):** Order `totalAmount` MUST be calculated exclusively on the server using authoritative `BakeryItem.price` from the database in **integer satang (`Int`, `100 satang = 1.00 THB`)**. Client-supplied prices are ignored.
* **BR-02 (Price Snapshot):** Each `OrderItem` MUST capture `unitPriceAtOrder` (`Int` in satang) at the moment of order creation.
* **BR-03 (Stock Atomicity):** Valid orders MUST atomically deduct `stockQuantity` within a single database transaction (`prisma.$transaction`).
* **BR-04 (Customer Ownership Isolation):** A `CUSTOMER` MUST only access their own orders (`order.customerId === req.user.userId`). Cross-customer access returns `403 FORBIDDEN`.
* **BR-05 (Availability vs. Stock Separation):** `isAvailable` (`Boolean`) is a manual catalog visibility flag controlled by `OPERATOR` (`GET /api/catalog` returns items with `isAvailable == true`). When `stockQuantity` reaches `0`, `isAvailable` does NOT automatically become `false`; the item remains visible in the catalog as "Out of Stock" (`stockQuantity: 0`), and any order request with `stockQuantity == 0` or `quantity > stockQuantity` is rejected with `409 CONFLICT`. Ordering an item with `isAvailable == false` is also rejected with `409 CONFLICT`.
* **BR-06 (Shared Operator Queue):** All `OPERATOR` accounts have shared visibility and transition authority over all incoming orders in the system (single-bakery operational model, documented as an ADR in `docs/srs.md` and `docs/system-sds.md`).

## 6. Authorization Matrix (RBAC)
| Resource / Action | CUSTOMER | OPERATOR | Notes |
| :--- | :---: | :---: | :--- |
| [Action] | ✔ | ❌ | [Conditions] |

## 7. Data Model Changes
[Prisma schema additions/modifications, field descriptions (`Int` satang for monetary fields), migration strategy]

## 8. API Contract Summary
[High-level list of new/modified endpoints — full detail in api-spec.md]

## 9. Acceptance Criteria (AC)
### 9.1 [Category]
* **AC-[XX]:** [Given / When / Then or Condition → Expected Result]

## 10. Assumptions & Architectural Decisions
1. [Decision]: [Reasoning]

## 11. Product Definition of Done (DoD)
* [ ] All AC-XX items verified and passing.
* [ ] All Test IDs in tests.md have a status of PASS.
* [ ] Spec DD documents (`ISSUE-01`, `ISSUE-02`) have Git timestamps BEFORE feature PRs (`ISSUE-03`+).
* [ ] PR reviewed and approved by cross-pair partner.
* [ ] No regression in previously passing tests.
```

---

### 2. `api-spec.md` Template
> Located at: `docs/sprints/sprint-[N]/api-spec.md`

```markdown
# Sprint [N] API Contract & Specification

> **Sprint [N] Status:** [Update]

## 1. Global Authentication & Security
- **Frontend Auth Channel:** Browser client (`client/src/services/api.ts`) uses an **`httpOnly` cookie (`token`)** sent automatically via `fetch(..., { credentials: 'include' })` (`SameSite=Lax; Path=/; Max-Age=86400`).
- **Backend Credential Resolution:** The `authenticate` middleware extracts the JWT from `req.cookies.token` first, and falls back to `Authorization: Bearer <token>` header (supported for Supertest / API test clients). If neither channel provides a valid, non-expired JWT, the server responds with `401 UNAUTHORIZED`.
- **Token Expiration & Logout Revocation:** JWT tokens expire in **24 hours (`expiresIn: '24h'`)**. `POST /api/auth/logout` revokes the client session by clearing the `httpOnly` cookie via `res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' })` (`Max-Age=0`) and resetting client auth state.
- **Monetary Fields:** All monetary fields (`price`, `unitPriceAtOrder`, `totalAmount`) are represented as **integer satang (`Int`, `100 satang = 1.00 THB`, e.g., `8500` = `85.00 THB`)**.
- **Error Envelope:** `{ "error": { "code": string, "message": string, "details"?: any[] } }`

## 2. Standard Error Codes
| Status | code string | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Missing, invalid, or expired authentication credentials |
| 403 | `FORBIDDEN` | Authenticated but insufficient role/ownership |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Stock exhausted, item unavailable, duplicate email, or invalid state transition |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

## 3. [Namespace] Endpoints (`/api/[path]`)
### 3.1 [METHOD] `/api/[path]`
[Description]
* **Auth Required:** Yes/No ([Role])
* **Request Body:**
    ```json
    {}
    ```
* **Success Response (200/201):**
    ```json
    {}
    ```
* **Error Responses:**
    * `4XX [code]`: [Reason]
```

---

### 3. `ui-spec.md` Template
> Located at: `docs/sprints/sprint-[N]/ui-spec.md`

```markdown
# Sprint [N] UI/UX Specification

## 1. Design Principles
- Mobile-first responsive design (375px → 768px → 1280px)
- Tailwind CSS utility classes only — no external CSS files
- Loading states, empty states, error states, and out-of-stock states (`isAvailable: true` with `stockQuantity: 0`) MUST be designed for every data-fetching component
- Monetary values received in integer satang (`Int`) MUST be formatted for display in THB (`(satang / 100).toFixed(2)`)

## 2. Page / View Inventory
| Page | Route / View State | Role | Description |
|---|---|---|---|
| [Page Name] | `/path` | CUSTOMER | [What it shows] |

## 3. Component Specifications
### 3.1 [ComponentName]
- **Purpose:** [What it does]
- **Props / State:** [Key data]
- **Loading State:** [Behavior]
- **Empty State:** [Behavior]
- **Error State:** [Behavior]
- **Responsive:** [Mobile / Tablet / Desktop differences]
```

---

### 4. `tests.md` Template
> Located at: `docs/sprints/sprint-[N]/tests.md`

```markdown
# Sprint [N] Test Plan & Results

## 1. Test Strategy
Unit (Vitest) → API/DB Integration (Vitest + Supertest) → E2E (Playwright, 3 viewports)

## 2. Test Execution Matrix
| Test ID | Type | AC-XX | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|---|
| AUTH-01 | Unit | AC-01 | Password hashing with bcrypt | Hash != plaintext, bcrypt.compare returns true | `__tests__/unit/auth.test.ts` | ⬜ |

## 3. Playwright E2E Scenarios
| Test ID | Scenario | Viewports | Steps | Expected |
|---|---|---|---|---|
| E2E-01 | Customer complete order flow | Desktop, Tablet, Mobile | 1. Login → 2. Browse → 3. Add items → 4. Submit | Order created, stock deducted |
```

---

## B) API Route Namespace Convention

| Namespace | Role Guard | Purpose |
|---|---|---|
| `/api/auth/*` | Public (`register`, `login`, `logout`) | Authentication & session lifecycle |
| `/api/catalog/*` | Any authenticated (`CUSTOMER` \| `OPERATOR`) | Browse bakery items (`isAvailable == true`) |
| `/api/customer/*` | `CUSTOMER` only (`requireRole(['CUSTOMER'])`) | Place and view own orders |
| `/api/operator/*` | `OPERATOR` only (`requireRole(['OPERATOR'])`) | Manage shared order queue, status transitions |

---

## C) Standard Error Response Shape

All errors returned by the API MUST use this exact JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      { "field": "quantity", "issue": "Must be greater than 0" }
    ]
  }
}
```

> `details` is optional — include when there are field-level validation errors.

---

## D) Order Status Lifecycle Transitions

### Sprint 1 Valid Transitions
| From | To | Actor | Rule |
|---|---|---|---|
| `PENDING` | `ACCEPTED` | `OPERATOR` | Any `OPERATOR` can view and accept any `PENDING` order (`BR-06` Shared Global Operator Queue ADR in `docs/srs.md` & `docs/system-sds.md`) |
| _(none)_ | _(cannot go backwards)_ | — | Invalid transition → `409 CONFLICT` |

### Sprint 2 Additional Transitions (Planned)
| From | To | Actor | Rule |
|---|---|---|---|
| `ACCEPTED` | `BAKING` | `OPERATOR` | — |
| `BAKING` | `READY_FOR_PICKUP` | `OPERATOR` | — |
| `READY_FOR_PICKUP` | `COMPLETED` | `OPERATOR` | — |
| `PENDING` | `CANCELLED` | `CUSTOMER` | Stock MUST be restored atomically |

---

## E) Prisma Singleton Pattern

All server-side code MUST import Prisma using:

```typescript
// server/src/lib/db.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

```typescript
// In any controller or service:
import { prisma } from '../lib/db';
```

Never instantiate `new PrismaClient()` anywhere else.

---

## F) TypeScript Type Conventions

```typescript
// Monetary values MUST be represented as integer satang (Prisma `Int`, 1 THB = 100 satang, e.g., 8500 = 85.00 THB)
// to prevent floating-point precision defects. Never use float THB numbers in API contracts or DB models.
type Satang = number; // Integer satang only (e.g., 8500 = 85.00 THB)

// Request body types — prefix with 'Create' or 'Update'
type CreateOrderBody = {
  items: Array<{ bakeryItemId: string; quantity: number }>;
  pickupNote?: string;
};

// API response types — prefix with resource name
type OrderItemResponse = {
  id: string;
  bakeryItemId: string;
  quantity: number;
  unitPriceAtOrder: Satang; // Integer satang (Int)
};

type OrderResponse = {
  id: string;
  status: OrderStatus;
  totalAmount: Satang; // Integer satang (Int)
  items: OrderItemResponse[];
  createdAt: string;
};

// Never use 'any' — use 'unknown' and narrow with type guards
```
