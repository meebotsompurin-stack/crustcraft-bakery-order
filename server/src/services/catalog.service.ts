import { prisma } from '../lib/db';
import { AppError } from './auth.service';

export interface BakeryItemDto {
  id: string;
  name: string;
  description: string;
  price: number; // integer satang
  stockQuantity: number;
  isAvailable: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Returns all bakery items where isAvailable === true.
 * Per BR-05, items with stockQuantity === 0 remain isAvailable: true
 * and ARE returned so the frontend can display them with an "Out of Stock" badge.
 */
export async function getAvailableCatalogItems(): Promise<BakeryItemDto[]> {
  const items = await prisma.bakeryItem.findMany({
    where: {
      isAvailable: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    stockQuantity: item.stockQuantity,
    isAvailable: item.isAvailable,
    category: item.category,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

/**
 * Returns a single BakeryItem by ID.
 * Throws 404 NOT_FOUND if the item does not exist.
 */
export async function getCatalogItemById(id: string): Promise<BakeryItemDto> {
  const item = await prisma.bakeryItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Bakery item not found');
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    stockQuantity: item.stockQuantity,
    isAvailable: item.isAvailable,
    category: item.category,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
