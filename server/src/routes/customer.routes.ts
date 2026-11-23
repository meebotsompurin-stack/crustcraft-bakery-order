import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import { requireRole } from '../middleware/requireRole.middleware';
import {
  createOrderHandler,
  getCustomerOrdersHandler,
  getCustomerOrderByIdHandler,
  cancelCustomerOrderHandler,
} from '../controllers/orders.controller';
import { simulateCustomerPaymentHandler } from '../controllers/payment.controller';

export const customerRouter = Router();

// Protect all customer routes: must be authenticated and have CUSTOMER role
customerRouter.use(authenticate);
customerRouter.use(requireRole(['CUSTOMER']));

customerRouter.post('/orders', createOrderHandler);
customerRouter.get('/orders', getCustomerOrdersHandler);
customerRouter.get('/orders/:id', getCustomerOrderByIdHandler);
customerRouter.patch('/orders/:id/cancel', cancelCustomerOrderHandler);
customerRouter.post('/orders/:id/pay', simulateCustomerPaymentHandler);
