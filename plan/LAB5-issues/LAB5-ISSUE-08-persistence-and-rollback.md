# LAB5-ISSUE-08 — Database Persistence Verification across Restarts & Emergency Rollback
## Episode 8: Data Durability (`C-05`), Container Restart & Recommended Rollback Protocol

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-08` — Database Persistence Verification across Restarts & Emergency Rollback |
| **Type** | `test` / `infra` |
| **Branch** | `test/lab5-issue-08-persistence-and-rollback` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-07-auto-deploy-pipeline.md` |
| **Lab 5 Rubric** | Category 3: GCP deployment and persistence (35 pts) — `C-05` (`R-04`), Recommended Practice (Rollback) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `testing`, `persistence`, `rollback` |

---

## 1. Objective

ดำเนินการทดสอบเชิงประจักษ์ (Empirical Evidence Verification) เพื่อพิสูจน์ความคงอยู่ของข้อมูลและการกู้คืนระบบตามเกณฑ์ของ Handout:
1. **พิสูจน์ความคงอยู่ของข้อมูล (Database Persistence `C-05` / `R-04`):** แสดงให้เห็นว่าข้อมูลคำสั่งซื้อที่สร้างขึ้นบนระบบ Production จะต้องคงอยู่อย่างสมบูรณ์ ไม่สูญหาย ครอบคลุม **ทั้ง 2 สภาวะ (`S6`):**
   - **(a) การ Restart แอปพลิเคชัน (Application Restart):** การจำลอง Container Scale-to-zero / New Revision Instance Restart หรือ Restart บน Local Compose
   - **(b) การ Redeploy ทั้งระบบ (Full Pipeline Redeploy / Rollback & Roll-forward):** การ Deploy ทับด้วย Revision ใหม่หรือการทำ Rollback
2. **ปฏิบัติตามแนวปฏิบัติแนะนำ (Recommended Practice Handout §5):** ทดสอบกระบวนการทำ **Zero-Downtime Manual Rollback** ผ่าน `workflow_dispatch` ข้ามขั้นตอน CI/Build/Migration (`SKIP CI/BUILD/MIGRATE`) เพื่อสลับ Revision กลับสู่ Release A อย่างรวดเร็ว
3. **Roll-forward กลับสู่ Release B:** นำระบบกลับสู่สถานะล่าสุดพร้อมรับการตรวจงาน
4. **รักษาความต่อเนื่องของระบบ (`B1`):** Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-08-01 (Order Creation on Live Production):**
  - เข้าสู่หน้าเว็บจริงผ่าน Public Service URL (Release B)
  - เข้าสู่ระบบด้วยบัญชี Customer (ห้ามเปิดเผยรหัสผ่านจริงในเอกสาร `S7`)
  - สร้าง Order คำสั่งซื้อเบเกอรี่ใหม่ 1 รายการ (e.g., Sourdough Bread x 2 ชิ้น)
  - บันทึกภาพหน้าจอ Order ในหน้า "My Orders" พร้อมแสดง Order ID และ Timestamp ไว้เป็นหลักฐาน "Before"
- [ ] **AC-LAB5-08-02 (Verification of Persistence across Application Restart `C-05` Part A `S6`):**
  - ดำเนินการทดสอบการ Restart แอปพลิเคชันบน GCP ด้วยวิธีการที่ชัดเจน: รอให้ Container เกิด Idle Scale-to-zero แล้วส่ง Request ปลุก Instance ใหม่ หรือสั่ง Deploy Revision ใหม่โดยไม่มีการเปลี่ยนโค้ด เพื่อให้ Cloud Run สปอน Container instance ใหม่ขึ้นมา
  - *(ข้อควรระวัง: การทดสอบด้วย `docker compose down && docker compose up -d` ให้ใช้สำหรับ Local testing เท่านั้น ไม่นำมาใช้เป็นหลักฐาน GCP `C-05`)*
  - เข้าสู่หน้า My Orders บน Live URL อีกครั้ง ยืนยันว่า Order ID เดิมและข้อมูลทั้งหมดยังคงอยู่ครบถ้วน 100%
  - บันทึกภาพหน้าจอเป็นหลักฐาน "After Restart"
- [ ] **AC-LAB5-08-03 (Manual Rollback Execution via `workflow_dispatch` - Recommended Practice):**
  - ไปที่ GitHub Actions > Workflow **Deploy demo** > **Run workflow**
  - เลือก Branch: `main`
  - กรอก `image_tag`: **Commit SHA เต็ม 40 ตัวอักษรของ Release A**
  - สังเกตการณ์ทำงาน:
    - Job `test` (CI) มีสถานะ **Skipped**
    - Step `Build and push image` มีสถานะ **Skipped**
    - Step `Verify image, migrate and deploy` รันคำสั่งสลับ Traffic ไปยัง Release A โดยไม่รัน Migration Job ซ้ำ
    - Step `Smoke test public URL` ผ่านฉลุย
- [ ] **AC-LAB5-08-04 (Verification of Persistence across Redeploy/Rollback `C-05` Part B `S6`):**
  - Refresh หน้าเว็บ Live Production:
    - หน้า UI เปลี่ยนกลับไปเป็นของ Release A
    - Order ที่สร้างไว้ในขั้นตอน AC-LAB5-08-01 **ยังคงอยู่ครบถ้วน 100% ไม่สูญหาย**
  - บันทึกภาพหน้าจอเป็นหลักฐาน "After Redeploy/Rollback"
- [ ] **AC-LAB5-08-05 (Roll-forward Recovery to Release B):**
  - สั่ง Roll-forward กลับสู่ Release B (ใส่ Commit SHA ของ Release B ในช่อง `image_tag`)
  - ตรวจสอบว่าระบบกลับมาเป็น Release B พร้อมข้อมูลที่สมบูรณ์
- [ ] **AC-LAB5-08-06 (Continuous Availability Compliance `B1`):**
  - **Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.**

---

## 3. Rollback Step-by-Step Protocol (Recommended Practice)

```
[ Step 1: Record Target Release A SHA ]
Commit SHA A: <40-character-commit-sha-release-a>
Image Digest A: asia-southeast1-docker.pkg.dev/.../crustcraft/crustcraft@sha256:...

[ Step 2: Trigger Fast Rollback ]
GitHub Actions Console -> Workflow "Deploy demo" -> "Run workflow"
Branch: main
Input image_tag: <40-character-commit-sha-release-a>

[ Step 3: Zero-Build Traffic Switch ]
Fast Execution in release.sh:
- Skips CI tests & Docker build
- Skips DB migration
- Updates Cloud Run image to Image Digest A
- Routes 100% traffic to latest revision

[ Step 4: Verification of C-05 ]
Open Live URL -> Verify Release A UI -> Verify Order created in Release B is preserved!
```

---

## 4. Evidence Checklist for Final Report (Handout Part 3 & Part 4)

- [ ] Screenshot 1: หน้าจอ My Orders แสดง Order ที่สร้างขึ้นใหม่ (Before Screenshot)
- [ ] Screenshot 2: หน้าจอ My Orders หลังสั่ง Application Restart ยืนยันข้อมูลคงอยู่ (`C-05` Part A)
- [ ] Screenshot 3: GitHub Actions แสดงผลการรัน Rollback Workflow (Job `test` skipped, Fast Deploy)
- [ ] Screenshot 4: หน้าจอ My Orders หลังสั่ง Redeploy/Rollback แสดง Order เดิมยังอยู่ครบถ้วน (`C-05` Part B)
- [ ] Screenshot 5: GitHub Step Summary แสดง Rollback: true และ Digest ที่ตรงกัน

---

## 5. Files Allowed (Whitelist)
```
docs/labs/lab-05/deployment.md
```

---

## 6. AI Agent & Secret Safety Rules (Strict Policy)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. ❌ **Keep Cloud Run and Cloud SQL running continuously until grading has ended and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited. (`B1`)**
2. ❌ **ห้ามเปิดเผย Password ของบัญชีผู้ใช้หรือ Admin ใน Screenshot หรือเอกสาร Markdown (`S7`)**
3. ❌ **ห้าม AI Agent ทำการ Rollback ฐานข้อมูลโดยพลการ (ให้ทำเฉพาะ Container Image Rollback ที่คง Schema เดิม)**
