# LAB5-ISSUE-06 — Workload Identity Federation (WIF) & GitHub Merge Gate Enforcement
## Episode 6: Keyless Cloud Authentication & Branch Protection Ruleset

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-06` — Workload Identity Federation (WIF) & GitHub Merge Gate Enforcement |
| **Type** | `sec` / `infra` |
| **Branch** | `sec/lab5-issue-06-wif-and-merge-gate` |
| **Depends on** | `LAB5-ISSUE-05-first-gcp-deployment.md` |
| **Lab 5 Rubric** | Traceability `C-02` (Merge Gate Enforcement), `R-03` (Zero Keyfile WIF) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

ติดตั้งระบบยืนยันตัวตนแบบไร้คีย์ถาวร (**Workload Identity Federation - WIF**) ระหว่าง GitHub Actions และ Google Cloud Platform พร้อมทั้งตั้งค่า **Branch Protection Ruleset บน Branch `main`** เพื่อสร้าง **Merge Gate** บังคับให้ Pull Request ทุกตัวต้องผ่านการทดสอบ CI (`test-and-docker`) ก่อนที่จะได้รับอนุญาตให้ทำการ Merge:
1. สร้าง Dedicated Deployer Service Account (`crustcraft-deployer`) ที่มีสิทธิ์จำกัดเฉพาะการ Deploy (ไม่มีสิทธิ์สร้าง SQL หรือจัดการ IAM ทั่วทั้งโปรเจกต์)
2. สร้าง Workload Identity Pool (`github-actions`) และ Workload Identity Provider (`github-main`) บน GCP
3. ผูกสิทธิ์ OIDC Subject ให้รับ Token เฉพาะที่ส่งมาจาก Repository `meebotsompurin-stack/crustcraft-bakery-order`, Branch `main`, และ Environment `demo` เท่านั้น
4. สร้าง GitHub Environment ชื่อ `demo` พร้อมกำหนดตัวแปร 4 ตัว (`GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`)
5. กำหนด GitHub Ruleset ปกป้อง Branch `main` และพิสูจน์การทำงานของ Merge Gate ด้วยการสร้าง Branch ทดสอบที่มี Bug เพื่อยืนยันว่าปุ่ม Merge ถูกบล็อกจริง (`C-02`)

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-06-01:** สร้าง Service Account `crustcraft-deployer` พร้อมมอบหมายบทบาทขั้นต่ำ:
  - `roles/run.developer` (สำหรับอัปเดต Service และ Job บน Cloud Run)
  - `roles/artifactregistry.writer` (เฉพาะบน Repository `crustcraft`)
  - `roles/iam.serviceAccountUser` (เฉพาะบน Runtime Service Account `crustcraft-runner`)
  - ❌ **ห้ามให้สิทธิ์ `roles/owner`, `roles/editor`, หรือ Secret Manager Admin**
- [ ] **AC-LAB5-06-02:** ติดตั้ง WIF Pool & Provider:
  - Pool: `github-actions`
  - Provider: `github-main`
  - Attribute Mapping:
    - `google.subject=assertion.sub`
    - `attribute.repository=assertion.repository`
    - `attribute.ref=assertion.ref`
    - `attribute.environment=assertion.environment`
- [ ] **AC-LAB5-06-03:** กำหนด IAM Binding ให้ GitHub OIDC สวมบทบาท `crustcraft-deployer` ได้:
  - Member: `principalSet://iam.googleapis.com/projects/<PROJECT_NUM>/locations/global/workloadIdentityPools/github-actions/attribute.repository/meebotsompurin-stack/crustcraft-bakery-order`
  - Role: `roles/iam.workloadIdentityUser`
- [ ] **AC-LAB5-06-04:** สร้าง GitHub Environment `demo`:
  - Scoped deployment branch: เฉพาะ `main` เท่านั้น
  - Environment Variables ครบ 4 ตัว:
    - `GCP_PROJECT_ID`: `cpe334-crustcraft`
    - `GCP_REGION`: `asia-southeast1`
    - `WIF_PROVIDER`: `projects/<PROJECT_NUM>/locations/global/workloadIdentityPools/github-actions/providers/github-main`
    - `WIF_SERVICE_ACCOUNT`: `crustcraft-deployer@cpe334-crustcraft.iam.gserviceaccount.com`
- [ ] **AC-LAB5-06-05:** ตั้งค่า GitHub Ruleset ปกป้อง Branch `main`:
  - Ruleset Name: `protect-main`
  - Target: Branch `main`
  - Restrictions:
    - Require a pull request before merging (1 approval)
    - Require status checks to pass before merging
    - Required check: `test-and-docker` (จาก workflow `ci-docker.yml`)
    - Require branches to be up to date before merging
    - Do NOT allow bypass
- [ ] **AC-LAB5-06-06 (Proof of Merge Gate `C-02`):**
  - สร้าง Branch `test/prove-gate` และแก้ Test ให้ Fail จงใจ (e.g. `expect(1).toBe(2)`)
  - เปิด Pull Request ไปยัง `main`
  - แสดงหลักฐานว่า GitHub PR ขึ้นแถบสีแดง Check failed (`test-and-docker`) และปุ่ม **Merge Pull Request ถูก Disable / บล็อกโดยสมบูรณ์**
  - บันทึก Screenshot เป็น Evidence สำหรับส่งอาจารย์
  - ปิด (Close) PR นั้นโดยไม่ต้องทำการ Merge

---

## 3. Step-by-Step GCP Configuration (via Cloud Shell)

```bash
PROJECT_ID="cpe334-crustcraft"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
REPO="meebotsompurin-stack/crustcraft-bakery-order"

# 1. Enable Required Security APIs
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project="$PROJECT_ID"

# 2. Create Deployer Service Account
gcloud iam service-accounts create crustcraft-deployer \
  --display-name="CrustCraft GitHub Actions Deployer" \
  --project="$PROJECT_ID"

# 3. Grant Specific Roles to Deployer SA
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.developer"

gcloud artifacts repositories add-iam-policy-binding crustcraft \
  --location=asia-southeast1 \
  --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer" \
  --project="$PROJECT_ID"

gcloud iam service-accounts add-iam-policy-binding "crustcraft-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --member="serviceAccount:crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --project="$PROJECT_ID"

# 4. Create Workload Identity Pool & Provider
gcloud iam workload-identity-pools create github-actions \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --project="$PROJECT_ID"

gcloud iam workload-identity-pools providers create-oidc github-main \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub Actions Main Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref,attribute.environment=assertion.environment" \
  --project="$PROJECT_ID"

# 5. Bind GitHub Repository to Deployer Service Account
gcloud iam service-accounts add-iam-policy-binding "crustcraft-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/${REPO}" \
  --project="$PROJECT_ID"
```

---

## 4. Evidence Checklist for Submission
- [ ] Screenshot 1: GCP IAM Console แสดง Service Account `crustcraft-deployer` และ Roles ที่ได้รับ
- [ ] Screenshot 2: GCP Workload Identity Pool Console แสดง Pool `github-actions` และ Provider `github-main`
- [ ] Screenshot 3: GitHub Settings > Environments > `demo` แสดง Variables ครบทั้ง 4 ตัว
- [ ] Screenshot 4: GitHub Settings > Rulesets แสดง `protect-main` และ Required check `test-and-docker`
- [ ] Screenshot 5: GitHub Pull Request บน Branch `test/prove-gate` ที่มีสถานะแดง และปุ่ม Merge ถูกล็อค (Evidence `C-02`)
