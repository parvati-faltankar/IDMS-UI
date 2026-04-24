import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

export function notFoundHandler(request: Request, _response: Response, next: NextFunction): void {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}
