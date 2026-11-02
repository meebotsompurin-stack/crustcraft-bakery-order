import type { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  getUserById,
  AppError,
  type Role,
} from '../services/auth.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const details: Array<{ field: string; issue: string }> = [];

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const rawRole = body?.role;

    if (!name) {
      details.push({ field: 'name', issue: 'Name is required' });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      details.push({ field: 'email', issue: 'Valid email is required' });
    }

    if (!password || password.length < 8) {
      details.push({
        field: 'password',
        issue: 'Password must be at least 8 characters long',
      });
    }

    let role: Role = 'CUSTOMER';
    if (rawRole !== undefined) {
      if (rawRole !== 'CUSTOMER' && rawRole !== 'OPERATOR') {
        details.push({
          field: 'role',
          issue: 'Role must be either CUSTOMER or OPERATOR',
        });
      } else {
        role = rawRole;
      }
    }

    if (details.length > 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid registration data', details);
    }

    const user = await registerUser({ name, email, password, role });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const details: Array<{ field: string; issue: string }> = [];

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email) {
      details.push({ field: 'email', issue: 'Email is required' });
    }
    if (!password) {
      details.push({ field: 'password', issue: 'Password is required' });
    }

    if (details.length > 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required', details);
    }

    const { user, token } = await loginUser({ email, password });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400000, // 24 hours in milliseconds (Max-Age=86400 seconds)
    });

    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export function logoutController(_req: Request, res: Response): void {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  res.status(200).json({
    message: 'Logged out successfully',
  });
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication credentials are required');
    }

    const user = await getUserById(req.user.userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export function operatorCheckController(req: Request, res: Response): void {
  res.status(200).json({
    ok: true,
    user: req.user,
  });
}
