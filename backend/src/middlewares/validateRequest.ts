import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/apiError.js';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        Object.assign(request.params, schemas.params.parse(request.params));
      }

      if (schemas.query) {
        Object.assign(request.query as Record<string, unknown>, schemas.query.parse(request.query));
      }

      if (schemas.body) {
        request.body = schemas.body.parse(request.body);
      }

      next();
    } catch (error) {
      next(new ApiError(400, 'Request validation failed', error));
    }
  };
}
