# LAB5-ISSUE-04 — Pull Request CI Workflow & Offline Deploy Script Verification
## Episode 4: Automated CI Quality Gate, Offline Script Validation & Dependabot

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-04` — Pull Request CI Workflow & Offline Deploy Script Verification |
| **Type** | `ci` / `test` |
| **Branch** | `ci/lab5-issue-04-pr-checks` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-03-docker-containerization.md` |
| **Lab 5 Rubric** | Category 1: CI and quality gate (30 pts) — `C-01` (`R-05`), `R-09`, `R-10` |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `ci`, `automation`, `testing` |

---

## 1. Objective

ติดตั้งระบบ Continuous Integration (CI) บน GitHub Actions ผ่านไฟล์ `.github/workflows/ci-docker.yml` และ `.github/dependabot.yml` เพื่อทำหน้าที่เป็นด่านทดสอบคุณภาพอัตโนมัติ (Automated Quality Gate) ตรวจสอบโค้ดทุกครั้งที่มีการเปิด Pull Request เข้าสู่ Branch `lab-5-staging` และ `main` (`B2`, `R-05`):
1. **เตรียมและดัดแปลงสคริปต์โฟลเดอร์ `deploy/` ทั้งหมด (`B4`):** คัดลอกและปรับแต่ง `deploy/deploy.sh`, `deploy/release.sh`, `deploy/smoke_test.py`, `deploy/teardown.sh` และชุดทดสอบ `deploy/tests/` ให้พร้อมใน Issue นี้ เพื่อให้ CI สามารถรัน Offline Syntax & Stub Checks ได้ทันที
2. ติดตั้ง Service Container PostgreSQL 16 บน GitHub Actions Runner เพื่อรัน Migration, Seeding, และ Automated Vitest Integration Tests (ครบ 50/50 tests) โดยใช้รหัสผ่านและค่า Ephemeral CI Test เท่านั้น (`S5`)
3. ตรวจสอบการ Compile TypeScript และการ Build Production ของ Client (`npm run build`)
4. ตรวจสอบว่า Unified Production Dockerfile สามารถ Build ได้สำเร็จจริงบน Runner
5. ตั้งค่า Dependabot เพื่อดูแล Dependency และ Action versions พร้อมแนะนำการ Pin Action เป็น 40-character Commit SHA เพื่อความปลอดภัยระดับ Enterprise (`S5`)

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-04-01 (CI Workflow Triggers & Job Naming):**
  - กำหนด Triggers ใน `.github/workflows/ci-docker.yml`:
    - `workflow_call` (สำหรับ Reusable ใน Deploy workflow)
    - `pull_request` บน branches: **`[main, lab-5-staging]`** (`B2`)
    - `workflow_dispatch`
  - **Job ID ต้องเป็น `test-and-docker`** เท่านั้น (ห้ามเปลี่ยนชื่อ เนื่องจาก Rubric และ Ruleset อ้างอิง ID นี้)
  - กำหนด Concurrency Group พร้อม `cancel-in-progress: true`
- [ ] **AC-LAB5-04-02 (Node.js 22 & PostgreSQL 16 Service Container `S2`):**
  - ใช้ Action `actions/setup-node` ระบุ `node-version: "22"`
  - Service Container ใช้ `postgres:16-alpine` พร้อม healthcheck `pg_isready`
- [ ] **AC-LAB5-04-03 (Complete `deploy/` Adaptation & Offline Tests `B4`):**
  - บรรจุไฟล์โฟลเดอร์ `deploy/` ครบทั้งหมด:
    - `deploy/deploy.sh`
    - `deploy/release.sh`
    - `deploy/smoke_test.py`
    - `deploy/teardown.sh`
    - `deploy/tests/test_deploy_stub.sh`
    - `deploy/tests/test_release_stub.sh`
    - `deploy/tests/test_smoke.py`
  - Step ตรวจสอบ Offline scripts รันผ่าน 100% โดยไม่ต้องต่อ GCP:
    ```bash
    bash -n deploy/deploy.sh deploy/teardown.sh deploy/release.sh deploy/teardown.sh
    bash deploy/tests/test_deploy_stub.sh
    bash deploy/tests/test_release_stub.sh
    python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
    ```
- [ ] **AC-LAB5-04-04 (Backend & Database Tests `C-01`):**
  - ใช้ Ephemeral non-secret CI Environment Variables (`S5`):
    - `DATABASE_URL: postgresql://crustcraft:crustcraft_test_password@localhost:5432/crustcraft_test?schema=public`
    - `JWT_SECRET: crustcraft-ci-jwt-test-secret-value-not-for-prod`
  - รัน `npm ci`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run seed`, และ `npm test` ผ่านครบ 50/50 tests
- [ ] **AC-LAB5-04-05 (Client Build & Docker Build):**
  - Build Client SPA ผ่านโดยไม่มี Lint หรือ Type errors
  - คำสั่ง `docker build -t crustcraft:ci .` ผ่านสมบูรณ์บน Runner
- [ ] **AC-LAB5-04-06 (Evidence Capture for `C-01` `S5`):**
  - ใน Pull Request เข้าสู่ `lab-5-staging` ต้องแสดงผลการรัน Job `test-and-docker` สีเขียวครบทุกขั้นตอน
  - บันทึกทั้ง **ลิงก์ CI Run Link** และ **ภาพ Test Summary Output** เพื่อใช้ใน PDF Report Part 1
- [ ] **AC-LAB5-04-07 (Dependabot Configuration):**
  - จัดทำ `.github/dependabot.yml` ติดตามอัปเดต `npm` และ `github-actions` ประจำสัปดาห์

---

## 3. Workflow Specification (`.github/workflows/ci-docker.yml`)

```yaml
name: CI & Docker Build

on:
  workflow_call:
  pull_request:
    branches: [main, lab-5-staging]
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

      - name: Setup Node.js 22
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
          JWT_SECRET: crustcraft-ci-jwt-test-secret-value-not-for-prod
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

## 4. Dependabot Specification (`.github/dependabot.yml`)

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 5. Files Allowed (Whitelist) (`B4`)
```
.github/workflows/ci-docker.yml
.github/dependabot.yml
deploy/**
docs/labs/lab-05/deployment.md
```

---

## 6. AI Agent & Secret Safety Rules (Strict Policy)

1. ❌ **ค่า `JWT_SECRET` และ `POSTGRES_PASSWORD` ใน CI เป็นเพียงค่าจำลอง (Ephemeral Mock Values) สำหรับการทดสอบ ห้ามนำไปใช้เป็น Production Secret เด็ดขาด**
2. ❌ **ห้าม AI Agent เพิ่มขั้นตอนที่มีการเชื่อมต่อ Secret Manager หรือดาวน์โหลด Key ใน workflow นี้เด็ดขาด (Workflow นี้ต้องทำงานแบบ Offline 100%)**
3. ❌ **ทุก PR ต้องผ่านการตรวจเช็คจากเพื่อนร่วมทีมก่อน Merge เสมอ**
