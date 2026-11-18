# CrustCraft Artisan Bakery — Deployment & Cloud Infrastructure Specification
## Lab 5: Cloud Deployment and CI/CD Pipeline on Google Cloud Platform (GCP)
### Document Version: 1.8.0-issue09 (Handout §4.3 Complete Deployment Reference & Lab 5 Verification)

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
| **Target GCP Project Name** | `cpe334-bobcat` |
| **Target GCP Project ID** | `cpe334-bobcat` (Project Number: `<PROJECT_NUMBER>`) |
| **GCP Target Region** | `asia-southeast1` (Singapore) |
| **Budget Alert Identifier** | `crustcraft-lab5-budget` |
| **Cloud Run Service Name** | `crustcraft` |
| **Cloud Run Migration Job Name** | `crustcraft-migrate` |
| **Cloud SQL Instance Name** | `crustcraft-pg` (PostgreSQL 16, Enterprise Edition, `db-f1-micro`) |
| **Public Service URL** | `https://crustcraft-d7wyiqxska-as.a.run.app` (`https://crustcraft-<PROJECT_NUMBER>.asia-southeast1.run.app`) |

### 1.2 GCP Project & Resource Inventory (Handout §4.3)

| Resource Category | Exact GCP Resource Name / Identifier | Region / Location | Configuration & Notes |
|---|---|---|---|
| **GCP Project ID** | `cpe334-bobcat` | Global | Project Number: `<PROJECT_NUMBER>` (Redacted per `S7`) |
| **GCP Target Region** | `asia-southeast1` | Singapore | Primary deployment region for all compute, database & registry resources |
| **Cloud Run Service** | `crustcraft` | `asia-southeast1` | Single-container Express + React SPA; `--min-instances=0`, `--max-instances=3` |
| **Cloud Run Migration Job** | `crustcraft-migrate` | `asia-southeast1` | Executes `npx prisma migrate deploy` (+ conditional seed) prior to traffic shift |
| **Cloud SQL Instance** | `crustcraft-pg` | `asia-southeast1` | PostgreSQL 16 Enterprise Edition (`db-f1-micro`, 10GB SSD, auto-increase OFF); DB & User: `crustcraft` |
| **Artifact Registry Repo** | `crustcraft` | `asia-southeast1` | Docker format: `asia-southeast1-docker.pkg.dev/cpe334-bobcat/crustcraft` |
| **Workload Identity Pool** | `github-actions` | `global` | Keyless OIDC federation pool for GitHub Actions CD |
| **WIF OIDC Provider** | `github-main` | `global` | Restricted via CEL condition to `main` branch & `demo` environment |
| **Runtime Service Account** | `crustcraft-runner@cpe334-bobcat.iam.gserviceaccount.com` | Project-scoped | `roles/cloudsql.client` + per-secret `roles/secretmanager.secretAccessor` |
| **Deployer Service Account** | `crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com` | Project-scoped | `roles/run.developer`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` (on `crustcraft-runner`); zero JSON keys |
| **Secret Manager Secrets** | `crustcraft-database-url`, `crustcraft-jwt-secret`, `crustcraft-admin-password`, `crustcraft-demo-password` | `asia-southeast1` / Global | Mounted as runtime environment variables via Cloud Run Secret bindings |
| **Billing Budget** | `crustcraft-lab5-budget` | Billing Account | USD 250.00 alerts-only budget (10%, 20%, 50%, 90% thresholds) |

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
| **Project Scope** | `cpe334-bobcat` only | Isolates billing calculations strictly to this academic project |
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
| **Cloud Run Runtime SA (Automated)** | `crustcraft-runner@cpe334-bobcat.iam.gserviceaccount.com` | `roles/cloudsql.client`, Secret Manager Secret Accessor (per secret) | Minimal execution identity for Cloud Run web container and migration job. Cannot read unintended secrets, manage IAM, or deploy services. |
| **GitHub Actions Deployer SA (Automated)** | `crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com` | `roles/run.developer` (bound to `crustcraft` service and job), `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` (on `crustcraft-runner` only) | Dedicated deployment identity assumed via Workload Identity Federation (WIF). Strictly forbidden from holding static JSON keys (`R-02`, Guide Ep. 6). |

### 2.4 Continuous Availability Policy (Handout §3, §12, Master Plan §4.1)
- **Mandatory Policy:** Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.
- **Teardown Restriction:** Manual deletion or suspension of Cloud SQL or Cloud Run before official instructor clearance is strictly prohibited.
- **Idle Optimization:** Cloud Run is configured with `--min-instances=0` (scales to zero when idle) and `--max-instances=3` to preserve credits without compromising endpoint responsiveness.

---

## 3. Stack & Changes from Reference Kit (Handout §4.3)

CrustCraft adapts the reference architecture (TokTickIT starter kit) into a unified **Express + React TypeScript Monorepo**, migrates persistence from **SQLite to PostgreSQL 16**, and adopts a **Single Container Serving** deployment model tailored for Google Cloud Run:

### 3.1 Key Architectural Changes from Reference
1. **Express + React Monorepo (npm Workspaces):**
   - Consolidated into a single repository using npm workspaces (`server/` for the Express + TypeScript REST API, `client/` for the React 18 + Vite + Tailwind CSS frontend, and root `prisma/` for shared schema and seeding).
2. **Migration from SQLite to PostgreSQL 16:**
   - Upgraded `prisma/schema.prisma` datasource provider from `sqlite` (`file:./dev.db`) to `postgresql` (PostgreSQL 16).
   - Removed hardcoded fallback credentials and SQLite paths from `prisma/seed.ts`, requiring `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` via environment variables in production.
   - Stored all monetary amounts as integer `satang` to prevent floating-point rounding discrepancies.
3. **Single Container Serving (Express Static Hosting):**
   - Instead of deploying separate Nginx (frontend) and Node.js (backend) containers, the unified multi-stage `Dockerfile` (`node:22-alpine`) compiles `client/dist` and `server/dist` into one non-root production image.
   - When `NODE_ENV=production`, Express serves static SPA assets from `client/dist`, routes `/api/*` to REST endpoints, and forwards all other routes (`*`) to `index.html` for client-side React Router navigation. This eliminates CORS overhead and reduces Cloud Run memory footprint.

```
                                  [ GitHub Actions CI/CD ]
                                             │
                       (OIDC Token / Workload Identity Federation)
                                             ▼
                             [ Google Cloud Platform ]
                                (Project: cpe334-bobcat)
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

### 3.2 Stack Adaptation Matrix

| Architectural Layer | TokTickIT Reference Kit | CrustCraft Production Architecture | Adaptation Rationale |
|---|---|---|---|
| **Backend Runtime** | Node.js Express (JavaScript/TypeScript) | Node.js Express (TypeScript) | Direct alignment; full type safety and modular router design |
| **Frontend Framework** | React (Vite) served via Nginx | React (Vite) + Tailwind CSS bundled & served statically via Express in production | Single-container architecture eliminates CORS complexities and optimizes Cloud Run memory footprint |
| **Database Engine** | PostgreSQL 16 | PostgreSQL 16 (Cloud SQL `db-f1-micro`, Enterprise Edition) | Enterprise edition required by GCP for `db-f1-micro` tier; `--no-storage-auto-increase` prevents runaway disk costs |
| **Database ORM** | Prisma ORM | Prisma ORM 5.22 | Migrated from SQLite to PostgreSQL 16 schema with integer satang currency |
| **Containerization** | Multi-stage Dockerfile (Nginx + Node) | Multi-stage Dockerfile (Node.js 22 Alpine building client & server, runtime listening on dynamic `$PORT`) | Fully compliant with Cloud Run container runtime contract |
| **CI/CD & Security** | GitHub Actions + WIF | GitHub Actions (`ci-docker.yml`, `deploy.yml`) + WIF (`github-actions` pool) | Zero long-lived JSON keys; OIDC token exchange gated to `main` branch and `demo` environment |

### 3.3 Cloud-Ready Probes & Dynamic Port Binding (Episode 2)

To satisfy the Cloud Run container runtime contract and enable automated health/readiness monitoring:
- **Liveness Probe (`GET /api/health`):** Returns HTTP `200 OK` with payload `{"status":"ok"}` indicating the Node.js Express process is responsive.
- **Readiness Probe (`GET /api/ready`):** Executes an active database connectivity check (`await prisma.$queryRaw`SELECT 1`;`). Returns HTTP `200 OK` with `{"status":"ready","db":"connected"}` when PostgreSQL is reachable, or HTTP `503 Service Unavailable` with error envelope when disconnected.
- **Single-Container Static Serving (`NODE_ENV=production`):** When running in production, Express directly serves the compiled client Single Page Application (SPA) from `client/dist`. A wildcard route (`*`) forwards non-API requests to `index.html` for client-side React routing, while API requests (`/api/*`) are handled by backend route handlers.
- **Dynamic Port Binding:** Server dynamically binds to `0.0.0.0:$PORT` defaulting to `Number(process.env.PORT) || 3000` to comply with the Google Cloud Run container contract.

---

## 4. Environment Variable Table (Handout §4.3 & R-02)

*This section documents every application and CI/CD environment variable used by CrustCraft. In compliance with `R-02` and `S6`, zero plaintext secrets are committed into version control (all sensitive values are represented using `<REDACTED>` or Secret Manager references).*

### 4.1 Application Runtime & Build Variables

| Variable Name | Purpose | Is Secret? | Source of Value |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL 16 connection string used by Prisma ORM (`postgresql://<USER>:<REDACTED>@localhost/crustcraft?host=/cloudsql/cpe334-bobcat:asia-southeast1:crustcraft-pg` via Unix socket on Cloud Run; TCP locally). | **Yes** | **GCP Secret Manager** (`crustcraft-database-url`) in Production; local `.env` / `docker-compose.yml` locally |
| `JWT_SECRET` | High-entropy cryptographic signing key for `httpOnly` JWT authentication cookies. | **Yes** | **GCP Secret Manager** (`crustcraft-jwt-secret`) in Production; local `.env` locally |
| `PORT` | TCP port the Express server binds to (`0.0.0.0:$PORT`). Defaults to `3000`. | **No** | **Cloud Run Container Contract** (injected dynamically as `$PORT`); local `.env` |
| `NODE_ENV` | Runtime mode (`development` locally; `production` on Cloud Run & Docker to enable static React SPA serving from `client/dist`). | **No** | **Cloud Run Service ENV** / `Dockerfile` / local `.env` |
| `VITE_API_URL` | Base API URL embedded into the client Vite bundle (`http://localhost:3000` in local dev; empty string `""` for same-origin serving in single-container production). | **No** | **Client `.env`** / Vite build environment |
| `ADMIN_PASSWORD` | Initial password for seeding the Operator/Admin account (`admin@crustcraft.com`). | **Yes** | **GCP Secret Manager** (`crustcraft-admin-password`) in Production; local `.env` locally |
| `DEMO_USER_PASSWORD` | Baseline password for seeded demo customer accounts (distributed privately for Lab 6 UAT). | **Yes** | **GCP Secret Manager** (`crustcraft-demo-password`) in Production; local `.env` locally |
| `SEED_DEMO_DATA` | Boolean flag (`true`/`false`) controlling whether `prisma/seed.ts` inserts demo catalog items and accounts. | **No** | **Cloud Run Job ENV** / `docker-compose.yml` / local `.env` |
| `CLIENT_ORIGIN` | Allowed CORS origin during split local development (`http://localhost:5173`). Not needed in single-container production. | **No** | Local `.env` |

### 4.2 GitHub Actions Environment Variables (`demo` Environment)

| Variable Name | Purpose | Is Secret? | Source of Value |
|---|---|---|---|
| `GCP_PROJECT_ID` | Target GCP Project ID (`cpe334-bobcat`) passed to `deploy/release.sh` and `gcloud`. | **No** | **GitHub Environment Variables** (`Settings > Environments > demo`) |
| `GCP_REGION` | Target GCP Region (`asia-southeast1`). | **No** | **GitHub Environment Variables** (`Settings > Environments > demo`) |
| `WIF_PROVIDER` | Full Workload Identity Provider resource path (`projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-actions/providers/github-main`). | **No** | **GitHub Environment Variables** (`Settings > Environments > demo`) |
| `WIF_SERVICE_ACCOUNT` | Deployer Service Account email (`crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com`). | **No** | **GitHub Environment Variables** (`Settings > Environments > demo`) |

---

## 5. Commands Guide: Build, Test, Run, Migrate & Seed (Handout §4.3)

All lifecycle commands are categorized across the three execution environments: **Local (Node)**, **Docker Compose (Container)**, and **Production (GCP)**.

### 5.1 Environment Command Matrix

| Operation | Local (Node.js) | Docker Compose (Container) | Production (GCP) |
|---|---|---|---|
| **Build** | `npm run build` | `docker compose build` | `docker build --tag "$IMAGE" .` (via `deploy.yml`) |
| **Test** | `npm test` / `npm run test:e2e` | `curl -f http://localhost:3000/api/ready` | `python3 deploy/smoke_test.py "$SERVICE_URL"` |
| **Run** | `npm run dev` (or `npm run start --workspace=server`) | `docker compose up --build -d` | `bash deploy/release.sh` (updates Cloud Run `crustcraft`) |
| **Migrate** | `npm run db:migrate` | Auto-executed by `migrate` container (`npx prisma migrate deploy`) | `gcloud run jobs execute crustcraft-migrate --region=asia-southeast1 --project=cpe334-bobcat --wait` |
| **Seed** | `npm run seed` | Auto-executed by `migrate` container (`npm run seed`) | Executed inside `crustcraft-migrate` job when `SEED_DEMO_DATA=true` |

### 5.2 Local Development (Node.js)
```bash
# 1. Clean clone & environment setup (R-01, R-02)
git clone https://github.com/meebotsompurin-stack/crustcraft-bakery-order.git
cd crustcraft-bakery-order
cp .env.example .env

# 2. Install dependencies & generate Prisma client
npm ci
npx prisma generate

# 3. Migrate & seed local PostgreSQL 16 database
npm run db:migrate          # runs: prisma migrate dev --schema=prisma/schema.prisma
npm run seed                # runs: npm run seed --workspace=server (tsx ../prisma/seed.ts)

# 4. Run development servers (Express API on :3000 + Vite Client on :5173)
npm run dev

# 5. Build production bundles & run automated test suites
npm run build               # builds server (tsc) and client (tsc && vite build)
npm test                    # runs Vitest unit & API integration tests in server/
npm run test:e2e            # runs Playwright end-to-end tests
```

### 5.3 Docker Compose (Containerized Local Stack)
```bash
# 1. Build multi-stage image, start Postgres 16, run migration/seed job, and start app
docker compose up --build -d

# 2. Inspect running services and application logs
docker compose ps -a
docker compose logs -f app

# 3. Verify liveness & readiness probes against containerized Express + React SPA
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/ready

# 4. Re-run database migration & seed container manually if needed
docker compose run --rm migrate

# 5. Graceful teardown (removes containers and local Postgres volume)
docker compose down -v
```

#### Docker Compose Service Topology:
1. **`db` (`postgres:16-alpine`):** PostgreSQL database engine on container port `5432` with persistent volume `postgres_data` and `pg_isready` healthcheck.
2. **`migrate` (`crustcraft-migrate`):** Ephemeral container built from root `Dockerfile`. Waits for `db` (`condition: service_healthy`), runs `npx prisma migrate deploy && npm run seed`, and exits with code `0`.
3. **`app` (`crustcraft-app`):** Production web container built from root `Dockerfile`. Waits for `migrate` (`condition: service_completed_successfully`), listens on `0.0.0.0:3000` (mapped to host `3000:3000`), and serves both the compiled React SPA and Express API as non-root user `node`.

### 5.4 CI Validation & Production Deployment (GCP)
```bash
# --- CI Offline Checks & Docker Build (.github/workflows/ci-docker.yml) ---
bash -n deploy/deploy.sh deploy/teardown.sh deploy/release.sh
bash deploy/tests/test_deploy_stub.sh
bash deploy/tests/test_release_stub.sh
python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
docker build -t crustcraft-app:latest .

# --- One-Time Initial GCP Provisioning (Cloud Shell, Episode 5) ---
DRY_RUN=1 PROJECT_ID="cpe334-bobcat" bash deploy/deploy.sh
PROJECT_ID="cpe334-bobcat" bash deploy/deploy.sh --demo

# --- Automated Production Release & Smoke Verification (GitHub Actions CD) ---
# Executed automatically on merge to main via .github/workflows/deploy.yml:
# 1. Build & Push to Artifact Registry (tagged with 40-char commit SHA)
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet
docker build --tag "asia-southeast1-docker.pkg.dev/cpe334-bobcat/crustcraft/crustcraft:$IMAGE_TAG" .
docker push "asia-southeast1-docker.pkg.dev/cpe334-bobcat/crustcraft/crustcraft:$IMAGE_TAG"

# 2. Resolve immutable @sha256 digest, execute crustcraft-migrate job, and update Cloud Run service
PROJECT_ID="cpe334-bobcat" REGION="asia-southeast1" IMAGE_TAG="$IMAGE_TAG" bash deploy/release.sh

# 3. Verify live production endpoints
SERVICE_URL=$(gcloud run services describe crustcraft --region=asia-southeast1 --project="cpe334-bobcat" --format='value(status.url)')
python3 deploy/smoke_test.py "$SERVICE_URL"
```

> [!IMPORTANT]
> **Cloud SQL Migration Troubleshooting (`S6`):**
> If the Cloud Run Migration Job (`crustcraft-migrate`) encounters an issue during execution, inspect the execution logs using Cloud Logging before retrying:
> ```bash
> gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=crustcraft-migrate" --project="cpe334-bobcat" --limit=50 --format="value(textPayload)"
> ```

---

## 6. Repeatable Release & Rollback Procedure

### 6.1 Automated CI/CD Release Flow (`R-07`, `C-06`)
1. **Feature Integration:** Developer opens a PR from a feature branch into `lab-5-staging`. Automated check `test-and-docker` (`.github/workflows/ci-docker.yml`) must pass, followed by peer review approval (`R-09`), before merging into `lab-5-staging`.
2. **Release PR to `main`:** A Release PR is opened from `lab-5-staging` into `main`, enforced by the `protect-main` ruleset (requiring passing `test-and-docker` and 1 non-author approval).
3. **CD Pipeline Trigger (`.github/workflows/deploy.yml`):** Merging/pushing to `main` triggers the two-job `Deploy demo` workflow (`concurrency: deploy-demo`):
   - **Job 1 (`test`):** Re-runs `ci-docker.yml` as a mandatory quality gate.
   - **Job 2 (`deploy`):** Runs in GitHub Environment `demo`:
     1. **WIF Authentication:** Authenticates keylessly via `google-github-actions/auth@v2` using OIDC token exchange.
     2. **Docker Build & Push:** Builds the unified image and pushes it to Artifact Registry tagged with the 40-character `${{ github.sha }}`.
     3. **Immutable Digest & Migration (`deploy/release.sh`):** Resolves the tag to its immutable `@sha256:...` digest, updates and executes Cloud Run Job `crustcraft-migrate` (`--wait`), updates Cloud Run service `crustcraft` to the digest, and shifts 100% traffic (`--to-latest`).
     4. **Smoke Test & Summary:** Runs `python3 deploy/smoke_test.py "$SERVICE_URL"` and writes the Commit SHA, Image Digest, and Service URL to `$GITHUB_STEP_SUMMARY`.

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
     --project="cpe334-bobcat" \
     --format='value(status.latestReadyRevisionName, spec.template.spec.containers[0].image)'
   ```

---

## 7. Verification & Handout Evidence Index (Traceability Matrix)

| Handout Check / Req | Rubric Category | Target Artifact / Direct Link | Identification / Version | Verification Result |
|---|---|---|---|---|
| **`AC-LAB5-01-01` / `R-03`** | Cloud Foundation | GCP Billing Console (`Overview` & `Credits`) | `cpe334-bobcat` | $300 credit verified; no red banner |
| **`AC-LAB5-01-02` / Handout §5** | Fiscal Guardrail | GCP Billing (`Budgets & caps`) | `crustcraft-lab5-budget` | $250 alerts-only; 4 thresholds (10/20/50/90%); monitoring email channel linked |
| **`AC-LAB5-01-03` / Handout §4.4** | IAM Least Privilege | GCP IAM Console & Cloud Shell | `cpe334-bobcat` | Owner + Editor assigned; `billingEnabled=True` |
| **`AC-LAB5-01-04` / `R-12`, `R-10`** | Repository Hygiene | GitHub Repo Settings & Issues | `meebotsompurin-stack/crustcraft-bakery-order` | Public repo; secret scanning push protection enabled; `lab5` labels active |
| **`C-01` (`R-05`)** | CI & Quality Gate | PR #30 & Actions CI Run | PR #30 (`a518c83`) | CI passing (`test-and-docker`) with comprehensive test summary |
| **`C-02` (`R-06`)** | Quality Gate | Failing PR from `test/prove-gate` (PR #44) | PR #44 (`ad2e112`) | `test-and-docker` failed; merge blocked by `protect-main` |
| **`C-03` (`R-01`, `R-02`)| Docker Reproducibility | Local / Cloud Shell execution | Commit `TBD` | Fresh clone builds & runs from `.env.example` |
| **`C-04` (`R-03`)** | GCP Deployment | Live Cloud Run Public URL | Revision `crustcraft-00001-7kz` | `https://crustcraft-d7wyiqxska-as.a.run.app`; Auth, pre-order, catalog, operator queue verified live |
| **`C-05` (`R-04`)** | Persistence | Cloud SQL live data test (Ep. 5 & Ep. 8 §11) | `cpe334-bobcat:crustcraft-pg` | Ep. 5 Order `#cmwf1j83j0002jyk1mtqxtpus` persisted in live Cloud SQL (stock 50->47); Ep. 8 Restart (`C-05` Part A) & Rollback/Redeploy (`C-05` Part B) runbook & tracking table in §11 |
| **`C-06 (Release A)` / `R-07`–`R-10`** | Repeatable Release A | GitHub Actions `deploy-demo` run & Cloud Run Console | Commit: `e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534`<br>Digest: `sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5`<br>Revision: `crustcraft-00002-424` (Run `43853803871`) | Pipeline auto-deployed upon initial merge from `lab-5-staging` to `main`; smoke test PASSED |
| **`C-06 (Release B)` / `R-07`–`R-10`** | Repeatable Release B | GitHub Actions `deploy-demo` run & Cloud Run Console | Commit: `13932e96a1491ded7b7c1e4bfa03701b50b1e917`<br>Digest: `sha256:3808bb9b8425cae2569faf8dc119ac171ccdc827a0d20a0935746ee96d01264c`<br>Revision: `crustcraft-00003-ncv` (Run `44042906620`) | Pipeline auto-deployed UI update upon merge to `main`; smoke test PASSED; verified live in browser |
| **`LAB5-ISSUE-08` (Handout §5)** | Recommended Practice (Rollback) | `Deploy demo` `workflow_dispatch` & `deploy/release.sh` | `ROLLBACK=true` (`@sha256:...`) | Fast manual container image rollback (no-rebuild traffic switch) & roll-forward protocol documented in §11 |
| **`AC-LAB5-07-01` / `R-07`** | CD Pipeline Trigger & Concurrency | `.github/workflows/deploy.yml` | `push` on `main` + `workflow_dispatch`, group `deploy-demo` | Concurrency group with `cancel-in-progress: false` to safeguard active DB migrations |
| **`AC-LAB5-07-02` / `R-07`** | Two-Job Pipeline Architecture | `.github/workflows/deploy.yml` | Job 1: `test` (`ci-docker.yml`), Job 2: `deploy` | Quality Gate enforced; deployment blocked if test suite fails |
| **`AC-LAB5-07-03` / `R-08`, `C-06`** | Immutable Digest & Migration | `deploy/release.sh` | `@sha256:...` digest resolution & traffic migration | Resolves image tag to immutable digest; executes migration job; updates service and pushes 100% traffic |
| **`AC-LAB5-07-04` / `M8`, `R-08`** | Deployment Identification | GitHub Actions Step Summary & Console | Commit SHA (40 chars) + Image Digest | Verified via `$GITHUB_STEP_SUMMARY` and `gcloud run services describe` |
| **`AC-LAB5-06-01` / `R-02`, `R-03`** | Security / WIF IAM | GCP IAM Console (`crustcraft-deployer`) | `crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com` | `TBD` — Resource-level roles only (`run.developer`, `artifactregistry.writer`, `serviceAccountUser`); Keys tab empty |
| **`AC-LAB5-06-02` / `M6`, `R-03`** | Keyless WIF Auth | GCP WIF Console (`github-actions` / `github-main`) | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-actions/providers/github-main` | `TBD` — OIDC provider + CEL condition + `workloadIdentityUser` binding verified |
| **`AC-LAB5-06-03` / `R-02`** | GitHub Environment | GitHub Settings > Environments > `demo` | `demo` (`main` branch only) | `TBD` — 4 plain variables (`GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`) configured |
| **`AC-LAB5-06-04` / `M7`, `R-06`, `R-09`, `R-12`** | Merge Gate Governance | GitHub Settings > Rulesets > `protect-main` | Target: `main` (Active, No bypass) | `TBD` — 1 approval (no self-approval), required check `test-and-docker`, up-to-date branch, no force-push/deletion |
| **`AC-LAB5-06-05` / `C-02` (`R-06`)** | Merge Gate Proof | Temporary PR #44 from `test/prove-gate` -> `main` | PR #44, Commit `ad2e112` | **VERIFIED PASS** — `test-and-docker` failed (red); merge blocked; screenshot captured before closing PR & deleting branch |

---

## 8. Live Deployment Record & Verification Evidence (Episode 5)

*This section records the verified live Cloud Run deployment state following the successful execution of `deploy/deploy.sh` on Google Cloud Shell. In accordance with `S7` and Handout `R-02`, zero passwords, secrets, or credential tokens are committed into this document.*

### 8.1 Live Infrastructure Attributes

| Parameter | Cloud Resource Specification | Live Verified Configuration |
|---|---|---|
| **Target Project ID** | `cpe334-bobcat` | `cpe334-bobcat` (Project Number: `<PROJECT_NUMBER>`) |
| **GCP Target Region** | `asia-southeast1` (Singapore) | `asia-southeast1` |
| **Cloud Run Service Name**| `crustcraft` | `crustcraft` |
| **Public Service URLs** | Managed Cloud Run default URLs | Primary: `https://crustcraft-d7wyiqxska-as.a.run.app`<br>Direct: `https://crustcraft-<PROJECT_NUMBER>.asia-southeast1.run.app` |
| **Deployed Container Image** | Artifact Registry Docker image | `asia-southeast1-docker.pkg.dev/cpe334-bobcat/crustcraft/crustcraft@sha256:284a17d0804e97b8913c83807a930c37ab36a840735cf1d9ad7e0e35b3ab7e0c` |
| **Deployed Image Digest** | Immutable 64-character SHA256 | `sha256:284a17d0804e97b8913c83807a930c37ab36a840735cf1d9ad7e0e35b3ab7e0c` |
| **Active Service Revision**| Cloud Run immutable revision | `crustcraft-00001-7kz` |
| **Cloud Run Migration Job**| Ephemeral Prisma migration & seed | `crustcraft-migrate` (Execution status: `Succeeded` / Exit Code `0`) |
| **Cloud SQL Instance** | PostgreSQL 16 Enterprise (`db-f1-micro`) | `cpe334-bobcat:asia-southeast1:crustcraft-pg` (`10GB SSD`, Auto-increase: `OFF`, status: `RUNNABLE`) |
| **Runtime Service Account**| Dedicated Least-Privilege Identity | `crustcraft-runner@cpe334-bobcat.iam.gserviceaccount.com` |
| **Secret Manager Secrets**| Individual Secret Accessor bindings | `crustcraft-database-url`, `crustcraft-jwt-secret`, `crustcraft-admin-password`, `crustcraft-demo-password` (Masked and securely mounted) |

### 8.2 Endpoint & Smoke Test Verification Checklist

| Check / Test Target | Endpoint / Method | Verification Status | Verified Live Response / Evidence |
|---|---|---|---|
| **Liveness Probe** | `GET /api/health` | **VERIFIED PASS** | HTTP `200 OK` — `{"status":"ok"}` |
| **Readiness Probe** | `GET /api/ready` | **VERIFIED PASS** | HTTP `200 OK` — `{"status":"ready","db":"connected"}` |
| **Frontend Root** | `GET /` | **VERIFIED PASS** | HTTP `200 OK` — React SPA HTML document (`<!DOCTYPE html>...`) |
| **Public Catalog Guard**| `GET /api/catalog` | **VERIFIED PASS** | HTTP `401 UNAUTHORIZED` — Auth guard active protecting catalog per AC-04-01 |
| **Smoke Test Suite** | `python3 deploy/smoke_test.py` | **VERIFIED PASS** | All 6 checks passed successfully: |

```text
PASS /api/health
PASS /api/ready
PASS /
PASS /api/catalog (auth guard active: 401)
PASS login and authenticated /api/auth/me
PASS authenticated /api/catalog
PASS logout
```

### 8.3 Live Browser Domain Verification (`C-04`, `C-05`)

Real end-to-end business workflows were verified live on the production Cloud Run instance (`https://crustcraft-d7wyiqxska-as.a.run.app`):

1. **Customer Pre-Order Workflow (`CUSTOMER` Role):**
   - Authenticated as `Customer One` (`customer1@test.com`).
   - Selected `Artisan Butter Croissant` (unit price `฿85.00`, initial stock `50`).
   - Placed pre-order for quantity `3` with special pickup note.
   - **Order Creation Success:** Order generated with ID `#cmwf1j83j0002jyk1mtqxtpus`, total `฿255.00`, status `PENDING`.
   - **Real-Time Stock Decrement:** Item stock immediately decremented from `50` to `47` in live Cloud SQL.

2. **Operator Fulfillment Queue Workflow (`OPERATOR` Role):**
   - Authenticated as `Head Baker Admin` (`admin@crustcraft.com`).
   - Accessed Operator Queue at `/operator/queue`.
   - Order `#cmwf1j83j0002jyk1mtqxtpus` displayed with full customer details, line items, and pickup notes.
   - Verified operator order status transition controls.

3. **Security, RBAC & Boundary Enforcement:**
   - Customer accounts navigating to `/operator/*` are blocked with HTTP `403 FORBIDDEN`.
   - Unauthenticated API access to protected endpoints is rejected with HTTP `401 UNAUTHORIZED`.
   - Attempting to order quantities exceeding available stock returns HTTP `400 VALIDATION_ERROR` (Stock boundary protection).

### 8.4 Continuous Availability Policy Compliance Notice (`B1`)

> [!CAUTION]
> **MANDATORY RESOURCE AVAILABILITY DIRECTIVE (`B1`):**
> - **Continuous Running Required:** Keep the Cloud Run service (`crustcraft`) and Cloud SQL instance (`crustcraft-pg`) running continuously until the instructor officially announces the conclusion of grading and Lab 6 partner UAT is complete.
> - **No Pausing Permitted:** Pausing or suspending Cloud SQL during the grading and UAT window is strictly prohibited.
> - **No Early Teardown:** The teardown script (`deploy/teardown.sh`) permanently deletes Cloud SQL, the database, and all test orders. Running teardown before course grading concludes is strictly forbidden.
> - **Fiscal Efficiency Safeguard:** Cloud Run automatically scales to zero instances when idle (`--min-instances=0`), keeping ongoing costs minimal while maintaining continuous readiness for grading and peer testing.

---

## 9. Workload Identity Federation (WIF) & GitHub Merge Gate (Episode 6)

*This section specifies the keyless OIDC authentication architecture between GitHub Actions and Google Cloud Platform (`R-03`, `M6`), along with the `protect-main` branch protection ruleset and `C-02` (`R-06`, `M7`) merge-gate verification procedure. All cloud, GitHub settings, and `C-02` execution steps are performed by human operators after reviewing every command.*

### 9.1 Deployer Service Account & Least Privilege (`AC-LAB5-06-01`)

- **Required APIs:** Enable `iamcredentials.googleapis.com` and `sts.googleapis.com` on the target GCP project.
- **Deployer Service Account:** `crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com`
- **Resource-Level Roles Only:**
  - `roles/run.developer` on Cloud Run service `crustcraft` and Cloud Run job `crustcraft-migrate` (region `asia-southeast1`).
  - `roles/artifactregistry.writer` on Artifact Registry repository `crustcraft` (`asia-southeast1`).
  - `roles/iam.serviceAccountUser` on `crustcraft-runner@cpe334-bobcat.iam.gserviceaccount.com` only.
- **Explicit Restrictions:**
  - **No `roles/owner`, `roles/editor`, or project-wide roles** may be granted to `crustcraft-deployer`.
  - **Zero JSON Keys:** Authentication is keyless WIF OIDC only. The Service Account **Keys** tab must remain empty, and nobody may click **"Add key"** or download/export a JSON key file (`R-02`, Lab Sheet §4.3).

### 9.2 Workload Identity Pool, OIDC Provider & CEL Condition (`AC-LAB5-06-02`, `M6`)

1. **Obtain Team-Specific GitHub Numeric IDs (Read-Only):**
   Run the following read-only commands (or inspect `https://api.github.com/repos/meebotsompurin-stack/crustcraft-bakery-order`) to retrieve the team's own numeric repository and owner IDs. **Never copy another team's IDs.**
   ```bash
   gh api repos/meebotsompurin-stack/crustcraft-bakery-order --jq '.id, .owner.id'
   gh api repos/meebotsompurin-stack/crustcraft-bakery-order/actions/oidc/customization/sub
   ```
   > [!NOTE]
   > Check `use_immutable_subject` from the second command. If `use_immutable_subject` is enabled on the repository, the `assertion.sub` claim format differs from `repo:<owner>/<repo>:environment:demo`, so verify the exact `sub` format before creating the OIDC provider.

2. **Pool & OIDC Provider Specification:**
   - **Workload Identity Pool:** `github-actions` (location: `global`)
   - **OIDC Provider:** `github-main`
   - **Issuer URI:** `https://token.actions.githubusercontent.com`
   - **Attribute Mapping:**
     ```text
     google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.repository_owner_id=assertion.repository_owner_id,attribute.ref=assertion.ref,attribute.environment=assertion.environment
     ```
   - **Exact CEL Attribute Condition (`M6`):**
     ```cel
     assertion.repository_id == '<YOUR_NUMERIC_REPO_ID>' &&
     assertion.repository_owner_id == '<YOUR_NUMERIC_OWNER_ID>' &&
     assertion.ref == 'refs/heads/main' &&
     assertion.workflow_ref.startsWith('meebotsompurin-stack/crustcraft-bakery-order/.github/workflows/deploy.yml@refs/heads/main') &&
     assertion.sub == 'repo:meebotsompurin-stack/crustcraft-bakery-order:environment:demo'
     ```
   - **Workload Identity User Binding:** Bind `roles/iam.workloadIdentityUser` on `crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com` to:
     ```text
     principalSet://iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-actions/attribute.repository_id/<YOUR_NUMERIC_REPO_ID>
     ```

3. **Human-Run Cloud Shell Command Block (Placeholder Template):**
   *Review every line before running in Cloud Shell. Never commit real `<PROJECT_NUMBER>`, `<YOUR_NUMERIC_REPO_ID>`, or `<YOUR_NUMERIC_OWNER_ID>` values into documentation.*
   ```bash
   PROJECT_ID="cpe334-bobcat"
   PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
   REPO="meebotsompurin-stack/crustcraft-bakery-order"

   # 1. Obtain GitHub Repo ID and Owner ID via GitHub API
   # Replace with actual numeric IDs obtained from https://api.github.com/repos/meebotsompurin-stack/crustcraft-bakery-order
   REPO_ID="<YOUR_NUMERIC_REPO_ID>"
   OWNER_ID="<YOUR_NUMERIC_OWNER_ID>"

   # 2. Enable Required Security APIs
   gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project="$PROJECT_ID"

   # 3. Create Deployer Service Account
   gcloud iam service-accounts create crustcraft-deployer \
     --display-name="CrustCraft GitHub Actions Deployer" \
     --project="$PROJECT_ID"

   # 4. Grant Roles to Deployer SA (Resource-Level Least Privilege)
   gcloud run services add-iam-policy-binding crustcraft \
     --region=asia-southeast1 \
     --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/run.developer" \
     --project="$PROJECT_ID"

   gcloud run jobs add-iam-policy-binding crustcraft-migrate \
     --region=asia-southeast1 \
     --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/run.developer" \
     --project="$PROJECT_ID"

   gcloud artifacts repositories add-iam-policy-binding crustcraft \
     --location=asia-southeast1 \
     --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.writer" \
     --project="$PROJECT_ID"

   gcloud iam service-accounts add-iam-policy-binding "crustcraft-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
     --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser" \
     --project="$PROJECT_ID"

   # 5. Create Workload Identity Pool
   gcloud iam workload-identity-pools create github-actions \
     --location="global" \
     --display-name="GitHub Actions Pool" \
     --project="$PROJECT_ID"

   # 6. Create Workload Identity Provider with CEL Attribute Condition (M6)
   gcloud iam workload-identity-pools providers create-oidc github-main \
     --location="global" \
     --workload-identity-pool="github-actions" \
     --display-name="GitHub Actions Main Provider" \
     --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.repository_owner_id=assertion.repository_owner_id,attribute.ref=assertion.ref,attribute.environment=assertion.environment" \
     --attribute-condition="assertion.repository_id == '${REPO_ID}' && assertion.repository_owner_id == '${OWNER_ID}' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref.startsWith('${REPO}/.github/workflows/deploy.yml@refs/heads/main') && assertion.sub == 'repo:${REPO}:environment:demo'" \
     --project="$PROJECT_ID"

   # 7. Bind Deployer SA Impersonation with attribute.repository_id
   gcloud iam service-accounts add-iam-policy-binding "crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository_id/${REPO_ID}" \
     --project="$PROJECT_ID"
   ```

### 9.3 GitHub Environment `demo` (`AC-LAB5-06-03`)

- **3-Way Name Consistency:** The environment name `demo` must match identically across three places:
  1. The GitHub Repository Environment (`Settings > Environments > demo`).
  2. `environment: demo` in `.github/workflows/deploy.yml` (implemented in Issue 7).
  3. `:environment:demo` in the WIF OIDC provider CEL condition (`assertion.sub`).
- **Deployment Branches:** Selected branches only — `main`.
- **Environment Variables (4 Plain Variables, NOT Secrets):**

| Variable Name | Configured Value |
|---|---|
| `GCP_PROJECT_ID` | `cpe334-bobcat` |
| `GCP_REGION` | `asia-southeast1` |
| `WIF_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-actions/providers/github-main` |
| `WIF_SERVICE_ACCOUNT` | `crustcraft-deployer@cpe334-bobcat.iam.gserviceaccount.com` |

> [!WARNING]
> Do **not** commit the real numeric `<PROJECT_NUMBER>` into this document or any repository file. Replace `<PROJECT_NUMBER>` only inside the GitHub Environment variable UI and Cloud Shell commands.

### 9.4 Branch Protection Ruleset `protect-main` (`AC-LAB5-06-04`, `M7`)

- **Repository Visibility (`R-12`):** The repository must remain **public** so GitHub Free supports branch protection rulesets.
- **Ruleset Configuration (`Settings > Rules > Rulesets > protect-main`):**
  - **Enforcement status:** `Active`
  - **Bypass list:** Empty (no bypass actors)
  - **Target branches:** `main`
  - **Require a pull request before merging:** `1` approval, with **Do not allow author approval** enabled to prevent self-approval (`R-09`).
  - **Require status checks to pass before merging:** Required check `test-and-docker` (matching the job ID in `.github/workflows/ci-docker.yml`), with **Require branches to be up to date before merging** enabled.
  - **Branch Integrity Protections:** **Restrict deletions** and **Block force pushes** enabled.
- **Staging Branch Note:** `lab-5-staging` does not require a separate strict ruleset because `protect-main` enforces `R-06` on all releases entering production (`main`).

### 9.5 Merge Gate Proof Procedure `C-02` (`AC-LAB5-06-05`, Human-Executed)

1. Confirm that ruleset `protect-main` is **Active** and `.github/workflows/ci-docker.yml` is present on `main`.
2. Create a temporary branch `test/prove-gate` from `main`.
3. Modify one test in `server/src/__tests__/` to fail intentionally (for example, `expect(1).toBe(2)`).
4. Push `test/prove-gate` and open a Pull Request with base `main`, labeled `lab5`.
5. Wait for the `test-and-docker` GitHub Actions check to fail (red).
6. Capture a screenshot clearly showing the PR link, the failed `test-and-docker` check, and the blocked/disabled Merge button. Use the lab sheet caption format, for example:
   *"Figure N. C-02 (R-06): PR #X from temporary branch test/prove-gate; the required check test-and-docker failed and merging is blocked. Commit <sha>."*
7. **Only after the screenshot is captured and saved:** close the Pull Request without merging and delete the `test/prove-gate` branch.

### 9.6 Episode 6 Evidence Screenshots & Redaction Reminders

Collect the following 5 screenshots for the final report (Handout Part 1):
1. **Screenshot 1:** GCP IAM Console showing `crustcraft-deployer` with resource-level least-privilege roles only (and empty Keys tab).
2. **Screenshot 2:** GCP WIF Console showing Pool `github-actions`, Provider `github-main`, and the CEL attribute condition.
3. **Screenshot 3:** GitHub `Settings > Environments > demo` showing all 4 plain variables (`GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`).
4. **Screenshot 4:** GitHub `Settings > Rulesets > protect-main` showing `Active` status, required check `test-and-docker`, 1 approval (no self-approval), and empty bypass list.
5. **Screenshot 5 (`C-02`):** Pull Request on `test/prove-gate` -> `main` showing the red failed `test-and-docker` check and the blocked Merge button.

> [!CAUTION]
> **Redaction Reminder:** Before submitting screenshots in the report, redact/mask the numeric `<PROJECT_NUMBER>` (if visible) and any secret values, tokens, or connection strings.

---

## 10. Automated Continuous Deployment Pipeline (`deploy.yml`) & Live Release Cycle (Episode 7)

*This section documents the two-job automated CD pipeline architecture, keyless WIF deployment, immutable `@sha256` digest resolution, and the live release cycle verifying `C-06` (`R-07` through `R-10`).*

### 10.1 Pipeline Architecture & Workflow Design (`AC-LAB5-07-01`, `AC-LAB5-07-02`)

The deployment workflow (`.github/workflows/deploy.yml`) implements an automated, secure, and resilient continuous deployment pipeline:

```
[ Push to main / Release PR Merge ]
                │
                ▼
      ┌──────────────────┐
      │   Job 1: test    │ ───► Calls reusable ./.github/workflows/ci-docker.yml
      │  (Quality Gate)  │      (Unit & integration tests + Docker build check)
      └──────────────────┘
                │ (Passes)
                ▼
      ┌──────────────────┐
      │   Job 2: deploy  │ ───► Environment: demo
      │ (CD Automation)  │      ├── Authenticate via WIF (google-github-actions/auth@v2)
      └──────────────────┘      ├── Build & push image tagged with full 40-char ${{ github.sha }}
                                ├── Execute deploy/release.sh (Resolves @sha256 digest)
                                ├── Run Cloud Run migration job (crustcraft-migrate)
                                ├── Update Cloud Run service (crustcraft) & shift 100% traffic
                                ├── Run post-deploy smoke test (deploy/smoke_test.py)
                                └── Output deployment summary to $GITHUB_STEP_SUMMARY
```

#### Pipeline Security & Governance Attributes:
- **Environment Binding:** Runs inside the `demo` environment, gated to the `main` branch and backed by WIF configuration.
- **Concurrency Safeguard:** `concurrency: { group: 'deploy-demo', cancel-in-progress: false }` ensures that simultaneous pushes or manual triggers do not cancel an active deployment mid-migration.
- **Rollback Capability:** Supports `workflow_dispatch` with optional `image_tag` parameter. Supplying a prior 40-character commit SHA skips the `test` quality gate and Docker build, redeploying the existing pre-validated Artifact Registry image digest with zero database disruption.

### 10.2 Immutable Digest Resolution & Traffic Migration (`AC-LAB5-07-03`)

The release execution script (`deploy/release.sh`) ensures deterministic, tamper-proof deployments:
1. **Deterministic Tag Resolution:** Resolves `IMAGE_TAG` (falling back to `git rev-parse HEAD`) to its immutable `@sha256:...` digest via Artifact Registry metadata:
   ```bash
   DEPLOYED_IMAGE=$(gcloud artifacts docker images describe "$IMAGE" \
     --project="$PROJECT_ID" \
     --format='value(image_summary.digest)' | awk '{print "'$REGION'-docker.pkg.dev/'$PROJECT_ID'/'$REPO_NAME'/'$SERVICE_NAME'@" $1}')
   ```
2. **Pre-Deployment Database Migration:** Executes `gcloud run jobs execute crustcraft-migrate --region="$REGION" --project="$PROJECT_ID" --wait`. If migrations fail, the pipeline terminates immediately without modifying the running Cloud Run service.
3. **Atomic Traffic Shift:** Updates the Cloud Run service container image to `$DEPLOYED_IMAGE` and shifts 100% traffic to the new revision:
   ```bash
   gcloud run services update-traffic "$SERVICE_NAME" --region="$REGION" --to-latest --project="$PROJECT_ID"
   ```
4. **GitHub Environment Propagation:** Appends `DEPLOYED_IMAGE` and `SERVICE_URL` to `$GITHUB_ENV` so subsequent steps (such as `deploy/smoke_test.py`) execute against the exact deployed endpoint.

### 10.3 Two-Release Verification Tracking Table (`C-06`, `AC-LAB5-07-05`, `AC-LAB5-07-06`)

To satisfy the rubric requirement for **Category 4: Repeatable Release Pipeline (`C-06`)**, two full release cycles are executed through the protected branching route (`feature branch` $\rightarrow$ `PR into lab-5-staging` $\rightarrow$ `Release PR into main`):

| Release Cycle | Branching & PR Route | Full Commit SHA (40 chars) | Immutable Image Digest (`@sha256:...`) | Active Cloud Run Revision | Live URL & Verification Status |
|---|---|---|---|---|---|
| **Release A** | `lab-5-staging` $\rightarrow$ `main` (Release PR) | `e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534` | `sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5` | `crustcraft-00002-424` (Run `43853803871`) | **DEPLOYED & VERIFIED**<br>Initial automated deployment via CD pipeline; automated smoke test PASSED |
| **Release B** | `feat/release-b-banner` $\rightarrow$ `lab-5-staging` $\rightarrow$ `main` (Release PR) | `13932e96a1491ded7b7c1e4bfa03701b50b1e917` | `sha256:3808bb9b8425cae2569faf8dc119ac171ccdc827a0d20a0935746ee96d01264c` | `crustcraft-00003-ncv` (Run `44042906620`) | **DEPLOYED & VERIFIED**<br>UI banner update ("CrustCraft Bakery (Release B)"); automated smoke test; live browser visual verification |

### 10.4 Running Commit Lookup Procedure (`R-08`)

Reviewers and auditors can verify the exact commit SHA currently serving live traffic through three independent mechanisms:
1. **GitHub Actions Step Summary:** Inspect the latest successful `Deploy demo` run summary in GitHub Actions; it prints the full 40-character Commit SHA (`$IMAGE_TAG`), immutable Image Digest (`$DEPLOYED_IMAGE`), and Service URL.
2. **GCP Console:** Navigate to **Cloud Run > Services > crustcraft > Revisions**, select the active revision receiving 100% traffic, and inspect the container image URL and tag.
3. **gcloud Verification Command:**
   ```bash
   gcloud run services describe crustcraft \
     --region=asia-southeast1 \
     --project="cpe334-bobcat" \
     --format='value(status.latestReadyRevisionName, spec.template.spec.containers[0].image)'
   ```


---

## 11. Episode 8: Database Persistence Verification across Restarts & Emergency Rollback (`LAB5-ISSUE-08`)

*This section provides the human-executed verification runbook, rollback/roll-forward protocol, structured tracking table, and 5-screenshot evidence checklist for **Handout `C-05` (`R-04`)** and **Recommended Practice: Fast Manual Rollback (Handout §5, Guide Ep. 8)**.*

> [!CAUTION]
> **Security, AI Safety & Continuous Availability Guardrails (`R-02`, `S7`, `B1`):**
> - **Zero Secret Leakage (`R-02`, `S7`):** NEVER include real passwords, `DATABASE_URL` connection strings, JWT secrets, or tokens in this document, Git commits, or screenshots. Redact or blur any sensitive data before capturing evidence screenshots.
> - **No Autonomous Cloud/GitHub Mutations:** All `gcloud`, Cloud Run, Cloud SQL, and GitHub Actions `workflow_dispatch` operations below MUST be executed by human operators after reviewing parameters.
> - **No Database Rollback:** Emergency rollback applies **ONLY** to the Cloud Run container image revision (`ROLLBACK=true` in `deploy/release.sh`), which skips `crustcraft-migrate` while keeping the additive PostgreSQL 16 schema and all persisted order data intact.
> - **Continuous Availability Policy (`B1`):** **Keep Cloud Run (`crustcraft`) and Cloud SQL (`crustcraft-pg`) running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing or running teardown during this period is strictly prohibited.**

---

### 11.1 `AC-LAB5-08-01`: Live Production Order Creation on Release B ("Before" Baseline)

Execute this procedure on the live Cloud Run Public Service URL running **Release B** to establish the "Before" persistence baseline:

1. Open the live Public Service URL in a browser: `https://crustcraft-d7wyiqxska-as.a.run.app`
2. Sign in using a `CUSTOMER` account (e.g., `customer1@test.com`). *(Reminder per `S7`: never expose or screenshot account passwords.)*
3. Create a new bakery pre-order (for example, `Sourdough Bread` x `2` or `Artisan Butter Croissant`) with a distinct pickup note for Episode 8 persistence verification (e.g., `"Ep8 persistence check"`).
4. Navigate to **"My Orders"** (`/orders`) and record the following baseline fields in the tracking table (§11.6):
   - **Order ID** (e.g., `#...`)
   - **Order Items & Quantities**
   - **Total Amount** (THB / satang)
   - **Order Status** (`PENDING`)
   - **Created Timestamp**
5. Capture **Screenshot 1 ("Before" Evidence)** showing the newly created order in **"My Orders"** with the public Cloud Run URL (`https://crustcraft-d7wyiqxska-as.a.run.app`) clearly visible in the browser address bar.

---

### 11.2 `AC-LAB5-08-02`: Verification of Persistence across Application Restart (`C-05` Part A, `R-04`, `S6`)

#### Why CrustCraft Data Survives Container Restarts
- **Externalized Persistent State:** All application state — users, bakery catalog stock, orders, and order items — is persisted in **Cloud SQL for PostgreSQL 16 (`crustcraft-pg`)** over a Unix socket connection (`/cloudsql/cpe334-bobcat:asia-southeast1:crustcraft-pg`).
- **Stateless Container & Auth:** Authentication uses stateless JWT `httpOnly` cookies (`token`), and zero business state is stored on the ephemeral Cloud Run container filesystem. Replacing or restarting a container instance never loses database records.

#### Human-Executed GCP Restart Verification Methods
Choose one of the following GCP-native restart methods (do **not** substitute local Docker Compose for GCP `C-05` evidence):

1. **Method A — Idle Scale-to-Zero Cold Start (Recommended):**
   - Because Cloud Run is configured with `--min-instances=0`, wait for the active container instance to scale down to zero after the idle timeout (typically ~15 minutes of no requests; confirm `0` active instances in GCP Console -> **Cloud Run** -> `crustcraft` -> **Metrics** / **Revisions**).
   - Send a new request to the live Public Service URL to wake a brand-new cold-started container instance.
2. **Method B — New Revision Instance Restart:**
   - Trigger a new Cloud Run revision deployment without code changes so Cloud Run provisions a fresh container instance and shifts 100% traffic to it.

> [!NOTE]
> **`S6` Local vs. GCP Evidence Rule:** `docker compose down && docker compose up -d` is for local reproducibility testing (`C-03`) only and **MUST NOT** be substituted for GCP `C-05` persistence evidence.

#### Post-Restart Verification
1. On the live Public Service URL (`https://crustcraft-d7wyiqxska-as.a.run.app`), perform a hard refresh (`Ctrl+F5`) and open **"My Orders"** (`/orders`).
2. Confirm that the exact **Order ID**, line items, total amount, pickup note, status, and timestamp recorded in `AC-LAB5-08-01` remain **100% intact**.
3. Capture **Screenshot 2 ("After Restart" Evidence)** with the live URL visible in the browser address bar.

---

### 11.3 `AC-LAB5-08-03`: Fast Manual Rollback Execution via `workflow_dispatch` (Recommended Practice, Handout §5 & Guide Ep. 8.1)

Follow this exact protocol to roll back the Cloud Run container image from **Release B** to **Release A** without re-running CI, rebuilding Docker images, or rolling back the database:

1. **Identify Release A Target SHA & Digest:**
   - Locate the **40-character Commit SHA** of **Release A** (`e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534`) from the earlier `Deploy demo` GitHub Actions Summary (`Commit SHA` / `Commit image tag`) and note its corresponding `@sha256:...` digest (`sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5`) in Artifact Registry.
2. **Trigger Manual Rollback in GitHub Actions:**
   - Navigate to **GitHub** -> **Actions** -> **Deploy demo** -> **Run workflow**.
   - Select **Branch:** `main`.
   - Enter **`image_tag`:** `e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534` (40-character Commit SHA of Release A).
   - Click **Run workflow**.
3. **Verify Internal Pipeline Mechanics (`.github/workflows/deploy.yml` & `deploy/release.sh`):**
   - **Job `test` (`ci-docker.yml`):** **Skipped** because `inputs.image_tag` is non-empty.
   - **Step `Build and push image`:** **Skipped** because `ROLLBACK == 'true'`.
   - **Step `Verify image, migrate and deploy` (`bash deploy/release.sh`):**
     - Validates that `IMAGE_TAG` matches the 40-character hexadecimal SHA regex (`^[0-9a-f]{40}$`).
     - Resolves `asia-southeast1-docker.pkg.dev/cpe334-bobcat/crustcraft/crustcraft:e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534` to its immutable `@sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5` digest via `gcloud artifacts docker images describe`.
     - **Skips `crustcraft-migrate`** (`ROLLBACK=true`), leaving the PostgreSQL 16 schema and all live data untouched.
     - Updates Cloud Run service `crustcraft` to Release A's immutable `@sha256:...` image digest (`gcloud run services update`) and immediately runs `gcloud run services update-traffic --to-latest` to route 100% traffic to the latest revision (relying on Cloud Run's container startup health check).
   - **Step `Smoke test public URL` (`python3 deploy/smoke_test.py "$SERVICE_URL"`):** Executes **post-switch** against the live public URL and verifies HTTP `200` on `/api/health`, `/api/ready`, and auth flows.
     - *Traffic-Routing Qualification (`S6`):* Because `deploy/release.sh` shifts 100% of traffic **before** `smoke_test.py` runs, the smoke test verifies the rollback post-switch rather than gating traffic beforehand. Risk is minimal because Release A is an immutable, previously validated image digest; however, if pre-traffic validation or gradual canary shifting is required in future incidents, deploy manually with `--no-traffic`, verify the tagged revision URL (`--tag`), and then shift 100% traffic via `gcloud run services update-traffic`.
   - **Step `Record deployment summary`:** Outputs `Rollback Mode: true`, the 40-character Commit SHA of Release A, and the resolved `@sha256:...` digest to `$GITHUB_STEP_SUMMARY`.
4. **Capture Workflow Evidence:**
   - **Screenshot 3:** GitHub Actions Rollback Run showing `test` and `Build` skipped, and `deploy` + `smoke_test` passed.
   - **Screenshot 5:** GitHub Step Summary showing `Rollback Mode: true`, Release A's 40-char Commit SHA, and the matching `@sha256:...` image digest.

---

### 11.4 `AC-LAB5-08-04`: Verification of Persistence across Redeploy / Rollback (`C-05` Part B, `R-04`, `S6` & Guide Ep. 8.2)

After the rollback workflow completes:

1. **Verify Active Cloud Run Revision:**
   - In GCP Console -> **Cloud Run** -> service `crustcraft` -> **Revisions**, confirm the newest active revision serves **100% traffic** and its container image points to **Release A's `@sha256:...` digest**.
2. **Verify UI Rollback & Data Preservation:**
   - Perform a hard refresh (`Ctrl+F5`) on `https://crustcraft-d7wyiqxska-as.a.run.app`.
   - Confirm the frontend UI has reverted to **Release A** (the visible UI banner change introduced in Release B is no longer displayed).
   - Confirm the signed-in customer session remains valid and the **Order ID** created in `AC-LAB5-08-01` (while running Release B) is **100% present and unaltered** in **"My Orders"** (`/orders`).
3. **Capture Screenshot 4 ("After Redeploy/Rollback" Evidence):**
   - Show the live Public Service URL, the reverted Release A UI, and the preserved Order record in **"My Orders"**.

---

### 11.5 `AC-LAB5-08-05`: Roll-Forward Recovery to Release B (Guide Ep. 8.3)

Once `C-05` and Rollback evidence are captured, restore the latest production release (**Release B**) so the live system is ready for instructor grading and Lab 6 partner UAT:

1. **Trigger Roll-Forward in GitHub Actions:**
   - Navigate to **GitHub** -> **Actions** -> **Deploy demo** -> **Run workflow**.
   - Select **Branch:** `main`.
   - Either enter **`image_tag`:** `13932e96a1491ded7b7c1e4bfa03701b50b1e917` (fast roll-forward reusing the already-validated Release B image digest) **OR** leave `image_tag` empty to run full CI, build, and deploy current `main`.
2. **Wait for Pipeline Completion:**
   - Confirm the `Deploy demo` workflow and `python3 deploy/smoke_test.py "$SERVICE_URL"` pass.
3. **Verify Restored Production State:**
   - Hard-refresh (`Ctrl+F5`) `https://crustcraft-d7wyiqxska-as.a.run.app` and verify:
     - The visible UI banner change from **Release B** (`CrustCraft Bakery (Release B)`) is restored.
     - Cloud Run's latest ready revision serves **100% traffic** on **Release B's `@sha256:...` digest**.
     - Both the Episode 8 Order created in `AC-LAB5-08-01` and the Episode 5 baseline Order (`#cmwf1j83j0002jyk1mtqxtpus`) remain completely intact in **"My Orders"** and the **Operator Queue** (`/operator/queue`).

---

### 11.6 `AC-LAB5-08-06`: Episode 8 Tracking Table, 5-Screenshot Evidence Checklist & Availability Compliance

#### Episode 8 Persistence & Rollback Tracking Table

| Phase / Step | Action Performed | Target Commit SHA (40 chars) | Image Digest (`@sha256:...`) | Active Cloud Run Revision | Test Order ID & Status | Verification Result |
|---|---|---|---|---|---|---|
| **1. Baseline (Release B)** | Live order created on Release B (`AC-LAB5-08-01`) | `13932e96a1491ded7b7c1e4bfa03701b50b1e917` | `sha256:3808bb9b8425cae2569faf8dc119ac171ccdc827a0d20a0935746ee96d01264c` | `crustcraft-00003-ncv` (Run `44042906620`) | `#cmwkpyktf000212bvzqayviz4` (`PENDING`) | `VERIFIED PASS` |
| **2. Restart (`C-05` Part A)** | Scale-to-zero cold start / new revision restart (`AC-LAB5-08-02`) | `13932e96a1491ded7b7c1e4bfa03701b50b1e917` | `sha256:3808bb9b8425cae2569faf8dc119ac171ccdc827a0d20a0935746ee96d01264c` | `crustcraft-00003-ncv` | `#cmwkpyktf000212bvzqayviz4` (`PENDING`) | `VERIFIED PASS` |
| **3. Rollback to Release A** | `workflow_dispatch` with `image_tag=e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534` (`AC-LAB5-08-03`) | `e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534` | `sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5` | `crustcraft-00004-6wg` (Run `44101835981`) | `#cmwkpyktf000212bvzqayviz4` (`PENDING`) | `VERIFIED PASS` |
| **4. Post-Rollback (`C-05` Part B)** | Hard refresh live URL; verify Release A UI & Order preserved (`AC-LAB5-08-04`) | `e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534` | `sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5` | `crustcraft-00004-6wg` | `#cmwkpyktf000212bvzqayviz4` (`PENDING`) | `VERIFIED PASS` |
| **5. Roll-Forward to Release B** | `workflow_dispatch` with `image_tag=13932e96a1491ded7b7c1e4bfa03701b50b1e917` or empty (`AC-LAB5-08-05`) | `13932e96a1491ded7b7c1e4bfa03701b50b1e917` | `sha256:3808bb9b8425cae2569faf8dc119ac171ccdc827a0d20a0935746ee96d01264c` | `crustcraft-00005-lzs` (Run `44107156025`, 100% traffic) | `#cmwkpyktf000212bvzqayviz4` & `#cmwf1j83j0002jyk1mtqxtpus` | `VERIFIED PASS` |

#### 5-Screenshot Evidence Checklist (Handout Part 3 `C-05` & Part 4 `C-06` / Rollback)

Use the Handout §12 caption format `"Figure X. C-05 (R-04): <what it shows>. Commit/Run/URL."` when assembling the final PDF report:

- [ ] **Screenshot 1 (`Before` Baseline — `AC-LAB5-08-01`):** Browser showing **"My Orders"** (`/orders`) on `https://crustcraft-d7wyiqxska-as.a.run.app` with the newly created Episode 8 Order ID, items, total, status, and timestamp visible (passwords/secrets redacted).
  - *Caption Template:* `Figure X. C-05 (R-04): Live production order #cmwkpyktf000212bvzqayviz4 created on Release B before restart and rollback. Commit 13932e9, https://crustcraft-d7wyiqxska-as.a.run.app.`
- [ ] **Screenshot 2 (`After Restart` — `AC-LAB5-08-02`):** Browser showing **"My Orders"** on the live URL after Cloud Run scale-to-zero cold start or new revision restart, confirming `#cmwkpyktf000212bvzqayviz4` is 100% intact.
  - *Caption Template:* `Figure X. C-05 (R-04): Order #cmwkpyktf000212bvzqayviz4 persisted in Cloud SQL after Cloud Run container restart. Revision crustcraft-00003-ncv, https://crustcraft-d7wyiqxska-as.a.run.app.`
- [ ] **Screenshot 3 (GitHub Actions Rollback Run — `AC-LAB5-08-03`):** GitHub Actions `Deploy demo` workflow run graph showing `test` and `Build and push image` **Skipped**, and `Verify image, migrate and deploy` + `Smoke test public URL` **Passed**.
  - *Caption Template:* `Figure X. C-06 / Rollback (R-08): Manual workflow_dispatch rollback to Release A skipping CI/build/migration with smoke test passing. Run #44101835981, Commit e28ceff.`
- [ ] **Screenshot 4 (`After Redeploy/Rollback` — `AC-LAB5-08-04`):** Browser showing the live URL reverted to **Release A** UI with `#cmwkpyktf000212bvzqayviz4` still preserved in **"My Orders"**.
  - *Caption Template:* `Figure X. C-05 (R-04): Order #cmwkpyktf000212bvzqayviz4 preserved in Cloud SQL after Cloud Run rollback to Release A. Revision crustcraft-00004-6wg, Commit e28ceff, https://crustcraft-d7wyiqxska-as.a.run.app.`
- [ ] **Screenshot 5 (GitHub Step Summary — `AC-LAB5-08-03`):** `Deploy demo` `$GITHUB_STEP_SUMMARY` showing `Rollback Mode: true`, Release A's 40-char Commit SHA (`e28ceffa3df72cb4cd25cd357d6fcaa03f2b6534`), and the resolved `@sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5` digest matching Cloud Run's active revision.
  - *Caption Template:* `Figure X. C-06 / Rollback (R-08): GitHub Actions Step Summary confirming Rollback Mode: true and immutable digest match for Release A. Run #44101835981, Digest sha256:76e23c3757417d243f514941ca0e2bdbc919697d9db11de7bf00244bdfc94de5.`

> [!CAUTION]
> **Continuous Availability Policy Reminder (`B1`, Handout §3 & §12):**
> **Cloud Run (`crustcraft`) and Cloud SQL (`crustcraft-pg`) must remain running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing or running teardown during this period is strictly prohibited.**
