import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OpsDeployService } from './ops-deploy.service';

const createConfig = (values: Record<string, string | undefined>) =>
  ({
    get: (key: string) => values[key],
  }) as unknown as ConfigService;

describe('OpsDeployService', () => {
  let tempDir: string;
  let scriptPath: string;
  let lockPath: string;
  let logPath: string;
  let service: OpsDeployService;

  const makeService = (overrides: Record<string, string | undefined> = {}) => {
    service = new OpsDeployService(
      createConfig({
        DEPLOY_API_TOKEN: 'secret-token',
        DEPLOY_BRANCH: 'develop',
        DEPLOY_LOCK_FILE: lockPath,
        DEPLOY_LOG_FILE: logPath,
        DEPLOY_SCRIPT_PATH: scriptPath,
        DEPLOY_WORKSPACE_ROOT: tempDir,
        ...overrides,
      }),
    );
  };

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ops-deploy-'));
    scriptPath = join(tempDir, 'deploy.sh');
    lockPath = join(tempDir, 'deploy.lock');
    logPath = join(tempDir, 'deploy.log');
    await writeFile(
      scriptPath,
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        ': "${DEPLOY_BRANCH:?}"',
        ': "${DEPLOY_DEFER_API_RESTART:?}"',
        ': "${DEPLOY_TARGET_SHA:?}"',
        'touch "${DEPLOY_LOG_FILE}"',
      ].join('\n'),
    );
    await chmod(scriptPath, 0o755);
    makeService();
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  it.each([undefined, 'Bearer wrong-token', 'Basic secret-token'])(
    'rejects missing or invalid deploy tokens',
    async (authorization) => {
      await expect(
        service.deploy(authorization, {
          ref: 'refs/heads/develop',
          sha: 'abc123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects deploy requests for non-develop refs', async () => {
    await expect(
      service.deploy('Bearer secret-token', {
        ref: 'refs/heads/main',
        sha: 'abc123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when a deploy lock already exists', async () => {
    await mkdir(lockPath);

    await expect(
      service.deploy('Bearer secret-token', {
        ref: 'refs/heads/develop',
        sha: 'abc123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reports script failures as internal server errors', async () => {
    await writeFile(scriptPath, '#!/usr/bin/env bash\nexit 42\n');
    await chmod(scriptPath, 0o755);

    await expect(
      service.deploy('Bearer secret-token', {
        ref: 'refs/heads/develop',
        sha: 'abc123',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('maps deploy script lock exits to conflicts', async () => {
    await writeFile(scriptPath, '#!/usr/bin/env bash\nexit 75\n');
    await chmod(scriptPath, 0o755);

    await expect(
      service.deploy('Bearer secret-token', {
        ref: 'refs/heads/develop',
        sha: 'abc123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('runs the deploy script and returns restart scheduled metadata', async () => {
    const result = await service.deploy('Bearer secret-token', {
      ref: 'refs/heads/develop',
      sha: 'abc123',
      actor: 'octocat',
      runId: '987',
    });

    expect(result).toEqual({
      ok: true,
      status: 'restart_scheduled',
      branch: 'develop',
      sha: 'abc123',
      logPath,
    });
  });
});
