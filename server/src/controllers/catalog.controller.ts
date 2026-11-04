import { type Request, type Response, type NextFunction } from 'express';
import {
  getAvailableCatalogItems,
  getCatalogItemById,
} from '../services/catalog.service';

export async function getCatalogItemsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await getAvailableCatalogItems();
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
}

export async function getCatalogItemByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const item = await getCatalogItemById(id);
    res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
}
