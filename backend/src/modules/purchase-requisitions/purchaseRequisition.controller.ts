import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { mapPurchaseRequisition } from './purchaseRequisition.mapper.js';
import {
  createPurchaseRequisition,
  deletePurchaseRequisition,
  getPurchaseRequisitionById,
  listPurchaseRequisitions,
  updatePurchaseRequisition,
  updatePurchaseRequisitionStatus,
} from './purchaseRequisition.service.js';

export const listRequisitionsController = asyncHandler(async (request: Request, response: Response) => {
  const result = await listPurchaseRequisitions(request.query as Record<string, unknown>);
  return sendSuccess(response, {
    message: 'Purchase requisitions fetched successfully',
    data: result.items.map(mapPurchaseRequisition),
    meta: result.pagination,
  });
});

export const getRequisitionController = asyncHandler(async (request: Request, response: Response) => {
  const document = await getPurchaseRequisitionById(request.params.id);
  return sendSuccess(response, {
    message: 'Purchase requisition fetched successfully',
    data: mapPurchaseRequisition(document),
  });
});

export const createRequisitionController = asyncHandler(async (request: Request, response: Response) => {
  const document = await createPurchaseRequisition(request.body);
  return sendSuccess(response, {
    statusCode: 201,
    message: 'Purchase requisition created successfully',
    data: mapPurchaseRequisition(document),
  });
});

export const updateRequisitionController = asyncHandler(async (request: Request, response: Response) => {
  const document = await updatePurchaseRequisition(request.params.id, request.body);
  return sendSuccess(response, {
    message: 'Purchase requisition updated successfully',
    data: mapPurchaseRequisition(document),
  });
});

export const deleteRequisitionController = asyncHandler(async (request: Request, response: Response) => {
  await deletePurchaseRequisition(request.params.id, request.body?.actorName);
  return sendSuccess(response, {
    message: 'Purchase requisition deleted successfully',
    data: { id: request.params.id },
  });
});

export const updateRequisitionStatusController = asyncHandler(async (request: Request, response: Response) => {
  const document = await updatePurchaseRequisitionStatus(request.params.id, request.body);
  return sendSuccess(response, {
    message: 'Purchase requisition status updated successfully',
    data: mapPurchaseRequisition(document),
  });
});
