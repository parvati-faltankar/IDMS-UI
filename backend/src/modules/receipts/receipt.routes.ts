import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  createReceiptController,
  deleteReceiptController,
  getReceiptController,
  listReceiptsController,
  updateReceiptController,
  updateReceiptStatusController,
} from './receipt.controller.js';
import {
  documentIdParamsSchema,
  receiptBodySchema,
  receiptListQuerySchema,
  receiptUpdateSchema,
  statusUpdateBodySchema,
} from './receipt.validation.js';

export const receiptRouter = Router();

receiptRouter.get('/', validateRequest({ query: receiptListQuerySchema }), listReceiptsController);
receiptRouter.get('/:id', validateRequest({ params: documentIdParamsSchema }), getReceiptController);
receiptRouter.post('/', validateRequest({ body: receiptBodySchema }), createReceiptController);
receiptRouter.put('/:id', validateRequest({ params: documentIdParamsSchema, body: receiptUpdateSchema }), updateReceiptController);
receiptRouter.patch('/:id/status', validateRequest({ params: documentIdParamsSchema, body: statusUpdateBodySchema }), updateReceiptStatusController);
receiptRouter.delete('/:id', validateRequest({ params: documentIdParamsSchema }), deleteReceiptController);
