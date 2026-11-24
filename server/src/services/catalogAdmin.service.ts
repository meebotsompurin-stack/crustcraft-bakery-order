import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from './auth.service';
import type { BakeryItemDto } from './catalog.service';

export interface CreateBakeryItemInput {
  name: string;
  description: string;
  price: number; // Integer satang > 0
  stockQuantity: number; // Integer >= 0
  category: string;
  isAvailable?: boolean;
}

export type UpdateBakeryItemInput = Partial<CreateBakeryItemInput>;

type ValidationDetail = { field: string; issue: string };

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 60;

function toBakeryItemDto(item: {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}): BakeryItemDto {
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

function validateNonEmptyString(
  value: unknown,
  field: string,
  maxLength: number,
  details: ValidationDetail[]
): string | undefined {
  if (typeof value !== 'string') {
    details.push({ field, issue: `${field} must be a string` });
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    details.push({ field, issue: `${field} cannot be empty` });
    return undefined;
  }
  if (trimmed.length > maxLength) {
    details.push({
      field,
      issue: `${field} must be at most ${maxLength} characters`,
    });
    return undefined;
  }
  return trimmed;
}

function validatePrice(
  value: unknown,
  details: ValidationDetail[]
): number | undefined {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    details.push({
      field: 'price',
      issue: 'price must be a positive integer in satang (> 0)',
    });
    return undefined;
  }
  return value;
}

function validateStockQuantity(
  value: unknown,
  details: ValidationDetail[]
): number | undefined {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    details.push({
      field: 'stockQuantity',
      issue: 'stockQuantity must be a non-negative integer (>= 0)',
    });
    return undefined;
  }
  return value;
}

function validateIsAvailable(
  value: unknown,
  details: ValidationDetail[]
): boolean | undefined {
  if (typeof value !== 'boolean') {
    details.push({
      field: 'isAvailable',
      issue: 'isAvailable must be a boolean',
    });
    return undefined;
  }
  return value;
}

/**
 * Returns ALL BakeryItem records (both isAvailable: true and false),
 * ordered by category ASC then name ASC.
 */
export async function listAllCatalogItems(): Promise<BakeryItemDto[]> {
  const items = await prisma.bakeryItem.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return items.map(toBakeryItemDto);
}

/**
 * Creates a new BakeryItem with strict integer satang pricing and unique name enforcement.
 */
export async function createCatalogItem(
  rawBody: unknown
): Promise<BakeryItemDto> {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object');
  }

  const body = rawBody as Record<string, unknown>;
  const details: ValidationDetail[] = [];

  const name = validateNonEmptyString(body.name, 'name', MAX_NAME_LENGTH, details);
  const description = validateNonEmptyString(
    body.description,
    'description',
    MAX_DESCRIPTION_LENGTH,
    details
  );
  const price = validatePrice(body.price, details);
  const stockQuantity = validateStockQuantity(body.stockQuantity, details);
  const category = validateNonEmptyString(
    body.category,
    'category',
    MAX_CATEGORY_LENGTH,
    details
  );

  let isAvailable = true;
  if (body.isAvailable !== undefined) {
    const validated = validateIsAvailable(body.isAvailable, details);
    if (validated !== undefined) {
      isAvailable = validated;
    }
  }

  if (details.length > 0 || name === undefined || description === undefined || price === undefined || stockQuantity === undefined || category === undefined) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid bakery item payload',
      details
    );
  }

  try {
    const created = await prisma.bakeryItem.create({
      data: {
        name,
        description,
        price,
        stockQuantity,
        category,
        isAvailable,
      },
    });

    return toBakeryItemDto(created);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        409,
        'CONFLICT',
        `A bakery item named "${name}" already exists.`
      );
    }
    throw error;
  }
}

/**
 * Partially updates an existing BakeryItem without mutating historical OrderItem snapshots (BR-02).
 */
export async function updateCatalogItem(
  id: string,
  rawBody: unknown
): Promise<BakeryItemDto> {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object');
  }

  const body = rawBody as Record<string, unknown>;
  const details: ValidationDetail[] = [];
  const updateData: Prisma.BakeryItemUpdateInput = {};

  if (body.name !== undefined) {
    const name = validateNonEmptyString(body.name, 'name', MAX_NAME_LENGTH, details);
    if (name !== undefined) {
      updateData.name = name;
    }
  }

  if (body.description !== undefined) {
    const description = validateNonEmptyString(
      body.description,
      'description',
      MAX_DESCRIPTION_LENGTH,
      details
    );
    if (description !== undefined) {
      updateData.description = description;
    }
  }

  if (body.price !== undefined) {
    const price = validatePrice(body.price, details);
    if (price !== undefined) {
      updateData.price = price;
    }
  }

  if (body.stockQuantity !== undefined) {
    const stockQuantity = validateStockQuantity(body.stockQuantity, details);
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = stockQuantity;
    }
  }

  if (body.category !== undefined) {
    const category = validateNonEmptyString(
      body.category,
      'category',
      MAX_CATEGORY_LENGTH,
      details
    );
    if (category !== undefined) {
      updateData.category = category;
    }
  }

  if (body.isAvailable !== undefined) {
    const isAvailable = validateIsAvailable(body.isAvailable, details);
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }
  }

  if (details.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid bakery item update payload',
      details
    );
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'At least one updatable field (name, description, price, stockQuantity, category, isAvailable) must be provided.'
    );
  }

  const existing = await prisma.bakeryItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Bakery item not found');
  }

  try {
    const updated = await prisma.bakeryItem.update({
      where: { id },
      data: updateData,
    });

    return toBakeryItemDto(updated);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new AppError(
          409,
          'CONFLICT',
          'Another bakery item with this name already exists.'
        );
      }
      if (error.code === 'P2025') {
        throw new AppError(404, 'NOT_FOUND', 'Bakery item not found');
      }
    }
    throw error;
  }
}
