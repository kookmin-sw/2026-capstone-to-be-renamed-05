import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DeployRequestDto } from './dto/deploy-request.dto';

export type DeployResponse = {
  ok: true;
  status: 'restart_scheduled';
  branch: string;
  sha: string;
  logPath: string;
};

@Injectable()
export class OpsDeployService {
  constructor(private readonly config: ConfigService) {}

  async deploy(
    authorization: string | undefined,
    body: DeployRequestDto,
  ): Promise<DeployResponse> {
    this.assertAuthorized(authorization);

    const branch = this.config.get<string>('DEPLOY_BRANCH') || 'develop';
    const expectedRef = `refs/heads/${branch}`;
    if (body.ref !== expectedRef) {
      throw new BadRequestException(
        `Deploy ref must be ${expectedRef}; received ${body.ref}.`,
      );
    }

    const workspaceRoot = this.getWorkspaceRoot();
    const scriptPath = this.resolvePath(
      workspaceRoot,
      this.config.get<string>('DEPLOY_SCRIPT_PATH') || 'scripts/deploy-ec2.sh',
    );
    const lockPath = this.resolvePath(
      workspaceRoot,
      this.config.get<string>('DEPLOY_LOCK_FILE') || '.run/deploy.lock',
    );
    const logPath = this.resolvePath(
      workspaceRoot,
      this.config.get<string>('DEPLOY_LOG_FILE') || '.run/deploy.log',
    );

    if (await this.pathExists(lockPath)) {
      throw new ConflictException('A deployment is already running.');
    }

    if (!(await this.pathExists(scriptPath))) {
      throw new InternalServerErrorException(
        `Deploy script does not exist: ${scriptPath}`,
      );
    }

    await mkdir(dirname(logPath), { recursive: true });
    await this.runDeployScript({
      branch,
      lockPath,
      logPath,
      scriptPath,
      sha: body.sha,
      workspaceRoot,
      actor: body.actor,
      runId: body.runId,
    });

    return {
      ok: true,
      status: 'restart_scheduled',
      branch,
      sha: body.sha,
      logPath,
    };
  }

  private assertAuthorized(authorization: string | undefined) {
    const configuredToken = this.config.get<string>('DEPLOY_API_TOKEN');
    if (!configuredToken) {
      throw new InternalServerErrorException(
        'DEPLOY_API_TOKEN is not configured.',
      );
    }

    const requestToken = this.extractBearerToken(authorization);
    if (!requestToken || !this.secureCompare(requestToken, configuredToken)) {
      throw new UnauthorizedException('Invalid deploy token.');
    }
  }

  private extractBearerToken(authorization: string | undefined) {
    const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];
    if (scheme?.toLowerCase() !== 'bearer') {
      return null;
    }
    return token?.trim() || null;
  }

  private secureCompare(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private getWorkspaceRoot() {
    const configuredRoot = this.config.get<string>('DEPLOY_WORKSPACE_ROOT');
    return configuredRoot
      ? this.resolvePath(process.cwd(), configuredRoot)
      : resolve(__dirname, '../../../..');
  }

  private resolvePath(basePath: string, pathValue: string) {
    return resolve(basePath, pathValue);
  }

  private async pathExists(path: string) {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async runDeployScript(options: {
    actor?: string;
    branch: string;
    lockPath: string;
    logPath: string;
    runId?: string;
    scriptPath: string;
    sha: string;
    workspaceRoot: string;
  }) {
    let exitCode: number | null;
    try {
      exitCode = await new Promise<number | null>((resolveExit, reject) => {
        const child = spawn('bash', [options.scriptPath], {
          cwd: options.workspaceRoot,
          env: {
            ...process.env,
            DEPLOY_BRANCH: options.branch,
            DEPLOY_DEFER_API_RESTART: '1',
            DEPLOY_GITHUB_ACTOR: options.actor ?? '',
            DEPLOY_GITHUB_RUN_ID: options.runId ?? '',
            DEPLOY_LOCK_FILE: options.lockPath,
            DEPLOY_LOG_FILE: options.logPath,
            DEPLOY_TARGET_SHA: options.sha,
          },
          stdio: 'ignore',
        });

        child.once('error', reject);
        child.once('close', resolveExit);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new InternalServerErrorException(
        `Deploy script could not start: ${message}`,
      );
    }

    if (exitCode === 75) {
      throw new ConflictException('A deployment is already running.');
    }

    if (exitCode !== 0) {
      throw new InternalServerErrorException(
        `Deploy script failed with exit code ${exitCode}.`,
      );
    }
  }
}
