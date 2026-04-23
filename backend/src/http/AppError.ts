export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "APP_ERROR",
    public readonly expose = true
  ) {
    super(message);
    this.name = "AppError";
  }
}
