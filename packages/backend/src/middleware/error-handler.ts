import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@summit-gear/shared';

export class HttpError extends Error {
  constructor(public statusCode: number, public error: string, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err instanceof HttpError) {
    const response: ApiError = {
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
    };
    return res.status(err.statusCode).json(response);
  }

  const response: ApiError = {
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
  res.status(500).json(response);
}
