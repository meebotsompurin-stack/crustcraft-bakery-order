# LAB5-ISSUE-02 — Cloud-Ready Application Refactoring, PostgreSQL 16 Migration & Readiness Probes
## Episode 2: Cloud 12-Factor App, Data Tier Migration & In-Container Single Serving

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-02` — Cloud-Ready Application Refactoring, PostgreSQL 16 Migration & Readiness Probes |
| **Type** | `refactor` / `feat` |
| **Branch** | `refactor/lab5-issue-02-cloud-ready` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-01-gcp-setup-and-budget.md` |
| **Lab 5 Rubric** | Traceability `R-01` (Docker Packaging & Cloud-Ready Endpoints), `R-02` (Config from Env & Static Serving), `C-03` |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `backend`, `database`, `refactor` |

---

## 1. Objective

ปรับปรุง Express backend (`server/`) และ React frontend (`client/`) ของ CrustCraft ให้รองรับมาตรฐานการทำงานบน Serverless Container Platform (Cloud Run) ตามหลัก 12-Factor App และ Handout §4:
1. **ย้ายระบบจัดเก็บข้อมูล (Database Migration) จาก SQLite สู่ PostgreSQL 16** ในระดับ Prisma ORM เพื่อให้รองรับ Cloud SQL บน GCP
2. เพิ่ม **Readiness Probe (`GET /api/ready`)** ที่ตรวจสอบการเชื่อมต่อฐานข้อมูลจริงผ่าน Prisma ด้วย Query `` await prisma.$queryRaw`SELECT 1`; ``
3. ปรับปรุง Express Application ให้ทำหน้าที่เป็น **Single Serving Container** โดยใน Production โหมดจะทำหน้าที่เสิร์ฟ Static Client Bundle จาก `client/dist` ควบคู่กับ API endpoints บน Port เดียวกัน (`0.0.0.0:$PORT`)
4. ปรับปรุง Server Port Binding ให้รองรับ Dynamic Environment Variable `$PORT` ที่ Cloud Run ทำการ Inject เข้ามา
5. จัดทำ Root **`.env.example`** (ควบคู่กับ `server/.env.example` และ `client/.env.example`) เพื่อให้ผู้ใช้สามารถรัน Fresh Clone ได้ทันทีตามเกณฑ์ `R-02` และ `C-03`

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-02-01 (Prisma Migration: SQLite to PostgreSQL 16 `B3`):**
  - อัปเดต `prisma/schema.prisma` ในส่วน datasource:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
  - ทำการ Clean และ Re-generate Migration Baseline ใหม่สำหรับ PostgreSQL 16 ภายใต้ `prisma/migrations/`
  - ปรับปรุง Seed Script (`prisma/seed.ts`) ให้ทำงานแบบ Idempotent (`upsert`) บน PostgreSQL
  - ตรวจสอบว่า Script ใน `package.json` (`db:migrate`, `seed`, `test`) สามารถทำงานร่วมกับ PostgreSQL 16 ได้อย่างไร้รอยต่อ
  - สมาชิกในทีมสามารถรัน Automated Test Suite ได้ผลลัพธ์ **100% GREEN** เมื่อเชื่อมต่อกับ PostgreSQL และบันทึก Actual Test Summary Output ไว้ยืนยัน
  - *Note:* การเปลี่ยน Datasource Provider สู่ `postgresql` สอดคล้องกับเอกสารสถาปัตยกรรม `docs/system-sds.md` ที่ระบุไว้ตั้งแต่ต้น
- [ ] **AC-LAB5-02-02 (Readiness Probe Endpoint `S1`):**
  - เพิ่ม Endpoint `GET /api/ready` ใน `server/src/app.ts` (หรือ router เฉพาะ):
    - เรียกใช้คำสั่ง:
      ```typescript
      await prisma.$queryRaw`SELECT 1`;
      ```
    - หากเชื่อมต่อฐานข้อมูลได้สำเร็จ ตอบกลับ HTTP `200 OK` พร้อม JSON payload:
      ```json
      { "status": "ready", "db": "connected" }
      ```
      *(สำคัญ: ต้องมีคีย์ `"db": "connected"` ตรงตามที่ `deploy/smoke_test.py` ตรวจสอบ)*
    - หากไม่สามารถเชื่อมต่อฐานข้อมูลได้ ตอบกลับ HTTP `503 Service Unavailable` พร้อม JSON Error Envelope
- [ ] **AC-LAB5-02-03 (Liveness Probe Endpoint):**
  - คงสภาพ Endpoint `GET /api/health` ที่มีอยู่เดิม ตอบกลับ HTTP `200 OK` พร้อม `{ "status": "ok" }` เสมอ
- [ ] **AC-LAB5-02-04 (Production Single Serving Mode `R-02`):**
  - เมื่อ `process.env.NODE_ENV === 'production'` ให้ Express ทำหน้าที่ Mount `express.static()` ชี้ไปยัง `client/dist`
  - มี SPA Fallback Handler สำหรับ Non-API routes (`*`) ให้ส่งกลับ `index.html` เพื่อให้ React Router (Client-Side Routing) ทำงานได้ปกติ
- [ ] **AC-LAB5-02-05 (Server Dynamic Port Binding):**
  - ผูก Port ใน `server/src/server.ts` เข้ากับ `0.0.0.0` (ไม่ผูกติดกับ `localhost`) และดึงค่า Port จาก `Number(process.env.PORT) || 3000`
- [ ] **AC-LAB5-02-06 (Standard Environment Templates `R-02`):**
  - จัดเตรียม Root **`.env.example`** สำหรับ Monorepo ที่รวบรวมตัวแปรทั้งหมด (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `VITE_API_URL`)
  - จัดเตรียม `server/.env.example` และ `client/.env.example`
  - ปราศจาก Plaintext Secret จริง (ใช้เฉพาะค่าตัวอย่าง เช่น `postgresql://user:password@localhost:5432/dbname`)
- [ ] **AC-LAB5-02-07 (PR & Review Workflow `R-09`):**
  - เปิด Pull Request จาก `refactor/lab5-issue-02-cloud-ready` เข้าสู่ **`lab-5-staging`**
  - ให้เพื่อนร่วมทีมทำการ Review, ตรวจสอบ Code Changes และทดสอบ Local Run ก่อน Approve

---

## 3. Technical Implementation Details

### 3.1 Prisma Schema DataSource Configuration
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### 3.2 Readiness Probe Implementation (`S1`)
```typescript
// server/src/app.ts
import { prisma } from './lib/db';

app.get('/api/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database readiness check failed',
      },
    });
  }
});
```

### 3.3 Express SPA Serving Configuration
```typescript
// server/src/app.ts (Mount after all /api routes)
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
```

---

## 4. Verification & Testing

1. **Local PostgreSQL Simulation:**
   - รัน PostgreSQL 16 (ผ่าน Docker Compose หรือ Local Service)
   - สั่ง Migrate และ Seed:
     ```bash
     npx prisma migrate dev --name init_postgres
     npm run seed
     ```
2. **Automated Vitest Suite:**
   - รัน `npm test` เพื่อยืนยันว่า Automated Unit & Integration Tests ผ่านทั้งหมด 100% พร้อมบันทึก Test Summary Output
3. **Endpoint Validation:**
   ```bash
   curl -f http://localhost:3000/api/health
   curl -f http://localhost:3000/api/ready
   ```

---

## 5. Files Allowed (Whitelist)
```
prisma/schema.prisma
prisma/migrations/**
prisma/seed.ts
package.json
server/package.json
client/package.json
.env.example
server/.env.example
client/.env.example
server/src/app.ts
server/src/server.ts
server/src/lib/db.ts
server/src/__tests__/**
docs/labs/lab-05/deployment.md
```

---

## 6. AI Agent & Secret Safety Rules (Strict Policy)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. ❌ **ห้าม Hardcode หรือแสดง Production Passwords ในไฟล์ Source Code หรือ Documentation**
2. ❌ **ห้ามนำ Secret จริงใส่ใน `.env.example` เด็ดขาด ให้ใช้เฉพาะ Dummy Values สำหรับพัฒนา**
3. ❌ **ห้ามให้ AI Agent รัน Migration ทำลายข้อมูลเดิมโดยปราศจากการตรวจสอบ Manual ก่อน**
