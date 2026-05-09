import type { NextConfig } from "next";

function s3RemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ??
    process.env.S3_PUBLIC_BASE_URL;
  if (!publicBaseUrl) return [];

  try {
    const url = new URL(publicBaseUrl);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: `${url.pathname.replace(/\/$/, "")}/**`,
      },
    ];
  } catch {
    return [];
  }
}

function basePath() {
  const path = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (!path || path === "/") return undefined;

  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return prefixed.replace(/\/$/, "");
}

function assetPrefix() {
  const prefix = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim();
  if (!prefix || prefix === "/") return undefined;

  const prefixed = prefix.startsWith("/") ? prefix : `/${prefix}`;
  return prefixed.replace(/\/$/, "");
}

const configuredBasePath = basePath();
const configuredAssetPrefix = assetPrefix();

const nextConfig: NextConfig = {
  ...(configuredBasePath ? { basePath: configuredBasePath } : {}),
  ...(configuredAssetPrefix ? { assetPrefix: configuredAssetPrefix } : {}),
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@cpa/shared"],
  images: {
    unoptimized: true,
    remotePatterns: s3RemotePatterns(),
  },
};

export default nextConfig;
