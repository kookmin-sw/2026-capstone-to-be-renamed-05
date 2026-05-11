import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type RuntimeEnvironment = 'local' | 'aws' | 'test';

type Env = Record<string, string | undefined>;

const DEFAULT_LOCAL_DATABASE_USER = 'cpa';
const DEFAULT_LOCAL_DATABASE_PASSWORD = 'cpa';
const DEFAULT_LOCAL_DATABASE_HOST = 'localhost';
const DEFAULT_LOCAL_DATABASE_PORT = '5432';
const DEFAULT_LOCAL_DATABASE_NAME = 'cpa_jobs';
const DEFAULT_LOCAL_DATABASE_SCHEMA = 'local';
const DEFAULT_AWS_DATABASE_SCHEMA = 'public';

export function resolveRuntimeEnvironment(
  env: Env = process.env,
): RuntimeEnvironment {
  const appEnv = normalize(env.APP_ENV ?? env.RUNTIME_ENV ?? env.DEPLOY_TARGET);
  if (appEnv === 'local' || appEnv === 'dev' || appEnv === 'development') {
    return 'local';
  }
  if (appEnv === 'aws' || appEnv === 'prod' || appEnv === 'production') {
    return 'aws';
  }
  if (appEnv === 'test') return 'test';

  if (env.NODE_ENV === 'production') return 'aws';
  if (env.NODE_ENV === 'test') return 'test';
  return 'local';
}

export function isServerRuntime(env: Env = process.env) {
  return resolveRuntimeEnvironment(env) === 'aws';
}

export function resolveDatabaseUrl(env: Env = process.env) {
  return resolvePrismaPostgresConfig(env).connectionString;
}

export function resolvePrismaPostgresConfig(env: Env = process.env) {
  const runtime = resolveRuntimeEnvironment(env);
  const schema = resolveDatabaseSchema(runtime, env);
  const configuredUrl =
    runtime === 'aws'
      ? firstNonEmpty(env.AWS_DATABASE_URL, env.DATABASE_URL)
      : firstNonEmpty(env.LOCAL_DATABASE_URL, env.DATABASE_URL);

  if (configuredUrl) {
    const connectionString = withPostgresSchema(configuredUrl, schema);
    return {
      connectionString,
      schema: readPostgresSchema(connectionString),
    };
  }

  if (runtime === 'aws') {
    throw new Error(
      'DATABASE_URL or AWS_DATABASE_URL must be set when APP_ENV=aws or NODE_ENV=production.',
    );
  }

  return {
    connectionString: buildLocalDatabaseUrl(schema),
    schema,
  };
}

export function resolveEnvFilePaths(
  env: Env = process.env,
  startDir = process.cwd(),
) {
  const root = resolveWorkspaceRoot(startDir);
  const runtime = resolveRuntimeEnvironment(env);
  const names =
    runtime === 'aws'
      ? ['.env.aws', '.env.production', '.env']
      : runtime === 'test'
        ? ['.env.test', '.env.local', '.env']
        : ['.env.local', '.env'];

  return names.map((name) => join(root, name));
}

export function resolveWorkspaceRoot(startDir = process.cwd()) {
  let current = resolve(startDir);

  while (true) {
    if (existsSync(join(current, 'prisma', 'schema.prisma'))) {
      return current;
    }

    const parent = resolve(current, '..');
    if (parent === current) return resolve(startDir);
    current = parent;
  }
}

function resolveDatabaseSchema(runtime: RuntimeEnvironment, env: Env) {
  return (
    firstNonEmpty(
      runtime === 'aws' ? env.AWS_DATABASE_SCHEMA : env.LOCAL_DATABASE_SCHEMA,
    ) ??
    firstNonEmpty(env.DATABASE_SCHEMA) ??
    (runtime === 'aws'
      ? DEFAULT_AWS_DATABASE_SCHEMA
      : DEFAULT_LOCAL_DATABASE_SCHEMA)
  );
}

function buildLocalDatabaseUrl(schema: string) {
  const url = new URL(
    `postgresql://${DEFAULT_LOCAL_DATABASE_USER}:${DEFAULT_LOCAL_DATABASE_PASSWORD}` +
      `@${DEFAULT_LOCAL_DATABASE_HOST}:${DEFAULT_LOCAL_DATABASE_PORT}/${DEFAULT_LOCAL_DATABASE_NAME}`,
  );
  url.searchParams.set('schema', schema);
  return url.toString();
}

function withPostgresSchema(connectionString: string, schema: string) {
  const url = new URL(connectionString);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    return connectionString;
  }
  if (!url.searchParams.has('schema')) {
    url.searchParams.set('schema', schema);
  }
  return url.toString();
}

function readPostgresSchema(connectionString: string) {
  try {
    const url = new URL(connectionString);
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      return undefined;
    }
    return url.searchParams.get('schema') ?? undefined;
  } catch {
    return undefined;
  }
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));
}

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase();
}
