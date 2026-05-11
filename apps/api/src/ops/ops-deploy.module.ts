import { Module } from '@nestjs/common';
import { OpsDeployController } from './ops-deploy.controller';
import { OpsDeployService } from './ops-deploy.service';

@Module({
  controllers: [OpsDeployController],
  providers: [OpsDeployService],
})
export class OpsDeployModule {}
