# ISSUE-03 — Project Scaffold, Database & Authentication (F-01)

---

| Field | Value |
|---|---|
| **ID / Title** | `ISSUE-03` — Project Scaffold, Database & Authentication |
| **Type** | `feat` |
| **Branch** | `feat/issue-03-scaffold-db-and-auth` |
| **Wave** | 2 (Sequential — must wait for Wave 1) |
| **Depends on** | `ISSUE-01` AND `ISSUE-02` merged to `sprint-1-staging` |
| **Parallel-safe** | ❌ No — creates the shared project foundation |
| **Est** | XL |
| **Deliverable** | Part F of Deliverable 1 |

---

## Objective
สร้าง Project scaffold ทั้ง backend + frontend, กำหนด Prisma schema + migration + seed data, และ implement F-01 Authentication & RBAC middleware ครบถ้วนด้วย TDD

---

## Pre-Implementation Checklist (AI Must Confirm)
ก่อนเขียนโค้ดใดๆ ให้ AI confirm:
1. อ่าน `ISSUE-03.md` และ `plan/01-conventions.md` แล้วยืนยัน Files Allowed whitelist
2. `ISSUE-01` (`docs/srs.md`, `docs/system-sds.md`) ถูก merge แล้ว → timestamp evidence ครบ
3. `ISSUE-02` (`docs/sprints/sprint-1/specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) ถูก merge แล้ว

---

## Acceptance Criteria

### Scaffold
- [ ] **AC-03-01:** `npm run dev` (root script) starts both `server` (port 3001) and `client` (port 5173) without errors
- [ ] **AC-03-02:** TypeScript compiles without errors in both `server/` and `client/`

### Database
- [ ] **AC-03-03:** `npx prisma migrate dev --name init` runs cleanly, creates SQLite `dev.db`
- [ ] **AC-03-04:** `npx prisma db seed` completes without error:
  - 1 OPERATOR user (email: `operator@crustcraft.com`, password: `operator123`)
  - 2 CUSTOMER users (email: `customer1@test.com`, `customer2@test.com`, password: `customer123`)
  - 5 BakeryItems (ราคาเก็บเป็นจำนวนเต็มสตางค์ `Int` ใน DB): Artisan Butter Croissant (`8500` satang / ฿85.00), Classic Sourdough Loaf (`22000` satang / ฿220.00), Cinnamon Brioche Roll (`6500` satang / ฿65.00), Pain au Chocolat (`9000` satang / ฿90.00), Matcha Almond Tart (`14500` satang / ฿145.00) — all `isAvailable: true` with stock ≥20
- [ ] **AC-03-05:** Prisma schema defines all 4 entities: `User`, `BakeryItem`, `Order`, `OrderItem` with correct fields and relations (monetary fields `price`, `totalAmount`, `unitPriceAtOrder` defined as `Int` in satang)
- [ ] **AC-03-06:** `prisma.$transaction` pattern is available and used in `orders.service.ts` (tested later in `ISSUE-04`)

### Authentication (F-01)
- [ ] **AC-03-07:** AUTH-01: POST `/api/auth/register` creates User, returns `201` with user data (no `passwordHash`)
- [ ] **AC-03-08:** AUTH-02: POST `/api/auth/register` with duplicate email returns `409 CONFLICT`
- [ ] **AC-03-09:** AUTH-03: POST `/api/auth/login` with correct credentials returns `200`, sets `httpOnly` cookie (`token`, `expiresIn: '24h'`, `maxAge: 86400000`, `sameSite: 'lax'`, `path: '/'`), and returns user + JWT token; POST `/api/auth/logout` clears the `httpOnly` cookie (`res.clearCookie('token')`) and returns `200`
- [ ] **AC-03-10:** AUTH-04: POST `/api/auth/login` with wrong password returns `401 UNAUTHORIZED`
- [ ] **AC-03-11:** AUTH-05: POST `/api/auth/login` with non-existent email returns `401 UNAUTHORIZED`
- [ ] **AC-03-12:** AUTH-06: Request to protected endpoint without valid authentication credentials (neither valid `httpOnly` cookie `token` nor valid `Authorization: Bearer <token>` header) returns `401 UNAUTHORIZED`
- [ ] **AC-03-13:** AUTH-07: Request to protected endpoint with invalid/expired JWT (in either cookie or Authorization header) returns `401 UNAUTHORIZED`
- [ ] **AC-03-14:** AUTH-08: Valid JWT (from `req.cookies.token` or `Authorization: Bearer <token>` header) attaches `{ userId, role }` to `req.user`
- [ ] **AC-03-15:** AUTH-09: CUSTOMER calling `requireRole(['OPERATOR'])` endpoint returns `403 FORBIDDEN`
- [ ] **AC-03-16:** AUTH-10: Password stored as bcrypt hash — raw password never persisted

### Architecture Constraints
- [ ] **AC-03-17:** Prisma singleton in `server/src/lib/db.ts` — verified no `new PrismaClient()` anywhere else in server code
- [ ] **AC-03-18:** `authenticate` middleware resolves JWT from `req.cookies.token` (primary channel used by React frontend via `fetch` with `credentials: 'include'`) or `Authorization: Bearer <token>` header (fallback for API test clients), verifies `24h` expiration, and sets `req.user = { userId: string, role: 'CUSTOMER' | 'OPERATOR' }`
- [ ] **AC-03-19:** `requireRole` middleware is a factory: `requireRole(['OPERATOR'])` — not hardcoded role checks inside controllers
- [ ] **AC-03-20:** Error envelope: `{ error: { code, message, details? } }` on all error responses

---

## Test IDs

| Test ID | Type | File |
|---|---|---|
| AUTH-01 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-02 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-03 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-04 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-05 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-06 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-07 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-08 | Unit | `server/src/__tests__/unit/auth.test.ts` |
| AUTH-09 | API Integration | `server/src/__tests__/sprint-1/auth.api.test.ts` |
| AUTH-10 | Unit | `server/src/__tests__/unit/auth.test.ts` |

**TDD Order:** Write `auth.test.ts` + `auth.api.test.ts` FIRST → STOP for confirmation → implement routes/controllers/middleware

---

## Files Allowed (Whitelist)

```
# Root config
package.json                                      ← สร้างใหม่ (root workspace scripts)

# Server
server/package.json
server/tsconfig.json
server/src/app.ts
server/src/server.ts
server/src/lib/db.ts                              ← Prisma singleton
server/src/middleware/authenticate.middleware.ts
server/src/middleware/requireRole.middleware.ts
server/src/routes/auth.routes.ts
server/src/controllers/auth.controller.ts
server/src/services/auth.service.ts
server/src/__tests__/unit/auth.test.ts
server/src/__tests__/sprint-1/auth.api.test.ts

# Prisma
prisma/schema.prisma
prisma/seed.ts

# Client
client/package.json
client/tsconfig.json
client/vite.config.ts
client/tailwind.config.js
client/postcss.config.js
client/index.html
client/src/main.tsx
client/src/App.tsx                                ← routing + AuthContext provider
client/src/context/AuthContext.tsx
client/src/services/api.ts                        ← auth functions only (register, login, logout; uses credentials: 'include')
client/src/pages/LoginPage.tsx
client/src/pages/RegisterPage.tsx
client/src/components/ProtectedRoute.tsx

# E2E config
e2e/playwright.config.ts
```

## Out of Scope

- ❌ ห้ามสร้าง catalog, orders, operator routes/controllers (อยู่ใน `ISSUE-04`, `ISSUE-05`)
- ❌ ห้ามสร้าง E2E test files ใน `e2e/sprint-1/` (อยู่ใน `ISSUE-06`)
- ❌ ห้ามแก้ไขไฟล์ใน `docs/`, `plan/`, `knowledge/`

---

## Review Focus

1. **Security & Auth Consistency:** Frontend ใช้ `httpOnly` cookie (`credentials: 'include'`); `authenticate` middleware รองรับทั้ง `req.cookies.token` และ `Authorization: Bearer <token>`; RBAC ต้องผ่าน middleware เท่านั้น — ห้าม check role inside controller body
2. **Singleton:** `lib/db.ts` เป็น single export ที่ทุกคนใช้
3. **TDD:** Test files ต้องมี Git commit timestamp ก่อน implementation files
4. **Seed Idempotency:** `prisma db seed` รันซ้ำได้โดยไม่ error (upsert, not insert)
