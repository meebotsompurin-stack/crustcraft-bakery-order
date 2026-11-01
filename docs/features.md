# Feature Inventory & Specification Breakdown

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Document Version:** `1.0.0` (Sprint 1 Engineering Baseline)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Master Feature Registry (F-01 to F-09)

The following master registry outlines all nine core capabilities spanning the complete three-sprint lifecycle of CrustCraft. Each feature is assigned an immutable Feature Identifier (`F-XX`), priority rating, implementation sprint, and dependency mapping.

| Feature ID | Feature Name | Target Sprint | Priority | Core Dependencies | Primary Beneficiary | Status |
|---|---|:---:|:---:|---|---|:---:|
| **F-01** | Authentication, Session Lifecycle & RBAC Foundation | Sprint 1 | Must Have | None | All Users | 🟡 Specified (ISSUE-03) |
| **F-02** | Bakery Catalog & Availability View | Sprint 1 | Must Have | F-01 | Customer, Guest | 🟡 Specified (ISSUE-04) |
| **F-03** | Customer Pre-Order Creation & Authoritative Server Calculation | Sprint 1 | Must Have | F-01, F-02 | Customer | 🟡 Specified (ISSUE-04) |
| **F-04** | Operator Incoming Order Queue & Acceptance | Sprint 1 | Must Have | F-01, F-03 | Operator | 🟡 Specified (ISSUE-05) |
| **F-05** | Bakery Catalog Administration | Sprint 2 | Must Have | F-01, F-02 | Operator | ⬜ Planned (Sprint 2) |
| **F-06** | Order Fulfillment & Cancellation Lifecycle | Sprint 2 | Must Have | F-03, F-04 | Operator, Customer | ⬜ Planned (Sprint 2) |
| **F-07** | Simulated Payment Transitions | Sprint 2 | Should Have | F-03, F-04 | Customer, Operator | ⬜ Planned (Sprint 2) |
| **F-08** | Bakery Sales & Order Summary Reporting | Sprint 3 | Should Have | F-04, F-06 | Operator | ⬜ Planned (Sprint 3) |
| **F-09** | Order Search, Filtering & Release Hardening | Sprint 3 | Could Have | F-03, F-04, F-06 | Operator, Customer | ⬜ Planned (Sprint 3) |

---

## 2. Granular Feature Breakdown

### F-01: Authentication, Session Lifecycle & RBAC Foundation
- **Target Sprint:** Sprint 1 (Deliverable 1 Baseline)
- **Priority:** Must Have
- **Associated Requirements:** `FR-01-01`, `FR-01-02`, `FR-01-03`, `FR-01-04`, `FR-01-05`, `FR-01-06`, `NFR-02`, `NFR-03`
- **User Stories:**
  - *US-01.1 (Customer Registration):* As a new customer, I want to create an account with my name, email, and password, so that I can log in and place pre-orders.
  - *US-01.2 (Secure Login):* As a registered user, I want to log in securely with my credentials and obtain an authenticated session via an `httpOnly` cookie, so that I remain logged in without exposing my credentials or session token to script injection.
  - *US-01.3 (Role Isolation):* As a customer, I want the system to restrict administrative operator operations from my account, so that system data and bakery queue management remain confidential.
  - *US-01.4 (Secure Logout):* As an authenticated user, I want to log out of my session, so that subsequent visitors on the same browser cannot access my private order history.
- **Detailed Scope:**
  - Password hashing with `bcrypt` (salt rounds ≥ 10).
  - JWT token generation with 24-hour expiration (`expiresIn: '24h'`).
  - Dual-channel credential delivery: browser `httpOnly` cookie (`token`) + JSON response body.
  - Dual-channel authentication middleware: primary cookie inspection with fallback to `Authorization: Bearer <token>` for API test automation.
  - Route guard factory `requireRole([...])` enforcing backend authorization.

---

### F-02: Bakery Catalog & Availability View
- **Target Sprint:** Sprint 1 (Deliverable 1 Baseline)
- **Priority:** Must Have
- **Associated Requirements:** `FR-02-01`, `FR-02-02`, `FR-02-03`, `FR-02-04`, `BR-01`, `BR-05`, `NFR-01`, `NFR-04`
- **User Stories:**
  - *US-02.1 (Browse Menu):* As a customer or guest, I want to view all currently active artisan bakery items with their descriptions, prices in Thai Baht, and remaining stock counts, so that I know what is available for ordering.
  - *US-02.2 (Item Detail):* As a customer, I want to inspect individual product details (allergens, category, ingredients) to make informed purchasing choices.
  - *US-02.3 (Out of Stock Indicator):* As a customer, I want to clearly see when an item's batch is depleted (`"Out of Stock"` / `"สินค้าหมดชั่วคราว"`) without it disappearing from the catalog, so that I know the bakery bakes this item even if today's batch is sold out.
- **Detailed Scope:**
  - Public `GET /api/catalog` and `GET /api/catalog/:id` endpoints.
  - Seeded catalog items with prices stored in integer satang (`Int`) and rendered as Baht.
  - Visual separation between `isAvailable` (menu inclusion flag) and `stockQuantity` (physical batch inventory).

---

### F-03: Customer Pre-Order Creation & Authoritative Server Calculation
- **Target Sprint:** Sprint 1 (Deliverable 1 Baseline)
- **Priority:** Must Have
- **Associated Requirements:** `FR-03-01`, `FR-03-02`, `FR-03-03`, `FR-03-04`, `FR-03-05`, `FR-03-06`, `BR-01`, `BR-02`, `BR-03`, `BR-04`, `BR-05`, `NFR-03`, `NFR-06`
- **User Stories:**
  - *US-03.1 (Place Pre-Order):* As a customer, I want to select multiple bakery items, specify quantities, attach an optional pickup note, and submit my order.
  - *US-03.2 (Price Transparency):* As a customer, I want the system to compute the authoritative total based on real bakery pricing, so that my final bill matches the exact menu prices without rounding inconsistencies.
  - *US-03.3 (Order History & Status):* As a customer, I want to view my past orders and track their current progress (`PENDING`, `ACCEPTED`), so that I know when to arrive at the bakery for pickup.
  - *US-03.4 (Privacy Protection):* As a customer, I want to be guaranteed that other customers cannot inspect my order history or personal details.
- **Detailed Scope:**
  - Transactional order creation (`prisma.$transaction`) with automated inventory deduction.
  - Server-authoritative total amount calculation in integer satangs (`Int`).
  - Immutable unit price snapshotting on `OrderItem.unitPriceAtOrder`.
  - Rejection of invalid quantities (`<= 0`), unavailable items, or depleted stock with descriptive standard error payloads (`400` / `409`).
  - Customer order list (`GET /api/customer/orders`) and detail (`GET /api/customer/orders/:id`) protected by ownership verification middleware.

---

### F-04: Operator Incoming Order Queue & Acceptance
- **Target Sprint:** Sprint 1 (Deliverable 1 Baseline)
- **Priority:** Must Have
- **Associated Requirements:** `FR-04-01`, `FR-04-02`, `FR-04-03`, `FR-04-04`, `BR-06`, `BR-07`, `NFR-03`, `NFR-04`
- **User Stories:**
  - *US-04.1 (Queue Monitoring):* As a bakery operator, I want to monitor a real-time list of all incoming orders across the store, sorted with pending orders at the top, so that the kitchen can prioritize production.
  - *US-04.2 (Order Inspection):* As an operator, I want to view complete order line items, customer contact names, and special baking/pickup notes.
  - *US-04.3 (Order Acceptance):* As an operator, I want to accept a pending order (`PENDING` → `ACCEPTED`), confirming that the kitchen has scheduled the batch for baking.
  - *US-04.4 (State Conflict Guard):* As an operator, I want the system to prevent accidental duplicate acceptances or invalid transitions, warning me if an order was already processed.
- **Detailed Scope:**
  - Shared operator queue endpoint (`GET /api/operator/orders`) accessible to all authenticated operators.
  - Single order query endpoint (`GET /api/operator/orders/:id`).
  - Status transition patch endpoint (`PATCH /api/operator/orders/:id/status`) enforcing the Sprint 1 transition rule (`PENDING` → `ACCEPTED`).

---

### F-05: Bakery Catalog Administration
- **Target Sprint:** Sprint 2 (Deliverable 2 Core Expansion)
- **Priority:** Must Have
- **Associated Requirements:** `FR-05-01`, `FR-05-02`, `BR-05`
- **User Stories:**
  - *US-05.1 (Create Product):* As an operator, I want to introduce new seasonal bread and pastry recipes to the catalog with names, descriptions, satang prices, categories, and initial stock.
  - *US-05.2 (Update Recipe & Pricing):* As an operator, I want to adjust prices and update product descriptions as ingredient costs evolve.
  - *US-05.3 (Replenish Batch Inventory):* As an operator, I want to record newly baked batches by updating `stockQuantity` without needing to delete or re-create menu items.
  - *US-05.4 (Toggle Menu Availability):* As an operator, I want to toggle `isAvailable` on or off to temporarily retire recipes that are not in season.

---

### F-06: Order Fulfillment & Cancellation Lifecycle
- **Target Sprint:** Sprint 2 (Deliverable 2 Core Expansion)
- **Priority:** Must Have
- **Associated Requirements:** `FR-06-01`, `FR-06-02`, `BR-03`, `BR-07`
- **User Stories:**
  - *US-06.1 (Advance Production):* As a baker/operator, I want to advance orders through `ACCEPTED` → `BAKING` → `READY_FOR_PICKUP` → `COMPLETED` as bread progresses through the ovens to the front counter.
  - *US-06.2 (Customer Order Cancellation):* As a customer, I want to cancel my order while it is still `PENDING` if my schedule changes, receiving immediate confirmation and knowing the reserved items are returned to stock.
  - *US-06.3 (Operator Order Rejection/Cancellation):* As an operator, I want to cancel a pending order if an unexpected kitchen equipment issue prevents baking, with the system automatically restoring inventory counts.

---

### F-07: Simulated Payment Transitions
- **Target Sprint:** Sprint 2 (Deliverable 2 Core Expansion)
- **Priority:** Should Have
- **Associated Requirements:** `FR-07-01`, `FR-07-02`, `NFR-03`
- **User Stories:**
  - *US-07.1 (Simulated Cashless Settlement):* As a customer, I want to simulate payment for my pre-order, transitioning payment status from `UNPAID` to `PAID`, so that my pickup is expedited.
  - *US-07.2 (Payment Audit):* As an operator, I want to clearly distinguish between paid orders and orders requiring counter payment upon collection.

---

### F-08: Bakery Sales & Order Summary Reporting
- **Target Sprint:** Sprint 3 (Final Delivery)
- **Priority:** Should Have
- **Associated Requirements:** `FR-08-01`, `BR-01`, `NFR-06`
- **User Stories:**
  - *US-08.1 (Daily Revenue Metrics):* As a bakery owner/operator, I want to view total daily revenue in Thai Baht calculated accurately from completed order satang values, so that I can evaluate daily business performance.
  - *US-08.2 (Order Volume Breakdown):* As an operator, I want to view order count distribution across fulfillment states (`COMPLETED`, `CANCELLED`, `PENDING`) to spot operational bottlenecks.
  - *US-08.3 (Top-Selling Items):* As a head baker, I want to identify our highest-volume pastries and loaves to optimize batch preparation for upcoming bake days.

---

### F-09: Order Search, Filtering & Release Hardening
- **Target Sprint:** Sprint 3 (Final Delivery)
- **Priority:** Could Have
- **Associated Requirements:** `FR-09-01`, `FR-09-02`, `NFR-01`, `NFR-04`, `NFR-05`
- **User Stories:**
  - *US-09.1 (Order Search):* As an operator, I want to search orders by customer name, order ID, or date range, so that I can quickly retrieve customer orders when customers arrive at the pickup counter.
  - *US-09.2 (Filter by Status):* As an operator, I want to filter the queue to display only `READY_FOR_PICKUP` orders for front-counter staff.
  - *US-09.3 (Maintenance Adaptability):* As a system maintainer, I want the system architecture to incorporate an approved change request cleanly (Lab 7) without regressing core workflows.
