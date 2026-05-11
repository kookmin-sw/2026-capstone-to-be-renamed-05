import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { resolvePrismaPostgresConfig } from '../config/runtime-environment';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const { connectionString, schema } = resolvePrismaPostgresConfig();
    super({
      adapter: new PrismaPg(
        { connectionString },
        schema ? { schema } : undefined,
      ),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
