import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  createRequisitionController,
  deleteRequisitionController,
  getRequisitionController,
  listRequisitionsController,
  updateRequisitionController,
  updateRequisitionStatusController,
} from './purchaseRequisition.controller.js';
import {
  documentIdParamsSchema,
  purchaseRequisitionBodySchema,
  purchaseRequisitionListQuerySchema,
  purchaseRequisitionUpdateSchema,
  statusUpdateBodySchema,
} from './purchaseRequisition.validation.js';

export const purchaseRequisitionRouter = Router();

purchaseRequisitionRouter.get('/', validateRequest({ query: purchaseRequisitionListQuerySchema }), listRequisitionsController);
purchaseRequisitionRouter.get('/:id', validateRequest({ params: documentIdParamsSchema }), getRequisitionController);
purchaseRequisitionRouter.post('/', validateRequest({ body: purchaseRequisitionBodySchema }), createRequisitionController);
purchaseRequisitionRouter.put(
  '/:id',
  validateRequest({ params: documentIdParamsSchema, body: purchaseRequisitionUpdateSchema }),
  updateRequisitionController
);
purchaseRequisitionRouter.patch(
  '/:id/status',
  validateRequest({ params: documentIdParamsSchema, body: statusUpdateBodySchema }),
  updateRequisitionStatusController
);
purchaseRequisitionRouter.delete('/:id', validateRequest({ params: documentIdParamsSchema }), deleteRequisitionController);
