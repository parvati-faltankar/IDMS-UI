import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): Response {
  void _next;

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      success: false,
      message: 'Request validation failed',
      details: error.flatten(),
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({
      success: false,
      message: 'Database validation failed',
      details: error.errors,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return response.status(400).json({
      success: false,
      message: `Invalid identifier for ${error.path}`,
    });
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return response.status(500).json({
    success: false,
    message,
  });
}
