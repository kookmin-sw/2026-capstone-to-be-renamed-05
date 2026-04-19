import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { SESSION_COOKIE_NAME } from '../common/auth/session.constants';
import { AnalyzeRepositoryResponseDto } from './dto/analyze-response.dto';
import { DuplicateGroupsResponseDto } from './dto/duplicates-response.dto';
import { LabelRecommendationsResponseDto } from './dto/label-recommendations-response.dto';
import { PrioritiesResponseDto } from './dto/priorities-response.dto';
import { AnalysisService } from './analysis.service';

@ApiTags('Analysis')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('repos/:id')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Run duplicate + priority + label recommendation analysis' })
  @ApiOkResponse({ type: AnalyzeRepositoryResponseDto })
  async analyzeRepository(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) repositoryId: number,
  ): Promise<AnalyzeRepositoryResponseDto> {
    const result = await this.analysisService.analyzeRepository(userId, repositoryId);
    return {
      repositoryId: result.repositoryId,
      analyzedItems: result.analyzedItems,
      duplicateGroups: result.duplicateGroups,
      llmUsed: result.llmUsed,
      analyzedAt: result.analyzedAt.toISOString(),
    };
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Get duplicate groups for dashboard' })
  @ApiOkResponse({ type: DuplicateGroupsResponseDto })
  async getDuplicates(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) repositoryId: number,
  ): Promise<DuplicateGroupsResponseDto> {
    const groups = await this.analysisService.getDuplicateGroups(userId, repositoryId);
    return {
      groups: groups.map((group) => ({
        groupId: group.id,
        similarity: group.similarity,
        items: group.items.map((entry) => ({
          itemId: entry.workItem.id,
          number: entry.workItem.number,
          type: entry.workItem.type,
          title: entry.workItem.title,
          url: entry.workItem.url,
        })),
      })),
      totalGroups: groups.length,
    };
  }

  @Get('priorities')
  @ApiOperation({ summary: 'Get priority results' })
  @ApiOkResponse({ type: PrioritiesResponseDto })
  async getPriorities(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) repositoryId: number,
  ): Promise<PrioritiesResponseDto> {
    const results = await this.analysisService.getPriorities(userId, repositoryId);
    return {
      items: results.map((result) => ({
        itemId: result.workItem.id,
        number: result.workItem.number,
        type: result.workItem.type,
        priority: result.priority,
        reason: result.priorityReason,
        title: result.workItem.title,
      })),
      total: results.length,
    };
  }

  @Get('label-recommendations')
  @ApiOperation({ summary: 'Get label recommendation results (no auto apply)' })
  @ApiOkResponse({ type: LabelRecommendationsResponseDto })
  async getLabelRecommendations(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) repositoryId: number,
  ): Promise<LabelRecommendationsResponseDto> {
    const results = await this.analysisService.getLabelRecommendations(userId, repositoryId);
    return {
      items: results,
      total: results.length,
    };
  }
}
