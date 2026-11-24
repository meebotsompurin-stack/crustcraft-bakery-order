# Sprint 2 UI/UX Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part B (Sprint 2 UI/UX Contract)  
> **Sprint 2 Status:** 🟡 Planned (Pre-Implementation Contracts Baseline — `S2-ISSUE-01` / `#61`)

---

## 1. Design Principles
- Mobile-first responsive Tailwind CSS across **Desktop (`1280px`)**, **Tablet (`768px`)**, and **Mobile (`375px`)** with zero horizontal overflow (`NFR-04`).
- All monetary values received in integer satang (`Int`) MUST render as Thai Baht via `formatTHB(satang)` (`฿(satang / 100).toFixed(2)`).
- Operator price inputs accept decimal THB (e.g., `95.00`) and convert cleanly with `Math.round(thb * 100)` into integer satang before calling the API.
- Every data-fetching view implements explicit **Loading**, **Empty**, **Error**, and **Action Pending (disabled button)** states.

---

## 2. Page & Route Inventory (Sprint 2 Additions / Updates)

| Page / Component | Route | Allowed Role | Feature | Summary |
|---|---|:---:|:---:|---|
| `OperatorCatalogPage` *(New)* | `/operator/catalog` | `OPERATOR` | `F-05` | Manage all catalog items (active & archived), create new item, edit price/details, restock `stockQuantity`, toggle `isAvailable`. |
| `OperatorOrderQueuePage` + `OperatorOrderRow` *(Updated)* | `/operator/orders` | `OPERATOR` | `F-06`, `F-07` | Show full 6-status badges, `PaymentStatusBadge`, and contextual next-step action button (`Accept`, `Start Baking`, `Mark Ready`, `Complete`) rendered per row in `OperatorOrderRow.tsx`. |
| `OperatorOrderDetailPage` *(Updated)* | `/operator/orders/:id` | `OPERATOR` | `F-06`, `F-07` | Full fulfillment stepper/buttons + Cancel button (when `PENDING`) + `SimulatedPaymentCard` (operator counter settlement toggle). |
| `MyOrdersPage` *(Updated)* | `/orders` | `CUSTOMER` | `F-06`, `F-07` | Display updated status badges (`PENDING`..`COMPLETED`/`CANCELLED`) and `PaymentStatusBadge` per order. |
| `OrderDetailPage` *(Updated)* | `/orders/:id` | `CUSTOMER` | `F-06`, `F-07` | Show order progress timeline, **Cancel Order** button (visible only when `status === "PENDING"`), and `SimulatedPaymentCard` (when not `CANCELLED`). |

---

## 3. Component Specifications

### 3.1 `OperatorCatalogPage.tsx` (`F-05`)
- **Top Bar:** Page heading `"Catalog Administration"` + `"Add Bakery Item"` toggle button.
- **Create/Edit Form:** Fields for `name`, `category` (`Pastry` | `Bread` | `Sweet Bread` | `Tart`), `price` (THB input converted to satang), `stockQuantity` (integer >= 0), `description`, and `isAvailable` checkbox. Inline validation error alert on `400`/`409`.
- **Catalog List:** Responsive table on Desktop (`md:table`) and stacked cards on Mobile (`< 768px`) showing status pill (`Active` vs `Archived` + `Out of Stock` badge when `stockQuantity === 0`), quick `+10 Restock` / inline stock edit, `Edit` button, and `Archive / Restore` (`isAvailable`) toggle button.
- **States:** Loading spinner/skeleton, Empty state prompt, Error banner with retry.

### 3.2 `PaymentStatusBadge.tsx` (`F-07`)
- Compact pill badge reused across Customer & Operator list and detail views:
  - `UNPAID`: amber/stone neutral badge (`Unpaid`)
  - `PAID`: emerald green badge (`Paid`)
  - `FAILED`: red badge (`Payment Failed`)

### 3.3 `SimulatedPaymentCard.tsx` (`F-07`)
- **Customer Mode:**
  - Displays current `PaymentStatusBadge` and formatted total in THB.
  - When `order.status !== "CANCELLED"` and `paymentStatus` is `UNPAID` or `FAILED`: displays primary `"Pay Now (Simulated)"` button (`simulateOutcome: "SUCCESS"`) and secondary `"Simulate Failed Payment"` button (`simulateOutcome: "FAIL"`) for testing/demonstration.
  - When `paymentStatus === "PAID"`: displays confirmation notice with disabled pay actions.
  - When `order.status === "CANCELLED"`: displays informational notice that payment is closed for cancelled orders.
- **Operator Mode:**
  - Displays `PaymentStatusBadge` and quick settlement buttons (`Mark Paid`, `Mark Unpaid`, `Mark Failed`) when `order.status !== "CANCELLED"`.

### 3.4 Fulfillment & Cancellation Controls (`F-06`)
- **Status Badge Palette:**
  - `PENDING` (amber), `ACCEPTED` (blue), `BAKING` (orange), `READY_FOR_PICKUP` (purple), `COMPLETED` (emerald), `CANCELLED` (rose/red).
- **Customer Cancel Flow (`OrderDetailPage.tsx`):**
  - `"Cancel Order"` button renders strictly when `status === "PENDING"`.
  - Clicking triggers confirmation prompt, calls `PATCH /api/customer/orders/:id/cancel`, updates status badge to `CANCELLED`, and displays confirmation message noting inventory was restored.
- **Operator Progression Flow (`OperatorOrderRow.tsx` & `OperatorOrderDetailPage.tsx`):**
  - Displays single deterministic next-step CTA based on current status (`Accept Order` → `Start Baking` → `Mark Ready for Pickup` → `Mark Completed`) plus `"Cancel Order"` button when `status === "PENDING"`.
  - `OperatorOrderRow.tsx` renders each queue item's 6-state status badge, `PaymentStatusBadge`, and inline next-step button without breaking mobile/tablet wrapping.
