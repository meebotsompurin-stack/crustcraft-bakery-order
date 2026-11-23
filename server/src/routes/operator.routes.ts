import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import {
  getOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
} from '../controllers/operator.controller';
import { updateOperatorPaymentHandler } from '../controllers/payment.controller';

export const operatorRouter = Router();

operatorRouter.use(authenticate, requireRole(['OPERATOR']));

operatorRouter.get('/orders', getOrdersHandler);
operatorRouter.get('/orders/:id', getOrderByIdHandler);
operatorRouter.patch('/orders/:id/status', updateOrderStatusHandler);
operatorRouter.patch('/orders/:id/payment', updateOperatorPaymentHandler);
