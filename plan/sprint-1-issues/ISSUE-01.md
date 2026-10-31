# Issue #1 — Product Baseline Documentation (Spec DD Parts A-D)

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-01` — Product Baseline Documentation |
| **Type** | `docs` |
| **Branch** | `docs/issue-01-product-baseline` |
| **Wave** | 1 (Parallel-safe with ISSUE-02) |
| **Depends on** | None |
| **Parallel-safe** | ✅ Yes — operates exclusively in `docs/` (non-overlapping with ISSUE-02) |
| **Est** | L |
| **Deliverable** | Parts A, B, C, D of Deliverable 1 |

---

## Objective
สร้าง Engineering Baseline documents ทั้ง 4 ส่วน (Parts A-D) ก่อน feature implementation เริ่มต้น เพื่อให้มีหลักฐาน Git timestamp ว่า System-Level Specification existed before any code was written

---

## Acceptance Criteria

- [ ] **AC-01-01:** `docs/srs.md` ครบถ้วน:
  - Problem Statement (ปัญหาของร้านเบเกอรี่ + CrustCraft solution)
  - Stakeholder List (Customer, Operator, Developer, University)
  - ≥5 Functional Requirements (FR-XX numbered, covering Auth, Catalog, Orders, Operator)
  - ≥3 Non-Functional Requirements (Performance, Security, Usability)
  - Constraints (Academic deadline, team size, tech stack choices)
- [ ] **AC-01-02:** `docs/features.md` ครอบคลุม F-01 ถึง F-09 ทุก Feature:
  - User Story format: "As a [role], I want to [action], so that [benefit]"
  - Priority: Must Have / Should Have / Could Have
  - Sprint Assignment (Sprint 1/2/3)
- [ ] **AC-01-03:** `docs/traceability.md` มี Requirement Traceability Matrix ครบ:
  - ทุก Functional Requirement → Feature (F-XX) → Test ID (ไม่มีช่องว่าง)
  - ทุก Feature มี Acceptance Criteria และ Test ID ที่ map แล้ว
- [ ] **AC-01-04:** `docs/system-sds.md` ครบถ้วน:
  - System Architecture Diagram (Mermaid หรือ ASCII art)
  - Component breakdown: server/, client/, e2e/, prisma/
  - Data flow diagram (Request → Auth middleware → Controller → Service → Prisma → SQLite)
  - Tech stack justification (เหตุผลที่เลือก Express, Prisma, SQLite, React, Tailwind, Playwright)
  - Deployment model overview (Docker container → GCP Cloud Run, planned for Lab 5)
- [ ] **AC-01-05:** `docs/sprints/plan.md` มี:
  - 3-Sprint roadmap table (Sprint, Deliverable, Due Date, Features, Key Milestones)
  - Feature-to-Sprint assignment table
  - Dependency diagram between features
- [ ] **AC-01-06:** Git timestamp ของ PR #1 ต้อง **ก่อน** PR #3 (ISSUE-03 scaffold) โดยเด็ดขาด

---

## Test IDs
Issue นี้ไม่มี automated tests (เป็นเอกสาร) แต่ต้องมี Git timestamp evidence ก่อน feature PRs

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
- ❌ ห้ามสร้าง `docs/sprints/sprint-1/` (อยู่ใน ISSUE-02)
- ❌ ห้ามแก้ไขไฟล์ใน `plan/` หรือ `knowledge/`
- ❌ ห้าม npm install หรือสร้าง package.json

---

## Review Focus

1. **Completeness:** ทุก AC-01-XX ต้องผ่านทุกข้อ
2. **Traceability:** ทุก FR ต้องมี Feature → Test ID chain ครบ (ไม่มี orphan)
3. **Timestamp:** PR #1 merged ก่อน PR #3 — ตรวจสอบจาก Git log
4. **Domain accuracy:** เนื้อหาต้องสะท้อน CrustCraft Artisan Bakery domain อย่างถูกต้อง (ไม่ใช่ generic template)
