import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type Role } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    let token: string | undefined;

    if (req.cookies && typeof req.cookies.token === 'string' && req.cookies.token.length > 0) {
      token = req.cookies.token;
    } else if (
      req.headers &&
      typeof req.headers.authorization === 'string' &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication credentials are required',
        },
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token',
      },
    });
  }
}
