# Sprint 3 API Contract & Specification

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **System:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System  
> **Deliverable Section:** Deliverable 2 — Part C (Sprint 3 API Contract)  
> **Sprint 3 Status:** 🟡 Contracts Defined (`S2-ISSUE-01` / `#61`)

---

## 1. F-08: Sales & Order Summary Reporting

### 1.1 `GET /api/operator/reports/summary`
Returns aggregated bakery sales and operational metrics, optionally bounded by an inclusive date window.
- **Auth Required:** Yes (`OPERATOR`)
- **Query Parameters (optional):**
  - `from`: `YYYY-MM-DD` (start of day UTC `00:00:00.000Z`)
  - `to`: `YYYY-MM-DD` (end of day UTC `23:59:59.999Z`)
- **Validation Rules:**
  - If provided, `from` and `to` must match `^\d{4}-\d{2}-\d{2}$` and represent valid calendar dates.
  - If both are provided, `from <= to`; otherwise reject with `400 VALIDATION_ERROR`.
- **Success Response (`200 OK`):**
  ```json
  {
    "summary": {
      "totalRevenueSatang": 52500,
      "completedOrderCount": 2,
      "totalOrderCount": 5,
      "ordersByStatus": {
        "PENDING": 1,
        "ACCEPTED": 1,
        "BAKING": 0,
        "READY_FOR_PICKUP": 0,
        "COMPLETED": 2,
        "CANCELLED": 1
      },
      "paymentBreakdown": {
        "UNPAID": 2,
        "PAID": 3,
        "FAILED": 0
      },
      "topSellingItems": [
        {
          "bakeryItemId": "clx...",
          "name": "Artisan Butter Croissant",
          "category": "Pastry",
          "quantitySold": 4,
          "revenueSatang": 34000
        }
      ],
      "dateRange": {
        "from": "2026-11-01",
        "to": "2026-11-30"
      }
    }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR`: invalid date format or `from > to`.
  - `401 UNAUTHORIZED`: missing/invalid JWT.
  - `403 FORBIDDEN`: authenticated as `CUSTOMER`.

---

## 2. F-09: Multi-Criteria Order Search & Filtering *(Planned for Final Delivery)*

### 2.1 `GET /api/operator/orders` *(Extended Query Parameters)*
Extends the existing shared operator queue endpoint with optional filter query parameters (all filters compose via logical `AND`; omitting all query params preserves existing Sprint 1/2 behavior):
- **Auth Required:** Yes (`OPERATOR`)
- **Optional Query Parameters:**
  - `status`: one of `PENDING | ACCEPTED | BAKING | READY_FOR_PICKUP | COMPLETED | CANCELLED`
  - `paymentStatus`: one of `UNPAID | PAID | FAILED`
  - `q`: trimmed search term (matches `order.id`, `customer.name`, or `customer.email` case-insensitively)
  - `from` / `to`: `YYYY-MM-DD` date bounds on `order.createdAt`
  - `minTotal` / `maxTotal`: non-negative integer satang bounds on `order.totalAmount` (`minTotal <= maxTotal`)
- **Success Response (`200 OK`):** `{ "orders": [ ...OrderResponseV2 ] }`
- **Errors:**
  - `400 VALIDATION_ERROR`: invalid enum value, invalid date, negative satang bound, or `minTotal > maxTotal` / `from > to`.
  - `401 UNAUTHORIZED`, `403 FORBIDDEN`.
