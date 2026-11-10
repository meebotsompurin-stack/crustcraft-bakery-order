# LAB 5 Master Plan: Cloud Deployment and CI/CD Pipeline on Google Cloud Platform (GCP)
## CrustCraft Artisan Bakery Pre-Order & Fulfillment System (CPE 334 Theme 4)

---

## 1. Executive Summary & Objective

เอกสารฉบับนี้คือ **Master Blueprint (แผนงานแม่บทระดับสถาปัตยกรรม DevOps)** สำหรับการดำเนินงาน **Lab 5: Cloud Deployment and CI/CD Pipeline on GCP** ของระบบ CrustCraft Artisan Bakery Pre-Order & Fulfillment System โดยอ้างอิงข้อกำหนดตาม **Lab 5 Handout (CPE 334)**, **Student Guide V1.1**, และสถาปัตยกรรมต้นแบบจาก **TokTickIT Starter Kit**

เป้าหมายสูงสุดของ Lab 5 คือ:
1. ปรับปรุงแอปพลิเคชัน CrustCraft ให้เป็น **Cloud-Ready 12-Factor App** สามารถรันได้ทั้งบน Local Development (Docker Compose) และ Production Serverless Container (Google Cloud Run)
2. ย้ายระบบจัดเก็บข้อมูลจาก SQLite สู่ **Cloud SQL for PostgreSQL 16 (Enterprise Edition, db-f1-micro)** เพื่อรองรับการเก็บข้อมูลถาวร (Persistent Storage) พร้อมกลไก Prisma Database Migration และ Idempotent Seeding
3. ติดตั้ง **Automated CI/CD Pipeline บน GitHub Actions** พร้อมระบบรักษาความปลอดภัยระดับองค์กรผ่าน **Workload Identity Federation (WIF)** โดยเด็ดขาดปราศจากการจัดเก็บ Long-lived Service Account JSON Key บน Repository
4. บังคับใช้ **Branch Protection Ruleset & Merge Gate (`test-and-docker`)** ป้องกัน Code ที่มี Bug หรือ Migration ที่ล้มเหลวไม่ให้ Merge สู่ Production Branch (`main`)
5. พิสูจน์ความสามารถในการทำ **Release, Live Smoke Testing, Persistence across revisions**, และ **Manual Rollback (Zero Downtime / Skip CI)** ตามเกณฑ์การให้คะแนน 100 คะแนนเต็ม
6. ปฏิบัติตามมาตรฐานการส่งงานอย่างเคร่งครัด: **Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.**

---

## 2. Lab 5 Rubric & Requirements Traceability Matrix (100 Points)

### 2.1 Handout 4-Part Rubric Structure (100 Points Total)

| Rubric Category | Points | Handout Checks & Requirements | Key Evaluation Focus | Mapped Issues |
|---|---|---|---|---|
| **1. CI and quality gate** | **30 pts** | `C-01` (`R-05`), `C-02` (`R-06`), `R-09`, `R-10` | Automated CI passes on valid PRs; failing test blocks merge via `protect-main` ruleset | `LAB5-ISSUE-04`, `06` |
| **2. Docker and reproducible configuration** | **20 pts** | `C-03` (`R-01`, `R-02`), `.env.example`, `deployment.md` | Clean clone builds and runs with only `.env.example` values; multi-stage Dockerfile | `LAB5-ISSUE-02`, `03` |
| **3. GCP deployment and persistence** | **35 pts** | `C-04` (`R-03`), `C-05` (`R-04`), Secret Manager, WIF | Public URL domain workflow works; data survives restart and full pipeline redeploy | `LAB5-ISSUE-01`, `05`, `08` |
| **4. Repeatable release pipeline** | **15 pts** | `C-06` (`R-07`–`R-10`), Release Procedure | Reviewed changes go staging -> main -> deployed; commit SHA & image digest trace cleanly | `LAB5-ISSUE-07`, `08`, `09` |

### 2.2 Exact Handout Requirements (`R-01` to `R-12`)

- **`R-01`:** Package with Docker; fresh build from clean clone produces working container.
- **`R-02`:** Read every setting from environment; document in `.env.example` & `docs/labs/lab-05/deployment.md`; commit no real secret.
- **`R-03`:** Deploy on GCP at a public URL; domain workflow works through UI, API, and DB.
- **`R-04`:** Store data in persistent DB; data survives application restart and redeploy.
- **`R-05`:** Run build and automated tests on every relevant PR with meaningful test results.
- **`R-06`:** Make passing check required so failed check blocks merge; demonstrate with failing PR from temporary branch without breaking released app.
- **`R-07`:** Deploy accepted releases from `main` through repeatable pipeline (reviewed change -> CI -> merge -> deploy).
- **`R-08`:** Identify commit of each release (tag or commit SHA) and document repeatable release procedure.
- **`R-09`:** Use Issues, project board, feature/fix branches, PRs into `lab-5-staging` reviewed by teammate (specific check/question/finding/reason; no self-approval), and release PR from `lab-5-staging` into `main`.
- **`R-10`:** Label all Lab 5 Issues and PRs with `lab5`; preserve history (never delete or rewrite commits, contract revisions, or CI runs).
- **`R-11`:** Both members (`@meebotsompurin-stack` and `@poom2548`) participate across all areas; record contributions in Issues, commits, and PRs.
- **`R-12`:** Make repository public and keep it public until grading ends.

### 2.3 Exact Handout Checks (`C-01` to `C-06`)

- **`C-01` (`R-05`):** Normal PR runs build and all automated tests, and they pass (Evidence: CI run link & test summary).
- **`C-02` (`R-06`):** PR from temporary branch with one failing test cannot be merged (Evidence: PR link, failed check, blocked merge screenshot).
- **`C-03` (`R-01`, `R-02`):** Fresh clone builds and runs with only `.env.example` values filled in (Evidence: commands & output).
- **`C-04` (`R-03`):** Domain workflow works on public URL: sign in, main business action, and one rule rejection or access restriction (Evidence: screenshots with URL visible).
- **`C-05` (`R-04`):** Record created before a restart and a redeploy is still there afterwards (Evidence: before & after screenshots).
- **`C-06` (`R-07`–`R-10`):** Reviewed change goes from `lab-5-staging` into `main` and is deployed, and running revision matches its commit (Evidence: PR links, pipeline run, GCP revision).

*หมายเหตุ: กลไก Zero-Downtime Manual Rollback (`LAB5-ISSUE-08`) จัดเป็น **Recommended Practice** (ตาม Handout §5) ที่ช่วยเสริมความแข็งแกร่งของ `C-05` (`R-04`) และ `R-08`*

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
 repo: crustcraft                      - crustcraft-jwt-secret                (prisma migrate deploy
 image: crustcraft:<commit-sha>        - crustcraft-admin-password             + non-destructive seed)
      │                                - crustcraft-demo-password                    │
      │ (pull image digest)                  │                                       │ (run before service)
      └───────────────────────────────┐      │ (mount env var)       ┌───────────────┘
                                      ▼      ▼                       ▼
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
- **GCP Project ID:** `cpe334-crustcraft` (หรือ Project ที่สร้างขึ้น)
- **Region:** `asia-southeast1` (Singapore)
- **Artifact Registry Repository:** `crustcraft`
- **Cloud Run Service Name:** `crustcraft`
- **Cloud Run Migration Job:** `crustcraft-migrate`
- **Cloud SQL Instance:** `crustcraft-pg` (PostgreSQL 16, `db-f1-micro`, Enterprise Edition, 10GB SSD)
- **Database Name / User:** `crustcraft` / `crustcraft`
- **Runtime Service Account:** `crustcraft-runner@cpe334-crustcraft.iam.gserviceaccount.com` (Least Privilege: `roles/cloudsql.client`, Secret Manager secretAccessor เฉพาะแต่ละ Secret)
- **Deployer Service Account:** `crustcraft-deployer@cpe334-crustcraft.iam.gserviceaccount.com` (สำหรับ GitHub Actions WIF)
- **WIF Pool / Provider:** `github-actions` / `github-main`
- **GitHub Environment:** `demo` (ตัวแปรและ Secret ถูกจำกัดเฉพาะ Branch `main`)

---

## 4. Cost Control & Safety Guardrails (Zero-Overrun & Continuous Availability Policy)

1. **Continuous Availability Rule (CRITICAL - Handout §12 & §3):**
   - **Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.**
   - ผู้สอนและทีม Partner (Lab 6 UAT) ต้องสามารถเข้าถึงระบบผ่าน Public URL ได้ตลอดเวลา
   - การสั่ง Pause หรือ Teardown ทรัพยากรตลอดช่วงระยะเวลาการตรวจงานและการทำ Lab 6 UAT เป็นสิ่งต้องห้ามโดยเด็ดขาด การทำลายทรัพยากร (Teardown) จะทำได้ก็ต่อเมื่อผู้สอนประกาศสิ้นสุดการตรวจให้คะแนนรายวิชาอย่างเป็นทางการเท่านั้น เพราะจะทำลายฐานข้อมูลและประวัติการทำงานอย่างถาวร
2. **Cloud SQL Instance Tier:** กำหนดชัดเจนเป็น `db-f1-micro` พร้อม `--edition=enterprise` (Lowercase ตาม Requirement)
3. **Storage Auto-increase Disabled:** บังคับปิด Storage Auto-increase ใน `deploy.sh` เพื่อป้องกัน disk ขยายตัวเกิน 10GB อัตโนมัติ (`--no-storage-auto-increase`)
4. **Budget Alert Thresholds:** ตั้ง Budget Alert $250 พร้อมแจ้งเตือน 4 ระดับ คือ 10% ($25), 20% ($50), 50% ($125), และ 90% ($225) สู่อีเมลของสมาชิกทีมทั้งสองคน โดยต้องสร้าง Budget ก่อนสร้างทรัพยากรที่คิดค่าบริการใดๆ
5. **Secret Redaction:** สคริปต์ `deploy.sh` และ CI logs ทั้งหมดต้องทำการ Mask/Redact flags `--password=...` และไม่พิมพ์ Plaintext Password ออกมาเด็ดขาด

---

## 5. Git Branching Model & Release Workflow (`R-09`, `R-10`)

เพื่อรักษาประวัติ Git ดั้งเดิมและให้เป็นไปตาม Handout `R-09` และ `R-10` อย่างเคร่งครัด:

```
[Issue labeled 'lab5']
       │
       ▼ (create branch from lab-5-staging)
[feature/fix/ci/docs branch]
       │
       ▼ (Pull Request + Teammate Review & Approval)
[lab-5-staging branch]  <─── (Integration Branch: CI runs on every PR)
       │
       ▼ (Release PR + Final Verification)
[main branch]           <─── (Protected Release Gate: CI must pass; triggers CD via WIF)
```

1. **Single Integration Branch (`lab-5-staging`):**
   - ทุก Feature/Fix branch ของ Lab 5 จะแตกกิ่งออกจาก `lab-5-staging` เท่านั้น
   - ส่ง Pull Request เข้าสู่ `lab-5-staging` โดยต้องได้รับการ Review และ Approve จากเพื่อนร่วมทีม (`@meebotsompurin-stack` หรือ `@poom2548`) พร้อมระบุข้อสังเกต/คำถามที่เป็นรูปธรรม (ห้าม Self-Approval ตาม `R-09`)
2. **Release Promotion to `main`:**
   - เมื่อชุดฟีเจอร์ใน `lab-5-staging` ผ่านการทดสอบเรียบร้อย จะเปิด Release PR จาก `lab-5-staging` เข้าสู่ `main`
   - เฉพาะการ Merge เข้าสู่ `main` เท่านั้นที่จะ Trigger การ Deploy สู่ Google Cloud Run (`R-07`)
   - **Initial Code Baseline on `main` before `ISSUE-05`:** เมื่อจบ `LAB5-ISSUE-04` จะเปิด Initial Release PR จาก `lab-5-staging` สู่ `main` และ Merge ทันที เพื่อให้โฟลเดอร์ `deploy/` ทั้งหมดและ CI workflow ปรากฏบน `main` ก่อนที่ `ISSUE-05` จะทำการ Checkout `main` บน Cloud Shell ไปสั่งรัน `deploy/deploy.sh`
3. **Branch Protection & Merge Gate (`protect-main`):**
   - Ruleset `protect-main` มีสถานะ Enforcement = **Active**, Bypass list = **Empty**
   - กำหนดให้ต้องผ่าน Status Check: **`test-and-docker`** (ตรงกับ Job ID ใน `ci-docker.yml`)
   - สำหรับการสาธิต `C-02` จะใช้กิ่งชั่วคราว `test/prove-gate` เปิด PR ตรงเข้าหา `main` เพื่อพิสูจน์การบล็อก แล้ว **Close PR ทันทีโดยไม่ Merge และลบกิ่งทิ้ง**
4. **History Preservation (`R-10`):**
   - ห้าม Force-push (`git push --force`) หรือ Rebase กิ่งที่เผยแพร่แล้ว
   - ห้ามลบ Commit, Contract Revision, หรือ CI Runs เพื่อรักษาประวัติการทำงานไว้ให้ผู้สอนตรวจสอบ

---

## 6. Migration Strategy: SQLite to PostgreSQL 16 (`B3`)

สถาปัตยกรรมเดิมของ Sprint 1 ใช้ SQLite เป็น Local Database ใน Lab 5 จะทำการยกระดับสู่ PostgreSQL 16 เต็มรูปแบบ:
1. ปรับปรุง `prisma/schema.prisma` datasource `provider = "postgresql"`
2. สร้าง PostgreSQL Migration Baseline ใหม่ภายใต้ `prisma/migrations/`
3. ปรับปรุง Seed Script (`prisma/seed.ts`) ให้ทำงานแบบ Idempotent (`upsert`) บน PostgreSQL
4. รองรับการรัน Local Dev ด้วย `docker-compose.yml` (PostgreSQL 16 Alpine container) และ CI test container
5. เอกสารสถาปัตยกรรม `docs/labs/lab-05/deployment.md` จะบันทึกการเปลี่ยนแปลงและเหตุผลทางเทคนิคอย่างครบถ้วน

---

## 7. AI Agent & Secret Safety Rules (Mandatory across ALL Issues)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. **No Autonomous Cloud Operations:** ห้าม AI Agent รันคำสั่ง `gcloud`, แก้ไข IAM, เปลี่ยนแปลง Billing, หรือจัดการ Database บน Cloud โดยปราศจากการตรวจสอบและสั่งการจากมนุษย์
2. **Read Before Run:** สมาชิกทีมต้องอ่านและทำความเข้าใจคำสั่ง shell ทุกคำสั่งก่อนสั่ง execute บน Cloud Shell หรือเครื่อง local
3. **No Secret Ingestion:** ห้ามนำ Production Password, Connection String จริง, หรือ Private Key วางลงใน AI Prompt หรือบันทึกลงใน Markdown / Screenshot เด็ดขาด
4. **Ephemeral Test Values Only:** อนุญาตให้ใช้เฉพาะค่าจำลองสำหรับการทดสอบบน CI (เช่น `crustcraft_test_password`) เท่านั้น

---

## 8. Directory Map: `plan/LAB5-issues/`

```
plan/LAB5-issues/
├── LAB5-ISSUE-00-master-plan.md              (This document - Architecture & Master Plan)
├── LAB5-ISSUE-01-gcp-setup-and-budget.md     (Episode 1: Project, IAM, Budget Alerts, R-10..12)
├── LAB5-ISSUE-02-cloud-ready-app.md          (Episode 2: /api/ready, SQLite->PostgreSQL 16 Migration)
├── LAB5-ISSUE-03-docker-containerization.md  (Episode 3: Multi-stage Dockerfile, Compose, C-03)
├── LAB5-ISSUE-04-pr-ci-workflow.md           (Episode 4: ci-docker.yml, offline deploy tests, C-01)
├── LAB5-ISSUE-05-first-gcp-deployment.md     (Episode 5: deploy.sh execution, Cloud Run initial run)
├── LAB5-ISSUE-06-wif-and-merge-gate.md       (Episode 6: WIF, GitHub env, Merge Gate C-02)
├── LAB5-ISSUE-07-auto-deploy-pipeline.md     (Episode 7: deploy.yml, auto release pipeline, C-06)
├── LAB5-ISSUE-08-persistence-and-rollback.md (Episode 8: Persistence test C-05 & Rollback protocol)
└── LAB5-ISSUE-09-docs-and-pdf-submission.md  (Handout §12: deployment.md, 5-part Evidence PDF report)
```
