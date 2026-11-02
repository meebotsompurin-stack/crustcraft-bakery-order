import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';

export type Role = 'CUSTOMER' | 'OPERATOR';

export interface JwtUserPayload {
  userId: string;
  role: Role;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Array<{ field: string; issue: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const JWT_SECRET =
  process.env.JWT_SECRET || 'crustcraft-sprint1-secret-key-2026';
const SALT_ROUNDS = 10;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function signToken(payload: JwtUserPayload): string {
  return jwt.sign(
    { userId: payload.userId, role: payload.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): JwtUserPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  if (
    !decoded ||
    typeof decoded.userId !== 'string' ||
    (decoded.role !== 'CUSTOMER' && decoded.role !== 'OPERATOR')
  ) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token payload');
  }
  return {
    userId: decoded.userId,
    role: decoded.role,
  };
}

export function formatUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}): Promise<UserResponse> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedName = input.name.trim();
  const role: Role = input.role ?? 'CUSTOMER';

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Email already in use', [
      { field: 'email', issue: 'Email address is already registered' },
    ]);
  }

  const passwordHash = await hashPassword(input.password);

  const created = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role,
    },
  });

  return formatUserResponse(created);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: UserResponse; token: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const role = user.role as Role;
  const token = signToken({ userId: user.id, role });

  return {
    user: formatUserResponse(user),
    token,
  };
}

export async function getUserById(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user no longer exists');
  }

  return formatUserResponse(user);
}
