import type { ErrorRequestHandler } from "express";
import { AppError } from "./AppError";
import { logger } from "../lib/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : "INTERNAL_SERVER_ERROR";
  const message =
    isAppError && err.expose ? err.message : "Internal server error";

  logger.error("Request failed", err, {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
  });

  return res.status(statusCode).json({
    message,
    code,
  });
};
