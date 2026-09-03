import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';

export { AppError };

/**
 * Message-based mapping for known service errors thrown as plain `Error`s.
 * Order matters: first match wins.
 */
const KNOWN_ERROR_STATUS: Array<{ pattern: RegExp; status: number }> = [
  { pattern: /not found/i, status: 404 },
  { pattern: /invalid or expired|invalid email or password|unauthorized/i, status: 401 },
  { pattern: /suspended/i, status: 403 },
  { pattern: /already exists/i, status: 409 },
  { pattern: /not enrolled|invalid/i, status: 400 },
];

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Pipeline]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Unauthorized access',
    });
    return;
  }

  let statusCode: number = err.statusCode || err.status || 0;

  if (!statusCode && err instanceof Error && typeof err.message === 'string') {
    const known = KNOWN_ERROR_STATUS.find(({ pattern }) => pattern.test(err.message));
    if (known) statusCode = known.status;
  }

  if (!statusCode) statusCode = 500;

  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
