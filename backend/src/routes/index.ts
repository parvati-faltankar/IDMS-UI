import type { Express } from 'express';
import { Router } from 'express';
import { env } from '../config/env.js';
import { purchaseOrderRouter } from '../modules/purchase-orders/purchaseOrder.routes.js';
import { purchaseRequisitionRouter } from '../modules/purchase-requisitions/purchaseRequisition.routes.js';
import { receiptRouter } from '../modules/receipts/receipt.routes.js';

export function registerRoutes(app: Express): void {
  const apiRouter = Router();

  apiRouter.use('/purchase-requisitions', purchaseRequisitionRouter);
  apiRouter.use('/purchase-orders', purchaseOrderRouter);
  apiRouter.use('/receipts', receiptRouter);

  app.use(env.API_PREFIX, apiRouter);
}
