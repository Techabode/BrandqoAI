type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
};

const writeLog = (level: LogLevel, message: string, meta: LogMeta = {}) => {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (level === "error") {
    console.error(logEntry);
    return;
  }

  if (level === "warn") {
    console.warn(logEntry);
    return;
  }

  console.log(logEntry);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
  error: (message: string, error?: unknown, meta: LogMeta = {}) =>
    writeLog("error", message, {
      ...meta,
      error: serializeError(error),
    }),
};
