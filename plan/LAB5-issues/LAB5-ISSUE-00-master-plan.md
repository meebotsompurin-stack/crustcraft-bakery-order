# LAB 5 Master Plan: Cloud Deployment and CI/CD Pipeline on Google Cloud Platform (GCP)
## CrustCraft Artisan Bakery Pre-Order & Fulfillment System (CPE 334 Theme 4)

---

## 1. Executive Summary & Objective

เอกสารฉบับนี้คือ **Master Blueprint (แผนงานแม่บทระดับสถาปัตยกรรม DevOps)** สำหรับการดำเนินงาน **Lab 5: Cloud Deployment and CI/CD Pipeline on GCP** ของระบบ CrustCraft Artisan Bakery Pre-Order & Fulfillment System โดยอ้างอิงข้อกำหนดตาม **Lab 5 Handout (CPE 334)**, **Student Guide V1.1**, และสถาปัตยกรรมต้นแบบจาก **TokTickIT Starter Kit**

เป้าหมายสูงสุดของ Lab 5 คือ:
1. ปรับปรุงแอปพลิเคชัน CrustCraft ให้เป็น **Cloud-Ready 12-Factor App** สามารถรันได้ทั้งบน Local Development (Docker Compose) และ Production Serverless Container (Google Cloud Run)
2. อัปเกรด Data Tier สู่ **Cloud SQL for PostgreSQL 16 (Enterprise Edition, db-f1-micro)** เพื่อรองรับการเก็บข้อมูลถาวร (Persistent Storage) พร้อมกลไก Non-destructive Prisma Database Migration และ Idempotent Seeding
3. ติดตั้ง **Automated CI/CD Pipeline บน GitHub Actions** พร้อมระบบรักษาความปลอดภัยระดับองค์กรผ่าน **Workload Identity Federation (WIF)** โดยเด็ดขาดปราศจากการจัดเก็บ Long-lived Service Account JSON Key บน Repository
4. บังคับใช้ **Branch Protection Ruleset & Merge Gate (`test-and-docker`)** ป้องกัน Code ที่มี Bug หรือ Migration ที่ล้มเหลวไม่ให้ Merge สู่ Production Branch (`main`)
5. พิสูจน์ความสามารถในการทำ **Release, Live Smoke Testing, Persistence across revisions**, และ **Manual Rollback (Zero Downtime / Skip CI)** ตามเกณฑ์การให้คะแนน 100 คะแนนเต็ม

---

## 2. Lab 5 Rubric & Traceability Matrix (100 Points)

| Rubric Category | Points | Criteria Code | Requirement Description | Mapped LAB5 Issue |
|---|---|---|---|---|
| **CI & Quality Gate** | **30 pts** | `C-01` | Automated CI triggered on PRs & Pushes to `main` (lint, typecheck, unit/integration tests, production docker build) | `LAB5-ISSUE-04` |
| | | `C-02` | Enforced Branch Protection & Merge Gate on `main` (Requires `test-and-docker` passing check, blocks failed builds) | `LAB5-ISSUE-06` |
| **Docker & Configuration** | **20 pts** | `C-03` | Production Multi-Stage Dockerfile (non-root `node` user, dumb-init/exec entrypoint, port binding via `$PORT`) & Local Compose | `LAB5-ISSUE-03` |
| | | `R-01` | Cloud-ready Health (`/api/health`) and Readiness (`/api/ready` with DB ping `SELECT 1`) endpoints | `LAB5-ISSUE-02` |
| | | `R-02` | Unified Express production server serving client bundle from `client/dist` on `0.0.0.0:$PORT` | `LAB5-ISSUE-02` |
| **GCP & Persistence** | **35 pts** | `C-04` | Idempotent GCP provisioning via Cloud Shell (`deploy.sh`), Cloud SQL PostgreSQL 16, Secret Manager, Cloud Run Service & Job | `LAB5-ISSUE-05` |
| | | `C-05` | Verified Database Persistence across container restarts, new revisions, and rollbacks (`crustcraft-pg`) | `LAB5-ISSUE-08` |
| | | `R-03` | Zero Plaintext Secrets in source code / repo; Least-privilege Secret Manager bindings per secret | `LAB5-ISSUE-01`, `05` |
| | | `R-04` | Budget alerts configured at $250 ($25, $50, $125, $225 thresholds) with zero-cost guardrails | `LAB5-ISSUE-01` |
| **Release & Rollback** | **15 pts** | `C-06` | Automated CD deployment via WIF on merge to `main` with immutable image tag digest synchronization | `LAB5-ISSUE-07` |
| | | `R-05` | Manual rollback workflow via `workflow_dispatch` skipping CI/build and reverting image tag cleanly | `LAB5-ISSUE-08` |
| **Documentation & Report** | — | `R-06` | Complete `deployment.md` architecture guide and final submission PDF report (`lab5_sec<sec>_<group>.pdf`) | `LAB5-ISSUE-09` |

---

## 3. Architecture Transition & Target Infrastructure

```
                                  [ GitHub Actions CI/CD ]
                                             │
                       (OIDC Token / Workload Identity Federation)
                                             ▼
                             [ Google Cloud Platform ]
                                (Project: cpe334-crustcraft)
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      │                                      │                                      │
      ▼                                      ▼                                      ▼
[ Artifact Registry ]               [ Secret Manager ]                      [ Cloud Run Job ]
 asia-southeast1-docker.pkg.dev        - crustcraft-database-url              crustcraft-migrate
 repo: crustcraft                      - crustcraft-admin-password            (prisma migrate deploy
 image: crustcraft:<commit-sha>        - crustcraft-demo-password              + non-destructive seed)
      │                                      │                                      │
      │ (pull image digest)                  │ (mount env var)                      │ (run before service)
      └───────────────────────────────┐      │      ┌───────────────────────────────┘
                                      ▼      ▼      ▼
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
                                  Tier: db-f1-micro (Enterprise)
                                  Storage: 10GB SSD (Auto-increase: OFF)
```

### Technical Parameters & Resource Naming Convention
- **GCP Project ID:** `cpe334-crustcraft` (or designated lab project)
- **Region:** `asia-southeast1` (Singapore)
- **Artifact Registry Repository:** `crustcraft`
- **Cloud Run Service Name:** `crustcraft`
- **Cloud Run Migration Job:** `crustcraft-migrate`
- **Cloud SQL Instance:** `crustcraft-pg` (PostgreSQL 16, `db-f1-micro`, 10GB SSD)
- **Database Name / User:** `crustcraft` / `crustcraft`
- **Runtime Service Account:** `crustcraft-runner@cpe334-crustcraft.iam.gserviceaccount.com` (Least Privilege: `roles/cloudsql.client`, Secret Manager secretAccessor on individual secrets)
- **Deployer Service Account:** `crustcraft-deployer@cpe334-crustcraft.iam.gserviceaccount.com` (Used by GitHub Actions WIF)
- **WIF Pool / Provider:** `github-actions` / `github-main`
- **GitHub Environment:** `demo` (Secrets & Variables scoped strictly to `main`)

---

## 4. Cost Control & Safety Guardrails (Zero-Overrun Policy)

1. **Cloud SQL Instance Tier:** กำหนดชัดเจนเป็น `db-f1-micro` พร้อม `--edition=enterprise` (Lowercase ตาม Requirement)
2. **Storage Auto-increase Disabled:** บังคับปิด Storage Auto-increase ใน `deploy.sh` เพื่อป้องกัน disk ขยายตัวเกิน 10GB อัตโนมัติ (`--no-storage-auto-increase`)
3. **Budget Alert Thresholds:** ตั้ง Budget Alert $250 พร้อมแจ้งเตือน 10% ($25), 20% ($50), 50% ($125), และ 90% ($225) สู่อีเมลของสมาชิกทีมทั้งสองคน
4. **Cloud SQL Pausing/Teardown:** หลังเสร็จสิ้นการสาธิตหรือทดสอบ ต้องทำการ Pause Cloud SQL หรือรัน `deploy/teardown.sh` ทันทีเพื่อหยุด Billing
5. **Secret Redaction:** สคริปต์ `deploy.sh` และ CI logs ทั้งหมดต้องทำการ Mask/Redact flags `--password=...` และไม่พิมพ์ Plaintext Password ออกมาเด็ดขาด

---

## 5. Git Branching & Execution Roadmap

เพื่อความปลอดภัยสูงสุดและไม่กระทบประวัติ Git เดิมของ Sprint 1:
- Feature Work ทั้งหมดของ Lab 5 จะสร้างจาก Branch `sprint-1-staging` หรือ `main`
- ใช้ Branch Naming Scheme ตามข้อกำหนด:
  - `refactor/lab5-issue-02-cloud-ready`
  - `build/lab5-issue-03-docker`
  - `ci/lab5-issue-04-pr-checks`
  - `deploy/lab5-issue-05-first-gcp-deployment`
  - `sec/lab5-issue-06-wif-and-merge-gate`
  - `ci/lab5-issue-07-auto-deploy-pipeline`
  - `test/lab5-issue-08-persistence-and-rollback`
  - `docs/lab5-issue-09-docs-and-pdf-submission`
- ทุก Pull Request ต้องผ่านการรีวิวแบบ Cross-Pair และผ่าน Quality Gate ก่อน Squash/Rebase เข้าสู่ `sprint-1-staging` และ `main` ตามลำดับ

---

## 6. Directory Map: `plan/LAB5-issues/`

```
plan/LAB5-issues/
├── LAB5-ISSUE-00-master-plan.md              (This document - Architecture & Master Plan)
├── LAB5-ISSUE-01-gcp-setup-and-budget.md     (Episode 1: Project, IAM, Budget Alerts)
├── LAB5-ISSUE-02-cloud-ready-app.md          (Episode 2: /api/ready, Express static serving)
├── LAB5-ISSUE-03-docker-containerization.md  (Episode 3: Multi-stage Dockerfile & Compose)
├── LAB5-ISSUE-04-pr-ci-workflow.md           (Episode 4: ci-docker.yml & offline tests)
├── LAB5-ISSUE-05-first-gcp-deployment.md     (Episode 5: deploy.sh & Cloud Shell initial run)
├── LAB5-ISSUE-06-wif-and-merge-gate.md       (Episode 6: WIF, GitHub env, Merge Gate C-02)
├── LAB5-ISSUE-07-auto-deploy-pipeline.md     (Episode 7: deploy.yml & auto release pipeline)
├── LAB5-ISSUE-08-persistence-and-rollback.md (Episode 8: Persistence test & rollback C-05)
└── LAB5-ISSUE-09-docs-and-pdf-submission.md  (Episode 9: deployment.md & final PDF report)
```
