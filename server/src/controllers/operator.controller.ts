import type { Request, Response, NextFunction } from 'express';
import {
  listOperatorOrders,
  getOperatorOrderById,
  updateOrderStatus,
} from '../services/operator.service';

export async function getOrdersHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await listOperatorOrders();
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrderByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await getOperatorOrderById(id);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body ?? {};
    const order = await updateOrderStatus(id, status);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
}
