# LAB5-ISSUE-05 — First GCP Deployment via Cloud Shell (`deploy.sh`)
## Episode 5: Automated Infrastructure Provisioning & Initial Cloud Run Service

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-05` — First GCP Deployment via Cloud Shell (`deploy.sh`) |
| **Type** | `deploy` / `infra` |
| **Branch** | `deploy/lab5-issue-05-first-gcp-deployment` |
| **Depends on** | `LAB5-ISSUE-04-pr-ci-workflow.md` |
| **Lab 5 Rubric** | Traceability `C-04` (First GCP Deployment), `R-03` (Least Privilege & Secret Protection) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

ดำเนินการเขียนและปรับปรุงสคริปต์ `deploy/deploy.sh`, `deploy/teardown.sh`, และ `deploy/smoke_test.py` ให้เป็นชื่อเฉพาะของระบบ CrustCraft (`crustcraft`, `crustcraft-pg`, `crustcraft-runner`, ฯลฯ) จากนั้นทำการทดสอบรันแบบ Dry Run บน Cloud Shell และทำการ Provisioning ทรัพยากรจริงบน GCP เป็นครั้งแรก (One-Time Initial Setup):
1. เปิดใช้งาน APIs ที่จำเป็น (Cloud Run, Cloud SQL Admin, Artifact Registry, Cloud Build, Secret Manager, IAM)
2. สร้าง Artifact Registry Repository (`crustcraft`) ใน Region `asia-southeast1`
3. สร้าง Cloud SQL Instance (`crustcraft-pg`) PostgreSQL 16 `db-f1-micro` Enterprise Edition พร้อมปิด Storage Auto-increase
4. สุ่มรหัสผ่านที่ปลอดภัยด้วย `openssl` และจัดเก็บลง Google Secret Manager โดยไม่มีการพิมพ์ Plaintext Password ออกทาง Console/Log
5. สร้าง Dedicated Runtime Service Account (`crustcraft-runner`) และผูกสิทธิ์เฉพาะเจาะจง (Per-Secret Secret Accessor)
6. สั่ง Build Production Image ผ่าน Cloud Build และ Deploy เป็น Cloud Run Migration Job (`crustcraft-migrate`)
7. รัน Migration Job ให้เสร็จสิ้น แล้วจึง Deploy Cloud Run Service (`crustcraft`) พร้อมทดสอบ Smoke Test ยืนยันความสมบูรณ์

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-05-01:** สคริปต์ `deploy/deploy.sh` ถูกดัดแปลงชื่อทรัพยากรอย่างสมบูรณ์:
  - `REPO_NAME="crustcraft"`
  - `SQL_INSTANCE="crustcraft-pg"`
  - `DB_NAME="crustcraft"`
  - `DB_USER="crustcraft"`
  - `SERVICE_NAME="crustcraft"`
  - `MIGRATE_JOB_NAME="crustcraft-migrate"`
  - `SA_NAME="crustcraft-runner"`
  - Secret names: `crustcraft-database-url`, `crustcraft-admin-password`, `crustcraft-demo-password`
- [ ] **AC-LAB5-05-02:** ในขั้นตอนสร้าง Cloud SQL instance ต้องมี Option:
  - `--database-version=POSTGRES_16`
  - `--edition=enterprise` (Lowercase)
  - `--tier=db-f1-micro`
  - `--region=asia-southeast1`
  - `--storage-size=10GB`
  - `--no-storage-auto-increase` (เพื่อป้องกันค่าใช้จ่ายบานปลาย)
- [ ] **AC-LAB5-05-03:** Function `run_cmd` ทำการ Redact `--password=...` ออกจาก Console Log เสมอ
- [ ] **AC-LAB5-05-04:** ทดสอบรัน Dry Run บน Cloud Shell สำเร็จ:
  ```bash
  DRY_RUN=1 PROJECT_ID=cpe334-crustcraft bash deploy/deploy.sh
  ```
  ไม่มีการเรียกคำสั่ง GCP จริง และแสดงขั้นตอนการสร้างทรัพยากรครบถ้วน
- [ ] **AC-LAB5-05-05:** ดำเนินการรัน Deploy จริงบน Cloud Shell:
  ```bash
  PROJECT_ID=cpe334-crustcraft bash deploy/deploy.sh --demo
  ```
  - Cloud SQL สร้างสำเร็จและสถานะเป็น RUNNABLE
  - Migration Job รัน `prisma migrate deploy` และ `prisma:seed` ผ่าน 100%
  - Cloud Run Service เริ่มทำงานและแสดง Service URL
- [ ] **AC-LAB5-05-06:** ตรวจสอบความถูกต้องของสิทธิ์ IAM:
  - `crustcraft-runner` มีบทบาท `roles/cloudsql.client`
  - มีสิทธิ์ `roles/secretmanager.secretAccessor` เฉพาะบน Secret ของโปรเจกต์ (ไม่มีสิทธิ์ระดับ Project-wide)
- [ ] **AC-LAB5-05-07:** ทำการทดสอบ Public URLs ผ่าน `curl`:
  ```bash
  curl -f "$SERVICE_URL/api/health"
  curl -f "$SERVICE_URL/api/ready"
  ```
  คืนค่า HTTP 200 และแสดง `{"status":"ok"}` และ `{"status":"ready","db":"connected"}` ตามลำดับ
- [ ] **AC-LAB5-05-08:** รันสคริปต์ `deploy/smoke_test.py "$SERVICE_URL"` ผ่านครบทุกข้อ (PASS /api/health, PASS /api/ready, PASS /, PASS /api/catalog)

---

## 3. Deployment Script Parameters

| ทรัพยากร | ชื่อ (Resource Name) | ข้อกำหนดทางเทคนิค |
|---|---|---|
| **Artifact Registry** | `crustcraft` | Docker format, `asia-southeast1` |
| **Cloud SQL** | `crustcraft-pg` | PostgreSQL 16, `db-f1-micro`, Enterprise, 10GB SSD |
| **Database / User**| `crustcraft` / `crustcraft` | Password ใน Secret Manager |
| **Service Account**| `crustcraft-runner` | Runtime Least Privilege |
| **Cloud Run Job** | `crustcraft-migrate` | รัน `npx prisma migrate deploy && npm run seed` |
| **Cloud Run Svc** | `crustcraft` | Port 3000, Min 0, Max 3, 512MiB, 1 CPU |

---

## 4. Teardown & Cost Management (`deploy/teardown.sh`)

สคริปต์ `deploy/teardown.sh` ต้องถูกเตรียมพร้อมไว้เสมอสำหรับลบหรือหยุดทรัพยากรทั้งหมดเพื่อไม่ให้เกิดค่าใช้จ่ายสะสมหลังการทดสอบ:
```bash
# Preview deletion without executing
DRY_RUN=1 bash deploy/teardown.sh

# Permanent teardown (requires manual project id confirmation)
bash deploy/teardown.sh
```

---

## 5. Files Allowed (Whitelist)
```
deploy/deploy.sh
deploy/release.sh
deploy/smoke_test.py
deploy/teardown.sh
```
