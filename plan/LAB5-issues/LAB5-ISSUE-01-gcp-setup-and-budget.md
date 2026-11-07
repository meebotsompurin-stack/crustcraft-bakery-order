# LAB5-ISSUE-01 — GCP Project Setup, IAM & Budget Alert Configuration
## Episode 1: Cloud Foundation & Fiscal Guardrails

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-01` — GCP Project Setup, IAM & Budget Alert Configuration |
| **Type** | `infra` / `docs` |
| **Branch** | `infra/lab5-issue-01-gcp-setup-and-budget` |
| **Depends on** | `LAB5-ISSUE-00-master-plan.md` |
| **Lab 5 Rubric** | Traceability `R-04` (Budget Alerts), `R-03` (Zero Plaintext Secrets) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

สร้างและตั้งค่าโครงสร้างพื้นฐานเบื้องต้นบน Google Cloud Platform (GCP) สำหรับโปรเจกต์ `cpe334-crustcraft` ให้เป็นไปตามมาตรฐานความปลอดภัยขั้นสูง (Least Privilege) และมาตรการควบคุมค่าใช้จ่ายอย่างเข้มงวด (Fiscal Guardrails) ก่อนที่จะมีการสร้างทรัพยากรที่คิดค่าบริการจริง เพื่อป้องกันปัญหา Billing Overrun โดยเด็ดขาด

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-01-01:** GCP Project `cpe334-crustcraft` ถูกสร้างสำเร็จ พร้อมเปิดใช้งาน Billing Account อย่างถูกต้อง
- [ ] **AC-LAB5-01-02:** ตั้งค่า **Budget Alert** ขนาด $250 บน GCP Billing Console พร้อมกำหนด Notification Thresholds ครบ 4 ระดับ:
  - 10% ($25.00)
  - 20% ($50.00)
  - 50% ($125.00)
  - 90% ($225.00)
  - 100% ($250.00)
  - อีเมลแจ้งเตือนถูกส่งถึงทั้งสอง Developer ทันทีเมื่อแตะเกณฑ์
- [ ] **AC-LAB5-01-03:** ยืนยันการตั้งค่าประเภท "Alerts Only" (ไม่ใช้ spend cap enforcement ที่อาจตัด service อัตโนมัติระหว่างการตรวจงาน)
- [ ] **AC-LAB5-01-04:** ตรวจสอบและบันทึกสิทธิ์ IAM เริ่มต้นของทั้งสอง Developer ในโปรเจกต์ (`roles/owner` หรือ `roles/editor`)
- [ ] **AC-LAB5-01-05:** เปิดใช้งาน Cloud Shell และทดสอบการรันคำสั่งยืนยัน Account & Project:
  ```bash
  gcloud auth list --filter=status:ACTIVE --format='value(account)'
  gcloud config set project cpe334-crustcraft
  gcloud config get-value project
  ```
- [ ] **AC-LAB5-01-06:** จับภาพหลักฐาน Evidence Screenshot บันทึกไว้ในโฟลเดอร์สำหรับเอกสารรายงานส่งท้ายเทอม

---

## 3. Step-by-Step Implementation Guide

### Step 3.1: Project Creation & Billing Verification
1. ล็อกอินเข้าสู่ Google Cloud Console ([https://console.cloud.google.com/](https://console.cloud.google.com/)) ด้วย Google Account ของทีม
2. สร้าง New Project:
   - **Project Name:** `CrustCraft Bakery`
   - **Project ID:** `cpe334-crustcraft` (หากชื่อซ้ำให้เติม postfix รหัสนักศึกษา เช่น `cpe334-crustcraft-7214`)
3. ผูก Billing Account เข้ากับโปรเจกต์ และตรวจสอบว่ามี Status เป็น Active

### Step 3.2: Configure Budget & Alerting (Cost Control Policy)
1. ไปที่เมนู **Billing** > **Budgets & alerts**
2. คลิก **Create Budget**:
   - **Scope:** เลือก Project `cpe334-crustcraft`
   - **Time period:** Monthly
   - **Budget type:** Specified amount -> `$250`
   - **Trigger alerts on:** Actual spend
   - **Thresholds:**
     - 10% ($25)
     - 20% ($50)
     - 50% ($125)
     - 90% ($225)
     - 100% ($250)
   - **Manage notifications:**
     - ติ๊กถูก "Email alerts to billing admins and users"
     - เพิ่มอีเมลของสมาชิกทีมทั้งสองคน
3. บันทึกและถ่ายภาพหน้าจอหน้าสรุป Budget Overview

### Step 3.3: Pre-flight Verification in Cloud Shell
1. เปิด Google Cloud Shell Terminal จากหน้า Console
2. ตั้งค่า Default Project และ Default Region:
   ```bash
   gcloud config set project cpe334-crustcraft
   gcloud config set compute/region asia-southeast1
   ```
3. บันทึกผลลัพธ์เป็นหลักฐานความพร้อมของสภาพแวดล้อม Cloud

---

## 4. Evidence Checklist for Final Report

- [ ] Screenshot 1: GCP Console แสดง Project ID `cpe334-crustcraft` และเมนู Billing Active
- [ ] Screenshot 2: หน้าต่าง GCP Budget & Alerts แสดงวงเงิน $250 พร้อม Thresholds 10%, 20%, 50%, 90%
- [ ] Screenshot 3: Cloud Shell แสดงคำสั่ง `gcloud config get-value project` คืนค่าถูกต้อง

---

## 5. Security & Boundary Rules
- ❌ **ห้ามดาวน์โหลด Service Account JSON Key** ลงมาเก็บในเครื่องหรือ commit ลง Git เป็นอันขาด
- ❌ **ห้ามเปิดใช้บริการที่คิดค่าบริการนอกเหนือจากที่ระบุใน Starter Kit**
