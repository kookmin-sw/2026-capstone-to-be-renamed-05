import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeployRequestDto } from './dto/deploy-request.dto';
import { OpsDeployService } from './ops-deploy.service';

@ApiTags('ops')
@Controller('ops')
export class OpsDeployController {
  constructor(private readonly opsDeployService: OpsDeployService) {}

  @Post('deploy')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trigger the EC2 develop deployment script.',
    description:
      'Used by GitHub Actions. Requires Authorization: Bearer DEPLOY_API_TOKEN.',
  })
  @ApiBody({ type: DeployRequestDto })
  deploy(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: DeployRequestDto,
  ) {
    return this.opsDeployService.deploy(authorization, body);
  }
}
