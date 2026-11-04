import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.middleware';
import {
  getCatalogItemsHandler,
  getCatalogItemByIdHandler,
} from '../controllers/catalog.controller';

export const catalogRouter = Router();

catalogRouter.use(authenticate);

catalogRouter.get('/', getCatalogItemsHandler);
catalogRouter.get('/:id', getCatalogItemByIdHandler);
