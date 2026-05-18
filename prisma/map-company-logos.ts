import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { config as loadDotenv } from "dotenv";
import {
  resolveEnvFilePaths,
  resolvePrismaPostgresConfig,
} from "../apps/api/src/config/runtime-environment";
import {
  ensureGeneratedCompanyBackgroundAsset,
  ensureGeneratedCompanyLogoAsset,
  pickGeneratedCompanyBackground,
  pickGeneratedCompanyLogo,
} from "./company-logo-assets";

for (const envFilePath of resolveEnvFilePaths()) {
  loadDotenv({ path: envFilePath, override: false });
}

type CliOptions = {
  dryRun: boolean;
  overwrite: boolean;
  limit?: number;
};

type MappingStats = {
  scanned: number;
  logoMapped: number;
  backgroundMapped: number;
  skipped: number;
  failed: number;
};

function createPrismaClient() {
  const { connectionString, schema } = resolvePrismaPostgresConfig();

  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString },
      schema ? { schema } : undefined,
    ),
  });
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    overwrite: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [name, inlineValue] = arg.includes("=")
      ? arg.split(/=(.*)/s, 2)
      : [arg, undefined];

    const readValue = () => {
      if (inlineValue !== undefined) {
        return inlineValue;
      }

      index += 1;
      const value = argv[index];
      if (!value) {
        throw new Error(`Missing value for ${name}`);
      }
      return value;
    };

    switch (name) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--limit":
        options.limit = parsePositiveInteger(readValue(), "--limit");
        break;
      case "--help":
      case "-h":
        printUsageAndExit();
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function parsePositiveInteger(value: string, optionName: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsed;
}

function printUsageAndExit(): never {
  console.log(`Usage: npm run prisma:map-company-assets -- [options]

Options:
  --dry-run      Preview company-to-image mapping without writing to the database
  --overwrite    Replace existing company logoAsset and backgroundAsset links
  --limit <n>    Maximum companies to process
`);
  process.exit(0);
}

async function mapCompanyLogos(options: CliOptions) {
  const prisma = createPrismaClient();
  const stats: MappingStats = {
    scanned: 0,
    logoMapped: 0,
    backgroundMapped: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const where: Prisma.CompanyWhereInput = options.overwrite
      ? {}
      : { OR: [{ logoAssetId: null }, { backgroundAssetId: null }] };

    const companies = await prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      ...(options.limit ? { take: options.limit } : {}),
    });

    stats.scanned = companies.length;

    for (const company of companies) {
      const logo = pickGeneratedCompanyLogo(company.name);
      const background = pickGeneratedCompanyBackground(
        company.name,
        company.type,
      );
      const shouldMapLogo = options.overwrite || !company.logoAssetId;
      const shouldMapBackground =
        options.overwrite || !company.backgroundAssetId;

      if (options.dryRun) {
        if (shouldMapLogo) {
          stats.logoMapped += 1;
        }
        if (shouldMapBackground) {
          stats.backgroundMapped += 1;
        }
        console.log(
          `[asset-map] ${company.name} -> logo: ${shouldMapLogo ? logo.publicPath : "keep"}, background: ${shouldMapBackground ? background.publicPath : "keep"}`,
        );
        continue;
      }

      try {
        const logoResult = await ensureGeneratedCompanyLogoAsset(
          prisma,
          company,
          {
            overwrite: options.overwrite,
          },
        );
        const backgroundResult = await ensureGeneratedCompanyBackgroundAsset(
          prisma,
          logoResult.company,
          {
            overwrite: options.overwrite,
          },
        );

        if (logoResult.changed) {
          stats.logoMapped += 1;
        }
        if (backgroundResult.changed) {
          stats.backgroundMapped += 1;
        }
        if (!logoResult.changed && !backgroundResult.changed) {
          stats.skipped += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.warn(
          `[asset-map] Failed to map ${company.name}: ${formatError(error)}`,
        );
      }
    }

    return stats;
  } finally {
    await prisma.$disconnect();
  }
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const stats = await mapCompanyLogos(options);
  console.log(`[asset-map] Complete: ${JSON.stringify(stats)}`);
}

main().catch((error) => {
  console.error(`[asset-map] Failed: ${formatError(error)}`);
  process.exit(1);
});
