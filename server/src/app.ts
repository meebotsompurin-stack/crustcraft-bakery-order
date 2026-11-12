import path from 'path';
import fs from 'fs';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes';
import { catalogRouter } from './routes/catalog.routes';
import { customerRouter } from './routes/customer.routes';
import { operatorRouter } from './routes/operator.routes';
import { AppError } from './services/auth.service';
import { prisma } from './lib/db';

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Liveness Probe (always 200 if server process is running)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness Probe (checks actual database connectivity via PostgreSQL ping)
app.get('/api/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database readiness check failed',
      },
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/customer', customerRouter);
app.use('/api/operator', operatorRouter);

// Single-Container Static Serving (Production Mode)
if (process.env.NODE_ENV === 'production') {
  const candidatePaths = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
  ];
  const clientDistPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];

  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Requested endpoint does not exist',
    },
  });
});

app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal server error occurred',
      },
    });
  }
);
