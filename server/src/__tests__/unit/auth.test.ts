import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'crustcraft-unit-test-jwt-secret-2026';
}

import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getJwtSecret,
} from '../../services/auth.service';
import { authenticate } from '../../middleware/authenticate.middleware';

describe('F-01 Authentication Unit Tests (AUTH-08, AUTH-10)', () => {
  describe('AUTH-10: Password hashing with bcrypt before database persistence', () => {
    it('hashes plaintext password such that hash !== plaintext and verifyPassword returns true', async () => {
      const plaintext = 'password123';
      const hashed = await hashPassword(plaintext);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(plaintext);
      expect(hashed.startsWith('$2')).toBe(true);

      const isValid = await verifyPassword(plaintext, hashed);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('wrongPassword', hashed);
      expect(isInvalid).toBe(false);
    });
  });

  describe('AUTH-08: JWT sign/verify helper & authenticate middleware token extraction', () => {
    it('encodes and decodes userId and role in a 24h JWT token', () => {
      const payload = { userId: 'clx1user0001', role: 'CUSTOMER' as const };
      const token = signToken(payload);

      expect(typeof token).toBe('string');
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('throws an error if JWT_SECRET environment variable is missing', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      try {
        expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
      } finally {
        process.env.JWT_SECRET = originalSecret;
      }
    });

    it('extracts valid JWT from req.cookies.token (primary channel) and attaches req.user', () => {
      const payload = { userId: 'clx1cust0001', role: 'CUSTOMER' as const };
      const token = signToken(payload);

      const req = {
        cookies: { token },
        headers: {},
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(1).toBe(2);
      expect(req.user).toEqual({
        userId: 'clx1cust0001',
        role: 'CUSTOMER',
      });
    });

    it('falls back to Authorization: Bearer <token> header when cookie is absent and attaches req.user', () => {
      const payload = { userId: 'clx1oper0001', role: 'OPERATOR' as const };
      const token = signToken(payload);

      const req = {
        cookies: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toEqual({
        userId: 'clx1oper0001',
        role: 'OPERATOR',
      });
    });
  });
});
