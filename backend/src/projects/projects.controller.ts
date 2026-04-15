import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateProjectRequestDto,
  UpdateProjectRequestDto,
} from './dto/project-requests.dto';
import { ProjectDto, ProjectListResponseDto } from './dto/project.dto';

@ApiTags('Projects')
@ApiBearerAuth('bearer')
@Controller('projects')
export class ProjectsController {
  @Get()
  @ApiOperation({
    summary: 'List projects',
    description:
      'Returns project definitions used for personalized triage relevance.',
  })
  @ApiOkResponse({
    description: 'Project list.',
    type: ProjectListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token.',
    type: ApiErrorResponseDto,
  })
  listProjects(): ProjectListResponseDto {
    const items: ProjectDto[] = [
      {
        id: 1,
        name: 'Standard Library',
        description:
          'Focus area for standard library related issue triage and pull request reviews.',
        keywords: ['stdlib', 'abi'],
        createdAt: '2026-04-14T12:00:00.000Z',
        updatedAt: '2026-04-15T08:00:00.000Z',
      },
    ];

    return {
      items,
      total: items.length,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project detail',
    description:
      'Returns single project definition to support project detail/edit screens.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Project detail.',
    type: ProjectDto,
  })
  getProject(@Param('id', ParseIntPipe) id: number): ProjectDto {
    return {
      id,
      name: 'Standard Library',
      description:
        'Focus area for standard library related issue triage and pull request reviews.',
      keywords: ['stdlib', 'abi'],
      createdAt: '2026-04-14T12:00:00.000Z',
      updatedAt: '2026-04-15T08:00:00.000Z',
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create project',
    description:
      'Creates project context used in classification and priority decisions.',
  })
  @ApiCreatedResponse({
    description: 'Project created.',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body.',
    type: ApiErrorResponseDto,
  })
  createProject(@Body() request: CreateProjectRequestDto): ProjectDto {
    return {
      id: 999,
      name: request.name,
      description: request.description,
      keywords: request.keywords ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update project',
    description: 'Updates project context and classification hints.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Project updated.',
    type: ProjectDto,
  })
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateProjectRequestDto,
  ): ProjectDto {
    return {
      id,
      name: request.name ?? 'Standard Library',
      description:
        request.description ??
        'Focus area for standard library related issue triage and pull request reviews.',
      keywords: request.keywords ?? ['stdlib', 'abi'],
      createdAt: '2026-04-14T12:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete project',
    description: 'Deletes project definition.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Project deleted.',
  })
  deleteProject(@Param('id', ParseIntPipe) id: number): void {
    void id;
  }
}
