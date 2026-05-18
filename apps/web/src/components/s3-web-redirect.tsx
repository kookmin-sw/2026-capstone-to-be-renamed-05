"use client";

import { useEffect } from "react";
import { logClientWarn } from "@/lib/client-logger";

const DEFAULT_REDIRECT_HOST_PATTERN = "s3-website";

export function S3WebRedirect() {
  useEffect(() => {
    const canonicalOrigin = trimTrailingSlash(
      process.env.NEXT_PUBLIC_CANONICAL_WEB_ORIGIN,
    );
    if (!canonicalOrigin) return;

    let canonicalHost: string;
    try {
      canonicalHost = new URL(canonicalOrigin).host;
    } catch (caught) {
      logClientWarn("web_redirect_invalid_canonical_origin", caught, {
        configured: Boolean(canonicalOrigin),
      });
      return;
    }

    if (window.location.host === canonicalHost) return;

    const redirectHosts = (
      process.env.NEXT_PUBLIC_REDIRECT_WEB_HOSTS ??
      DEFAULT_REDIRECT_HOST_PATTERN
    )
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean);

    const shouldRedirect = redirectHosts.some(
      (host) =>
        window.location.host === host || window.location.host.includes(host),
    );
    if (!shouldRedirect) return;

    window.location.replace(
      `${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }, []);

  return null;
}

function trimTrailingSlash(value: string | undefined) {
  return value?.trim().replace(/\/+$/, "");
}
