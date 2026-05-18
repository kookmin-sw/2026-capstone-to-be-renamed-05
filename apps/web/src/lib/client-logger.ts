type ClientLogValue = string | number | boolean | null | undefined;

export type ClientLogContext = Record<string, ClientLogValue>;

type ClientLogLevel = "debug" | "info" | "warn" | "error";

const UT_LOG_SESSION_KEY = "accountit:ut-log-session-id";
const LOG_PREFIX = "[Accountit UT]";

function shouldLog() {
  return (
    process.env.NEXT_PUBLIC_ENABLE_UT_LOGS?.trim() === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

export function logClientWarn(
  event: string,
  error?: unknown,
  context?: ClientLogContext,
) {
  writeLog("warn", event, error, context);
}

export function logClientError(
  event: string,
  error: unknown,
  context?: ClientLogContext,
) {
  writeLog("error", event, error, context);
}

function writeLog(
  level: ClientLogLevel,
  event: string,
  error?: unknown,
  context?: ClientLogContext,
) {
  if (!shouldLog()) return;

  const payload = {
    event,
    at: new Date().toISOString(),
    sessionId: getSessionId(),
    path: getCurrentPath(),
    context: compactContext(context),
    error: error === undefined ? undefined : serializeError(error),
  };

  console[level](`${LOG_PREFIX} ${event}`, payload);
}

function compactContext(context?: ClientLogContext) {
  if (!context) return undefined;
  const entries = Object.entries(context).filter(
    ([, value]) => value !== undefined,
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: typeof error,
    message: String(error),
  };
}

function getCurrentPath() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.pathname}${window.location.search}`;
}

function getSessionId() {
  if (typeof window === "undefined") return undefined;

  try {
    const existing = window.sessionStorage.getItem(UT_LOG_SESSION_KEY);
    if (existing) return existing;

    const next =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(UT_LOG_SESSION_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}
