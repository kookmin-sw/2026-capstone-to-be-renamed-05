import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CommunityService } from './community.service';
import { CreateCommunityAnswerDto } from './dto/create-community-answer.dto';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { ListCommunityPostsDto } from './dto/list-community-posts.dto';
import { ResolveCommunityPostDto } from './dto/resolve-community-post.dto';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  listPosts(
    @Query() query: ListCommunityPostsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.communityService.listPosts(query, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts/:id')
  getPost(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.communityService.getPost(id, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Post('posts')
  createPost(@Req() req: RequestWithUser, @Body() dto: CreateCommunityPostDto) {
    return this.communityService.createPost(req.user!, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Post('posts/:id/answers')
  createAnswer(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateCommunityAnswerDto,
  ) {
    return this.communityService.createAnswer(req.user!, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Post('posts/:id/like')
  likePost(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.communityService.likePost(req.user!, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Post('answers/:id/like')
  likeAnswer(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.communityService.likeAnswer(req.user!, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Patch('posts/:id/resolve')
  resolvePost(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ResolveCommunityPostDto,
  ) {
    return this.communityService.resolvePost(req.user!, id, dto.answerId);
  }
}
