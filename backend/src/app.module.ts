import { Module } from '@nestjs/common';
import { AuthController, MenuController } from './auth/auth.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { HealthController } from './health/health.controller';
import { LabelsController } from './labels/labels.controller';
import { ProjectsController } from './projects/projects.controller';
import { ReposController } from './repos/repos.controller';
import { SummaryController } from './summary/summary.controller';

@Module({
  imports: [],
  controllers: [
    AuthController,
    MenuController,
    HealthController,
    DashboardController,
    ReposController,
    ProjectsController,
    LabelsController,
    SummaryController,
  ],
  providers: [],
})
export class AppModule {}
