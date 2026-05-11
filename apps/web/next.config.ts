import type { NextConfig } from "next";

function assetRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const publicBaseUrls = [
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL,
    process.env.S3_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_LOCAL_ASSET_PUBLIC_BASE_URL,
    process.env.LOCAL_ASSET_PUBLIC_BASE_URL,
    process.env.NODE_ENV === "production"
      ? undefined
      : "http://localhost:3000/uploads",
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(publicBaseUrls)).flatMap((publicBaseUrl) => {
    try {
      const url = new URL(publicBaseUrl);
      return {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/$/, "")}/**`,
      };
    } catch {
      return [];
    }
  });
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
    remotePatterns: assetRemotePatterns(),
  },
};

export default nextConfig;
