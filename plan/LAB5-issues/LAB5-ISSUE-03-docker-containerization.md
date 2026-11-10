# LAB5-ISSUE-03 — Production Containerization & Docker Compose Local Environment
## Episode 3: Multi-Stage Dockerfile, Minimal Footprint & Reproducible Fresh Clone (`C-03`)

---

| Field | Value |
|---|---|
| **ID / Title** | `LAB5-ISSUE-03` — Production Containerization & Docker Compose Local Environment |
| **Type** | `build` / `infra` |
| **Branch** | `build/lab5-issue-03-docker` (branch from `lab-5-staging`) |
| **Depends on** | `LAB5-ISSUE-02-cloud-ready-app.md` |
| **Lab 5 Rubric** | Category 2: Docker and reproducible configuration (20 pts) — `C-03` (`R-01`, `R-02`) |
| **Primary Owners**| Purin Mebotsom (`@meebotsompurin-stack`), Saksorn Buranatananun (`@poom2548`) |
| **Issue Labels** | `lab5`, `docker`, `infrastructure` |

---

## 1. Objective

จัดทำระบบ Containerization ที่สมบูรณ์แบบสำหรับ CrustCraft ตามมาตรฐาน Handout §4.2, `R-01`, `R-02` และ `C-03`:
1. สร้าง **Unified Multi-stage Production Dockerfile** ที่ Root ของ Repository ซึ่งรวม Client Builder, Server Builder, และ Production Runtime ไว้อย่างกะทัดรัด ปลอดภัย (Non-root `node` user, Base image `node:22-alpine`, สัญญาณ POSIX signal passing ด้วย `exec "$@"`)
2. บรรจุ `prisma` CLI, `schema.prisma`, `migrations/`, และ `seed.ts` ลงใน Production Image เพื่อให้ Cloud Run Migration Job (`npx prisma migrate deploy && npm run seed`) สามารถทำงานได้สมบูรณ์ใน Container เดียวกัน
3. สร้าง `.dockerignore` ที่รัดกุม ป้องกันการ Leak ของ `.env`, `node_modules`, build artifacts, และ sensitive credentials
4. สร้าง `docker-compose.yml` สำหรับ Local Development ที่จำลองสถาปัตยกรรมเดียวกับ Production (PostgreSQL 16 Alpine, Auto-migration, Server)
5. **พิสูจน์การทดสอบ Fresh Clone (`C-03`):** จำลองการโคลน Repository ใหม่ ใช้เพียงค่าตัวอย่างจาก `.env.example` แล้วสั่ง `docker compose up --build -d` ต้องทำงานได้สมบูรณ์

---

## 2. Acceptance Criteria

- [ ] **AC-LAB5-03-01 (Multi-Stage Production Dockerfile):**
  - Base Image ใช้ **`node:22-alpine`** ทั้งหมด (`S2`)
  - **Stage 1 (`client-builder`):** ติดตั้ง dependencies, build React Vite SPA ออกมาเป็น `client/dist`
  - **Stage 2 (`server-builder`):** ติดตั้ง OpenSSL (สำหรับ Prisma บน Alpine), run `prisma generate`, compile TypeScript สู่ `server/dist`
  - **Stage 3 (`production`):** คัดลอกเฉพาะ production dependencies, runtime artifacts, ไฟล์ client bundle, และชุดคำสั่ง Prisma Migration/Seed
  - รัน Container ด้วยผู้ใช้สิทธิ์ต่ำ **`USER node`**
  - ไม่ใช้ `dumb-init` โดยไม่จำเป็น ให้ใช้ Shell Entrypoint (`docker-entrypoint.sh`) ที่มีคำสั่ง `exec "$@"` เพื่อรับส่งสัญญาณ `SIGTERM` / `SIGINT` ให้ Node process โดยตรง (`S3`)
- [ ] **AC-LAB5-03-02 (Prisma CLI & Migration Job Capability in Image `S3`):**
  - เนื่องจากคำสั่ง `npm ci --omit=dev` จะตัด `devDependencies` ซึ่งรวมถึง `prisma` CLI ออกไป ทำให้คำสั่งรัน Migration ล้มเหลว ดังนั้นใน Runtime Image จะต้องทำการติดตั้ง Prisma CLI อย่างชัดเจน (เช่น `RUN npm install -g prisma`)
  - Runtime Image ต้องมีไฟล์ `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts`, และ `prisma` CLI พร้อมรันคำสั่ง:
    ```bash
    npx prisma migrate deploy && npm run seed
    ```
    สำหรับใช้ใน Cloud Run Job (`crustcraft-migrate`) ได้อย่างสมบูรณ์โดยไม่ขาด CLI tool
- [ ] **AC-LAB5-03-03 (Strict `.dockerignore`):**
  - บล็อกไม่ให้ไฟล์ sensitive หรือ dev caches หลุดเข้าไปใน Image: `**/node_modules`, `**/dist`, `**/.env*`, `*.db*`, `test-results`, `playwright-report`, `gha-creds-*.json`, `.git`
- [ ] **AC-LAB5-03-04 (Local Development with Docker Compose):**
  - มี `docker-compose.yml` รองรับ Services:
    - `db`: `postgres:16-alpine`, Volume persistence `postgres_data`, healthcheck `pg_isready`
    - `migrate`: สั่ง `prisma migrate deploy` และ seed ข้อมูลเริ่มต้นเมื่อ db พร้อม
    - `app`: รัน Backend + Frontend Production Single Serving Container เชื่อมต่อ Postgres
- [ ] **AC-LAB5-03-05 (Fresh Clone Verification `C-03` `S4`):**
  - ดำเนินการทดสอบในโฟลเดอร์สะอาด (Clean Directory):
    1. Clone repo จากกิ่ง `lab-5-staging`
    2. คัดลอก `.env.example` ไปเป็น `.env` โดยกรอกเฉพาะค่าเริ่มต้นตัวอย่าง
    3. รัน `docker compose up --build -d`
    4. ตรวจสอบว่า Container start สำเร็จ และเรียก:
       ```bash
       curl -f http://localhost:3000/api/health
       curl -f http://localhost:3000/api/ready
       ```
       คืนค่า HTTP 200 ทั้งสอง endpoint
  - บันทึกคำสั่งและ Console Output เป็นหลักฐาน Evidence สำหรับส่งใน PDF Report Part 2
- [ ] **AC-LAB5-03-06 (Branch & PR Workflow `R-09`):**
  - เปิด PR จาก `build/lab5-issue-03-docker` เข้าสู่ **`lab-5-staging`**
  - ได้รับการ Review และ Approval จากเพื่อนร่วมทีม

---

## 3. Configuration & Files Specification

### 3.1 Root `Dockerfile` (Node.js 22 Multi-Stage)
```dockerfile
# Stage 1: Build Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS server-builder
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
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl

# Explicitly install Prisma CLI globally so migration job works even when devDependencies are omitted (S3)
RUN npm install -g prisma

# Set up non-root user and directories
ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
EXPOSE 3000

COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --omit=dev --workspace=server

COPY --from=server-builder /app/prisma ./prisma
COPY --from=server-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/src ./server/src
COPY --from=client-builder /app/client/dist ./client/dist
COPY server/docker-entrypoint.sh ./server/docker-entrypoint.sh

RUN chmod +x ./server/docker-entrypoint.sh && chown -R node:node /app

USER node
WORKDIR /app/server

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

### 3.2 Entrypoint Signal Handler (`server/docker-entrypoint.sh`)
```bash
#!/bin/sh
set -e

# Execute target process as PID 1 child passing signals
exec "$@"
```

### 3.3 Root `.dockerignore`
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

---

## 4. Verification Commands for `C-03`

```bash
# 1. Fresh Clone Verification Test (C-03 Procedure)
cd /tmp
git clone -b lab-5-staging https://github.com/meebotsompurin-stack/crustcraft-bakery-order.git test-c03
cd test-c03
cp .env.example .env

# 2. Build & Launch Containers
docker compose up --build -d

# 3. Check Service Health
sleep 5
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/ready

# 4. Cleanup
docker compose down -v
```

---

## 5. Files Allowed (Whitelist)
```
Dockerfile
.dockerignore
docker-compose.yml
server/docker-entrypoint.sh
server/Dockerfile
client/Dockerfile
client/nginx.conf
docs/labs/lab-05/deployment.md
```

---

## 6. AI Agent & Secret Safety Rules (Strict Policy)

> 🛡️ **AI Safety Rule: Do not allow AI agents to autonomously run `gcloud` commands or modify billing, IAM, or database resources. Never paste secrets or passwords into AI chats or screenshots.**

1. ❌ **ห้าม AI Agent ใส่ Production Database Credentials ลงใน `docker-compose.yml` หรือ Dockerfile**
2. ❌ **ห้าม Bake ไฟล์ `.env` เข้าไปใน Docker Image เด็ดขาด** ตรวจสอบผ่าน `.dockerignore` ทุกครั้ง
3. ❌ **คำสั่ง Docker Run / Compose ทุกคำสั่งต้องรันผ่านการตรวจสอบของผู้พัฒนา**
