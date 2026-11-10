# LAB5-ISSUE-07 — Automated CD Deployment Pipeline (`deploy.yml`) & Live Release Cycle
## Episode 7: Continuous Deployment Pipeline, Revision Digest Synchronization & Two-Release Verification (`C-06`)

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-07` — Automated CD Deployment Pipeline (`deploy.yml`) & Live Release Cycle |
| **Type** | `ci` / `deploy` |
| **Branch** | `ci/lab5-issue-07-auto-deploy-pipeline` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-06-wif-and-merge-gate.md` |
| **Lab 5 Rubric** | Category 4: Repeatable release pipeline (15 pts) — `C-06` (`R-07`–`R-10`), `R-08` |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `cd`, `release`, `automation` |

---

## 1. Objective

สร้างและติดตั้ง Automated CD Pipeline ผ่านไฟล์ `.github/workflows/deploy.yml` เพื่อให้ทุกการ Merge เข้าสู่ Branch `main` เกิดการ Deploy สู่ Google Cloud Run อัตโนมัติ โดยปราศจากการแทรกแซงแบบ Manual ตามมาตรฐาน `R-07`, `R-08`, และ `C-06`:
1. เรียกใช้ Reusable CI Workflow (`ci-docker.yml`) เป็น Quality Gate หาก CI ล้มเหลวจะไม่มีการแตะต้องระบบ Production
2. ล็อกอินเข้าสู่ GCP ผ่าน Workload Identity Federation (WIF) ด้วยสิทธิ์ของ `crustcraft-deployer`
3. สั่ง Build Docker Image บน Runner และ Push สู่ Artifact Registry โดยติดแท็กด้วย Commit SHA เต็ม 40 ตัวอักษร
4. รัน `deploy/release.sh` เพื่อ Resolve Image Tag ไปสู่ **Immutable `@sha256` Image Digest** รัน Cloud Run Migration Job (`crustcraft-migrate`) และอัปเดต Cloud Run Service (`crustcraft`)
5. รัน Smoke Test ตรวจสอบ Service URL ทันที
6. **ดำเนินวงรอบการปล่อย Release สองรอบ (Release A และ Release B) ผ่านกระบวนการ `lab-5-staging -> main` (`B2`, `M8`):**
   - ทั้ง Release A และ Release B ต้องผ่านเส้นทาง: `feature branch` -> `PR into lab-5-staging (peer reviewed)` -> `Release PR from lab-5-staging into main`
   - พิสูจน์การจับคู่ระหว่าง Commit SHA, Immutable `@sha256` Image Digest, และ Cloud Run Active Revision

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-07-01 (Deployment Workflow Structure):**
  - Workflow `.github/workflows/deploy.yml`:
    - Trigger: `push` on branch `main` และ `workflow_dispatch` (พร้อม input `image_tag` สำหรับ Rollback)
    - Concurrency group `deploy-demo` พร้อม `cancel-in-progress: false` (ป้องกันการยกเลิกระหว่าง DB Migration)
    - Environment: `demo` (เชื่อมโยงกับ WIF variables)
- [ ] **AC-LAB5-07-02 (Two-Job Pipeline Architecture):**
  - **Job 1 (`test`):** เรียก Reusable Workflow `./.github/workflows/ci-docker.yml`
  - **Job 2 (`deploy`):** ทำงานต่อเมื่อ `test` สำเร็จ (`needs: test`), ตรวจสอบ WIF settings, Build & Push Image, รัน `deploy/release.sh` และ `deploy/smoke_test.py`
- [ ] **AC-LAB5-07-03 (Immutable Digest Resolution & Migration):**
  - สคริปต์ `deploy/release.sh` ทำการ Resolve Commit SHA Tag ไปสู่ Fully Qualified `@sha256:...` Image Digest เสมอ (`C-06`)
  - รัน `gcloud run jobs execute crustcraft-migrate --wait` ก่อนการอัปเดต Service หาก Migration ล้มเหลว จะยุติการทำงานทันทีโดยไม่แตะต้อง Service
  - สั่ง `gcloud run services update-traffic crustcraft --to-latest` เพื่อส่ง Traffic 100% ไปยัง Revision ใหม่
- [ ] **AC-LAB5-07-04 (Release Identification & Smoke Test Security `M8`):**
  - แสดง Commit SHA เต็ม 40 ตัวอักษร และ Image Digest ใน GitHub Actions Step Summary
  - สามารถตรวจสอบ Commit ของ Revision ที่กำลังรันอยู่ได้ผ่านคำสั่ง `gcloud` และหน้า Console
  - หากเปิดใช้ Authenticated Smoke Test (`SMOKE_EMAIL` / `SMOKE_PASSWORD`) ต้องใช้บัญชีทดสอบระดับต่ำสุด (`CUSTOMER`) เท่านั้น — **ห้ามใช้บัญชี Operator/Admin หรือรหัสผ่าน Demo ส่วนกลางเด็ดขาด**
- [ ] **AC-LAB5-07-05 (Execution of Release A `B2`, `C-06`):**
  - Merge ชุดฟีเจอร์เริ่มต้นจาก `lab-5-staging` เข้าสู่ `main` ผ่าน Release PR
  - GitHub Actions รัน Auto-deploy สำเร็จ
  - บันทึก Commit SHA A, Image Digest A, และ Cloud Run Revision Name A
- [ ] **AC-LAB5-07-06 (Execution of Release B `B2`, `C-06`):**
  - สร้าง Feature Branch จาก `lab-5-staging` เช่น `feat/release-b-banner`
  - ทำการแก้ไข UI เล็กน้อยที่มองเห็นได้ชัดเจนบนหน้าเว็บ (เช่น ปรับปรุง Header หรือ Footer ข้อความใน `client/src/App.tsx`)
  - เปิด PR เข้าสู่ `lab-5-staging` ให้เพื่อนรีวิวและอนุมัติ
  - เปิด Release PR จาก `lab-5-staging` เข้าสู่ `main`
  - สังเกตการณ์ Auto-deploy สำเร็จโดยสมบูรณ์
  - บันทึก Commit SHA B, Image Digest B, และ Cloud Run Revision Name B
- [ ] **AC-LAB5-07-07 (Live Verification of Release B):**
  - เปิดเบราว์เซอร์เข้าสู่ Public Service URL ตรวจสอบว่าเห็นการเปลี่ยนแปลงของ Release B อย่างชัดเจน

---

## 3. Workflow Implementation (`.github/workflows/deploy.yml`)

```yaml
name: Deploy demo

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      image_tag:
        description: 'Rollback: full commit SHA of an existing image. Empty = test, build and deploy current main.'
        type: string
        required: false
        default: ''

permissions:
  contents: read

concurrency:
  group: deploy-demo
  cancel-in-progress: false

jobs:
  test:
    if: github.ref == 'refs/heads/main' && !inputs.image_tag
    uses: ./.github/workflows/ci-docker.yml

  deploy:
    needs: test
    if: >-
      always() && !cancelled() && github.ref == 'refs/heads/main' &&
      (needs.test.result == 'success' ||
       (github.event_name == 'workflow_dispatch' && inputs.image_tag != '' && needs.test.result == 'skipped'))
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: demo
    permissions:
      contents: read
      id-token: write

    env:
      PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
      REGION: ${{ vars.GCP_REGION }}
      SERVICE_NAME: crustcraft
      MIGRATE_JOB_NAME: crustcraft-migrate
      IMAGE_TAG: ${{ inputs.image_tag || github.sha }}
      ROLLBACK: ${{ inputs.image_tag != '' }}

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Validate deployment settings
        run: |
          test -n "$PROJECT_ID" && test -n "$REGION"
          test -n "${{ vars.WIF_PROVIDER }}" && test -n "${{ vars.WIF_SERVICE_ACCOUNT }}"
          [[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Image tag must be a full 40-character commit SHA.'; exit 1; }

      - name: Authenticate to Google Cloud via WIF
        uses: google-github-actions/auth@71f9e21972fae77b1222eecda1753174e62630f5 # v2.1.8
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@6184eb66b576856555c5dfc14041b6c7a0d4c82c # v2.1.1

      - name: Build and push image
        if: env.ROLLBACK != 'true'
        run: |
          gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
          IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/crustcraft/crustcraft:$IMAGE_TAG"
          docker build --tag "$IMAGE" .
          docker push "$IMAGE"

      - name: Verify image, migrate and deploy
        run: bash deploy/release.sh

      - name: Setup Python
        uses: actions/setup-python@42375524e23c412d93fb67b49958b491fce71c38 # v5.4.0
        with:
          python-version: "3.12"

      - name: Smoke test public URL
        run: python3 deploy/smoke_test.py "$SERVICE_URL"

      - name: Record deployment summary
        run: |
          {
            echo '### CrustCraft Demo Deployment Summary'
            echo "- Commit SHA: \`$IMAGE_TAG\`"
            echo "- Image Digest: \`$DEPLOYED_IMAGE\`"
            echo "- Rollback Mode: $ROLLBACK"
            echo "- Service URL: $SERVICE_URL"
            echo '- Smoke Test: PASSED'
          } >> "$GITHUB_STEP_SUMMARY"
```

---

## 4. Release Tracking Table (Evidence Collection for `C-06`)

| Release Stage | Branching Route | Commit SHA (40 chars) | Image Digest (`@sha256:...`) | Cloud Run Revision | Live URL Status |
|---|---|---|---|---|---|
| **Release A** | `lab-5-staging -> main` | `[Record SHA A]` | `[Record Digest A]` | `crustcraft-00001-...` | PASS (Initial Pipeline Deploy) |
| **Release B** | `feat/banner -> lab-5-staging -> main` | `[Record SHA B]` | `[Record Digest B]` | `crustcraft-00002-...` | PASS (UI Banner Update) |

---

## 5. Identifying the Running Commit (`R-08` Procedure)

ผู้ประเมินหรือทีมงานสามารถตรวจสอบ Commit SHA ที่กำลังรันอยู่บน Cloud Run ได้จาก 3 แหล่ง:
1. **GitHub Actions Step Summary:** แสดง 40-char Commit SHA คู่กับ Image Digest
2. **Cloud Run Revision Description:** ตรวจสอบ Image URL ใน Revision Details
3. **CLI Command:**
   ```bash
   gcloud run services describe crustcraft --region=asia-southeast1 --format='value(status.latestReadyRevisionName, spec.template.spec.containers[0].image)'
   ```

---

## 6. Files Allowed (Whitelist)
```
.github/workflows/deploy.yml
deploy/release.sh
docs/labs/lab-05/deployment.md
```

---

## 7. AI Agent & Secret Safety Rules (Strict Policy)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. ❌ **ห้ามรันการ Deploy สู่ Production จาก Local Machine หรือ AI Agent** ทุกการ Deploy ต้องผ่าน GitHub Actions WIF บนกิ่ง `main` เท่านั้น
2. ❌ **ห้ามใช้ Credentials ของ Admin/Operator ในการรัน Smoke Test อัตโนมัติ** ให้ใช้เฉพาะบัญชี Customer สิทธิ์ต่ำสุด
3. ❌ **ห้าม Force-push ทับประวัติ Release ใน Branch `main` เด็ดขาด**
