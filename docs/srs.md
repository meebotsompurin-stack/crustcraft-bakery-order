# System Requirements Specification (SRS)
## CrustCraft Artisan Bakery — Pre-Order & Fulfillment System

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Department:** Department of Computer Engineering, Faculty of Engineering, King Mongkut's University of Technology Thonburi (KMUTT)  
> **Assigned Project Theme:** Theme 4 — E-Commerce or Ordering System  
> **Document Version:** `1.0.0` (Sprint 1 Engineering Baseline)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Problem Statement & Product Scope

### 1.1 Context & Problem Statement
Artisan bakeries specialize in small-batch, handcrafted baked goods (such as sourdough breads, laminated croissants, brioches, and delicate tarts) requiring multi-stage proofing and baking schedules ranging from 12 to 36 hours. Because daily production yields are physically constrained by oven capacity and proofing times, artisan bakeries face two critical operational failures when relying on walk-in sales or informal communication channels (social media messaging, phone calls):
1. **Unpredictable Demand & Food Waste:** Over-baking perishable items leads to inventory spoilage and operational loss, while under-baking results in stock-outs, long customer wait lines, and unfulfilled demand.
2. **Order Discrepancies & Stale Inventory Conflicts:** Informal pre-ordering lacks real-time inventory locking, leading to double-allocation of limited batches, price confusion, and customer dissatisfaction during morning pickups.

### 1.2 CrustCraft Solution Overview
**CrustCraft** is a web-based, full-stack pre-order and fulfillment management system tailored specifically for boutique artisan bakeries. CrustCraft bridges customer demand and bakery production by enforcing:
- Authoritative inventory transparency and real-time stock allocation.
- Server-side price calculation and historical pricing snapshots in integer satangs (`Int`).
- A structured, step-by-step order fulfillment lifecycle from submission to completion.

### 1.3 Scope Boundaries Across Sprints
- **Sprint 1 (Deliverable 1 Baseline):** End-to-end vertical slice implementing customer authentication, session management, catalog browsing with stock counts, atomic customer pre-order creation with server-side total calculation, and operator queue visibility with order acceptance.
- **Sprint 2 (Deliverable 2 Core Expansion & Group Labs 5–6):** Bakery catalog administration (operator CRUD and batch inventory restock), complete multi-stage order fulfillment lifecycle (`ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`), customer cancellation with automated stock restoration, simulated payment status transitions (`UNPAID` → `PAID` / `FAILED`), Docker containerization, CI/CD pipeline, and GCP deployment.
- **Sprint 3 (Final Delivery & Group Lab 7):** Comprehensive sales and revenue reporting dashboard, advanced order search and multi-criteria filtering, approved maintenance rule change verification, and final regression hardening.

### 1.4 Explicit Exclusions (Out of Scope)
To maintain academic rigor and focus on software engineering discipline, the following aspects are explicitly excluded:
- Real third-party payment gateway integration (e.g., Stripe, Omise, GB Prime Pay). Simulated payment state transitions using synthetic test data are used instead.
- External courier logistics and third-party delivery dispatch APIs (e.g., GrabExpress, LINE MAN). All orders represent on-premise bakery counter pickup.
- Public customer self-registration password reset via third-party SMS/SMTP email verification services in Sprint 1. Seeded demo accounts and localized credentials are used.
- Multi-branch or multi-tenant franchise operations. CrustCraft is designed around a single artisan production workshop.

---

## 2. Stakeholder List & Actor Profiles

| Stakeholder / Actor | Description & Primary Responsibilities | Interaction with CrustCraft |
|---|---|---|
| **Unauthenticated Guest** | Anonymous visitor browsing the bakery offerings. | Can view public catalog items and availability status; prompted to authenticate when initiating an order. |
| **Customer (`CUSTOMER`)** | Registered consumer pre-ordering baked goods for pickup. | Browses catalog, places pre-orders with custom pickup notes, views own historical orders, and tracks order fulfillment state. |
| **Bakery Operator (`OPERATOR`)** | Bakery kitchen staff, head baker, and counter fulfillment manager. | Monitors shared incoming order queue, accepts pending orders, advances baking/fulfillment states, manages catalog items, and reviews sales summaries. |
| **Co-Developers** | Purin Mebotsom & Saksorn Buranatananun. | Lead software engineers responsible for requirements, architecture, TDD implementation, code reviews, containerization, and quality gates. |
| **University Evaluator / TAs** | CPE 334 Instructors and Teaching Assistants at KMUTT. | Evaluates system engineering baseline, traceability, automated test verification, release commits, and deliverable compliance. |

---

## 3. System-Wide Business Rules (BR)

CrustCraft enforces six foundational business rules across all architectural layers:

* **BR-01 (Authoritative Server-Side Pricing in Integer Satang):**  
  All monetary amounts (`price`, `unitPriceAtOrder`, `totalAmount`) MUST be calculated and validated exclusively on the server side using authoritative database values represented as **integer satangs (`Int`, `100 satang = 1.00 THB`)**. Any client-supplied price or total amount in HTTP request payloads MUST be strictly ignored or rejected to eliminate client-side price tampering and IEEE 754 floating-point arithmetic errors.

* **BR-02 (Historical Price Snapshot):**  
  When an order is created, each line item (`OrderItem`) MUST snapshot the exact active `BakeryItem.price` into `OrderItem.unitPriceAtOrder` (`Int` satang). Subsequent price modifications or promotions on `BakeryItem` MUST NOT alter historical order items or previously completed order totals.

* **BR-03 (Stock Validation & Transactional Atomicity):**  
  Every pre-order submission MUST execute within an isolated database transaction (`prisma.$transaction`). The server verifies:
  1. Requested line item `quantity > 0` (otherwise rejected with `400 VALIDATION_ERROR`).
  2. Item `isAvailable == true` (otherwise rejected with `409 CONFLICT`).
  3. `item.stockQuantity >= requested quantity` (otherwise rejected with `409 CONFLICT`).  
  If any line item fails validation, the entire transaction rolls back; no stock is deducted, and no order record is created.

* **BR-04 (Customer Ownership & Data Isolation):**  
  Customers are strictly quarantined to their own operational data. A user with role `CUSTOMER` can ONLY view or access orders where `Order.customerId === req.user.userId`. Any attempt by a customer to inspect, query, or mutate an order belonging to another customer MUST be rejected immediately with `403 FORBIDDEN` without leaking entity metadata.

* **BR-05 (`isAvailable` vs. `stockQuantity` Semantics):**  
  - `isAvailable` (`Boolean`) is an operator-controlled catalog visibility switch indicating whether a product recipe is active on the menu.
  - `stockQuantity` (`Int`) represents physical inventory remaining for the batch.  
  When inventory drops to zero (`stockQuantity == 0`), the system **MUST NOT** automatically flip `isAvailable` to `false`. Instead, the item remains visible in `GET /api/catalog` with an `"Out of Stock"` (`สินค้าหมดชั่วคราว`) indicator, and customer order attempts are rejected with `409 CONFLICT`. Flipping `isAvailable` to `false` is reserved for intentional catalog archival.

* **BR-06 (Shared Global Operator Queue):**  
  CrustCraft operates under a unified store operational model. All authenticated accounts with role `OPERATOR` share full read and transition authority over the storewide incoming order queue, ensuring kitchen staff and front-counter operators coordinate fulfillment concurrently without siloed queues.

* **BR-07 (Order Status Lifecycle & Strict State Machine):**  
  Orders follow a deterministic, forward-only finite state machine:
  - **Sprint 1 Allowed Transition:** `PENDING` → `ACCEPTED` (executable only by `OPERATOR`).
  - **Sprint 2 Extended Lifecycle:** `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`.
  - **Cancellation Rule:** An order in `PENDING` state may be cancelled (`PENDING` → `CANCELLED`) by its owning customer or an operator; cancellation triggers an atomic reversal that restores deducted inventory back to `BakeryItem.stockQuantity`.
  - Any out-of-order, backward, or invalid transition attempt MUST be rejected with `409 CONFLICT`.

---

## 4. Functional Requirements (FR)

### 4.1 Authentication & Session Management (`F-01`)
* **FR-01-01:** The system shall allow users to register an account with `name`, valid unique `email`, `password` (minimum 8 characters), and optional initial `role` (defaults to `CUSTOMER`).
* **FR-01-02:** The system shall authenticate users via `email` and `password`, verifying hashed credentials with `bcrypt`. Upon successful authentication, the server generates a JSON Web Token (JWT) with a signed payload (`userId`, `role`) and a `24h` expiration window.
* **FR-01-03:** The authentication endpoint shall set the issued JWT in an `httpOnly`, `SameSite=Lax`, `Path=/` browser cookie (`token`) with `Max-Age=86400` (24 hours). The endpoint shall also echo the token and user profile in the JSON response body to support automated API test suites and fallback header authorization.
* **FR-01-04:** The API middleware shall guard protected routes by validating the JWT extracted primarily from `req.cookies.token`, falling back to `Authorization: Bearer <token>` when cookies are absent. Unauthenticated requests must receive `401 UNAUTHORIZED`.
* **FR-01-05:** The API middleware shall enforce role authorization (`requireRole(['OPERATOR'])`), returning `403 FORBIDDEN` when an authenticated user lacks requisite privileges.
* **FR-01-06:** The system shall provide a logout endpoint (`POST /api/auth/logout`) that clears the `httpOnly` authentication cookie (`res.clearCookie('token')`) and revokes client-side session state.

### 4.2 Bakery Catalog & Availability (`F-02`)
* **FR-02-01:** The system shall provide a public catalog endpoint (`GET /api/catalog`) returning all bakery items where `isAvailable == true`.
* **FR-02-02:** The catalog response shall include `id`, `name`, `description`, `price` (in integer satangs), `stockQuantity`, `isAvailable`, `category`, and timestamps for each item.
* **FR-02-03:** The system shall provide an item detail endpoint (`GET /api/catalog/:id`) returning full specifications for a single item, or `404 NOT_FOUND` if the identifier does not exist.
* **FR-02-04:** The frontend catalog shall render bakery items with formatted prices in Thai Baht (`฿(price / 100).toFixed(2)`), remaining stock count, and visual availability badges (including `"Out of Stock"` / `"สินค้าหมดชั่วคราว"` when `stockQuantity == 0`).

### 4.3 Customer Pre-Order Processing (`F-03`)
* **FR-03-01:** The system shall allow authenticated customers to submit pre-orders (`POST /api/customer/orders`) with line items containing `bakeryItemId`, `quantity`, and an optional `pickupNote`.
* **FR-03-02:** The server shall compute line item subtotals and overall order `totalAmount` in integer satangs from database item prices, strictly disregarding any client-sent price values (`BR-01`).
* **FR-03-03:** The system shall snapshot the current `price` into `OrderItem.unitPriceAtOrder` for every line item (`BR-02`).
* **FR-03-04:** The system shall validate stock and atomically deduct `stockQuantity` within a `prisma.$transaction` block (`BR-03`).
* **FR-03-05:** The system shall assign all newly created pre-orders an initial status of `PENDING`.
* **FR-03-06:** The system shall allow customers to retrieve a list of their own historical orders (`GET /api/customer/orders`) and view specific order details (`GET /api/customer/orders/:id`), enforcing ownership isolation (`BR-04`).

### 4.4 Operator Queue & Order Acceptance (`F-04`)
* **FR-04-01:** The system shall provide operators with a storewide order queue endpoint (`GET /api/operator/orders`) sorted by `PENDING` status first, followed by newest creation time (`BR-06`).
* **FR-04-02:** The system shall allow operators to inspect complete order details (`GET /api/operator/orders/:id`), including customer identity, line item snapshot prices, quantities, and pickup notes.
* **FR-04-03:** The system shall allow operators to transition order status from `PENDING` to `ACCEPTED` (`PATCH /api/operator/orders/:id/status`).
* **FR-04-04:** The system shall reject invalid status transitions or non-operator transition attempts with `409 CONFLICT` or `403 FORBIDDEN` respectively (`BR-07`).

### 4.5 Catalog Administration (`F-05`, Sprint 2)
* **FR-05-01:** The system shall allow operators to create new bakery catalog items with name, description, price (satang), initial stock, category, and availability status.
* **FR-05-02:** The system shall allow operators to update item pricing, toggle `isAvailable`, and replenish batch stock quantities.

### 4.6 Extended Fulfillment & Cancellation (`F-06`, Sprint 2)
* **FR-06-01:** The system shall allow operators to advance order states through the complete lifecycle: `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED`.
* **FR-06-02:** The system shall permit cancellation of `PENDING` orders, automatically replenishing deducted stock quantities in an atomic transaction.

### 4.7 Simulated Payment Transitions (`F-07`, Sprint 2)
* **FR-07-01:** The system shall maintain a payment status (`UNPAID`, `PAID`, `FAILED`) associated with each order.
* **FR-07-02:** The system shall support operator-triggered or automated synthetic payment status transitions simulating cashless store transactions.

### 4.8 Sales & Order Summary Reporting (`F-08`, Sprint 3)
* **FR-08-01:** The system shall provide aggregated reporting endpoints for operators summarizing daily/weekly revenue in Thai Baht, order count distribution by status, and top-selling bakery items.

### 4.9 Order Search, Filtering & Hardening (`F-09`, Sprint 3)
* **FR-09-01:** The system shall provide multi-parameter query filtering on orders (by date range, customer name, status, and price range).
* **FR-09-02:** The system shall implement verified maintenance changes and pass comprehensive end-to-end regression test suites.

---

## 5. System-Level Role & Permission Matrix (RBAC)

The following matrix defines conceptual operational privileges across user roles for all system capabilities across Sprints 1–3:

| Capability / System Action | Target Resource | Unauthenticated Guest | Customer (`CUSTOMER`) | Bakery Operator (`OPERATOR`) | Business Rule & Policy Constraints |
|---|---|:---:|:---:|:---:|---|
| Browse Public Menu | `BakeryItem` | ✔ | ✔ | ✔ | Limited to active catalog items where `isAvailable == true` (`BR-05`). |
| View Item Detail | `BakeryItem` | ✔ | ✔ | ✔ | Can inspect single item information and stock availability. |
| Register Account | `User` | ✔ | ✔ | ✔ | Anyone can register; defaults to `CUSTOMER` role. |
| Login / Acquire Session | `User` | ✔ | ✔ | ✔ | Validates credentials; issues 24-hour `httpOnly` cookie + JWT. |
| Logout / Clear Session | `User` | ❌ | ✔ | ✔ | Clears authentication cookie and invalidates client session state. |
| Create Pre-Order | `Order`, `OrderItem` | ❌ | ✔ | ❌ | Requires `CUSTOMER` role; executes atomic stock validation (`BR-01`, `BR-03`). |
| View Own Orders | `Order` | ❌ | ✔ | ❌ | Returns only orders matching `Order.customerId == req.user.userId` (`BR-04`). |
| View Other's Orders | `Order` | ❌ | ❌ | ❌ | Strictly forbidden; attempts return `403 FORBIDDEN` (`BR-04`). |
| View Global Order Queue | `Order` (All) | ❌ | ❌ | ✔ | Shared global queue showing all incoming customer orders (`BR-06`). |
| Accept Pending Order | `Order.status` | ❌ | ❌ | ✔ | Transitions status from `PENDING` → `ACCEPTED` (`BR-07`). |
| Advance Fulfillment State | `Order.status` | ❌ | ❌ | ✔ | Advances `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED` (Sprint 2). |
| Cancel Pre-Order | `Order.status` | ❌ | ✔ (Own `PENDING`) | ✔ (`PENDING`) | Permitted only while `PENDING`; atomically restores inventory (`BR-07`, Sprint 2). |
| Manage Menu Items | `BakeryItem` | ❌ | ❌ | ✔ | Create/edit bakery items, adjust prices, and toggle `isAvailable` (Sprint 2). |
| Restock Item Inventory | `BakeryItem` | ❌ | ❌ | ✔ | Batch replenishment of `stockQuantity` (Sprint 2). |
| Update Payment State | `Order.paymentStatus`| ❌ | ❌ | ✔ | Transition `UNPAID` → `PAID` / `FAILED` using synthetic controls (Sprint 2). |
| View Sales Analytics | Reports / Metrics | ❌ | ❌ | ✔ | Aggregated store revenue and fulfillment throughput summaries (Sprint 3). |

---

## 6. Non-Functional Requirements (NFR)

| NFR ID | Category | Requirement Statement | Measurable Target & Verification Method | Planned Sprint |
|---|---|---|---|:---:|
| **NFR-01** | Performance | Catalog retrieval and single order lookup response times shall remain responsive under standard local and cloud environments. | `GET /api/catalog` response time `< 100ms` for up to 100 items, verified via automated integration tests and network profiling. | Sprint 1 |
| **NFR-02** | Security | User passwords shall never be persisted in plaintext, and session tokens must be shielded from cross-site scripting (XSS). | Passwords hashed using `bcrypt` with salt rounds `≥ 10`. JWT issued in `httpOnly`, `SameSite=Lax` cookie. Verified by unit and API test assertions. | Sprint 1 |
| **NFR-03** | Security | All API error responses must adhere to a secure standard error envelope without leaking server stack traces. | Response body matches `{ error: { code, message, details? } }` with appropriate HTTP status (`400`, `401`, `403`, `404`, `409`). Verified by API integration tests. | Sprint 1 |
| **NFR-04** | Usability & Responsive | The web user interface shall be fully functional and visually ergonomic across desktop, tablet, and mobile viewport widths. | Zero horizontal scroll and complete DOM interaction at `1280px` (Desktop), `768px` (Tablet), and `375px` (Mobile). Verified by Playwright multi-viewport tests. | Sprint 1 |
| **NFR-05** | Reliability & Persistence | Production database records must survive container destruction, application redeployment, and service restarts without data loss (Course Spec 5.1). | Database file mounted on external persistent volume (`/app/data/crustcraft.db` on GCP persistent disk). Validated during container lifecycle tests in Lab 5. | Sprint 1 (Design) / Lab 5 |
| **NFR-06** | Data Integrity | Monetary transactions must avoid floating-point rounding discrepancies. | All pricing stored and calculated as integers (`satang`). Verified by calculation unit tests (`server/src/__tests__/unit/orderCalculation.test.ts`). | Sprint 1 |

---

## 7. Assumptions, Technical Constraints & Decisions

### 7.1 Technical Constraints
1. **Academic Framework Constraints:** Project development is bounded by the KMUTT CPE 334 semester schedule, mandating three incremental deliverables (Deliverable 1 due 8 Nov 2026, Deliverable 2 due 29 Nov 2026, Final Delivery due 13 Dec 2026) alongside three group labs (Lab 5 GCP/Docker, Lab 6 UAT, Lab 7 Maintenance).
2. **Modular Monolith Stack:** Single unified repository with distinct layers: Express.js (TypeScript) backend in `server/`, React (Vite + TypeScript + Tailwind CSS) in `client/`, Prisma ORM with SQLite (local) / PostgreSQL (production capability) in `prisma/`, and Playwright in `e2e/`.

### 7.2 Architectural Assumptions & Resolutions
- **Currency Assumption:** All business operations occur in Thailand; currency is Thai Baht (THB). Storing prices in integer satang (`Int`) eliminates fractional cent ambiguities.
- **Single Production Site:** Inventory is centralized in a single bakery workshop; distributed warehouse synchronization is assumed unnecessary.
- **Synthetic Payment:** Real payment gateways are excluded to prevent reliance on external payment sandboxes that could jeopardize automated grading pipelines.
