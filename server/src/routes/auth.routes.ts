import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  meController,
  operatorCheckController,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { requireRole } from '../middleware/requireRole.middleware';

export const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
authRouter.get('/me', authenticate, meController);
authRouter.get(
  '/operator-check',
  authenticate,
  requireRole(['OPERATOR']),
  operatorCheckController
);
