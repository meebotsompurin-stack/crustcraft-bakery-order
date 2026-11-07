# LAB5-ISSUE-04 — Pull Request CI Workflow & Offline Deploy Script Verification
## Episode 4: Automated CI Quality Gate & Offline Script Validation

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-04` — Pull Request CI Workflow & Offline Deploy Script Verification |
| **Type** | `ci` / `test` |
| **Branch** | `ci/lab5-issue-04-pr-checks` |
| **Depends on** | `LAB5-ISSUE-03-docker-containerization.md` |
| **Lab 5 Rubric** | Traceability `C-01` (CI Automation), `C-02` (Prerequisite for Merge Gate) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

ติดตั้งระบบ Continuous Integration (CI) บน GitHub Actions ผ่านไฟล์ `.github/workflows/ci-docker.yml` เพื่อทำหน้าที่เป็นแนวป้องกันแรก (First Line of Defense) โดยจะตรวจสอบโค้ดทุกครั้งที่มีการเปิด Pull Request เข้าสู่ Branch `main` และ `sprint-1-staging` รวมทั้งรองรับการเรียกใช้แบบ Reusable Workflow (`workflow_call`) สำหรับขั้นตอน Deploy:
1. ทำการ Run Offline Tests ตรวจสอบ Syntax และ Logic ของสคริปต์ Deployment ทั้งหมด (`deploy.sh`, `teardown.sh`, `release.sh`, `smoke_test.py`) โดยไม่มีการเรียกเชื่อมต่อ GCP จริง
2. สปอน Service Container ชนิด PostgreSQL 16 บน GitHub Actions Runner เพื่อใช้รัน Database Migration, Seeding, และ Automated Vitest Integration Tests (ครบ 50/50 tests)
3. ตรวจสอบการ Compile TypeScript และการ Build Production ของ Client (`npm run build`)
4. ตรวจสอบว่า Unified Production Dockerfile สามารถ Build ผ่านได้จริงบน CI Runner

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-04-01:** ไฟล์ `.github/workflows/ci-docker.yml` มีโครงสร้างตามมาตรฐาน Starter Kit:
  - **Triggers:** `workflow_call`, `pull_request` (branches: `[main, sprint-1-staging]`), และ `workflow_dispatch`
  - **Job Name & ID:** ต้องใช้ ID `test-and-docker` อย่างแม่นยำ (ห้ามเปลี่ยนชื่อเนื่องจาก Rubric และ Ruleset อ้างอิง ID นี้)
  - **Concurrency:** ตั้งค่า cancel-in-progress เพื่อประหยัดเวลา CI Runner
- [ ] **AC-LAB5-04-02:** ติดตั้ง PostgreSQL 16 Service Container ใน Job `test-and-docker`:
  - ใช้ Image `postgres:16-alpine`
  - มี Healthcheck `pg_isready` รอจนกระทั่ง DB พร้อมรับคำขอ
- [ ] **AC-LAB5-04-03:** มี Step สำหรับตรวจสอบ Deployment Scripts แบบ Offline (No GCP access):
  - ตรวจสอบ Bash syntax ด้วย `bash -n`
  - รัน `deploy/tests/test_deploy_stub.sh`
  - รัน `deploy/tests/test_release_stub.sh`
  - รัน Python unittest `deploy/tests/test_smoke.py`
- [ ] **AC-LAB5-04-04:** มี Step ทดสอบ Backend ครบวงจร:
  - `npm ci`
  - `npx prisma migrate deploy`
  - `npm run seed`
  - `npm test` (Vitest unit + integration tests ผ่าน 100%)
- [ ] **AC-LAB5-04-05:** มี Step ทดสอบ Frontend:
  - `npm ci`
  - `npm run build` (Vite build สำเร็จ ไม่มี type/lint error)
- [ ] **AC-LAB5-04-06:** มี Step ตรวจสอบการ Build Dockerfile:
  - `docker build -t crustcraft:ci .` รันผ่านสมบูรณ์โดยไม่ push
- [ ] **AC-LAB5-04-07:** ดัดแปลงชุดสคริปต์ทดสอบ `deploy/tests/` ให้รองรับชื่อทรัพยากรของ CrustCraft (`crustcraft`, `crustcraft-pg`, `crustcraft-runner`, ฯลฯ)

---

## 3. Workflow Specification (`.github/workflows/ci-docker.yml`)

```yaml
name: CI & Docker Build

on:
  workflow_call:
  pull_request:
    branches: [main, sprint-1-staging]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-and-docker:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: crustcraft
          POSTGRES_PASSWORD: crustcraft_test_password
          POSTGRES_DB: crustcraft_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 22 / 24
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Setup Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Check deployment scripts without accessing GCP
        run: |
          bash -n deploy/deploy.sh deploy/teardown.sh deploy/release.sh
          bash deploy/tests/test_deploy_stub.sh
          bash deploy/tests/test_release_stub.sh
          python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'

      - name: Install & Test Backend
        env:
          DATABASE_URL: postgresql://crustcraft:crustcraft_test_password@localhost:5432/crustcraft_test?schema=public
          JWT_SECRET: crustcraft-ci-jwt-secret-token-2026
        run: |
          npm ci
          npx prisma generate
          npx prisma migrate deploy
          npm run seed
          npm test

      - name: Build Frontend
        working-directory: ./client
        run: |
          npm ci
          npm run build

      - name: Verify Unified Production Dockerfile Build
        run: |
          docker build -t crustcraft-app:latest .
```

---

## 4. Verification & Evidence Collection

1. ดำเนินการเปิด Pull Request จาก Branch `ci/lab5-issue-04-pr-checks` เข้าสู่ `sprint-1-staging`
2. ตรวจสอบแถบ **Checks** บน GitHub PR:
   - ตรวจดูว่า Job `test-and-docker` ทำงานครบทุก Steps
   - ตรวจดูผลการทดสอบ Vitest และ Docker Build
3. บันทึกภาพ Screenshot ของหน้า GitHub PR Checks ที่แสดงสถานะสีเขียวผ่านทุกข้อ

---

## 5. Files Allowed (Whitelist)
```
.github/workflows/ci-docker.yml
deploy/tests/test_deploy_stub.sh
deploy/tests/test_release_stub.sh
deploy/tests/test_smoke.py
```
