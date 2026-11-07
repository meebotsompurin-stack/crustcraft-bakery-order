import { type Request, type Response, type NextFunction } from 'express';
import {
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
} from '../services/orders.service';

export async function createOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.user!.userId;
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must be a valid JSON object.',
        },
      });
      return;
    }

    const { items, pickupNote } = body;

    const order = await createCustomerOrder({
      customerId,
      items,
      pickupNote,
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.user!.userId;
    const orders = await getCustomerOrders(customerId);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerOrderByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.user!.userId;
    const id = req.params.id as string;
    const order = await getCustomerOrderById(id, customerId);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}
