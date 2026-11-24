import type { Request, Response, NextFunction } from 'express';
import { getSalesSummary } from '../services/reporting.service';

export async function getOperatorSalesSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await getSalesSummary({
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
}
