/* eslint-disable no-console */
// Centralized logger utility. In production you could swap transports.
// We keep console usage isolated here to satisfy the no-console rule elsewhere.

type LogMeta = Record<string, unknown> | Error | undefined;

function format(message: string, meta?: LogMeta) {
  if (!meta) return message;
  // If meta is an Error, include its message and stack
  if (meta instanceof Error) {
    return `${message} | error=${meta.message}`;
  }
  try {
    return `${message} | meta=${JSON.stringify(meta)}`;
  } catch {
    return message;
  }
}

export const logger = {
  error(message: string, meta?: LogMeta) {
    console.error(format(message, meta));
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(format(message, meta));
  },
  info(message: string, meta?: LogMeta) {
    console.info(format(message, meta));
  },
  debug(message: string, meta?: LogMeta) {
    if (import.meta.env?.MODE === "development") {
      console.debug(format(message, meta));
    }
  },
};
