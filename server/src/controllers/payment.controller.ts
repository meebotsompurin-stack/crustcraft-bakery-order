import type { Request, Response, NextFunction } from 'express';
import {
  simulateCustomerPayment,
  updateOperatorOrderPayment,
} from '../services/payment.service';

export async function simulateCustomerPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body ?? {};
    const { simulateOutcome } = body;

    const order = await simulateCustomerPayment(id, customerId, simulateOutcome);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function updateOperatorPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { paymentStatus } = req.body ?? {};

    const order = await updateOperatorOrderPayment(id, paymentStatus);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}
