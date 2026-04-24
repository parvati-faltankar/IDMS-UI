import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { mapReceipt } from './receipt.mapper.js';
import {
  createReceipt,
  deleteReceipt,
  getReceiptById,
  listReceipts,
  updateReceipt,
  updateReceiptStatus,
} from './receipt.service.js';

export const listReceiptsController = asyncHandler(async (request: Request, response: Response) => {
  const result = await listReceipts(request.query as Record<string, unknown>);
  return sendSuccess(response, {
    message: 'Receipts fetched successfully',
    data: result.items.map(mapReceipt),
    meta: result.pagination,
  });
});

export const getReceiptController = asyncHandler(async (request: Request, response: Response) => {
  const document = await getReceiptById(request.params.id);
  return sendSuccess(response, {
    message: 'Receipt fetched successfully',
    data: mapReceipt(document),
  });
});

export const createReceiptController = asyncHandler(async (request: Request, response: Response) => {
  const document = await createReceipt(request.body);
  return sendSuccess(response, {
    statusCode: 201,
    message: 'Receipt created successfully',
    data: mapReceipt(document),
  });
});

export const updateReceiptController = asyncHandler(async (request: Request, response: Response) => {
  const document = await updateReceipt(request.params.id, request.body);
  return sendSuccess(response, {
    message: 'Receipt updated successfully',
    data: mapReceipt(document),
  });
});

export const deleteReceiptController = asyncHandler(async (request: Request, response: Response) => {
  await deleteReceipt(request.params.id, request.body?.actorName);
  return sendSuccess(response, {
    message: 'Receipt deleted successfully',
    data: { id: request.params.id },
  });
});

export const updateReceiptStatusController = asyncHandler(async (request: Request, response: Response) => {
  const document = await updateReceiptStatus(request.params.id, request.body);
  return sendSuccess(response, {
    message: 'Receipt status updated successfully',
    data: mapReceipt(document),
  });
});
