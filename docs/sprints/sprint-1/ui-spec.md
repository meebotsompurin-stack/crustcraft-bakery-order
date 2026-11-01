# Sprint 1 UI/UX Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 1 — Part E (UI/UX & Responsive Specification)  
> **Sprint 1 Status:** 🟡 In Progress (Engineering Contracts Baseline — Pre-Implementation)  
> **Authors & Co-Developers:**
> - Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack), Role: `Co-Developer`)
> - Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548), Role: `Co-Developer`)

---

## 1. Design Principles & Monetary Formatting

- **Mobile-First Responsive Architecture:** Every view and component is built mobile-first (`375px` base) and scales smoothly across Tablet (`768px`, Tailwind `md:`) and Desktop (`1280px`, Tailwind `lg:` / `xl:`) with zero horizontal scrolling (`overflow-x-hidden`).
- **Tailwind CSS Utility-First Styling:** All styling uses Tailwind CSS v3 utility classes exclusively — no external component libraries or custom CSS stylesheets. Warm artisan bakery palette:
  - Primary Accent: Amber / Warm Crust (`amber-600`, `amber-700`, `amber-800`)
  - Neutral Background: Warm Cream / Stone (`stone-50`, `amber-50/40`, `white`)
  - Typography: High-contrast Dark Espresso (`stone-800`, `stone-900`) and muted secondary text (`stone-500`, `stone-600`)
- **Mandatory Data-Fetching States:** Every data-fetching page and component MUST implement explicit UI states for:
  1. **Loading State:** Accessible skeleton placeholders or spinner indicator (`data-testid="loading-state"`).
  2. **Empty State:** Informative illustration/message with a clear call-to-action when lists are empty (`data-testid="empty-state"`).
  3. **Error State:** Clear alert banner displaying the server error message (`error.message`) and a retry trigger (`data-testid="error-state"`).
  4. **Out-of-Stock State (`BR-05`):** When `isAvailable === true` and `stockQuantity === 0`, the item remains visible in the catalog with a prominent `"Out of Stock"` (`สินค้าหมดชั่วคราว`) badge and a disabled order button (`disabled={item.stockQuantity === 0}`).
- **Satang-to-THB Display Formatting (`ADR-03`):**
  - All monetary values arrive from the API as integer satangs (`Int`, where `100 satang = 1.00 THB`, e.g., `8500` satang = `฿85.00`).
  - Every UI component MUST format satang values using a shared helper:
    ```typescript
    export const formatTHB = (satang: number): string =>
      `฿${(satang / 100).toFixed(2)}`;
    // Example: formatTHB(8500) -> "฿85.00", formatTHB(22000) -> "฿220.00"
    ```

---

## 2. Page / View Inventory (Sprint 1)

| Page Component | File Path | Route Path | Role / Access Guard | Primary Purpose & Key Contents |
|---|---|---|---|---|
| **`LoginPage`** | `client/src/pages/LoginPage.tsx` | `/login` | Public (Redirects authenticated users to default portal) | Email + password login form, validation feedback, link to `/register`, sets `AuthContext` session via `httpOnly` cookie. |
| **`RegisterPage`** | `client/src/pages/RegisterPage.tsx` | `/register` | Public | Customer registration form (`name`, `email`, `password`), duplicate email error banner (`409`), redirects to `/login` or `/catalog` upon success. |
| **`CatalogPage`** | `client/src/pages/CatalogPage.tsx` | `/catalog` (and `/` redirect) | Authenticated (`CUSTOMER` \| `OPERATOR` via `ProtectedRoute`) | Displays grid of active `BakeryItemCard` components (`isAvailable == true`), category badges, THB prices (`satang / 100`), stock counts, `"Out of Stock"` states, and navigation to place a pre-order. |
| **`OrderPage`** | `client/src/pages/OrderPage.tsx` | `/orders/new` | `CUSTOMER` only (`ProtectedRoute` with `allowedRoles={['CUSTOMER']}`) | Hosts the interactive `OrderForm` + live `OrderSummary` preview: allows selecting available items (`stockQuantity > 0`), setting quantities (`1..stockQuantity`), adding an optional `pickupNote`, and submitting to `POST /api/customer/orders`. |
| **`MyOrdersPage`** | `client/src/pages/MyOrdersPage.tsx` | `/orders` | `CUSTOMER` only (`ProtectedRoute` with `allowedRoles={['CUSTOMER']}`) | Displays chronological list (newest first) of the customer's own pre-orders (`GET /api/customer/orders`) with order ID, status badge (`PENDING` / `ACCEPTED`), formatted THB total, item count, and link to `/orders/:id`. |
| **`OrderDetailPage`** | `client/src/pages/OrderDetailPage.tsx` | `/orders/:id` | `CUSTOMER` only (`ProtectedRoute` with `allowedRoles={['CUSTOMER']}`) | Renders `OrderSummary` for a single customer order (`GET /api/customer/orders/:id`): status badge, timestamps, `pickupNote`, line item table (`quantity`, `unitPriceAtOrder` in THB, line subtotal in THB), and authoritative `totalAmount` in THB. |
| **`OperatorOrderQueuePage`** | `client/src/pages/OperatorOrderQueuePage.tsx` | `/operator/orders` | `OPERATOR` only (`ProtectedRoute` with `allowedRoles={['OPERATOR']}`) | Shared storewide incoming order queue (`GET /api/operator/orders`, sorted `PENDING` first). Renders `OperatorOrderRow` per order with customer name, status badge, THB total, `"Accept Order"` action button (`PATCH /api/operator/orders/:id/status`), and link to detail view. |
| **`OperatorOrderDetailPage`** | `client/src/pages/OperatorOrderDetailPage.tsx` | `/operator/orders/:id` | `OPERATOR` only (`ProtectedRoute` with `allowedRoles={['OPERATOR']}`) | Full operator inspection view (`GET /api/operator/orders/:id`) showing customer profile (`name`, `email`), pickup instructions, complete line-item price snapshots in THB, current status, and inline `"Accept Order"` button if status is `PENDING`. |

---

## 3. Component Specifications

### 3.1 `BakeryItemCard` (`client/src/components/BakeryItemCard.tsx`)
- **Purpose:** Displays an individual artisan bakery product card inside `CatalogPage` (and item selector lists), converting integer satang prices into THB and enforcing out-of-stock visual semantics (`BR-05`).
- **Props / State:**
  ```typescript
  interface BakeryItemCardProps {
    item: {
      id: string;
      name: string;
      description: string;
      price: number;         // Integer satang (e.g., 8500)
      stockQuantity: number; // Remaining physical stock (>= 0)
      isAvailable: boolean;  // Always true in catalog list
      category: string;
    };
    onSelectItem?: (itemId: string) => void;
    actionLabel?: string;
  }
  ```
- **Monetary & Stock Presentation Rules:**
  - Displays formatted price `฿${(item.price / 100).toFixed(2)}` (e.g., `8500` → `฿85.00`).
  - **In-Stock State (`stockQuantity > 0`):** Shows green badge `"In Stock (${item.stockQuantity} left)"` (`bg-emerald-100 text-emerald-800`) and enables the `"Add to Pre-Order"` / `"Order Now"` button.
  - **Out-of-Stock State (`isAvailable === true && stockQuantity === 0`):** Card remains visible (`opacity-90`), displays prominent red/amber badge `"Out of Stock / สินค้าหมดชั่วคราว"` (`bg-red-100 text-red-800`, `data-testid="out-of-stock-badge"`), and renders the action button as `disabled` (`cursor-not-allowed bg-stone-300 text-stone-500`) with label `"Out of Stock"`.
- **Loading State (Parent `CatalogPage`):** Renders a 3-card skeleton grid (`animate-pulse bg-stone-200 rounded-xl h-64`) while `GET /api/catalog` is in flight.
- **Empty State (Parent `CatalogPage`):** Displays `"No bakery items are currently available on the menu."` centered card when `items.length === 0`.
- **Error State (Parent `CatalogPage`):** Displays red alert box (`bg-red-50 border border-red-200 text-red-700`) with error message and a `"Retry"` button.
- **Responsive Layout:**
  - **Mobile (`375px`):** Single-column full-width card stack (`grid-cols-1 gap-4`), full-width touch-friendly CTA button (`min-h-[44px]`).
  - **Tablet (`768px`):** 2-column equal-height card grid (`md:grid-cols-2 gap-6`).
  - **Desktop (`1280px`):** 3-column card grid (`lg:grid-cols-3 gap-6`) with hover elevation (`hover:shadow-md transition-shadow`).

---

### 3.2 `OrderForm` (Integrated in `client/src/pages/OrderPage.tsx`)
- **Purpose:** Allows a `CUSTOMER` to select one or more in-stock catalog items, adjust quantities (`1` up to `item.stockQuantity`), enter an optional `pickupNote`, review the estimated THB subtotal, and submit the pre-order to `POST /api/customer/orders`.
- **Props / State:**
  - `catalogItems: BakeryItemResponse[]` (fetched from `GET /api/catalog`)
  - `selectedItems: Record<string, number>` (maps `bakeryItemId` → `quantity`)
  - `pickupNote: string`
  - `isSubmitting: boolean`
  - `submitError: string | null`
- **Validation & Domain Guards:**
  - Items with `stockQuantity === 0` have their quantity controls disabled and cannot be added.
  - Quantity stepper enforces `0 <= quantity <= item.stockQuantity`. Attempting to submit with zero total items selected disables the submit button.
  - Client calculates a preview total `sum(item.price * quantity) / 100` for user convenience, clearly labeled *"Authoritative total calculated by server upon submission"*.
- **Loading State:** Shows loading indicator while fetching catalog items; disables form inputs and displays `"Placing Pre-Order..."` on the submit button while `POST /api/customer/orders` is pending.
- **Empty State:** If no catalog items have `stockQuantity > 0`, displays banner: `"All artisan batches are currently sold out for today."`
- **Error State:** If `POST /api/customer/orders` returns `400 VALIDATION_ERROR` or `409 CONFLICT` (e.g., concurrent stock depletion), displays a prominent error banner (`role="alert"`) with `error.message` without clearing the user's `pickupNote`.
- **Responsive Layout:**
  - **Mobile (`375px`):** Stacked vertical layout — item selector list on top, `OrderSummary` preview and submit button stacked below. Quantity `+` / `-` buttons sized at `40px × 40px` for touch accuracy.
  - **Tablet (`768px`):** Stacked two-section layout with wider item rows displaying unit price and line subtotal inline.
  - **Desktop (`1280px`):** Two-column split layout (`lg:grid-cols-12 gap-8`) — left 7 columns (`lg:col-span-7`) for item selection & pickup note, right 5 columns (`lg:col-span-5`) for sticky `OrderSummary` card and submit button.

---

### 3.3 `OrderSummary` (`client/src/components/OrderSummary.tsx`)
- **Purpose:** Reusable component that renders the structured breakdown of an order — used both as a live preview inside `OrderPage` and as the authoritative receipt view inside `OrderDetailPage` and `OperatorOrderDetailPage`.
- **Props / State:**
  ```typescript
  interface OrderSummaryProps {
    orderId?: string;
    status?: 'PENDING' | 'ACCEPTED';
    createdAt?: string;
    pickupNote?: string | null;
    customer?: { name: string; email: string };
    items: Array<{
      id?: string;
      name: string;
      quantity: number;
      unitPriceSatang: number; // unitPriceAtOrder (or catalog price in preview) in satang
    }>;
    totalAmountSatang: number; // Authoritative server totalAmount in satang
    isLoading?: boolean;
    error?: string | null;
  }
  ```
- **Presentation Rules:**
  - Renders status badge:
    - `PENDING`: Amber badge (`bg-amber-100 text-amber-800 border-amber-300`)
    - `ACCEPTED`: Emerald badge (`bg-emerald-100 text-emerald-800 border-emerald-300`)
  - For each line item, displays: Item Name, `× ${quantity}`, Unit Price (`฿${(unitPriceSatang / 100).toFixed(2)}`), and Line Subtotal (`฿${((unitPriceSatang * quantity) / 100).toFixed(2)}`).
  - Footer highlights `Total Amount` formatted as `฿${(totalAmountSatang / 100).toFixed(2)}`.
- **Loading State:** Skeleton lines for header, item rows, and total footer.
- **Empty State:** Displays `"No items selected yet. Choose items from the menu to build your pre-order."`
- **Error State:** Renders error alert banner if order retrieval fails (`403 FORBIDDEN` or `404 NOT_FOUND`).
- **Responsive Layout:**
  - **Mobile (`375px`):** Compact card layout where each line item wraps cleanly into two lines (Title + Qty on left, Unit Price + Subtotal on right).
  - **Tablet (`768px`) & Desktop (`1280px`):** Structured tabular layout with aligned columns (`Item`, `Unit Price`, `Qty`, `Subtotal`).

---

### 3.4 `OperatorOrderRow` (`client/src/components/OperatorOrderRow.tsx`)
- **Purpose:** Renders a single incoming customer order inside `OperatorOrderQueuePage` (`GET /api/operator/orders`), allowing any `OPERATOR` to inspect summary metadata and immediately transition a `PENDING` order to `ACCEPTED` (`BR-06`, `BR-07`).
- **Props / State:**
  ```typescript
  interface OperatorOrderRowProps {
    order: OrderResponse;
    onAcceptOrder: (orderId: string) => Promise<void>;
    isAccepting: boolean;
  }
  ```
- **Interactive Behavior:**
  - Displays Order ID (shortened display with full ID in `data-order-id`), Customer Name & Email, Created Timestamp, Item Summary (`e.g., "2x Artisan Butter Croissant, 1x Pain au Chocolat"`), Formatted Total (`฿${(order.totalAmount / 100).toFixed(2)}`), and Status Badge (`PENDING` vs `ACCEPTED`).
  - **Action Button Rules (`AC-05-09`, `AC-05-11`):**
    - When `order.status === 'PENDING'`: Renders an active `"Accept Order"` button (`bg-amber-600 hover:bg-amber-700 text-white`). Clicking invokes `PATCH /api/operator/orders/:id/status` with `{ status: 'ACCEPTED' }` and updates the order's state in the parent queue **in-place without a full page reload**.
    - When `order.status === 'ACCEPTED'`: The `"Accept Order"` button is disabled/replaced by an `"Accepted ✓"` indicator (`bg-emerald-50 text-emerald-700`).
  - Includes a `"View Details"` link navigating to `/operator/orders/${order.id}`.
- **Loading State (Parent `OperatorOrderQueuePage`):** Skeleton rows while `GET /api/operator/orders` is loading; `"Accepting..."` spinner on the specific row button during `PATCH`.
- **Empty State (Parent `OperatorOrderQueuePage`):** Displays `"No incoming orders in the queue right now."` when `orders.length === 0`.
- **Error State:** Displays inline or banner error alert if `GET /api/operator/orders` or `PATCH /api/operator/orders/:id/status` fails (e.g., `409 CONFLICT` if another operator already accepted the order).
- **Responsive Layout:**
  - **Mobile (`375px`):** Stacked card per order (`flex-col gap-3 p-4`), with Status Badge at top-right and full-width `"Accept Order"` & `"View Details"` buttons at the bottom.
  - **Tablet (`768px`):** 2-row horizontal card with metadata on the left and action buttons aligned on the right.
  - **Desktop (`1280px`):** Full horizontal row / table-row layout (`lg:flex-row lg:items-center lg:justify-between p-5`) showing Order ID, Customer, Items, Total THB, Status Badge, and Action Buttons in a single scannable line.

---

### 3.5 `ProtectedRoute` & Top Navigation Bar (`client/src/components/ProtectedRoute.tsx` & `App.tsx`)
- **Purpose:** Enforces client-side route protection and role-appropriate navigation links.
- **Behavior:**
  - While `AuthContext` is initializing, renders a centered loading indicator.
  - If `!user` (unauthenticated), automatically redirects to `/login` via `<Navigate to="/login" replace />` (verified by `E2E-09`).
  - If `allowedRoles` is specified and `!allowedRoles.includes(user.role)`, redirects `CUSTOMER` to `/catalog` and `OPERATOR` to `/operator/orders`.
  - Top Navigation Bar displays role-specific links:
    - `CUSTOMER`: `Catalog (/catalog)`, `New Pre-Order (/orders/new)`, `My Orders (/orders)`, User Badge, `Logout` button.
    - `OPERATOR`: `Order Queue (/operator/orders)`, `Catalog View (/catalog)`, Operator Badge, `Logout` button.

---

## 4. Multi-Viewport Responsive Specification Matrix

All 5 core views are verified via Playwright E2E tests and screenshot captures across the three mandatory course viewports:

| Page / View | Mobile (`375px × 667px`) | Tablet (`768px × 1024px`) | Desktop (`1280px × 720px`) |
|---|---|---|---|
| **1. Login / Register (`/login`, `/register`)** | Full-width card (`w-full px-4`), stacked inputs, `44px` tall submit button, compact header. | Centered card (`max-w-md mx-auto p-8`) with generous whitespace and subtle shadow. | Centered card (`max-w-md mx-auto p-8`) on warm bakery backdrop with brand header. |
| **2. Bakery Catalog (`/catalog`)** | Single-column card stack (`grid-cols-1 gap-4`), compact navigation header with wrapping links. | 2-column grid (`md:grid-cols-2 gap-6`), horizontal navigation bar. | 3-column grid (`lg:grid-cols-3 gap-6`), max container width `max-w-7xl mx-auto px-8`. |
| **3. Customer Order Form (`/orders/new`)** | Single-column stack: item selector cards on top, `OrderSummary` and submit CTA below. | Single-column wide cards with inline quantity steppers and summary card below. | 12-column split view: 7 cols item selector on left, 5 cols sticky `OrderSummary` on right. |
| **4. Customer My Orders & Detail (`/orders`, `/orders/:id`)** | Stacked order cards (`flex-col`), wrapped line-item rows in `OrderSummary`. | Horizontal order summary cards (`md:flex-row`), structured line-item table. | Wide container (`max-w-5xl mx-auto`) with full tabular line-item breakdown and status timeline header. |
| **5. Operator Order Queue (`/operator/orders`)** | Stacked `OperatorOrderRow` cards with full-width `"Accept Order"` button. | Two-column metadata + right-aligned action buttons per row. | Full-width scannable queue rows (`max-w-7xl mx-auto`) with inline status badges and instant action buttons. |
