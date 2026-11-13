# CrustCraft Artisan Bakery — Deployment & Cloud Infrastructure Specification
## Lab 5: Cloud Deployment and CI/CD Pipeline on Google Cloud Platform (GCP)
### Document Version: 1.1.0-issue03 (Episode 3 Docker Compose)

---

## 1. Team & Project Metadata

| Attribute | Specification / Value |
|---|---|
| **Application Name** | CrustCraft Artisan Bakery Pre-Order & Fulfillment System |
| **Course & Semester** | CPE 334 Introduction to Software Engineering in the Age of AI Agents, Semester 1/2026, KMUTT |
| **Theme** | Theme 4: E-Commerce / Ordering System |
| **Team Member 1 (Project Creator & Owner)** | Purin Mebotsom (Student ID: `67070507214`, GitHub: [`@meebotsompurin-stack`](https://github.com/meebotsompurin-stack)) |
| **Team Member 2 (Co-Developer & Editor)** | Saksorn Buranatananun (Student ID: `67070507208`, GitHub: [`@poom2548`](https://github.com/poom2548)) |
| **GitHub Repository** | [`meebotsompurin-stack/crustcraft-bakery-order`](https://github.com/meebotsompurin-stack/crustcraft-bakery-order) (Public per `R-12`) |
| **Default Branch (Production)** | `main` (Protected release gate; merges trigger CD) |
| **Integration Branch (Staging)** | `lab-5-staging` (Integration branch for Lab 5 feature & doc PRs) |
| **Target GCP Project Name** | `cpe334-crustcraft` |
| **Target GCP Project ID** | `cpe334-crustcraft` (Globally unique, immutable) |
| **GCP Target Region** | `asia-southeast1` (Singapore) |
| **Budget Alert Identifier** | `crustcraft-lab5-budget` |
| **Cloud Run Service Name** | `crustcraft` |
| **Cloud Run Migration Job Name** | `crustcraft-migrate` |
| **Cloud SQL Instance Name** | `crustcraft-pg` (PostgreSQL 16, Enterprise Edition, `db-f1-micro`) |
| **Public Service URL** | `https://crustcraft-<hash>-as.a.run.app` *(Populated upon initial deployment in Episode 5)* |

---

## 2. Cloud Foundation, IAM & Fiscal Guardrails (Episode 1 Baseline)

### 2.1 GCP Free Trial & Billing Foundation (Handout §4.4, Guide 1.1)
- **Account Type:** Individual, Country: Thailand.
- **Registration Policy:** Registered using a personal Gmail account that has never utilized a GCP Free Trial. The university domain account (`@mail.kmutt.ac.th`) is strictly avoided to prevent automated prepayment enforcement or domain policy restrictions.
- **Credit Allocation:** USD 300.00 (~THB 10,078) Free Trial credit valid for 90 days.
- **Card Authorization Verification:** Temporary verification hold of ~900 THB placed and released by Google; no real prepayment paid.
- **Billing Integrity Rule:** **Zero Prepayment & Zero Account Upgrade.** The team will never click "Upgrade" on the billing account. If GCP prompts for prepayment or reports a closed billing status, work halts immediately, evidence is recorded, and the course teaching assistant is notified.

### 2.2 Fiscal Guardrails: Alerts-Only Budget Configuration (Handout §5, Guide 1.5)
To satisfy the mandatory cost-control requirements of Handout §5 prior to creating any billable cloud infrastructure (such as Cloud SQL), an alerts-only budget is established:

| Budget Parameter | Configured Value | Justification / Operational Policy |
|---|---|---|
| **Budget Name** | `crustcraft-lab5-budget` | Unique identifier for CPE 334 Lab 5 monitoring |
| **Enforcement Policy** | **Alerts only (available to all services)** | **NEVER select Spend cap enforcement.** A spend cap forcibly shuts down services when hit, causing an outage during TA grading or Lab 6 partner UAT. |
| **Time Range** | Custom range: Today through **15 December 2026** | Spans through the end of Semester 1/2026 Final Project grading |
| **Project Scope** | `cpe334-crustcraft` only | Isolates billing calculations strictly to this academic project |
| **Service Scope** | All services | Monitors Cloud SQL, Cloud Run, Artifact Registry, Secret Manager, Cloud Build |
| **Savings (Discounts & Credits)** | **Unchecked / Cleared (Both `Savings programs` & `Other savings` unticked)** | Mandatory: Ensures the budget calculates actual resource consumption against the thresholds while the $300 Free Trial credit pays the bill. |
| **Target Amount** | **USD 250.00** (~THB 8,400) | Allocates the majority of the $300 credit while reserving a $50 contingency buffer. Projected 1.5-month spend is ~$21–$27. |

#### Actual Cost Notification Thresholds:
1. **10% ($25.00):** Expected total expenditure boundary for the entire 1.5-month project lifecycle.
2. **20% ($50.00):** Warning trigger: Indicates consumption is double the projected estimate; prompts an immediate resource audit.
3. **50% ($125.00):** Elevated trigger: Abnormal consumption pattern detected; immediate investigation required.
4. **90% ($225.00):** Critical trigger: Credit depletion alert; guarantees notification before the $300 credit limit is breached.

#### Notification Routing:
- **Billing Administrators:** Default notification enabled (emails Purin Mebotsom, Project Creator & Owner).
- **Monitoring Email Notification Channel:** Configured via Cloud Monitoring and linked to `crustcraft-lab5-budget` targeting Saksorn Buranatananun's personal Gmail. This ensures both co-developers receive simultaneous budget alerts despite the `Editor` role having no native billing admin access.

### 2.3 IAM Least-Privilege Hierarchy (Handout §4.4, Guide 1.3, 1.4, 6.2)
Access control follows the principle of least privilege (PoLP) across human engineers and automated workload identities:

| Principal | Identity | Assigned Role | Scope & Permission Rationale |
|---|---|---|---|
| **Project Creator (Human)** | Purin Mebotsom (`@meebotsompurin-stack`) | `roles/owner` | Project creation, billing link management, IAM assignment, project lifecycle. |
| **Co-Developer (Human)** | Saksorn Buranatananun (`@poom2548`) | `roles/editor` (`Editor` under Basic) | Full build, edit, and deployment access. Explicitly restricted from altering project IAM or billing accounts. |
| **Cloud Run Runtime SA (Automated)** | `crustcraft-runner@cpe334-crustcraft.iam.gserviceaccount.com` | `roles/cloudsql.client`, Secret Manager Secret Accessor (per secret) | Minimal execution identity for Cloud Run web container and migration job. Cannot read unintended secrets, manage IAM, or deploy services. |
| **GitHub Actions Deployer SA (Automated)** | `crustcraft-deployer@cpe334-crustcraft.iam.gserviceaccount.com` | `roles/run.developer` (bound to `crustcraft` service and job), `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` (on `crustcraft-runner` only) | Dedicated deployment identity assumed via Workload Identity Federation (WIF). Strictly forbidden from holding static JSON keys (`R-02`, Guide Ep. 6). |

### 2.4 Continuous Availability Policy (Handout §3, §12, Master Plan §4.1)
- **Mandatory Policy:** Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.
- **Teardown Restriction:** Manual deletion or suspension of Cloud SQL or Cloud Run before official instructor clearance is strictly prohibited.
- **Idle Optimization:** Cloud Run is configured with `--min-instances=0` (scales to zero when idle) and `--max-instances=3` to preserve credits without compromising endpoint responsiveness.

---

## 3. Architecture & Stack Adaptation from Reference Kit

CrustCraft adapts the reference architecture (TokTickIT starter kit) while tailoring it to the bakery ordering domain model:

```
                                  [ GitHub Actions CI/CD ]
                                             │
                       (OIDC Token / Workload Identity Federation)
                                             ▼
                             [ Google Cloud Platform ]
                                (Project: cpe334-crustcraft)
                                             │
       ┌─────────────────────────────────────┼─────────────────────────────────────┐
       │                                     │                                     │
       ▼                                     ▼                                     ▼
[ Artifact Registry ]              [ Secret Manager ]                      [ Cloud Run Job ]
 asia-southeast1-docker.pkg.dev       - crustcraft-database-url             crustcraft-migrate
 repo: crustcraft                     - crustcraft-jwt-secret               (prisma migrate deploy
 image: crustcraft:<commit-sha>       - crustcraft-admin-password            + non-destructive seed)
       │                               - crustcraft-demo-password                   │
       │ (pull image digest)                 │                                      │ (run before service)
       └──────────────────────────────┐      │ (mount env var)      ┌───────────────┘
                                      ▼      ▼                      ▼
                                [ Cloud Run Service ]
                                  Service: crustcraft
                                  Image: crustcraft@sha256:...
                                  Port: 3000 (dynamic $PORT)
                                  Runtime SA: crustcraft-runner
                                             │
                                   (Unix Socket Connection)
                                             ▼
                                [ Cloud SQL Instance ]
                                  Name: crustcraft-pg
                                  Engine: PostgreSQL 16
                                  Tier: db-f1-micro (Enterprise Edition)
                                  Storage: 10GB SSD (Auto-increase: OFF)
```

### 3.1 Stack Adaptation Matrix

| Architectural Layer | TokTickIT Reference Kit | CrustCraft Production Architecture | Adaptation Rationale |
|---|---|---|---|
| **Backend Runtime** | Node.js Express (JavaScript/TypeScript) | Node.js Express (TypeScript) | Direct alignment; full type safety and modular router design |
| **Frontend Framework** | React (Vite) served via Nginx | React (Vite) + Tailwind CSS bundled & served statically via Express in production | Single-container architecture eliminates CORS complexities and optimizes Cloud Run memory footprint |
| **Database Engine** | PostgreSQL 16 | PostgreSQL 16 (Cloud SQL `db-f1-micro`, Enterprise Edition) | Enterprise edition required by GCP for `db-f1-micro` tier; `--no-storage-auto-increase` prevents runaway disk costs |
| **Database ORM** | Prisma ORM | Prisma ORM 5.22 | Migrated from SQLite to PostgreSQL 16 schema with integer satang currency |
| **Containerization** | Multi-stage Dockerfile (Nginx + Node) | Multi-stage Dockerfile (Node.js 22 Alpine building client & server, runtime listening on dynamic `$PORT`) | Fully compliant with Cloud Run container runtime contract |
| **CI/CD & Security** | GitHub Actions + WIF | GitHub Actions (`ci-docker.yml`, `deploy.yml`) + WIF (`github-actions` pool) | Zero long-lived JSON keys; OIDC token exchange gated to `main` branch and `demo` environment |

### 3.2 Cloud-Ready Probes & Single-Container Static Serving (Episode 2)

To satisfy the Cloud Run container runtime contract and enable automated health/readiness monitoring:
- **Liveness Probe (`GET /api/health`):** Returns HTTP `200 OK` with payload `{"status":"ok"}` indicating the Node.js Express process is responsive.
- **Readiness Probe (`GET /api/ready`):** Executes an active database connectivity check (`await prisma.$queryRaw`SELECT 1`;`). Returns HTTP `200 OK` with `{"status":"ready","db":"connected"}` when PostgreSQL is reachable, or HTTP `503 Service Unavailable` with error envelope when disconnected.
- **Single-Container Static Serving (`NODE_ENV=production`):** When running in production, Express directly serves the compiled client Single Page Application (SPA) from `client/dist`. A wildcard route (`*`) forwards non-API requests to `index.html` for client-side React routing, while API requests (`/api/*`) are handled by backend route handlers.
- **Dynamic Port Binding:** Server dynamically binds to `0.0.0.0:$PORT` defaulting to `Number(process.env.PORT) || 3000` to comply with the Google Cloud Run container contract.

---

## 4. Environment Variables Specification (Episode 2 Implementation)

*This section documents every environment variable read by CrustCraft, fulfilling Handout `R-02`. Zero real secrets are committed into version control.*

| Environment Variable | Classification | Injection Mechanism | Purpose & Expected Value Format |
|---|---|---|---|
| `NODE_ENV` | Plain Config | Cloud Run / Docker ENV / `.env` | Environment mode (`development` locally; `production` on Cloud Run to activate static client serving). |
| `PORT` | Plain Config | Cloud Run Container Contract / `.env` | Port assigned dynamically by Cloud Run via `$PORT` (defaults to `3000`). Server listens on `0.0.0.0:$PORT`. |
| `DATABASE_URL` | **Secret** | Secret Manager (`crustcraft-database-url`) / `.env` | PostgreSQL 16 connection string (Unix socket on Cloud Run: `postgresql://user:pass@localhost/crustcraft?host=/cloudsql/PROJECT:REGION:INSTANCE`; TCP locally). |
| `JWT_SECRET` | **Secret** | Secret Manager (`crustcraft-jwt-secret`) / `.env` | High-entropy secret key for signing and verifying customer and operator authentication tokens. |
| `ADMIN_PASSWORD` | **Secret** | Secret Manager (`crustcraft-admin-password`) | Initial password for the seeded Operator/Admin account (`admin@crustcraft.com`). |
| `SEED_DEMO_DATA` | Plain Config | Cloud Run ENV | Boolean (`true`/`false`) toggling seed execution in migration job. |
| `DEMO_USER_PASSWORD` | **Secret** | Secret Manager (`crustcraft-demo-password`) | Shared baseline password for customer demo accounts (shared privately for Lab 6 UAT). |
| `CLIENT_ORIGIN` | Plain Config | Cloud Run ENV / `.env` | Allowed CORS origin for local development (`http://localhost:5173`). Optional in single-container production. |
| `VITE_API_URL` | Plain Config | Client `.env` / Build ARG | API base URL for client Vite build (`http://localhost:3000` in local dev; empty string in production). |

---

## 5. Local & CI Build, Test, and Containerization Commands

### 5.1 Local Development & Container Validation (`C-03`)
```bash
# Clean clone verification (R-01, R-02, C-03)
git clone https://github.com/meebotsompurin-stack/crustcraft-bakery-order.git
cd crustcraft-bakery-order
cp .env.example .env

# Local development without Docker
npm ci
npm run dev

# Containerized execution via Docker Compose (Multi-stage build, Postgres 16, Auto-migration)
docker compose up --build -d

# Inspect service statuses and logs
docker compose ps -a
docker compose logs -f app

# Health & Readiness probe verification
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/ready

# Graceful teardown (with volume cleanup)
docker compose down -v
```

#### Docker Compose Service Topology:
1. **`db` (`postgres:16-alpine`):** PostgreSQL database engine listening on container port `5432`. Includes persistent volume `postgres_data` and healthcheck via `pg_isready`.
2. **`migrate` (`crustcraft-migrate`):** Ephemeral container built from root `Dockerfile`. Waits for `db` to be healthy (`condition: service_healthy`), executes `npx prisma migrate deploy && npm run seed`, then exits cleanly with code 0.
3. **`app` (`crustcraft-app`):** Web container built from root `Dockerfile`. Waits for `migrate` to succeed (`condition: service_completed_successfully`), binds to `0.0.0.0:3000` mapped to host `3000:3000`, serves the compiled React Vite SPA and Express REST API as non-root `node` user.

### 5.2 Database Migration & Seeding Commands
```bash
# Apply pending Prisma migrations
npx prisma migrate deploy --schema=prisma/schema.prisma

# Execute idempotent database seed
npx tsx prisma/seed.ts
```

### 5.3 CI Workflow Commands (`ci-docker.yml`)
```bash
# Workspace unit & integration tests
npm ci
npm run build
npm test
docker build -t crustcraft:local .
```

---

## 6. Repeatable Release & Rollback Procedure

### 6.1 Release Flow (`R-07`, `C-06`)
1. Developer opens PR from feature branch into `lab-5-staging`.
2. Automated check `test-and-docker` runs on GitHub Actions and must pass.
3. Teammate conducts peer review with specific findings and approves (`R-09`).
4. PR is merged to `lab-5-staging`.
5. Release PR opened from `lab-5-staging` into `main`.
6. Merge to `main` triggers `.github/workflows/deploy.yml` via WIF.
7. Image built, pushed to Artifact Registry tagged with `${{ github.sha }}`, migration job executed, Cloud Run updated to image digest, smoke test validates `/api/ready`.

### 6.2 Rollback Flow (`R-08`, Recommended Practice Handout §5)
1. Navigate to GitHub Actions > **Deploy demo** workflow.
2. Click **Run workflow**, select branch `main`, and supply the target 40-character commit SHA in `image_tag`.
3. Pipeline skips build/migration and deploys the pre-existing validated image digest to Cloud Run with zero database disruption.

### 6.3 Running Commit Lookup Procedure (`R-08`)
To determine and verify the exact commit SHA currently serving live traffic on Cloud Run:
1. **GitHub Actions Summary:** Review the latest executed `Deploy demo` workflow run summary; it outputs the 40-character Commit SHA (`$IMAGE_TAG`) and immutable image digest (`$DEPLOYED_IMAGE`).
2. **Cloud Run Console:** In GCP Console > Cloud Run > Service `crustcraft` > Revisions tab, inspect the active revision's container image URL.
3. **gcloud CLI Verification Command:**
   ```bash
   gcloud run services describe crustcraft \
     --region=asia-southeast1 \
     --format='value(status.latestReadyRevisionName, spec.template.spec.containers[0].image)'
   ```

---

## 7. Verification & Handout Evidence Index (Traceability Matrix)

| Handout Check / Req | Rubric Category | Target Artifact / Direct Link | Identification / Version | Verification Result |
|---|---|---|---|---|
| **`AC-LAB5-01-01` / `R-03`** | Cloud Foundation | GCP Billing Console (`Overview` & `Credits`) | `cpe334-crustcraft` | $300 credit verified; no red banner |
| **`AC-LAB5-01-02` / Handout §5** | Fiscal Guardrail | GCP Billing (`Budgets & caps`) | `crustcraft-lab5-budget` | $250 alerts-only; 4 thresholds (10/20/50/90%); monitoring email channel linked |
| **`AC-LAB5-01-03` / Handout §4.4** | IAM Least Privilege | GCP IAM Console & Cloud Shell | `cpe334-crustcraft` | Owner + Editor assigned; `billingEnabled=True` |
| **`AC-LAB5-01-04` / `R-12`, `R-10`** | Repository Hygiene | GitHub Repo Settings & Issues | `meebotsompurin-stack/crustcraft-bakery-order` | Public repo; secret scanning push protection enabled; `lab5` labels active |
| **`C-01` (`R-05`)** | CI & Quality Gate | PR #X & Actions CI Run | Commit `TBD` | CI passing with comprehensive test summary |
| **`C-02` (`R-06`)** | Quality Gate | Failing PR from `test/prove-gate` | Commit `TBD` | `test-and-docker` failed; merge blocked |
| **`C-03` (`R-01`, `R-02`)| Docker Reproducibility | Local / Cloud Shell execution | Commit `TBD` | Fresh clone builds & runs from `.env.example` |
| **`C-04` (`R-03`)** | GCP Deployment | Live Cloud Run Public URL | Commit `TBD` | Auth, pre-order catalog, operator acceptance working live |
| **`C-05` (`R-04`)** | Persistence | Cloud SQL live data test | Revisions `A` & `B` | Pre-order survives container restart & redeploy |
| **`C-06` (`R-07`–`R-10`)| Repeatable Release | Staging -> Main PR & Revision History | Full SHA `TBD` | Revision digest matches Artifact Registry commit tag |
