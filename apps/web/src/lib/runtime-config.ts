const LOCAL_API_BASE_URL = "http://localhost:4000";
const AWS_API_BASE_URL = "/api";

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return trimTrailingSlash(configured);

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (appEnv === "aws" || appEnv === "production" || appEnv === "prod") {
    return AWS_API_BASE_URL;
  }
  if (appEnv === "local" || appEnv === "development" || appEnv === "dev") {
    return LOCAL_API_BASE_URL;
  }

  return process.env.NODE_ENV === "production"
    ? AWS_API_BASE_URL
    : LOCAL_API_BASE_URL;
}

function trimTrailingSlash(value: string) {
  if (value === "/") return value;
  return value.replace(/\/+$/, "");
}
