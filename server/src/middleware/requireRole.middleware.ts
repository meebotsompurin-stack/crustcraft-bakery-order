import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../services/auth.service';

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication credentials are required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role permissions for this resource',
        },
      });
      return;
    }

    next();
  };
}
