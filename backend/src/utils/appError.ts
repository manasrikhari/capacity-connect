/**
 * Lightweight typed HTTP error for services/routes.
 * The global errorHandler maps `statusCode` onto the response.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
