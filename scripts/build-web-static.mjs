import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

for (const envFileName of [
  ".env.local",
  ".env.aws",
  ".env.production",
  ".env",
]) {
  const envFilePath = resolve(process.cwd(), envFileName);
  if (existsSync(envFilePath)) {
    loadDotenv({ path: envFilePath, override: false });
  }
}

const env = {
  ...process.env,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "aws",
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
};

const result = spawnSync("npm", ["run", "build", "--workspace", "@cpa/web"], {
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status ?? 1);
