export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, code?: string) {
    return new AppError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new AppError(404, `${resource} not found`, 'NOT_FOUND');
  }
}
