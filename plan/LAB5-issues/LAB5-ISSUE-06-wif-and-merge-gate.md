# LAB5-ISSUE-06 — Workload Identity Federation (WIF) & GitHub Merge Gate Enforcement
## Episode 6: Keyless Cloud Authentication, CEL Security Constraints & Branch Protection Ruleset

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-06` — Workload Identity Federation (WIF) & GitHub Merge Gate Enforcement |
| **Type** | `sec` / `infra` |
| **Branch** | `sec/lab5-issue-06-wif-and-merge-gate` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-05-first-gcp-deployment.md` |
| **Lab 5 Rubric** | Category 1: CI and quality gate (30 pts) — `C-02` (`R-06`), `R-03` (Zero Keyfile WIF), `R-09`, `R-10` |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `security`, `iam`, `governance` |

---

## 1. Objective

ติดตั้งระบบยืนยันตัวตนแบบไร้คีย์ถาวร (**Workload Identity Federation - WIF**) ระหว่าง GitHub Actions และ Google Cloud Platform พร้อมทั้งตั้งค่า **Branch Protection Ruleset บน Branch `main`** เพื่อสร้าง **Merge Gate** บังคับให้ Pull Request ทุกตัวต้องผ่านการทดสอบ CI (`test-and-docker`) ก่อนที่จะได้รับอนุญาตให้ทำการ Merge:
1. สร้าง Dedicated Deployer Service Account (`crustcraft-deployer`) ที่มีสิทธิ์จำกัดเฉพาะการ Deploy บน Cloud Run และ Artifact Registry
2. สร้าง Workload Identity Pool (`github-actions`) และ Workload Identity Provider (`github-main`) บน GCP
3. **กำหนดเงื่อนไขความปลอดภัยขั้นสูง (CEL Attribute Condition `M6`):** ล็อคการยืนยันตัวตนด้วย `assertion.repository_id`, `assertion.repository_owner_id`, `assertion.ref == 'refs/heads/main'`, และ `assertion.environment == 'demo'` เพื่อป้องกันการปลอมแปลง Token จาก Repository หรือ Branch อื่น
4. สร้าง GitHub Environment ชื่อ `demo` พร้อมกำหนดตัวแปร 4 ตัว (`GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`)
5. กำหนด GitHub Ruleset `protect-main` และ **พิสูจน์การทำงานของ Merge Gate ด้วยการเปิด PR จาก Temporary Branch `test/prove-gate` ที่มี 1 Failed Test ไปยัง `main` เพื่อบันทึกภาพบล็อกการ Merge (`C-02`, `M7`) แล้ว Close PR ทิ้งทันที**

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-06-01 (Deployer SA Least Privilege):**
  - สร้าง Service Account `crustcraft-deployer` พร้อมมอบหมายบทบาทเฉพาะ:
    - `roles/run.developer`
    - `roles/artifactregistry.writer` (เฉพาะบน repo `crustcraft`)
    - `roles/iam.serviceAccountUser` (เฉพาะบน `crustcraft-runner`)
  - ❌ **ห้ามมอบสิทธิ์ `roles/owner`, `roles/editor`, หรือสิทธิ์ Project-wide เด็ดขาด**
- [ ] **AC-LAB5-06-02 (Strict WIF OIDC Provider with CEL Condition `M6`):**
  - ติดตั้ง Pool `github-actions` และ Provider `github-main`
  - Attribute Condition (CEL) ต้องล็อคความปลอดภัยอย่างสมบูรณ์:
    ```cel
    assertion.repository_id == '<YOUR_REPO_ID>' &&
    assertion.repository_owner_id == '<YOUR_OWNER_ID>' &&
    assertion.ref == 'refs/heads/main' &&
    assertion.workflow_ref.startsWith('meebotsompurin-stack/crustcraft-bakery-order/.github/workflows/deploy.yml@refs/heads/main') &&
    assertion.sub == 'repo:meebotsompurin-stack/crustcraft-bakery-order:environment:demo'
    ```
  - ผูกสิทธิ์ Impersonation ของ `crustcraft-deployer` เข้ากับ `attribute.repository_id`
  - ❌ **ห้าม Copy `REPO_ID`, `OWNER_ID` หรือ `PROJECT_NUMBER` ของกลุ่มอื่นมาใช้โดยเด็ดขาด**
  - ❌ **ห้ามดาวน์โหลดหรือสร้าง Service Account JSON Key เป็นอันขาด**
- [ ] **AC-LAB5-06-03 (GitHub Environment `demo` Setup):**
  - สร้าง Environment `demo` ใน GitHub Repository Settings
  - กำหนด Deployment Branches: เฉพาะ `main`
  - กำหนด Environment Variables ครบทั้ง 4 ตัว:
    - `GCP_PROJECT_ID`: `cpe334-crustcraft`
    - `GCP_REGION`: `asia-southeast1`
    - `WIF_PROVIDER`: `projects/<PROJECT_NUM>/locations/global/workloadIdentityPools/github-actions/providers/github-main`
    - `WIF_SERVICE_ACCOUNT`: `crustcraft-deployer@cpe334-crustcraft.iam.gserviceaccount.com`
- [ ] **AC-LAB5-06-04 (Branch Protection Ruleset `protect-main` `M7`):**
  - Enforcement status: **Active**
  - Bypass list: **Empty (ไม่มีข้อยกเว้น)**
  - Require a pull request before merging: **1 approval** (เปิดตัวเลือก Do not allow author approval เพื่อป้องกัน Self-approval ตาม `R-09`)
  - Require status checks to pass before merging:
    - Required check: **`test-and-docker`** (ตรงตาม Job ID ใน `ci-docker.yml`)
  - Require branches to be up to date before merging
- [ ] **AC-LAB5-06-05 (Proof of Merge Gate `C-02` Execution `M7`, `B2`):**
  - สร้าง Branch ชั่วคราว: `test/prove-gate`
  - แก้ไข Test 1 ตัวใน `server/src/__tests__/` ให้จงใจ Fail (เช่น `expect(1).toBe(2)`)
  - เปิด Pull Request โดยมี Base เป็น **`main`** (ตาม Student Guide Ep. 6.6 step 4)
  - รอให้ GitHub Actions รันจนกระทั่ง Job `test-and-docker` ล้มเหลว (Failed Check แถบสีแดง)
  - **บันทึกภาพหน้าจอหลักฐาน (`C-02`):** แสดง PR Link, Failed Check `test-and-docker`, และปุ่ม **Merge Pull Request ถูกล็อค / บล็อกอย่างชัดเจน**
  - **การจัดการความสะอาด:** **กด Close Pull Request ทันทีโดยไม่ต้อง Merge และลบ Branch `test/prove-gate` ทิ้งทันที** เพื่อไม่ให้กระทบระบบ Production

---

## 3. Step-by-Step GCP Configuration (via Cloud Shell)

```bash
PROJECT_ID="cpe334-crustcraft"
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

# 4. Grant Roles to Deployer SA
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

---

## 4. Evidence Checklist for Final Report (Handout Part 1)

- [ ] Screenshot 1: GCP IAM Console แสดง Service Account `crustcraft-deployer` และสิทธิ์ Least Privilege
- [ ] Screenshot 2: GCP WIF Console แสดง Pool `github-actions`, Provider `github-main` และ CEL Condition
- [ ] Screenshot 3: GitHub Settings > Environments > `demo` แสดง Variables ครบ 4 รายการ
- [ ] Screenshot 4: GitHub Settings > Rulesets > `protect-main` แสดงสถานะ Active, Required check `test-and-docker`, และ No bypass
- [ ] Screenshot 5: **Figure for `C-02`:** หน้าจอ PR บน `test/prove-gate` แสดง check สีแดงล้มเหลว และปุ่ม Merge ถูกบล็อกอย่างชัดเจน

---

## 5. Files Allowed (Whitelist)
```
docs/labs/lab-05/deployment.md
```

---

## 6. AI Agent & Secret Safety Rules (Strict Policy)

1. ❌ **ห้ามสร้างหรือ Export Service Account JSON Key โดยเด็ดขาด** (การยืนยันตัวตนทั้งหมดต้องผ่าน WIF OIDC Token เท่านั้น)
2. ❌ **ห้าม AI Agent แก้ไขการตั้งค่า GitHub Ruleset หรือลดหย่อนระดับความปลอดภัย**
3. ❌ **ห้ามรันการลบ Branch หรือปิด PR โดยพลการหากยังไม่ได้บันทึกภาพหลักฐาน `C-02`**
