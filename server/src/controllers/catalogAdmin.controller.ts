import type { Request, Response, NextFunction } from 'express';
import {
  listAllCatalogItems,
  createCatalogItem,
  updateCatalogItem,
} from '../services/catalogAdmin.service';

export async function getOperatorCatalogHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await listAllCatalogItems();
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
}

export async function createOperatorCatalogItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await createCatalogItem(req.body);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function updateOperatorCatalogItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await updateCatalogItem(id, req.body);
    res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
}
