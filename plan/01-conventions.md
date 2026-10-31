# 01 — Conventions & Patterns: CrustCraft Artisan Bakery

> **Goal:** Define the team's working standards so all Engineering Contract documents and source code look consistent across all Sprints.

---

## A) Engineering Contract Document Patterns

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
* **BR-[XX] ([Name]):** [Description]
* **BR-01 (Server-Side Pricing):** Order total MUST be calculated exclusively on the server using authoritative `BakeryItem.price` from the database. Client-supplied prices are ignored.
* **BR-02 (Price Snapshot):** Each `OrderItem` MUST capture `unitPriceAtOrder` at the moment of order creation.
* **BR-03 (Stock Atomicity):** Valid orders MUST atomically deduct `stockQuantity` within a single database transaction.
* **BR-04 (Ownership Isolation):** A `CUSTOMER` MUST only access their own orders. Cross-customer access returns `403 Forbidden`.

## 6. Authorization Matrix (RBAC)
| Resource / Action | CUSTOMER | OPERATOR | Notes |
| :--- | :---: | :---: | :--- |
| [Action] | ✔ | ❌ | [Conditions] |

## 7. Data Model Changes
[Prisma schema additions/modifications, field descriptions, migration strategy]

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
* [ ] Spec DD documents (ISSUE-01, ISSUE-02) have Git timestamps BEFORE feature PRs.
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
- Auth method: JWT Bearer Token (stored as httpOnly cookie)
- All protected routes require `Authorization: Bearer <token>` header or valid cookie
- Error envelope: `{ "error": { "code": string, "message": string, "details"?: any[] } }`

## 2. Standard Error Codes
| Status | code string | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Authenticated but insufficient role/ownership |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Stock exhausted or invalid state transition |
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
- Loading states, empty states, and error states MUST be designed for every data-fetching component

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
| `/api/auth/*` | Public | Register, Login, Logout |
| `/api/catalog/*` | Any authenticated | Browse bakery items |
| `/api/customer/*` | CUSTOMER + | Place and view own orders |
| `/api/operator/*` | OPERATOR only | Manage order queue, transitions |

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
| `PENDING` | `ACCEPTED` | OPERATOR | Any OPERATOR can accept any pending order |
| _(none)_ | _(cannot go backwards)_ | — | Invalid transition → `409 CONFLICT` |

### Sprint 2 Additional Transitions (Planned)
| From | To | Actor | Rule |
|---|---|---|---|
| `ACCEPTED` | `BAKING` | OPERATOR | — |
| `BAKING` | `READY_FOR_PICKUP` | OPERATOR | — |
| `READY_FOR_PICKUP` | `COMPLETED` | OPERATOR | — |
| `PENDING` | `CANCELLED` | CUSTOMER | Stock MUST be restored atomically |

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
// Request body types — prefix with 'Create' or 'Update'
type CreateOrderBody = {
  items: Array<{ bakeryItemId: string; quantity: number }>;
  pickupNote?: string;
};

// API response types — prefix with resource name
type OrderResponse = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt: string;
};

// Never use 'any' — use 'unknown' and narrow with type guards
```
