# LAB5-ISSUE-09 — Architecture Documentation & Final Evidence Index PDF Report
## Episode 9, Episode 10 & Handout Section 12: Architecture Guide & Concise Evidence Index Submission

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-09` — Architecture Documentation & Final Evidence Index PDF Report |
| **Type** | `docs` / `release` |
| **Branch** | `docs/lab5-issue-09-docs-and-pdf-submission` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-08-persistence-and-rollback.md` |
| **Lab 5 Rubric** | All Categories (100 pts) — Handout §4.3 & §12 Submission Verification |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `documentation`, `pdf-report` |

---

## 1. Objective

จัดทำเอกสารคู่มือสถาปัตยกรรมการ Deploy ฉบับสมบูรณ์ (`docs/labs/lab-05/deployment.md` `M2`) และจัดทำรายงานสรุปหลักฐานส่งงานตามรูปแบบ **Concise Evidence Index PDF (Handout §12 `M3`)** เพื่อส่งเข้าสู่ระบบ LEB2:
1. เขียนเอกสาร `docs/labs/lab-05/deployment.md` ครอบคลุมทั้ง 5 หัวข้อบังคับตาม Handout §4.3
2. รวบรวมหลักฐาน Link-First และภาพ Screenshot ที่ผ่านการ Crop ชัดเจน 100% ปราศจาก Plaintext Secret พร้อมหมายเลขกำกับ Caption: `"Figure X. C-0Y (R-0Z): <what it shows>. Commit/Run/URL."`
3. จัดทำรายงาน PDF ในโครงสร้าง 5 ส่วนตาม Handout §12 ตั้งชื่อไฟล์ `lab5_sec<section>_<group name>.pdf` (เก็บนอก Git repo สำหรับอัปโหลดขึ้น LEB2 โดยไม่ commit ไฟล์ pdf ลงใน `docs/`)
4. **ปฏิบัติตามกฎความต่อเนื่องของระบบอย่างเคร่งครัด (Continuous Availability Directive `B1`):** **ห้ามสั่ง Pause หรือ Teardown ทรัพยากร Cloud Run และ Cloud SQL เด็ดขาด** ต้องเปิดระบบให้ทำงานต่อเนื่องจนกว่าผู้สอนจะประกาศสิ้นสุดการตรวจให้คะแนนรายวิชาและเสร็จสิ้น Lab 6 Partner UAT

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-09-01 (Deployment Guide per Handout §4.3 `M2`):**
  - จัดทำไฟล์ `docs/labs/lab-05/deployment.md` มีเนื้อหาครบทั้ง 5 หัวข้อ:
    1. **Stack & Changes from Reference:** สถาปัตยกรรม Express + React Monorepo, การย้าย SQLite -> PostgreSQL 16, และ Single Container Serving
    2. **Environment Variable Table:** ตารางแสดงทุกตัวแปร (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `VITE_API_URL`) ระบุวัตถุประสงค์, เป็น Secret หรือไม่, และแหล่งที่มาของค่า
    3. **Commands Guide:** คำสั่งที่ใช้ Build, Test, Run, Migrate, และ Seed (ทั้งแบบ Local, Docker Compose, และ Production)
    4. **GCP Project & Resource Names:** ระบุ Project ID, Region, และชื่อ Resource ทั้งหมดอย่างแม่นยำ
    5. **Repeatable Release Procedure & Running Commit Lookup:** ขั้นตอนการ Deploy ผ่าน Pipeline และวิธีตรวจสอบ Commit ที่กำลังรันอยู่ (`R-08`)
- [ ] **AC-LAB5-09-02 (Root `.env.example` Verification `M2`):**
  - ตรวจสอบว่ามีไฟล์ `.env.example` อยู่ที่ Root ของ Repository สำหรับให้ผู้ประเมินรัน Fresh Clone ได้ทันที (`R-02`, `C-03`)
- [ ] **AC-LAB5-09-03 (Exact 5-Part PDF Report Structure per Handout §12 `M3`):**
  - จัดทำรายงาน PDF ที่มีโครงสร้าง 5 หัวข้อตามลำดับอย่างแม่นยำ:
    - **`Answer Part 0: Team and Evidence Index`:** ข้อมูลทีม (ชื่อ, รหัสนักศึกษา, GitHub Username ทั้ง 2 คน), ลิงก์ Public Repo, Submitted Tag/Commit, Public Cloud Run URL & Serving Commit, ตาราง Contribution พร้อมลิงก์ Issue/PR (`R-11`), และตาราง Evidence Index สรุปคะแนนรูบริกครบทุกหมวด
    - **`Answer Part 1: CI and Quality Gate` (30 pts):** หลักฐาน `C-01` (CI run link & test summary) และ `C-02` (PR link, failed check, blocked merge screenshot)
    - **`Answer Part 2: Docker and Reproducible Configuration` (20 pts):** หลักฐาน `C-03` (Fresh clone build commands & output), ลิงก์ `.env.example`, ตาราง Env จาก `deployment.md`
    - **`Answer Part 3: GCP Deployment and Persistence` (35 pts):** หลักฐาน `C-04` (Domain workflow บน Live URL: Sign in, Create Order, Access Rejection) และ `C-05` (Before & After screenshots ของทั้ง Application Restart และ Redeploy/Rollback)
    - **`Answer Part 4: Repeatable Release Pipeline` (15 pts):** หลักฐาน `C-06` (PR links จาก `lab-5-staging` -> `main`, Pipeline run link, GCP Revision details ที่จับคู่ Commit SHA) และคำอธิบายขั้นตอน Release
- [ ] **AC-LAB5-09-04 (Evidence Styling & Security Standards):**
  - รูปภาพทุกรูปต้องถูก Crop ชัดเจน อ่าน Text ในภาพออก 100%
  - รูปภาพต้องมีหมายเลขกำกับตามรูปแบบมาตรฐาน: `"Figure X. C-0Y (R-0Z): <description>. Commit/Run/URL."`
  - ❌ **ห้ามมี Plaintext Password, Connection String จริง, หรือ Private Token ปรากฏในรายงานเด็ดขาด (`R-02`)**
- [ ] **AC-LAB5-09-05 (PDF Filename & Clean Repository Rule `M3`):**
  - ตั้งชื่อไฟล์ PDF: `lab5_sec<section>_<group name>.pdf` (เช่น `lab5_sec1_group04.pdf`)
  - **ไฟล์ PDF ต้องถูกเก็บไว้นอก Git Repository สำหรับอัปโหลดขึ้น LEB2 — ห้าม Commit ไฟล์ PDF ลงในโฟลเดอร์ `docs/` เพื่อรักษาความสะอาดของ Repository**
- [ ] **AC-LAB5-09-06 (Continuous Availability Directive `B1`):**
  - **ห้าม Pause หรือ Teardown ทรัพยากร Cloud Run และ Cloud SQL เด็ดขาด**
  - Cloud Run Service และ Cloud SQL ต้องเปิดทำงานต่อเนื่องจนกว่าอาจารย์ผู้สอนจะประกาศสิ้นสุดการตรวจให้คะแนนและเสร็จสิ้น Lab 6 Partner UAT

---

## 3. Handout §12 PDF Report Blueprint

```markdown
# Lab 5: Cloud Deployment and CI/CD Pipeline on GCP
## CrustCraft Bakery (Theme 4) — Group 04 (Section 1)

---

### Answer Part 0: Team and Evidence Index
- **Team Topic:** CrustCraft Artisan Bakery Pre-Order & Fulfillment System (Theme 4)
- **Members:**
  1. Purin Mebotsom (ID: 650705034xx, GitHub: @meebotsompurin-stack)
  2. Saksorn Buranatananun (ID: 650705034xx, GitHub: @poom2548)
- **Public Repository Link:** https://github.com/meebotsompurin-stack/crustcraft-bakery-order (Public per R-12)
- **Submitted Tag / Commit:** v1.0.0 (`<commit-sha>`)
- **Public Cloud Run URL:** `https://crustcraft-xxxxxx-as.a.run.app`
- **Current Serving Commit:** `<40-char-commit-sha>`
- **Contribution Table:** (Issues, Commits, PR Review links for both members per R-11)
- **Evidence Index Table:**
  | Rubric Part | Points | Handout Check / Criteria | Primary Link / Evidence Summary |
  |---|---|---|---|
  | Part 1: CI and Quality Gate | 30 pts | C-01, C-02 | PR #xx, CI Run #yy, Figure 1-2 |
  | Part 2: Docker and Configuration | 20 pts | C-03, R-01, R-02 | Fresh clone terminal output, .env.example, Figure 3 |
  | Part 3: GCP Deployment & Persistence | 35 pts | C-04, C-05 | Public URL, Before/After Restart & Redeploy, Figure 4-7 |
  | Part 4: Repeatable Release Pipeline | 15 pts | C-06, R-07..R-10 | Release PR #aa, Cloud Run Revision SHA, Figure 8-9 |

---

### Answer Part 1: CI and Quality Gate (30 pts)
- **C-01 Verification:** Link to passing CI run on normal PR, test summary output.
- **Figure 1. C-01 (R-05):** Automated CI run summary passing 50/50 tests and Docker build.
- **C-02 Verification:** Link to temporary failing PR (`test/prove-gate` into `main`), ruleset `protect-main` configuration.
- **Figure 2. C-02 (R-06):** GitHub PR from temporary branch blocked by failing `test-and-docker` check.

---

### Answer Part 2: Docker and Reproducible Configuration (20 pts)
- **C-03 Verification:** Commands and full output of clean clone with only `.env.example` values.
- **Figure 3. C-03 (R-01, R-02):** Terminal logs of `docker compose up --build -d` and HTTP 200 responses.
- **Environment Variables Table:** Reference to `docs/labs/lab-05/deployment.md`.

---

### Answer Part 3: GCP Deployment and Persistence (35 pts)
- **C-04 Verification:** Screenshots of live domain workflow on public URL:
  - Figure 4. C-04 (R-03): Sign in to live application.
  - Figure 5. C-04 (R-03): Successful Bakery Order placement.
  - Figure 6. C-04 (R-03): Access restriction / rule rejection enforcement.
- **C-05 Verification:** Database persistence across restart and redeploy:
  - Figure 7A. C-05 (R-04): Order record before restart.
  - Figure 7B. C-05 (R-04): Order record intact after container restart.
  - Figure 7C. C-05 (R-04): Order record intact after full pipeline redeploy / rollback.

---

### Answer Part 4: Repeatable Release Pipeline (15 pts)
- **C-06 Verification:** Evidence of Release A and Release B progression through `lab-5-staging` -> `main` -> Cloud Run.
- **Figure 8. C-06 (R-07..R-10):** PR into `lab-5-staging`, peer review approval, and release PR into `main`.
- **Figure 9. C-06 (R-08):** Cloud Run Revision details matching 40-char commit SHA and resolved `@sha256` digest.
- **Release Procedure Summary:** Reference to documented steps in `docs/labs/lab-05/deployment.md`.
```

---

## 4. Policy on Pausing and Teardown (`B1`)

> 🚨 **MANDATORY INSTRUCTION REGARDING GRADING & LAB 6 UAT:**
> - **Episode 9 (Pause):** ใช้เพื่อหยุด Cloud SQL ชั่วคราวเฉพาะช่วงที่ไม่มีการเรียนการสอนหรือตรวจงาน และต้องเปิดกลับขึ้นมาทันทีเมื่อถึงกำหนดการตรวจ
> - **Episode 10 (Teardown):** ห้ามรัน `deploy/teardown.sh` เด็ดขาดจนกว่าผู้สอนจะประกาศปิดการตรวจรายวิชา การลบทรัพยากรก่อนกำหนดจะทำให้ถูกหักคะแนนในส่วน Live Service
> - ให้คงสภาพระบบพร้อมใช้งานบน Public URL ตลอดเวลา

---

## 5. Files Allowed (Whitelist)
```
docs/labs/lab-05/deployment.md
```
*(หมายเหตุ: ไฟล์ PDF จะถูกสร้างและจัดเก็บไว้นอก Git Repo เพื่ออัปโหลดขึ้นระบบ LEB2 โดยตรง)*

---

## 6. AI Agent & Secret Safety Rules (Strict Policy)

1. ❌ **ห้ามใส่ Secret จริงในรายงาน PDF หรือเอกสาร `deployment.md` เด็ดขาด**
2. ❌ **ห้ามรันคำสั่ง Teardown หรือ Pause ฐานข้อมูลหลังสร้างเอกสารเสร็จ (`B1`)**
3. ❌ **ภาพหลักฐานทุกภาพต้องได้รับการตรวจสอบโดยสมาชิกทีมทั้งสองคนก่อนส่งงาน**
