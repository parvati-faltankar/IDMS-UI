import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { mapPurchaseOrder } from './purchaseOrder.mapper.js';
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
} from './purchaseOrder.service.js';

export const listPurchaseOrdersController = asyncHandler(async (request: Request, response: Response) => {
  const result = await listPurchaseOrders(request.query as Record<string, unknown>);
  return sendSuccess(response, {
    message: 'Purchase orders fetched successfully',
    data: result.items.map(mapPurchaseOrder),
    meta: result.pagination,
  });
});

export const getPurchaseOrderController = asyncHandler(async (request: Request, response: Response) => {
  const document = await getPurchaseOrderById(request.params.id);
  return sendSuccess(response, {
    message: 'Purchase order fetched successfully',
    data: mapPurchaseOrder(document),
  });
});

export const createPurchaseOrderController = asyncHandler(async (request: Request, response: Response) => {
  const document = await createPurchaseOrder(request.body);
  return sendSuccess(response, {
    statusCode: 201,
    message: 'Purchase order created successfully',
    data: mapPurchaseOrder(document),
  });
});

export const updatePurchaseOrderController = asyncHandler(async (request: Request, response: Response) => {
  const document = await updatePurchaseOrder(request.params.id, request.body);
  return sendSuccess(response, {
    message: 'Purchase order updated successfully',
    data: mapPurchaseOrder(document),
  });
});

export const deletePurchaseOrderController = asyncHandler(async (request: Request, response: Response) => {
  await deletePurchaseOrder(request.params.id, request.body?.actorName);
  return sendSuccess(response, {
    message: 'Purchase order deleted successfully',
    data: { id: request.params.id },
  });
});

export const updatePurchaseOrderStatusController = asyncHandler(async (request: Request, response: Response) => {
  const document = await updatePurchaseOrderStatus(request.params.id, request.body);
  return sendSuccess(response, {
    message: 'Purchase order status updated successfully',
    data: mapPurchaseOrder(document),
  });
});
