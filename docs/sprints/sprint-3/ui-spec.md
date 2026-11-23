# Sprint 3 UI/UX Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part C (Sprint 3 UI/UX Contract)  
> **Sprint 3 Status:** 🟡 Contracts Defined (`S2-ISSUE-01` / `#61`)

---

## 1. Page & Component Inventory

| Page / Component | Route | Allowed Role | Feature | Target Milestone |
|---|---|:---:|:---:|---|
| `OperatorReportsPage` *(New)* | `/operator/reports` | `OPERATOR` | `F-08` | Deliverable 2 (`S2-ISSUE-04` / `#64`) |
| `OperatorOrderQueuePage` *(Filter Bar Enhancement)* | `/operator/orders` | `OPERATOR` | `F-09` | Final Delivery (1–13 Dec) |

---

## 2. Component Specifications

### 2.1 `OperatorReportsPage.tsx` (`F-08`)
- **Navigation:** Accessible via `"Sales Reports"` link in `TopNavbar` (visible to `OPERATOR` only; route wrapped in `<ProtectedRoute allowedRoles={['OPERATOR']}>`).
- **Date Range Filter Bar:** `From` date input (`YYYY-MM-DD`), `To` date input (`YYYY-MM-DD`), `"Apply Filter"` button, and `"Reset"` button. Displays clear validation banner if `from > to`.
- **KPI Summary Cards (3-column grid on Desktop, 1-column stack on Mobile):**
  1. **Completed Revenue:** formatted in THB (`formatTHB(summary.totalRevenueSatang)`), subtitled `"From completed orders only"`.
  2. **Completed Orders:** `summary.completedOrderCount` out of `summary.totalOrderCount` total orders.
  3. **Paid Orders:** `summary.paymentBreakdown.PAID` paid vs `summary.paymentBreakdown.UNPAID` unpaid.
- **Order Status Breakdown Panel:** Badge + count grid for all 6 lifecycle statuses (`PENDING`, `ACCEPTED`, `BAKING`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`).
- **Top-Selling Items Table / Cards:** Ranked list showing rank, item name, category, total units sold (`quantitySold`), and revenue in THB (`formatTHB(revenueSatang)`).
- **States:** Loading placeholder, Empty state (`"No completed sales found for the selected period"`), and Error banner with retry button.

### 2.2 `OperatorOrderQueuePage.tsx` Filter Bar (`F-09` — Planned for Final Delivery)
- **Controls:** Search input (`placeholder="Search customer or order ID..."`), Status select (`All` + 6 statuses), Payment Status select (`All` + 3 statuses), Date From/To inputs, and `"Clear Filters"` button.
- **Responsive:** Flex-wrap toolbar on Desktop/Tablet; stacked full-width inputs on Mobile (`375px`) with zero horizontal overflow.
- **Empty Filtered State:** `"No orders match your current filters"` with one-click `"Reset Filters"` action.
