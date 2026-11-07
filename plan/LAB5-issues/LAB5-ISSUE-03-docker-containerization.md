# LAB5-ISSUE-03 — Production Containerization & Docker Compose Local Environment
## Episode 3: Multi-Stage Dockerfile & Local Microservices Composition

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-03` — Production Containerization & Docker Compose Local Environment |
| **Type** | `build` / `infra` |
| **Branch** | `build/lab5-issue-03-docker` |
| **Depends on** | `LAB5-ISSUE-02-cloud-ready-app.md` |
| **Lab 5 Rubric** | Traceability `C-03` (Containerization & Local Dev), `R-03` (Zero Secret Baking) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |

---

## 1. Objective

จัดทำระบบ Containerization ที่สมบูรณ์สำหรับ CrustCraft โดยดัดแปลงไฟล์ชุด Docker ทั้ง 7 ไฟล์จาก TokTickIT Starter Kit ให้เข้ากับโครงสร้างของ CrustCraft Monorepo:
1. สร้าง **Unified Multi-stage Production Dockerfile** ที่ Root ของ Repository ซึ่งรวม Client Builder, Server Builder, และ Production Runtime ไว้อย่างกระชับ ปลอดภัย (Non-root `node` user, Dumb-init/Exec signal passing)
2. สร้าง `.dockerignore` ที่รัดกุม ป้องกันการ Leak ของ `.env`, node_modules, build artifacts, และ credentials
3. สร้าง `docker-compose.yml` สำหรับ Local Development ที่จำลองสถาปัตยกรรมเดียวกับ Production (PostgreSQL 16 Alpine, Auto-migration, Server, Client)
4. จัดเตรียม `server/Dockerfile`, `server/docker-entrypoint.sh`, `client/Dockerfile`, และ `client/nginx.conf` สำหรับ Docker Compose Development

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-03-01:** Root `Dockerfile` เป็นแบบ Multi-stage 3 ขั้นตอน:
  - **Stage 1 (client-builder):** ติดตั้ง dependencies, build React Vite SPA ออกมาเป็น `client/dist`
  - **Stage 2 (server-builder):** ติดตั้ง openssl (สำหรับ Prisma บน alpine), run `prisma generate`, compile TypeScript ออกมาเป็น `server/dist`
  - **Stage 3 (production):** Image ขนาดเล็ก (node:24-alpine), copy เฉพาะ build artifacts, runtime dependencies, และ `prisma/` folder สำหรับ migration, รันด้วยผู้ใช้ `USER node`, entrypoint เป็น `docker-entrypoint.sh` ที่ส่งผ่าน `exec "$@"`
- [ ] **AC-LAB5-03-02:** Root `.dockerignore` ป้องกันไฟล์ที่ไม่เกี่ยวข้องและ sensitive files อย่างสมบูรณ์:
  - ไม่รวม `node_modules`, `dist`, `.env*`, `*.db*`, `test-results`, `playwright-report`, `gha-creds-*.json`
- [ ] **AC-LAB5-03-03:** `server/docker-entrypoint.sh` รองรับการเป็น PID 1 ที่ถูกต้องเพื่อรับสัญญาณ `SIGTERM` จาก Cloud Run ทำให้เกิด Graceful Shutdown
- [ ] **AC-LAB5-03-04:** `docker-compose.yml` ประกอบด้วย 4 services:
  - `db`: `postgres:16-alpine`, Volume persistence `postgres_data`, healthcheck `pg_isready`
  - `migrate`: ดำเนินการ `npx prisma migrate deploy` และ `npm run seed` เมื่อ db healthy
  - `server`: รัน backend เชื่อมต่อ local postgres
  - `client`: รัน frontend ผ่าน Nginx reverse proxy
- [ ] **AC-LAB5-03-05:** ทดสอบสั่ง `docker compose up --build -d` บนเครื่อง Local:
  - ทุก Container ต้อง Start สำเร็จและ Healthy
  - เข้าใช้งาน `http://localhost:5173` หรือ `http://localhost:3000` ได้สมบูรณ์
  - ข้อมูล Order และ Catalog ถูกเก็บอย่างถาวรใน Volume แม้ Restart Container
- [ ] **AC-LAB5-03-06:** ตรวจสอบขนาดของ Production Docker Image ต้องมีความกระชับ (Minimal footprint) และไม่มี Dev tooling

---

## 3. Configuration & Files Specification

### 3.1 Root `Dockerfile` (Adapted for CrustCraft Monorepo)
```dockerfile
# Stage 1: Build Frontend
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Build Backend
FROM node:24-alpine AS server-builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY server/package*.json ./server/
COPY prisma/ ./prisma/
RUN npm ci --workspace=server
RUN npx prisma generate --schema=prisma/schema.prisma
COPY server/ ./server/
RUN npm run build --workspace=server

# Stage 3: Unified Production Runtime
FROM node:24-alpine AS production
WORKDIR /app/server
RUN apk add --no-cache openssl

COPY --from=server-builder /app/package*.json /app/
COPY --from=server-builder /app/node_modules /app/node_modules
COPY --from=server-builder /app/server/package*.json ./
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/src ./src
COPY --from=server-builder /app/prisma /app/prisma
COPY --from=server-builder /app/server/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=client-builder /app/client/dist /app/client/dist

RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
EXPOSE 3000

USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

### 3.2 Root `.dockerignore`
```gitignore
**/node_modules
**/dist
**/build
**/.env*
*.log
.git
.gitignore
test-results
playwright-report
server/uploads
*.db
*.db-journal
*.db-wal
*.db-shm
*.sqlite
gha-creds-*.json
```

### 3.3 Root `docker-compose.yml`
- Service `db` ใช้ `postgres:16-alpine` พร้อม volume `postgres_data`
- Service `migrate` ใช้ Prisma schema ชี้ไปยัง Postgres
- Service `server` และ `client` พร้อม Nginx routing

---

## 4. Verification Commands

```bash
# 1. Build test production image locally
docker build -t crustcraft:local .

# 2. Test Docker Compose setup
docker compose up --build -d
docker compose ps

# 3. Check health and readiness
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/ready

# 4. Teardown
docker compose down
```

---

## 5. Files Allowed (Whitelist)
```
Dockerfile
.dockerignore
docker-compose.yml
server/Dockerfile
server/docker-entrypoint.sh
client/Dockerfile
client/nginx.conf
```
