import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

const explicitEnvFile = process.env.ENV_FILE?.trim();
const envFileNames = explicitEnvFile
  ? [explicitEnvFile]
  : [".env.aws", ".env.production", ".env", ".env.local"];

for (const envFileName of envFileNames) {
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

function runNpm(args) {
  return spawnSync("npm", args, {
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
}

const sharedBuild = runNpm(["run", "build", "--workspace", "@cpa/shared"]);
if (sharedBuild.status !== 0) process.exit(sharedBuild.status ?? 1);

const result = runNpm(["run", "build", "--workspace", "@cpa/web"]);

process.exit(result.status ?? 1);
