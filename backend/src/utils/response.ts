import type { Response } from 'express';

export function sendSuccess<T>(
  response: Response,
  payload: {
    statusCode?: number;
    message: string;
    data: T;
    meta?: Record<string, unknown>;
  }
): Response {
  const { statusCode = 200, message, data, meta } = payload;

  return response.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}
