import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  createPurchaseOrderController,
  deletePurchaseOrderController,
  getPurchaseOrderController,
  listPurchaseOrdersController,
  updatePurchaseOrderController,
  updatePurchaseOrderStatusController,
} from './purchaseOrder.controller.js';
import {
  documentIdParamsSchema,
  purchaseOrderBodySchema,
  purchaseOrderListQuerySchema,
  purchaseOrderUpdateSchema,
  statusUpdateBodySchema,
} from './purchaseOrder.validation.js';

export const purchaseOrderRouter = Router();

purchaseOrderRouter.get('/', validateRequest({ query: purchaseOrderListQuerySchema }), listPurchaseOrdersController);
purchaseOrderRouter.get('/:id', validateRequest({ params: documentIdParamsSchema }), getPurchaseOrderController);
purchaseOrderRouter.post('/', validateRequest({ body: purchaseOrderBodySchema }), createPurchaseOrderController);
purchaseOrderRouter.put('/:id', validateRequest({ params: documentIdParamsSchema, body: purchaseOrderUpdateSchema }), updatePurchaseOrderController);
purchaseOrderRouter.patch('/:id/status', validateRequest({ params: documentIdParamsSchema, body: statusUpdateBodySchema }), updatePurchaseOrderStatusController);
purchaseOrderRouter.delete('/:id', validateRequest({ params: documentIdParamsSchema }), deletePurchaseOrderController);
