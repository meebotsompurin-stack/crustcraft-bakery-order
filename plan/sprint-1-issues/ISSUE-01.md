# ISSUE-01 — Product Baseline Documentation (Spec DD Parts A-D)

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-01` — Product Baseline Documentation |
| **Type** | `docs` |
| **Branch** | `docs/issue-01-product-baseline` |
| **Wave** | 1 (Parallel-safe with `ISSUE-02`) |
| **Depends on** | `ISSUE-00` (`chore/issue-00-master-plan`) merged |
| **Parallel-safe** | ✅ Yes — operates exclusively in `docs/` (non-overlapping with `ISSUE-02`) |
| **Est** | L |
| **Deliverable** | Parts A, B, C, D of Deliverable 1 |

---

## Objective
สร้าง Engineering Baseline documents ทั้ง 4 ส่วน (Parts A-D) ก่อน feature implementation เริ่มต้น เพื่อให้มีหลักฐาน Git timestamp ว่า System-Level Specification existed before any code was written

---

## Acceptance Criteria

- [ ] **AC-01-01:** `docs/srs.md` (Part A — System Requirements Specification) ครบถ้วน:
  - Problem Statement (ปัญหาของร้านเบเกอรี่ + CrustCraft solution)
  - Stakeholder List (Customer, Operator, Developer, University)
  - ≥5 Functional Requirements (`FR-XX` numbered, covering Auth, Catalog, Orders, Operator)
  - System-wide Business Rules (`BR-01` ถึง `BR-06`, ครอบคลุม Server-Side Pricing in `Int` Satang, Price Snapshot, Stock Atomicity, Customer Ownership Isolation, `isAvailable` vs. `stockQuantity` separation, และ Shared Global Operator Queue)
  - **System-Level Role & Permission Matrix (RBAC)** (`CUSTOMER` vs `OPERATOR`)
  - ≥3 Non-Functional Requirements (`NFR-XX`: Performance, Security, Usability, Data Persistence Spec 5.1)
  - Constraints (Academic deadline, team size, tech stack choices)
- [ ] **AC-01-02:** `docs/features.md` (Part B — Feature Breakdown) ครอบคลุม F-01 ถึง F-09 ทุก Feature:
  - User Story format: "As a [role], I want to [action], so that [benefit]"
  - Priority: Must Have / Should Have / Could Have
  - Sprint Assignment (Sprint 1/2/3)
- [ ] **AC-01-03:** `docs/traceability.md` (Part B — Requirement Traceability Matrix) มีตารางครบ:
  - ทุก Functional Requirement (`FR-XX`) & Business Rule (`BR-XX`) → Feature (`F-XX`) → Acceptance Criteria (`AC-XX`) → Test ID (ไม่มีช่องว่าง)
- [ ] **AC-01-04:** `docs/system-sds.md` (Part C — System-Level SDS) ครบถ้วน:
  - System Architecture Diagram (Mermaid หรือ ASCII art)
  - Component breakdown: `server/`, `client/`, `e2e/`, `prisma/`
  - Data flow diagram (Request → Auth middleware [`httpOnly` cookie primary / Bearer header fallback] → Controller → Service → Prisma → Database)
  - Tech stack justification (เหตุผลที่เลือก Express, Prisma, SQLite/PostgreSQL, React, Tailwind, Playwright)
  - **System Architecture Decision Records (ADRs):**
    1. **GCP Data Persistence & Migration Strategy (Spec 5.1):** ใช้ SQLite ที่ mount บน Persistent Volume (`/app/data/crustcraft.db` บน GCP Compute Engine Persistent Disk / Cloud Run Gen2 volume mount) เพื่อให้ข้อมูลอยู่รอดหลัง container restart/redeploy โดยไม่ต้องเปลี่ยน Prisma provider และออกแบบ schema ด้วยชนิดข้อมูลมาตรฐาน (`Int` satang) ที่พร้อมสลับไป PostgreSQL (`docker-compose.yml` + `pgdata` volume) ได้ทันทีหากต้องการ
    2. **JWT Authentication, Expiry (`24h`) & Logout Revocation:** Frontend ส่ง `httpOnly` cookie (`token`) ผ่าน `credentials: 'include'`, Backend ตรวจ cookie เป็นหลักและ fallback ไปที่ `Authorization: Bearer <token>` header, อายุ token `24h`, และ `POST /api/auth/logout` ล้าง cookie ผ่าน `res.clearCookie('token')`
    3. **Monetary Representation as Integer Satang (`Int`):** เก็บและคำนวณเงินเป็นจำนวนเต็มสตางค์ (`100 satang = 1.00 THB`)
    4. **`isAvailable` vs. `stockQuantity` Separation:** สต็อกเหลือ `0` ไม่เปลี่ยน `isAvailable` เป็น `false` อัตโนมัติ (แสดง "Out of Stock" บนหน้าเมนู แต่ห้ามสั่งซื้อด้วย `409 CONFLICT`)
    5. **Shared Global Operator Queue:** `OPERATOR` ทุกคนเห็นและจัดการออเดอร์ทั้งหมดของร้านร่วมกัน
- [ ] **AC-01-05:** `docs/sprints/plan.md` (Part D — 3-Sprint Master Plan) มี:
  - 3-Sprint roadmap table (Sprint, Deliverable, Due Date, Features, Key Milestones)
  - Feature-to-Sprint assignment table
  - Dependency diagram between features
- [ ] **AC-01-06:** Git timestamp ของ PR สำหรับ `ISSUE-01` (`docs/issue-01-product-baseline`) ต้อง **ก่อน** PR สำหรับ `ISSUE-03` (`feat/issue-03-scaffold-db-and-auth`) โดยเด็ดขาด

---

## Test IDs
Issue นี้ไม่มี automated tests (เป็นเอกสาร) แต่ต้องมี Git timestamp evidence ก่อน feature PRs (`ISSUE-03` ถึง `ISSUE-06`)

---

## Files Allowed (Whitelist)

```
docs/srs.md                   ← สร้างใหม่
docs/features.md              ← สร้างใหม่
docs/traceability.md          ← สร้างใหม่
docs/system-sds.md            ← สร้างใหม่
docs/sprints/plan.md          ← สร้างใหม่
```

## Out of Scope

- ❌ ห้ามสร้างหรือแก้ไขไฟล์ใดๆ ใน `server/`, `client/`, `e2e/`, `prisma/`
- ❌ ห้ามสร้าง `docs/sprints/sprint-1/` (อยู่ใน `ISSUE-02`)
- ❌ ห้ามแก้ไขไฟล์ใน `plan/` หรือ `knowledge/`
- ❌ ห้าม npm install หรือสร้าง package.json

---

## Review Focus

1. **Completeness:** ทุก AC-01-XX ต้องผ่านทุกข้อ (รวมถึง Role/Permission Matrix ใน `docs/srs.md` และ ADRs ใน `docs/system-sds.md`)
2. **Traceability:** ทุก FR/BR ต้องมี Feature → Test ID chain ครบ (ไม่มี orphan)
3. **Timestamp:** Branch `docs/issue-01-product-baseline` (`ISSUE-01`) merged ก่อน `feat/issue-03-scaffold-db-and-auth` (`ISSUE-03`) — ตรวจสอบจาก Git log
4. **Domain accuracy:** เนื้อหาต้องสะท้อน CrustCraft Artisan Bakery domain อย่างถูกต้อง
