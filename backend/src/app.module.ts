import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis/analysis.controller';
import { AnalysisService } from './analysis/analysis.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { GitHubApiService } from './github/github-api.service';
import { GitHubReposController } from './github/github-repos.controller';
import { HealthController } from './health/health.controller';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { PrismaService } from './prisma.service';
import { RepositoriesController } from './repositories/repositories.controller';
import { RepositoriesService } from './repositories/repositories.service';

@Module({
  imports: [],
  controllers: [
    HealthController,
    AuthController,
    GitHubReposController,
    RepositoriesController,
    ItemsController,
    AnalysisController,
  ],
  providers: [
    PrismaService,
    GitHubApiService,
    AuthService,
    RepositoriesService,
    ItemsService,
    AnalysisService,
  ],
})
export class AppModule {}
