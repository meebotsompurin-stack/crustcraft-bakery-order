# LAB5-ISSUE-09 — Architecture Documentation & Final Lab 5 Submission Report (PDF)
## Episode 9 & Section 12: Knowledge Synthesis & Report Generation

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-09` — Architecture Documentation & Final Lab 5 Submission Report (PDF) |
| **Type** | `docs` / `release` |
| **Branch** | `docs/lab5-issue-09-docs-and-pdf-submission` |
| **Depends on** | `LAB5-ISSUE-08-persistence-and-rollback.md` |
| **Lab 5 Rubric** | Traceability `R-06` (Deployment Docs & Final PDF Submission) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

จัดทำเอกสารคู่มือสถาปัตยกรรมการ Deploy ฉบับสมบูรณ์ (`docs/deployment.md`) และรวบรวมหลักฐานเชิงประจักษ์ทั้งหมดตลอดทั้ง 8 ขั้นตอนของ Lab 5 มาจัดทำเป็น **รายงานสรุปผลการปฏิบัติการ Lab 5 ฉบับสมบูรณ์ (PDF Document: `lab5_sec<sec>_<group>.pdf`)** ตามมาตรฐานเดียวกับ Deliverable 1:
1. เขียนเอกสาร `docs/deployment.md` อธิบายสถาปัตยกรรมระบบ Cloud, แผนภาพ Data Flow, การทำงานของ CI/CD Pipeline, และคู่มือการ Troubleshooting
2. บันทึกหลักฐาน Evidence Screenshots ครบทุกเกณฑ์รูบริก (`C-01` ถึง `C-06` และ `R-01` ถึง `R-06`)
3. ดำเนินการ **Pause / Teardown ทรัพยากร Cloud SQL (`crustcraft-pg`)** เพื่อหยุดค่าใช้จ่ายทันทีหลังเสร็จสิ้นการบันทึกภาพ
4. แปลงรายงานจาก HTML Source สู่ไฟล์ PDF ผ่าน Playwright Chromium Engine (`displayHeaderFooter: false`) ตามชื่อไฟล์ที่อาจารย์กำหนด

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-09-01:** จัดทำเอกสาร `docs/deployment.md` ครอบคลุม:
  - สถาปัตยกรรมระบบบน Google Cloud Platform (Mermaid Architecture Diagram)
  - รายละเอียดทรัพยากร (Artifact Registry, Cloud SQL PostgreSQL 16, Cloud Run Service, Cloud Run Job, Secret Manager)
  - โครงสร้าง CI/CD Pipeline (`ci-docker.yml`, `deploy.yml`, Workload Identity Federation)
  - กลไก Zero-downtime Rollback และ Database Persistence
  - คู่มือคำสั่งกู้คืนระบบและ Cost Management Guardrails
- [ ] **AC-LAB5-09-02:** รวบรวมหลักฐานรูปภาพครบทั้ง 6 หมวดหลัก:
  - **Category 1 (Budget & Setup):** หน้าจอ Budget Alert $250, Project IAM
  - **Category 2 (CI & Quality Gate `C-01`):** หน้าจอ GitHub PR Checks สีเขียวครบทุกขั้นตอน
  - **Category 3 (Merge Gate Enforcement `C-02`):** หน้าจอ PR `test/prove-gate` ที่ถูกบล็อกปุ่ม Merge
  - **Category 4 (First Deploy & Live URL `C-04`):** หน้าจอ Cloud Shell Output, Cloud Run Service, Live URL ในเบราว์เซอร์
  - **Category 5 (Automated CD & Digest Sync `C-06`):** หน้าจอ Release A, Release B, และ Step Summary
  - **Category 6 (Persistence & Rollback `C-05`):** หน้าจอสร้าง Order, หน้าจอ Rollback สำเร็จ, หน้าจอ Order ยังคงอยู่ครบ
- [ ] **AC-LAB5-09-03 (Fiscal Shutdown Protocol):**
  - ดำเนินการ Pause Cloud SQL instance `crustcraft-pg` หรือรัน `deploy/teardown.sh`
  - ตรวจสอบผ่านหน้า Billing Console ว่าไม่มีทรัพยากรส่วนเกินที่คิดค่าบริการค้างอยู่
- [ ] **AC-LAB5-09-04 (Final Report Generation):**
  - สร้างไฟล์ HTML Source: `docs/lab5-report.html` โดยใช้ Clean Styling (ฟอนต์ Sarabun / Inter, JetBrains Mono, Theme Palette สีเขียว/ครามที่สะอาดตา)
  - ฝังภาพ Evidence ทั้งหมดในรูปแบบ Base64 Inline Image เพื่อให้ไฟล์ Standalone
  - แปลงเป็นไฟล์ PDF ผ่านสคริปต์ Playwright Headless Chromium:
    ```bash
    node scripts/generate-lab5-pdf.js
    ```
  - Output PDF File: `docs/lab5_sec1_group04.pdf` (หรือตามรหัสกลุ่มวิชาของทีม)
  - ความคมชัดระดับ 300 DPI, ตัดขอบกระดาษพอดี ไม่มีหัว/ท้ายกระดาษรบกวน (`displayHeaderFooter: false`)

---

## 3. Final Report Structure (Table of Contents)

1. **Cover Page & Executive Overview**
   - ชื่อนศ., รหัสนักศึกษา, ภาควิชา, มหาวิทยาลัย, ลิงก์ GitHub Repository, ลิงก์ Live URL
2. **Part 1: Cloud Architecture & 12-Factor Containerization**
   - Diagram สถาปัตยกรรม, การปรับปรุง Express Static Serving, `/api/ready`
3. **Part 2: CI Pipeline & Automated Testing Quality Gate (`C-01`)**
   - การทำงานของ `ci-docker.yml`, Service Container PostgreSQL 16, ผลการทดสอบ 50/50 Tests
4. **Part 3: Branch Protection & Merge Gate Demonstration (`C-02`)**
   - กฎ Ruleset `protect-main`, หลักฐานการบล็อก PR ที่มีข้อผิดพลาด
5. **Part 4: Google Cloud Infrastructure & First Deployment (`C-04`)**
   - การ Provisioning ผ่าน `deploy.sh`, Cloud SQL PostgreSQL 16, Secret Manager, Least Privilege IAM
6. **Part 5: Workload Identity Federation & Security Posture**
   - การยืนยันตัวตนแบบ Keyless, OIDC Attribute Mapping, ไร้ความเสี่ยงกุญแจรั่วไหล
7. **Part 6: Continuous Deployment & Immutable Digest Tracking (`C-06`)**
   - วงรอบ Release A สู่ Release B, การจับคู่ Tag SHA กับ `@sha256` Image Digest
8. **Part 7: Database Persistence & Emergency Rollback Verification (`C-05`)**
   - การพิสูจน์ความคงอยู่ของข้อมูล Order ข้าม Revision, การสั่ง Rollback ข้ามขั้นตอน CI
9. **Part 8: Cost Analysis & Cloud Resource Shutdown**
   - สรุปค่าใช้จ่ายจริงเทียบกับงบประมาณ, หลักฐานการ Pause/Teardown Cloud SQL

---

## 4. Script Specification for PDF Generation

```javascript
// scripts/generate-lab5-pdf.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, '../docs/lab5-report.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  await page.pdf({
    path: path.resolve(__dirname, '../docs/lab5_sec1_group04.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: false,
  });

  await browser.close();
  console.log('LAB 5 Report PDF generated successfully.');
})();
```

---

## 5. Files Allowed (Whitelist)
```
docs/deployment.md
docs/lab5-report.html
scripts/generate-lab5-pdf.js (temporary runner)
docs/lab5_sec1_group04.pdf
```
