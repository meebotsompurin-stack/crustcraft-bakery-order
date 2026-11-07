# LAB5-ISSUE-02 — Cloud-Ready Application Refactoring & Readiness Probes
## Episode 2: Cloud 12-Factor App & In-Container Single Serving

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-02` — Cloud-Ready Application Refactoring & Readiness Probes |
| **Type** | `refactor` / `feat` |
| **Branch** | `refactor/lab5-issue-02-cloud-ready` |
| **Depends on** | `LAB5-ISSUE-01-gcp-setup-and-budget.md` |
| **Lab 5 Rubric** | Traceability `R-01` (Health & Readiness), `R-02` (Unified Express Single Container) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

ปรับปรุง Express backend (`server/`) และ React frontend (`client/`) ของ CrustCraft ให้รองรับมาตรฐานการทำงานบน Serverless Container Platform (Cloud Run):
1. เพิ่ม **Readiness Probe (`GET /api/ready`)** ที่ตรวจสอบการเชื่อมต่อฐานข้อมูลจริงผ่าน Prisma (`SELECT 1`) เพื่อให้ระบบ Smoke Test และ Cloud Run ทราบสถานะความพร้อม
2. ปรับปรุง Express Application ให้ทำหน้าที่เป็น **Single Serving Container** โดยใน Production โหมดจะทำหน้าที่เสิร์ฟ Static Client Bundle จาก `client/dist` ควบคู่กับ API endpoints บน Port เดียวกัน (`0.0.0.0:$PORT`)
3. ปรับปรุง Server Port Binding ให้รองรับ Dynamic Environment Variable `$PORT` ที่ Cloud Run ทำการ Inject เข้ามา
4. จัดเตรียม `.env.example` ทั้งใน `server/` และ `client/` เพื่อความโปร่งใสและง่ายต่อการรันบนทุกสภาพแวดล้อม

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-02-01:** เพิ่ม Endpoint `GET /api/ready` ใน `server/src/app.ts` (หรือ router เฉพาะ):
  - ทำการ Execute คำสั่ง `prisma.$queryRaw`Unsafe('SELECT 1')` หรือ `$queryRaw`SELECT 1``
  - หากฐานข้อมูลเชื่อมต่อได้ปกติ ตอบกลับ HTTP `200 OK` พร้อม JSON payload:
    ```json
    { "status": "ready", "db": "connected" }
    ```
    *(หมายเหตุ: ต้องมี `"db": "connected"` ตรงตามที่ `deploy/smoke_test.py` ตรวจสอบ)*
  - หากฐานข้อมูลไม่สามารถเชื่อมต่อได้ ตอบกลับ HTTP `503 SERVICE_UNAVAILABLE` พร้อม error envelope
- [ ] **AC-LAB5-02-02:** คงสภาพ Endpoint `GET /api/health` ที่มีอยู่เดิม:
  - ตอบกลับ HTTP `200 OK` พร้อม `{ "status": "ok" }` เสมอ (Liveness Probe)
- [ ] **AC-LAB5-02-03:** Express Server รองรับการเสิร์ฟ Built SPA Files ในสภาวะ Production:
  - เมื่อ `process.env.NODE_ENV === 'production'` ให้ mount `express.static()` ไปยัง Directory `path.resolve(__dirname, '../../client/dist')` หรือ `/app/client/dist`
  - มี SPA Fallback Handler สำหรับ Non-API routes (`*`) ให้ส่งกลับ `index.html` เพื่อให้ React Router (Client-Side Routing) ทำงานได้ปกติ
- [ ] **AC-LAB5-02-04:** Server Port Binding ใน `server/src/server.ts`:
  - ต้องผูกกับ `0.0.0.0` (ไม่ผูกติดกับ `localhost`) และดึงค่า Port จาก `Number(process.env.PORT) || 3000`
- [ ] **AC-LAB5-02-05:** สร้างไฟล์ `.env.example`:
  - `server/.env.example`: ระบุตัวอย่าง `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`
  - `client/.env.example`: ระบุตัวอย่าง `VITE_API_URL`
- [ ] **AC-LAB5-02-06:** รัน Local Automated Test ครบทั้ง Unit & API integration tests โดยต้องผ่าน `100% GREEN` (50/50 tests)

---

## 3. Technical Implementation Specification

### 3.1 Readiness Probe Endpoint
```typescript
// server/src/app.ts
import { prisma } from './lib/db';

app.get('/api/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (error) {
    res.status(503).json({
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

### 3.2 Production Static Serving Architecture
```typescript
// server/src/app.ts (Placed after all /api routes)
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
```

### 3.3 Server Listening Binding
```typescript
// server/src/server.ts
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`CrustCraft API server listening on http://${HOST}:${PORT}`);
});
```

---

## 4. Verification & Testing

1. **Automated Unit/Integration Test:**
   - เขียน Unit/Integration test สำหรับ `GET /api/ready` เพื่อตรวจสอบทั้งกรณี DB Connected (200) และ DB Disconnected (503)
2. **Local Simulation:**
   - Build client (`npm run build --workspace=client`)
   - รัน server ด้วย `NODE_ENV=production npm run dev:server`
   - ทดสอบเปิด Browser ไปที่ `http://localhost:3000` ต้องเห็นหน้า CrustCraft Web UI สวยงามโดยไม่ต้องเปิด Vite Dev Server
   - ตรวจสอบ `curl http://localhost:3000/api/ready` ต้องได้ `{"status":"ready","db":"connected"}`

---

## 5. Files Allowed (Whitelist)
```
server/src/app.ts
server/src/server.ts
server/src/__tests__/sprint-1/health.api.test.ts (update/create readiness tests)
server/.env.example
client/.env.example
```
