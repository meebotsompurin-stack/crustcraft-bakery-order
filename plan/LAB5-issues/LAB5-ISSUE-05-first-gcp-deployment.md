# LAB5-ISSUE-05 — First GCP Deployment via Cloud Shell (`deploy.sh`)
## Episode 5: Automated Infrastructure Provisioning, Continuous Availability & Initial Cloud Run Service

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-05` — First GCP Deployment via Cloud Shell (`deploy.sh`) |
| **Type** | `deploy` / `infra` |
| **Branch** | `deploy/lab5-issue-05-first-gcp-deployment` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-04-pr-ci-workflow.md` |
| **Lab 5 Rubric** | Category 3: GCP deployment and persistence (35 pts) — `C-04` (`R-03`), `R-09`, `R-10` |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `gcp`, `deployment`, `infrastructure` |

---

## 1. Objective

ดำเนินการรันสคริปต์ `deploy/deploy.sh` (ซึ่งผ่านการตรวจรับและ Commit มาจาก `LAB5-ISSUE-04` บน Branch `main` เรียบร้อยแล้ว `B4`) บน Google Cloud Shell เพื่อสร้างและตั้งค่าทรัพยากรทั้งหมดบน Google Cloud Platform เป็นครั้งแรก (One-Time Initial Infrastructure Provisioning):
1. ตรวจสอบเนื้อหาของสคริปต์ `deploy/deploy.sh` อย่างละเอียดก่อนการรัน และทดสอบด้วยโหมด Dry Run (`DRY_RUN=1`) เสมอ (`S6`)
2. สร้างทรัพยากรหลัก: Artifact Registry (`crustcraft`), Cloud SQL PostgreSQL 16 (`crustcraft-pg`, `db-f1-micro`, 10GB SSD, Auto-increase OFF)
3. สุ่มสร้าง Secret ผ่าน `openssl` และจัดเก็บลง Google Secret Manager โดยไม่มีการพิมพ์ Plaintext Password ออกทาง Console หรือเอกสาร (`S7`)
4. สร้าง Dedicated Runtime Service Account (`crustcraft-runner`) พร้อมสิทธิ์ Least Privilege (เข้าถึงเฉพาะ Secret ที่กำหนด)
5. ดำเนินการ Build Image ผ่าน Cloud Build และ Execute Cloud Run Migration Job (`crustcraft-migrate`)
6. Deploy Cloud Run Service (`crustcraft`) และทดสอบความพร้อมด้วย `deploy/smoke_test.py`
7. **ปฏิบัติตามกฎความต่อเนื่องของระบบ (Continuous Availability Rule `B1`):** Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-05-01 (Pre-flight Review & Dry Run `S6`):**
  - สมาชิกทีมทำการ Review สคริปต์ `deploy/deploy.sh` ยืนยันว่าไม่มี Hardcoded Secret หรือ Parameter ผิดพลาด
  - รัน Dry Run บน Cloud Shell สำเร็จ:
    ```bash
    DRY_RUN=1 PROJECT_ID=cpe334-crustcraft bash deploy/deploy.sh
    ```
    ยืนยันว่าคำสั่งแสดงแผนการทำงานครบถ้วนโดยไม่มี Error
- [ ] **AC-LAB5-05-02 (Cloud SQL Provisioning Guardrails):**
  - Cloud SQL instance สร้างด้วยพารามิเตอร์:
    - `--database-version=POSTGRES_16`
    - `--edition=enterprise` (Lowercase)
    - `--tier=db-f1-micro`
    - `--region=asia-southeast1`
    - `--storage-size=10GB`
    - `--no-storage-auto-increase` (ป้องกันค่าใช้จ่ายบานปลาย)
- [ ] **AC-LAB5-05-03 (Secret Protection in Secret Manager `S7`):**
  - สร้าง Secret ครบ 4 ตัว:
    - `crustcraft-database-url`
    - `crustcraft-jwt-secret`
    - `crustcraft-admin-password`
    - `crustcraft-demo-password`
  - สคริปต์ต้อง Mask/Redact flags `--password=...` ออกจาก Console Log ทั้งหมด
  - ห้ามพิมพ์หรือบันทึก Production Passwords จริงลงใน Markdown หรือ Screenshot (แชร์รหัสผ่านสำหรับ Lab 6 UAT ผ่านช่องทางส่วนตัวเท่านั้น)
- [ ] **AC-LAB5-05-04 (Cloud Run Migration Job Execution):**
  - รัน Cloud Run Job `crustcraft-migrate` ให้เสร็จสิ้นสมบูรณ์
  - หาก Migration ล้มเหลว ให้อ่าน Log จาก Cloud Logging ก่อนทำการ Retry เสมอ (`S6`)
- [ ] **AC-LAB5-05-05 (Cloud Run Service Deployment & Public Health `C-04`):**
  - Cloud Run Service `crustcraft` เปิดให้บริการที่ Public URL และคืนค่า HTTP 200:
    ```bash
    curl -f "$SERVICE_URL/api/health"
    curl -f "$SERVICE_URL/api/ready"
    ```
  - รันสคริปต์ `deploy/smoke_test.py "$SERVICE_URL"` ผ่านครบทุกเงื่อนไข
- [ ] **AC-LAB5-05-06 (Domain Workflow Demonstration `C-04`):**
  - ทดสอบการทำงานของระบบบน Public URL ผ่าน Browser:
    1. Sign In ด้วยบัญชีผู้ใช้
    2. ทำธุรกรรมหลักของธุรกิจ (Browse Catalog & Create Order)
    3. พิสูจน์ Rule Rejection หรือ Access Restriction 1 กรณี (เช่น ลูกค้าทั่วไปเข้า Operator Queue ไม่ได้ หรือสั่งซื้อด้วยจำนวนไม่ถูกต้องแล้วถูกปฏิเสธ)
  - บันทึกภาพหน้าจอพร้อมแสดง Public URL อย่างชัดเจน
- [ ] **AC-LAB5-05-07 (Continuous Availability Compliance `B1`):**
  - **Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.**
  - ต้องเปิดให้ Cloud Run Service และ Cloud SQL ทำงานต่อเนื่องเพื่อรองรับการตรวจงานของผู้สอนและ Lab 6 Partner UAT

---

## 3. Deployment Script Parameters

| ทรัพยากร | ชื่อ (Resource Name) | ข้อกำหนดทางเทคนิค |
|---|---|---|
| **Artifact Registry** | `crustcraft` | Docker format, `asia-southeast1` |
| **Cloud SQL** | `crustcraft-pg` | PostgreSQL 16, `db-f1-micro`, Enterprise, 10GB SSD |
| **Database / User**| `crustcraft` / `crustcraft` | Password สุ่มและเก็บใน Secret Manager |
| **Service Account**| `crustcraft-runner` | Runtime Least Privilege (`roles/cloudsql.client`, Secret Accessor) |
| **Cloud Run Job** | `crustcraft-migrate` | รัน `npx prisma migrate deploy && npm run seed` |
| **Cloud Run Svc** | `crustcraft` | Port 3000, Min 0, Max 3, 512MiB, 1 CPU |

---

## 4. Execution Commands (via Cloud Shell)

```bash
# 1. Ensure clean workspace on branch main
git checkout main
git pull origin main

# 2. Dry run preview
DRY_RUN=1 PROJECT_ID="cpe334-crustcraft" bash deploy/deploy.sh

# 3. Real deployment execution
PROJECT_ID="cpe334-crustcraft" bash deploy/deploy.sh --demo

# 4. Verify deployment with Smoke Test
SERVICE_URL=$(gcloud run services describe crustcraft --region=asia-southeast1 --format='value(status.url)')
python3 deploy/smoke_test.py "$SERVICE_URL"
```

---

## 5. Policy on Continuous Availability and Teardown (`B1`)

> ⚠️ **CRITICAL DIRECTIVE ON RESOURCE AVAILABILITY (`B1`):**
> - **Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.**
> - **ห้าม Teardown (`deploy/teardown.sh`) เด็ดขาด:** การสั่ง Teardown จะทำลาย Cloud SQL, Database, และข้อมูลคำสั่งซื้อทั้งหมดอย่างถาวร ห้ามรันจนกว่าผู้สอนจะประกาศสิ้นสุดการตรวจให้คะแนนรายวิชาอย่างเป็นทางการ
> - ระบบต้องคงสถานะ **Active & Available** ตลอดช่วงเวลาส่งงาน Lab 5 และ Lab 6

---

## 6. Files Allowed (Whitelist)
```
docs/labs/lab-05/deployment.md
```

---

## 7. AI Agent & Secret Safety Rules (Strict Policy `S6`, `S7`)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. ❌ **ห้าม AI Agent รันคำสั่ง `gcloud` หรือสร้าง Resource บน Cloud โดยตรงโดยเด็ดขาด** คำสั่งทั้งหมดต้องถูก execute โดยสมาชิกทีมผ่าน Cloud Shell
2. ❌ **อ่านและตรวจสอบสคริปต์ `deploy/deploy.sh` ทุกครั้งก่อนสั่งรันจริง**
3. ❌ **ห้ามนำรหัสผ่านจริงที่สร้างขึ้นไปโพสต์ใน AI Chat หรือแปะใน Issue/PR/Docs เด็ดขาด**
