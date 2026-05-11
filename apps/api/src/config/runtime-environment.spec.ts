import {
  resolveDatabaseUrl,
  resolvePrismaPostgresConfig,
  resolveRuntimeEnvironment,
} from './runtime-environment';

describe('runtime environment helpers', () => {
  it('defaults to local outside production', () => {
    expect(resolveRuntimeEnvironment({})).toBe('local');
    expect(resolveRuntimeEnvironment({ NODE_ENV: 'test' })).toBe('test');
    expect(resolveRuntimeEnvironment({ NODE_ENV: 'production' })).toBe('aws');
  });

  it('keeps an explicit database schema in DATABASE_URL', () => {
    expect(
      resolveDatabaseUrl({
        APP_ENV: 'local',
        DATABASE_URL:
          'postgresql://cpa:cpa@localhost:5432/cpa_jobs?schema=custom_local',
      }),
    ).toBe('postgresql://cpa:cpa@localhost:5432/cpa_jobs?schema=custom_local');
  });

  it('adds the environment schema when the URL has none', () => {
    expect(
      resolveDatabaseUrl({
        APP_ENV: 'local',
        LOCAL_DATABASE_SCHEMA: 'dev_schema',
        DATABASE_URL: 'postgresql://cpa:cpa@localhost:5432/cpa_jobs',
      }),
    ).toBe('postgresql://cpa:cpa@localhost:5432/cpa_jobs?schema=dev_schema');
  });

  it('exposes the schema for the Prisma pg adapter', () => {
    expect(
      resolvePrismaPostgresConfig({
        APP_ENV: 'local',
        LOCAL_DATABASE_SCHEMA: 'local',
        DATABASE_URL: 'postgresql://cpa:cpa@localhost:5432/cpa_jobs',
      }),
    ).toEqual({
      connectionString:
        'postgresql://cpa:cpa@localhost:5432/cpa_jobs?schema=local',
      schema: 'local',
    });
  });

  it('uses separate local and aws database URLs', () => {
    expect(
      resolveDatabaseUrl({
        APP_ENV: 'local',
        LOCAL_DATABASE_URL: 'postgresql://local:pw@localhost:5432/jobs',
      }),
    ).toBe('postgresql://local:pw@localhost:5432/jobs?schema=local');

    expect(
      resolveDatabaseUrl({
        APP_ENV: 'aws',
        AWS_DATABASE_URL: 'postgresql://aws:pw@postgres:5432/jobs',
      }),
    ).toBe('postgresql://aws:pw@postgres:5432/jobs?schema=public');
  });

  it('lets environment-specific URLs override a shared DATABASE_URL', () => {
    expect(
      resolveDatabaseUrl({
        APP_ENV: 'local',
        DATABASE_URL: 'postgresql://prod:pw@postgres:5432/jobs?schema=public',
        LOCAL_DATABASE_URL: 'postgresql://local:pw@localhost:5432/jobs',
      }),
    ).toBe('postgresql://local:pw@localhost:5432/jobs?schema=local');
  });

  it('requires an explicit database URL in aws runtime', () => {
    expect(() => resolveDatabaseUrl({ APP_ENV: 'aws' })).toThrow(
      /DATABASE_URL/,
    );
  });
});
