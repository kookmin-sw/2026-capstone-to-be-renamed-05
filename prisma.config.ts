import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";
import {
  resolveDatabaseUrl,
  resolveEnvFilePaths,
} from "./apps/api/src/config/runtime-environment";

for (const envFilePath of resolveEnvFilePaths()) {
  loadDotenv({ path: envFilePath, override: false });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
