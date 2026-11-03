import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import path from 'path';

process.env.DATABASE_URL = 'file:./test.db';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'crustcraft-api-test-jwt-secret-2026';
}

import { app } from '../../app';
import { prisma } from '../../lib/db';
import { hashPassword, getJwtSecret } from '../../services/auth.service';

describe('F-01 Authentication & RBAC API Integration Tests (AUTH-01 to AUTH-07, AUTH-09)', () => {
  const testRunId = Date.now();
  const testCustomerEmail = `auth.customer.${testRunId}@test.com`;
  const testOperatorEmail = `auth.operator.${testRunId}@test.com`;
  const testPrivilegeEscalationEmail = `auth.escalation.${testRunId}@test.com`;
  const ownedTestEmails = [
    testCustomerEmail,
    testOperatorEmail,
    testPrivilegeEscalationEmail,
  ];

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'pipe',
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ownedTestEmails,
        },
      },
    });

    const operatorHash = await hashPassword('operator123');
    await prisma.user.upsert({
      where: { email: testOperatorEmail },
      update: { passwordHash: operatorHash, role: 'OPERATOR' },
      create: {
        name: 'Test Operator',
        email: testOperatorEmail,
        passwordHash: operatorHash,
        role: 'OPERATOR',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ownedTestEmails,
        },
      },
    });
    await prisma.$disconnect();
  });

  it('AUTH-01: POST /api/auth/register creates User with CUSTOMER role and returns 201 with user data (excluding passwordHash)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'SomsakJaidee',
      email: testCustomerEmail,
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.name).toBe('SomsakJaidee');
    expect(res.body.user.email).toBe(testCustomerEmail);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user.createdAt).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();

    const dbUser = await prisma.user.findUnique({
      where: { email: testCustomerEmail },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe('CUSTOMER');
    expect(dbUser?.passwordHash).not.toBe('password123');

    const escalationRes = await request(app).post('/api/auth/register').send({
      name: 'Escalation Attempt',
      email: testPrivilegeEscalationEmail,
      password: 'password123',
      role: 'OPERATOR',
    });
    expect(escalationRes.status).toBe(400);
    expect(escalationRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('AUTH-02: POST /api/auth/register with duplicate email returns 409 CONFLICT with standard error envelope', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate User',
      email: testCustomerEmail,
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('CONFLICT');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('AUTH-03: POST /api/auth/login sets httpOnly cookie (24h) and returns user + token; POST /api/auth/logout clears cookie', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testCustomerEmail,
      password: 'password123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user).toBeDefined();
    expect(loginRes.body.user.email).toBe(testCustomerEmail);
    expect(loginRes.body.user.passwordHash).toBeUndefined();
    expect(typeof loginRes.body.token).toBe('string');

    const setCookieHeader = loginRes.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader.join('; ')
      : String(setCookieHeader);
    expect(cookies).toContain('token=');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('Path=/');
    expect(cookies).toMatch(/Max-Age=86400/i);
    expect(cookies).toMatch(/SameSite=Lax/i);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', setCookieHeader);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Logged out successfully');
    const clearCookieHeader = logoutRes.headers['set-cookie'];
    expect(clearCookieHeader).toBeDefined();
    const clearedCookies = Array.isArray(clearCookieHeader)
      ? clearCookieHeader.join('; ')
      : String(clearCookieHeader);
    expect(clearedCookies).toContain('token=;');
  });

  it('AUTH-04: POST /api/auth/login with wrong password returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testCustomerEmail,
      password: 'wrongpassword999',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('AUTH-05: POST /api/auth/login with non-existent email returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent.user@crustcraft.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('AUTH-06: Request to protected endpoint without cookie or Authorization header returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('AUTH-07: Request to protected endpoint with malformed or expired JWT returns 401 UNAUTHORIZED', async () => {
    const malformedRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer malformed.jwt.token');

    expect(malformedRes.status).toBe(401);
    expect(malformedRes.body.error.code).toBe('UNAUTHORIZED');

    const expiredToken = jwt.sign(
      { userId: 'clx1expired', role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '-10s' }
    );

    const expiredCookieRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${expiredToken}`]);

    expect(expiredCookieRes.status).toBe(401);
    expect(expiredCookieRes.body.error.code).toBe('UNAUTHORIZED');
  });

  it('AUTH-09: Authenticated CUSTOMER calling requireRole(["OPERATOR"]) protected route returns 403 FORBIDDEN', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testCustomerEmail,
      password: 'password123',
    });
    const customerToken = loginRes.body.token as string;

    const res = await request(app)
      .get('/api/auth/operator-check')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(typeof res.body.error.message).toBe('string');
  });
});
