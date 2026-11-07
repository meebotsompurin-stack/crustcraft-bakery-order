# LAB5-ISSUE-08 — Database Persistence Verification & Zero-Downtime Manual Rollback
## Episode 8: Data Durability & Emergency Rollback Protocol

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-08` — Database Persistence Verification & Zero-Downtime Manual Rollback |
| **Type** | `test` / `infra` |
| **Branch** | `test/lab5-issue-08-persistence-and-rollback` |
| **Depends on** | `LAB5-ISSUE-07-auto-deploy-pipeline.md` |
| **Lab 5 Rubric** | Traceability `C-05` (Database Persistence), `R-05` (Manual Rollback Protocol) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

ดำเนินการทดสอบเชิงประจักษ์ (Empirical Evidence Verification) ตามเกณฑ์บังคับของ Lab 5:
1. **พิสูจน์ความคงอยู่ของข้อมูล (Database Persistence `C-05`):** แสดงให้เห็นว่าข้อมูลธุรกรรมคำสั่งซื้อของ CrustCraft (Orders, OrderItems, Users) ที่สร้างขึ้นบนระบบ Production จะต้องคงอยู่อย่างสมบูรณ์ ไม่สูญหาย แม้ Container จะถูก Restart, Scale down to 0, Deploy revision ใหม่, หรือทำการ Rollback กลับสู่เวอร์ชันก่อนหน้า
2. **พิสูจน์การ Rollback แบบปลอดภัย (Rollback Protocol `R-05`):** จำลองสถานการณ์ฉุกเฉินบน Production ด้วยการสั่ง Run Workflow `Deploy demo` แบบ Manual (`workflow_dispatch`) โดยระบุ `image_tag` เป็น Commit SHA ของ Release A เพื่อสั่งให้ Cloud Run สลับ Revision กลับไปชี้ที่ Image A ทันที โดยทำการ **ข้ามขั้นตอน CI, Build, และ Migration (`SKIP CI/BUILD/MIGRATE`)**
3. **ตรวจสอบความถูกต้องหลัง Rollback:** ยืนยันว่าหน้าเว็บกลับไปแสดงผลแบบ Release A และข้อมูลคำสั่งซื้อที่สร้างขึ้นใน Release B ยังคงอยู่ครบถ้วน 100%
4. **Roll-forward กลับสู่ Release B:** สั่ง Deploy กลับมายัง Release B เพื่อให้ระบบกลับสู่สถานะล่าสุดพร้อมส่งงาน

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-08-01 (Order Creation on Live Release B):**
  - เปิดเบราว์เซอร์เข้าสู่ Production Service URL (Release B)
  - เข้าสู่ระบบด้วยบัญชี Customer (`customer1@test.com`)
  - สร้าง Order คำสั่งซื้อขนมปังใหม่ 1 รายการ (e.g., Artisan Butter Croissant x 2 ชิ้น)
  - ยืนยัน Order ID, สถานะ `PENDING`, และ Total Amount
  - บันทึกภาพหน้าจอ Order ในหน้า "My Orders" บน Live Production ไว้เป็น Evidence
- [ ] **AC-LAB5-08-02 (Trigger Manual Rollback to Release A):**
  - ไปที่ GitHub Actions > Workflow **Deploy demo** > **Run workflow**
  - เลือก Branch: `main`
  - กรอกช่อง `image_tag`: ใส่ **Commit SHA เต็ม 40 ตัวอักษรของ Release A**
  - กดรัน และสังเกตการทำงาน:
    - Job `test` (CI) ต้องแสดงสถานะ **Skipped**
    - Step `Build and push image` ต้องแสดงสถานะ **Skipped**
    - ใน Step `Verify image, migrate and deploy`: สคริปต์ `deploy/release.sh` ต้องพิมพ์ข้อความ:
      `Rollback: reuse existing image; skip tests, build, migration and seed.`
    - ไม่มีการรัน Cloud Run Migration Job (`crustcraft-migrate`)
    - Service `crustcraft` ถูกอัปเดตไปใช้ Image Digest ของ Release A
    - Step `Smoke test public URL` ผ่านฉลุย (PASS)
- [ ] **AC-LAB5-08-03 (Persistence & Rollback Verification on Live URL):**
  - Refresh หน้าเบราว์เซอร์ Live Production:
    - หน้า UI ต้องย้อนกลับไปเป็นดีไซน์ของ Release A (ข้อความ Banner หรือ Footer ของ Release B หายไป)
    - บัญชีผู้ใช้ยังคงล็อกอินอยู่ หรือสามารถล็อกอินเข้าไปดู Order เดิมได้
    - Order ที่สร้างไว้ในขั้นตอน AC-LAB5-08-01 **ยังคงอยู่ครบถ้วน 100% ไม่สูญหาย** (`C-05`)
  - ตรวจสอบผ่าน GCP Cloud Run Console: Revision ของ Release A ได้รับ Traffic 100%
- [ ] **AC-LAB5-08-04 (Roll-forward Recovery to Release B):**
  - ดำเนินการสั่ง Roll-forward กลับสู่ Release B ด้วยวิธีเดียวกัน (ใส่ Commit SHA ของ Release B ในช่อง `image_tag`)
  - ตรวจสอบว่าระบบกลับมาเป็น Release B พร้อมข้อมูลที่สมบูรณ์

---

## 3. Rollback Step-by-Step Protocol

```
[ Step 1: Record Target Release A SHA ]
Commit SHA A: a1b2c3d4e5f6... (40 chars)
Image Digest A: asia-southeast1-docker.pkg.dev/.../crustcraft/crustcraft@sha256:...

[ Step 2: Trigger Rollback ]
GitHub Console -> Actions -> "Deploy demo" -> "Run workflow"
Branch: main
image_tag: a1b2c3d4e5f6...

[ Step 3: Fast Traffic Switching in release.sh ]
gcloud run services update crustcraft --image="$DIGEST_IMAGE"
gcloud run services update-traffic crustcraft --to-latest

[ Step 4: Verification ]
Check Live URL -> UI reverts to Release A -> DB record from Release B is intact!
```

---

## 4. Architectural Note on Database Migration Compatibility

> ⚠️ **Zero-Downtime Migration Rule (Expand and Contract Pattern):**
> การทำ Image Rollback บน Serverless Container จะปลอดภัยต่อฐานข้อมูลเฉพาะในกรณีที่ Database Schema ของเวอร์ชันก่อนหน้ายังคงเข้ากันได้ (Backward-compatible) กับข้อมูลในปัจจุบัน
> - **อนุญาต (Additive changes):** เพิ่ม Table ใหม่, เพิ่ม Nullable Column ใหม่
> - **ข้อควรระวัง (Destructive changes):** การ Drop Table หรือ Rename Column ข้ามเวอร์ชัน จะไม่สามารถทำ Image Rollback แบบไร้รอยต่อได้โดยตรง ต้องเตรียม Migration Script ย้อนกลับเฉพาะทาง

---

## 5. Evidence Checklist for Final Report
- [ ] Screenshot 1: หน้าจอสร้าง Order สำเร็จบน Live Release B URL พร้อมเห็น Order ID
- [ ] Screenshot 2: GitHub Actions แสดงผลการรัน Rollback Workflow (Job `test` skipped, `release.sh` skipped migration)
- [ ] Screenshot 3: Cloud Run Revisions Console แสดง Revision Release A ได้รับ Traffic 100%
- [ ] Screenshot 4: หน้าจอ My Orders บน Release A แสดง Order เดิมที่สร้างใน Release B ยังคงอยู่ครบถ้วน (Proof of `C-05`)
- [ ] Screenshot 5: Summary หน้า GitHub Step Summary แสดง Rollback: true และ Digest ที่ตรงกัน
