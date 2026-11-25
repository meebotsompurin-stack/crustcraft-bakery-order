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

- **Backend:** Node.js + Express.js (TypeScript), Prisma ORM, PostgreSQL 16 (local Docker & GCP Cloud SQL)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Testing:** Vitest + Supertest (Backend), Vitest + React Testing Library + `jsdom` (Frontend), Playwright (Multi-Viewport E2E)
- **Deployment:** Unified Docker + GitHub Actions (WIF) + GCP Cloud Run & Cloud SQL (Lab 5)

## Sprint Roadmap & Releases

| Sprint / Lab | Deliverable | Due Date | Key Features / Scope | Status / Release |
|---|---|---|---|---|
| Sprint 1 | Deliverable 1 | 8 Nov 2026 | Auth/RBAC (`F-01`), Catalog (`F-02`), Customer Pre-Order (`F-03`), Operator Acceptance (`F-04`) | ✅ `v1.0.0-sprint1` |
| Labs 5–6 | Cloud CI/CD & UAT | 15–22 Nov 2026 | GCP Cloud Run + Cloud SQL PostgreSQL 16, CI/CD WIF, Lab 6 UAT `#58` fix | ✅ `c876686` |
| Sprint 2 | Deliverable 2 (Part B) | 29 Nov 2026 | Catalog Admin (`F-05`), Fulfillment & Cancellation (`F-06`), Simulated Payment (`F-07`) | ✅ `v2.0.0-sprint2` |
| Lab 7 | Maintenance & Metrics | 29 Nov 2026 | `CR-01` (`BR-03` max 5 per item cap), Metrics & Release Readiness | ✅ `v2.0.1-lab7` |
| Sprint 3 (Progress) | Deliverable 2 (Part C/E) | 29 Nov 2026 | Sales & Order Summary Reporting (`F-08`) integrated with Sprints 1–2 & Lab 7 | ✅ `v2.1.0-s3-progress` |
| Sprint 3 (Final) | Final Delivery | 13 Dec 2026 | Order Search/Filter (`F-09`), CI hardening, Final UAT & Demo Video | ⬜ Planned (`v3.0.0`) |

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
- **PostgreSQL 16** (or Docker Desktop via `docker compose up -d db`)
- **Browser (for E2E tests)**: Chromium (installed via `npx playwright install chromium`)

### 2. Installation & Environment Configuration
Clone the repository, install dependencies, and copy `.env.example` to `.env`:
```bash
cd crustcraft-bakery-order
npm install
cp .env.example .env
```
Configure `DATABASE_URL` (PostgreSQL 16) and `JWT_SECRET` in `.env`. Never commit `.env` or production secrets to Git.

### 3. Database Migration & Seeding
Apply PostgreSQL Prisma migrations and load the initial seed data (Operator, Customers, and Bakery items):
```bash
# Generate Prisma client & apply migrations
npx prisma generate
npx prisma migrate deploy

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
- **Backend Unit & API Integration Tests (Vitest + Supertest against PostgreSQL 16):**
  ```bash
  npm test
  ```
- **Frontend Component Unit Tests (Vitest + React Testing Library + `jsdom`):**
  ```bash
  npm run test --workspace=client
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
The database seed (`prisma/seed.ts`) creates the following accounts for local development and testing using environment variables (never commit real passwords or production secrets to Git):

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Operator** | `admin@crustcraft.com` | Set via `ADMIN_PASSWORD` in `.env` | Order Queue (`/operator/orders`), Catalog Admin (`/operator/catalog`), Sales Reports (`/operator/reports`) |
| **Customer 1** | `customer1@test.com` | Set via `DEMO_USER_PASSWORD` in `.env` | Bakery Catalog (`/catalog`), Pre-Order Form (`/orders/new`), My Orders (`/orders`) |
| **Customer 2** | `customer2@test.com` | Set via `DEMO_USER_PASSWORD` in `.env` | Customer features (isolated order history) |

## License

For academic use only — CPE 334 KMUTT 2026.
