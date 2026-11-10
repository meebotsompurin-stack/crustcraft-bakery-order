# LAB5-ISSUE-01 — GCP Project Setup, IAM & Budget Alert Configuration
## Episode 1: Cloud Foundation, Fiscal Guardrails & Repository Hygiene

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-01` — GCP Project Setup, IAM & Budget Alert Configuration |
| **Type** | `infra` / `docs` |
| **Branch** | `infra/lab5-issue-01-gcp-setup-and-budget` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-00-master-plan.md` |
| **Lab 5 Rubric** | Traceability `R-03` (Zero Secrets), `R-04` (Budget Guardrails), `R-10` (Label & History), `R-11` (Collaboration), `R-12` (Public Repo) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `infrastructure`, `security` |

---

## 1. Objective

สร้างและตั้งค่าสภาพแวดล้อมระบบบน Google Cloud Platform (GCP) สำหรับโปรเจกต์ `cpe334-crustcraft` ให้สอดคล้องกับระเบียบปฏิบัติด้านความปลอดภัยและการควบคุมงบประมาณ (Fiscal Guardrails) ตาม Handout §4.4 ก่อนการสร้างทรัพยากรที่คิดค่าบริการจริง พร้อมทั้งกำหนดมาตรฐาน Repository Hygiene บน GitHub:
1. ลงทะเบียน GCP Free Trial ($300 Credit) ด้วยบัญชีส่วนบุคคลที่ไม่เคยใช้งานมาก่อน
2. ตั้งค่าการแจ้งเตือนงบประมาณ (Budget Alert) ขนาด $250 ครบทั้ง 4 ระดับ (10%, 20%, 50%, 90%) ในโหมด Alerts-Only ก่อนการสร้างทรัพยากรใดๆ
3. กำหนดสิทธิ์ IAM แก่เพื่อนร่วมทีมในระดับ `roles/editor` อย่างเคร่งครัด (Least Privilege)
4. ตั้งค่าความปลอดภัยของ GitHub Repository: เปิดสถานะ Public (`R-12`), เปิดใช้ **Secret Scanning Push Protection**, กำหนด Label `lab5` (`R-10`), และนำ Issues ทั้งหมดขึ้น GitHub Project Board (`R-09`, `R-11`)

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-01-01 (GCP Free Trial Registration per Handout §4.4):**
  - สมาชิกคนหนึ่งดำเนินการสมัคร GCP Free Trial โดยใช้ **Personal Gmail Account** ที่ไม่เคยเปิดใช้งาน Free Trial มาก่อน (**ห้ามใช้อีเมลสถาบัน `@mail.kmutt.ac.th` โดยเด็ดขาด**)
  - ยืนยันว่าหน้า `Billing -> Credits` แสดงยอดเครดิตทดลองใช้งาน $300 พร้อมใช้งาน
  - ⚠️ **กฎความปลอดภัยด้านการเงิน:** ห้ามกดจ่ายเงินล่วงหน้า (Prepayment) และ **ห้ามคลิก Upgrade Billing Account เด็ดขาด** หากระบบเรียกเก็บเงินหรือระงับบัญชี ให้บันทึกภาพหน้าจอและแจ้งอาจารย์ผู้สอน/TA ทันที
- [ ] **AC-LAB5-01-02 (Fiscal Guardrail: Budget & Alerting Setup):**
  - สร้าง Budget Alert มูลค่า **$250** ก่อนสร้างทรัพยากรใดๆ ที่คิดค่าบริการ
  - กำหนดเกณฑ์แจ้งเตือน (Thresholds) ครบทั้ง **4 ระดับ**:
    - **10%** ($25.00)
    - **20%** ($50.00)
    - **50%** ($125.00)
    - **90%** ($225.00)
  - กำหนดประเภทเป็น "Alerts Only" (ไม่ตัดการทำงานของ Service อัตโนมัติ เพื่อป้องกันระบบล่มระหว่างการตรวจงาน)
  - ผูกอีเมลรับการแจ้งเตือนไปยังสมาชิกทั้งสองคน (`@meebotsompurin-stack` และ `@poom2548`)
- [ ] **AC-LAB5-01-03 (IAM Least Privilege Configuration):**
  - เพิ่มสิทธิ์ให้สมาชิกอีกคนหนึ่งในบทบาท **`roles/editor`** เท่านั้น (ห้ามมอบสิทธิ์ `Owner` ให้แก่สมาชิกคนที่สอง ตาม Handout §4.4)
  - ทั้งสองคนสามารถล็อกอินเข้าสู่ GCP Console และเข้าถึง Cloud Shell ของโปรเจกต์ `cpe334-crustcraft` ได้สำเร็จ
- [ ] **AC-LAB5-01-04 (GitHub Repository Hygiene & Secret Protection):**
  - ตรวจสอบว่า Repository เป็น **Public** (`R-12`) และเปิดใช้งาน **GitHub Secret scanning push protection** ในแถบ Settings > Code security and analysis
  - ติดป้ายกำกับ (Label) **`lab5`** ให้แก่ Issue และ Pull Request ของ Lab 5 ทุกรายการ (`R-10`)
  - นำ Issue ทั้ง 9 ฉบับขึ้นแสดงบน GitHub Project Board เพื่อติดตามสถานะร่วมกัน (`R-09`, `R-11`)
- [ ] **AC-LAB5-01-05 (Git History Preservation `R-10`):**
  - กำหนดข้อตกลงทีมอย่างเคร่งครัด: ห้าม Force-push (`--force`), ห้าม Rebase กิ่งที่เผยแพร่แล้ว, และห้ามลบ Commit หรือ CI runs ใดๆ
  - ทุกการ Merge ให้ใช้ Standard Merge Commit หรือ Squash ที่รักษาประวัติอย่างโปร่งใส

---

## 3. Step-by-Step Implementation Guide

### Step 3.1: GCP Project & Free Trial Verification
1. สมาชิกคนที่ 1 ล็อกอินเข้าสู่ GCP Console ([https://console.cloud.google.com/](https://console.cloud.google.com/)) ด้วยบัญชี Personal Gmail
2. สร้าง Project ใหม่ชื่อ `cpe334-crustcraft` (หากชื่อซ้ำให้ระบุรหัสนักศึกษาต่อท้าย)
3. ตรวจสอบหน้า `Billing > Overview` ให้แน่ใจว่าสถานะ Billing Active และในหน้า `Credits` มี $300 Credit แสดงอยู่

### Step 3.2: Configure Budget & Alerting (ก่อนสร้าง Resource)
1. ไปที่ `Billing > Budgets & alerts` > คลิก **Create Budget**
2. ตั้งชื่อ: `crustcraft-lab5-budget`
3. Scope: เลือก Project `cpe334-crustcraft`
4. Amount: Specified amount -> `$250`
5. Threshold Rules: เพิ่ม 4 จุดแจ้งเตือน (10%, 20%, 50%, 90% of budget)
6. Manage Notifications: ระบุอีเมลของ Purin และ Saksorn
7. บันทึกและถ่ายภาพหน้าจอเป็นหลักฐาน

### Step 3.3: IAM Member Assignment
1. ไปที่ `IAM & Admin > IAM`
2. คลิก **Grant Access**
3. เพิ่มอีเมลของสมาชิกคนที่ 2
4. กำหนด Role: **Project > Editor**
5. ตรวจสอบให้แน่ใจว่าสมาชิกคนที่ 2 สามารถสลับเข้าสู่โปรเจกต์และรัน `gcloud config set project cpe334-crustcraft` ใน Cloud Shell ได้

### Step 3.4: Repository Security & Board Setup
1. ไปที่ GitHub Repository Settings > General > ยืนยัน Danger Zone เป็น Public Repository
2. ไปที่ Code security > Secret scanning > เปิดใช้งาน **Push protection**
3. ไปที่ Issues > Labels > สร้าง Label `lab5`
4. ไปที่ Projects > สร้าง Board "Lab 5 Cloud Deployment" และเพิ่มรายการ Issue 01 ถึง 09

---

## 4. Evidence Checklist for Final Report (Handout Part 0 & Part 3)

- [ ] Screenshot 1: GCP Console แสดง Project ID, Billing Active และ $300 Credits
- [ ] Screenshot 2: หน้าต่าง Budget & Alerts แสดงวงเงิน $250 พร้อม Thresholds 4 ระดับ (10%, 20%, 50%, 90%)
- [ ] Screenshot 3: หน้าจอ IAM & Admin แสดงทั้งสองสมาชิก (เจ้าของโปรเจกต์ และ Editor)
- [ ] Screenshot 4: GitHub Security Settings แสดง Secret Scanning Push Protection Enabled
- [ ] Screenshot 5: GitHub Issues / Project Board แสดง Issue ทั้งหมดที่มี Label `lab5`

---

## 5. AI Agent & Secret Safety Rules (Strict Policy)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. ❌ **ห้ามให้ AI Agent ดำเนินการคำสั่ง `gcloud` หรือสร้างทรัพยากรบน Cloud แบบอัตโนมัติ**
2. ❌ **ห้ามนำ Billing Account ID, บัตรเครดิต, หรือ Secret ใดๆ วางลงใน AI Prompt หรือบันทึกลงใน Repository**
3. ❌ **ห้ามดาวน์โหลด Service Account JSON Key** ลงมาเด็ดขาด (เราจะใช้ Workload Identity Federation ใน Episode 6)
