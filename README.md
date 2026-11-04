# CrustCraft Artisan Bakery — Pre-Order & Fulfillment System

> **CPE 334 Introduction to Software Engineering in the Age of AI Agents**  
> Semester 1/2026 | KMUTT Department of Computer Engineering  
> **Theme 4:** E-Commerce / Ordering System

## Team

| Name | Student ID | GitHub | Role |
|---|---|---|---|
| Purin Mebotsom | 67070507214 | [@meebotsompurin-stack](https://github.com/meebotsompurin-stack) | Co-Developer |
| Saksorn Buranatananun | 67070507208 | [@poom2548](https://github.com/poom2548) | Co-Developer |

## Project Overview

CrustCraft is a pre-order and fulfillment management system for an artisan bakery. Customers browse the bakery catalog and place pre-orders; Operators manage the order queue through a defined fulfillment lifecycle.

## Tech Stack

- **Backend:** Node.js + Express.js (TypeScript), Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Testing:** Vitest + Supertest, React Testing Library, Playwright (E2E)
- **Deployment:** Docker + GCP (Lab 5)

## Sprint Roadmap

| Sprint | Deliverable | Due Date | Key Features |
|---|---|---|---|
| Sprint 1 | Deliverable 1 | 8 Nov 2026 | Auth/RBAC, Catalog, Customer Orders, Operator Acceptance |
| Sprint 2 | Deliverable 2 | 29 Nov 2026 | Catalog Admin, Fulfillment Lifecycle, Payment Simulation |
| Sprint 3 | Final Delivery | 13 Dec 2026 | Reporting Dashboard, Search/Filter, Regression & UAT |

## Repository Structure

```
crustcraft-bakery-order/
├── plan/                  # Spec-Driven Development planning documents (Git-tracked)
│   ├── 00-project-state.md
│   ├── 01-conventions.md
│   ├── 02-feature-coverage.md
│   ├── 03-macro-plan.md
│   └── sprint-1-issues/
│       ├── INDEX.md
│       └── ISSUE-00.md ... ISSUE-06.md
├── docs/                  # Engineering Contracts (created in ISSUE-01 & ISSUE-02)
├── server/                # Express backend (created in ISSUE-03)
├── client/                # React frontend (created in ISSUE-03)
├── e2e/                   # Playwright E2E tests (created in ISSUE-06)
└── README.md
```

## Setup Guide

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or newer
- **Browser (for E2E tests)**: Chromium (installed via `npx playwright install chromium`)

### 2. Installation
Clone the repository and install dependencies at the workspace root:
```bash
cd crustcraft-bakery-order
npm install
```

### 3. Database Migration & Seeding
Initialize the SQLite development database and load the initial seed data (Operator, Customers, and Bakery items):
```bash
# Run database migrations
npm run db:migrate

# Seed default test users and catalog items
npm run seed
```

### 4. Running Development Servers
Start both backend (Express on port `3001`) and frontend (Vite React on port `5173`) concurrently:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Running Automated Tests
- **Unit & API Integration Tests (Vitest + Supertest):**
  ```bash
  npm test
  ```
- **End-to-End Tests (Playwright across Desktop 1280px, Tablet 768px, and Mobile 375px):**
  ```bash
  npm run test:e2e
  ```
- **Production Build Check:**
  ```bash
  npm run build
  ```

### 6. Default Test Credentials
The database seed creates the following default accounts for development and testing:

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Operator** | `operator@crustcraft.com` | `operator123` | Incoming Order Queue (`/operator/orders`), Order Details, Acceptance |
| **Customer 1** | `customer1@test.com` | `customer123` | Bakery Catalog (`/catalog`), Pre-Order Form (`/orders/new`), My Orders (`/orders`) |
| **Customer 2** | `customer2@test.com` | `customer123` | Customer features (isolated order history) |

## License

For academic use only — CPE 334 KMUTT 2026.
