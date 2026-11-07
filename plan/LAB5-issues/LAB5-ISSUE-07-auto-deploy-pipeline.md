# LAB5-ISSUE-07 — Automated CD Deployment Pipeline (`deploy.yml`) & Live Release Cycle
## Episode 7: Continuous Deployment Pipeline & Revision Digest Synchronization

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-07` — Automated CD Deployment Pipeline (`deploy.yml`) & Live Release Cycle |
| **Type** | `ci` / `deploy` |
| **Branch** | `ci/lab5-issue-07-auto-deploy-pipeline` |
| **Depends on** | `LAB5-ISSUE-06-wif-and-merge-gate.md` |
| **Lab 5 Rubric** | Traceability `C-06` (Automated CD Pipeline & Digest Sync), `C-01` |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

สร้างและติดตั้ง Automated CD Pipeline ผ่านไฟล์ `.github/workflows/deploy.yml` เพื่อให้ทุกการ Merge หรือ Push สู่ Branch `main` เกิดการ Deploy สู่ Google Cloud Run อัตโนมัติ โดยปราศจากการแทรกแซงแบบ Manual:
1. เรียกใช้ Reusable CI Workflow (`ci-docker.yml`) เป็น Gate แรก หาก CI ล้มเหลวจะไม่มีการแตะต้องระบบ Production
2. ล็อกอินเข้าสู่ GCP ผ่าน Workload Identity Federation (WIF) ด้วยสิทธิ์ของ `crustcraft-deployer`
3. สั่ง Build Docker Image บน GitHub Actions Runner และ Push ตรงสู่ Artifact Registry โดยแท็กด้วย Commit SHA เต็ม 40 ตัวอักษร
4. รัน `deploy/release.sh` เพื่อ Resolve Image Tag ไปสู่ **Immutable `@sha256` Image Digest** รัน Cloud Run Migration Job (`crustcraft-migrate`) ให้เสร็จสิ้น แล้วอัปเดต Cloud Run Service (`crustcraft`)
5. ดำเนินการรัน Smoke Test ตรวจสอบ Service URL ทันที
6. บันทึกและทดสอบวงรอบการปล่อย Release สองเวอร์ชัน (Release A และ Release B) เพื่อพิสูจน์การทำงานของ Pipeline อัตโนมัติ

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-07-01:** ไฟล์ `.github/workflows/deploy.yml` ได้รับการตั้งค่าตามสเปก:
  - Trigger: `push` on branch `main` และ `workflow_dispatch` (มี input `image_tag` สำหรับ rollback)
  - Concurrency group `deploy-demo` พร้อม `cancel-in-progress: false` เพื่อป้องกันการยกเลิกระหว่าง DB Migration
  - Environment: `demo` (เชื่อมโยงกับ WIF variables)
- [ ] **AC-LAB5-07-02:** Workflow ประกอบด้วย 2 Jobs:
  - **Job 1 (`test`):** เรียก Reusable Workflow `./.github/workflows/ci-docker.yml` (ข้ามเฉพาะตอนที่เป็น Rollback)
  - **Job 2 (`deploy`):** ทำงานต่อเมื่อ `test` ผ่านสำเร็จ (`needs: test`), ตรวจสอบความถูกต้องของค่า WIF, Build & Push Image, รัน `deploy/release.sh`, และรัน `smoke_test.py`
- [ ] **AC-LAB5-07-03:** สคริปต์ `deploy/release.sh` มีกลไกป้องกันความผิดพลาด:
  - Resolve Commit SHA Tag เป็น Fully Qualified `@sha256:...` Image Digest เสมอ (`C-06`)
  - รัน `gcloud run jobs execute crustcraft-migrate --wait` ก่อนการอัปเดต Service หาก Job ล้มเหลว สคริปต์จะ Exit ทันทีและไม่แตะต้อง Service
  - สั่ง `gcloud run services update-traffic crustcraft --to-latest` เพื่อส่ง Traffic 100% ไปยัง Revision ใหม่ล่าสุด
- [ ] **AC-LAB5-07-04 (Release A Execution):**
  - ดำเนินการ Merge PR เข้าสู่ `main` ถือเป็น **Release A**
  - GitHub Actions รัน Auto-deploy สำเร็จ
  - บันทึก Commit SHA A, Image Digest A, และ Cloud Run Revision Name A
- [ ] **AC-LAB5-07-05 (Release B Execution):**
  - ทำการแก้ไข UI เล็กน้อยที่มองเห็นได้ชัดเจน (เช่น ปรับแต่ง Footer หรือข้อความหัวเว็บใน `client/src/App.tsx` หรือ `Navbar.tsx`)
  - เปิด PR จาก branch `feat/release-b-banner` ตรวจสอบ Merge Gate แล้ว Merge เข้าสู่ `main`
  - GitHub Actions รัน Auto-deploy สำเร็จโดยอัตโนมัติ
  - บันทึก Commit SHA B, Image Digest B, และ Cloud Run Revision Name B
- [ ] **AC-LAB5-07-06:** ตรวจสอบหน้าเว็บสด (Live URL) ต้องเห็นการเปลี่ยนแปลงของ Release B อย่างถูกต้อง

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
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Validate deployment settings
        run: |
          test -n "$PROJECT_ID" && test -n "$REGION"
          test -n "${{ vars.WIF_PROVIDER }}" && test -n "${{ vars.WIF_SERVICE_ACCOUNT }}"
          [[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Image tag must be a full 40-character commit SHA.'; exit 1; }

      - name: Authenticate to Google Cloud via WIF
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v2

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
        uses: actions/setup-python@v5
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

## 4. Release Tracking Table (Evidence Collection)

| Release Stage | Commit SHA (40 chars) | Image Digest (`@sha256:...`) | Cloud Run Revision | Live URL Status |
|---|---|---|---|---|
| **Release A** | `[Record SHA A]` | `[Record Digest A]` | `crustcraft-00001-...` | PASS (Initial Deploy) |
| **Release B** | `[Record SHA B]` | `[Record Digest B]` | `crustcraft-00002-...` | PASS (UI Banner Update) |

---

## 5. Files Allowed (Whitelist)
```
.github/workflows/deploy.yml
deploy/release.sh
```
