/**
 * Service-layer errors carry an HTTP status so Route Handlers can translate
 * them into responses without re-deriving intent from string matching.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message = "Invalid input") {
    super(message, 400);
    this.name = "ValidationError";
  }
}
