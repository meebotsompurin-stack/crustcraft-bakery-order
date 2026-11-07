# ISSUE-00 — Phase 0 Repository Initialization & 3-Sprint Master Plan

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-00` — Phase 0 Repository Initialization & 3-Sprint Master Plan |
| **Type** | `chore` |
| **Branch** | `chore/issue-00-master-plan` |
| **Target Branch** | `sprint-1-staging` |
| **Wave** | 0 (Pre-Sprint Baseline) |
| **Depends on** | None |
| **Parallel-safe** | N/A (Initial repository setup) |
| **Est** | M |
| **Deliverable** | Phase 0 Setup & Governance Baseline |

---

## Objective
เตรียมโครงสร้าง Repository `crustcraft-bakery-order/` สำหรับทีม 2 คน กำหนดกลยุทธ์ Spec-Driven Development (SDD), แผนงาน 3-Sprint Master Plan, กฎระเบียบทางวิศวกรรม (Conventions, Testing Strategy, AI Guardrails) และโครงสร้าง Atomic Issues สำหรับ Sprint 1 ให้พร้อมก่อนเริ่มเขียนโค้ดและส่ง PR แรกเข้า `sprint-1-staging`

---

## Acceptance Criteria

- [ ] **AC-00-01:** Repository root มี `.gitignore` ครอบคลุม node_modules, SQLite files (`*.db`, `*.db-wal`), build artifacts, และ environment files
- [ ] **AC-00-02:** `README.md` ระบุข้อมูลสมาชิกทีม (Purin Mebotsom, Saksorn Buranatananun), Theme 4 context, Tech Stack (Express + React + Prisma SQLite/PostgreSQL + Tailwind), และ Sprint Roadmap ชัดเจน
- [ ] **AC-00-03:** `plan/00-project-state.md` บันทึกสถานะระบบเริ่มต้น, Tech Stack lock, Domain Models (User, BakeryItem, Order, OrderItem พร้อมชนิดเงินจำนวนเต็มสตางค์ `Int` และความสัมพันธ์ `isAvailable` vs. `stockQuantity`), ADRs (รวมถึงแผนเก็บข้อมูลถาวรบน GCP ตาม Spec 5.1, Shared Operator Queue, และ JWT Cookie + Expiry/Logout), และ Issue Status Tracker
- [ ] **AC-00-04:** `plan/01-conventions.md` กำหนดตารางตำแหน่งไฟล์เอกสาร (SRS, System SDS, Role/Permission Matrix, Feature SDS), Document Templates (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`), API Namespace conventions, Error Response Envelope, และ TypeScript Monetary Type (`Satang` = `Int`)
- [ ] **AC-00-05:** `plan/02-feature-coverage.md` บันทึก Master Feature Registry (F-01 ถึง F-09) พร้อมรายละเอียดความต้องการสำหรับ Sprint 1
- [ ] **AC-00-06:** `plan/03-macro-plan.md` กำหนดแผนงานแม่บท 3 Sprints, Timeline ส่งงาน Deliverables 1-3 และ Labs 5-7
- [ ] **AC-00-07:** โฟลเดอร์ `plan/sprint-1-issues/` มี `INDEX.md` และเอกสารสเปกราย Issue ตั้งแต่ `ISSUE-00.md` ถึง `ISSUE-06.md` ครบถ้วน พร้อม Wave execution, Conflict matrix, และ Test ID allocations (อ้างอิงด้วย `ISSUE-XX` หรือชื่อ branch)

---

## Files Allowed (Whitelist)

```
.gitignore
README.md
plan/00-project-state.md
plan/01-conventions.md
plan/02-feature-coverage.md
plan/03-macro-plan.md
plan/sprint-1-issues/INDEX.md
plan/sprint-1-issues/ISSUE-00.md
plan/sprint-1-issues/ISSUE-01.md
plan/sprint-1-issues/ISSUE-02.md
plan/sprint-1-issues/ISSUE-03.md
plan/sprint-1-issues/ISSUE-04.md
plan/sprint-1-issues/ISSUE-05.md
plan/sprint-1-issues/ISSUE-06.md
```

## Out of Scope

- ❌ ห้ามสร้างหรือแก้ไขไฟล์โค้ดใน `server/`, `client/`, `prisma/`, `e2e/`
- ❌ ห้ามสร้างไฟล์สเปกใน `docs/` (งานของ `ISSUE-01` และ `ISSUE-02`)
- ❌ ห้ามแก้ไขไฟล์หลักสูตรใน `Docs/`

---

## Review Focus

1. **Completeness:** โครงสร้างเอกสารครบทุกมิติทั้ง Team, Architecture, Domain Rules, และ Sprints
2. **Path Integrity:** ไม่มี path อ้างอิงเก่าหลงเหลือ (`04-issues` ต้องถูกเปลี่ยนเป็น `sprint-1-issues` ทั้งหมด)
3. **Execution Readiness:** ทีมสามารถเริ่มแตก branch สำหรับ Wave 1 (`ISSUE-01` และ `ISSUE-02`) ได้ทันทีหลัง PR นี้ merge
