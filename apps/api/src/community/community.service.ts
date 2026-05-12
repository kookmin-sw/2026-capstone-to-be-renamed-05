import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CommunityBoardType,
  CommunityPostStatus,
  CpaVerificationStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type {
  CommunityAnswerItem,
  CommunityPostDetailResponse,
  CommunityPostItem,
  CommunityPostListResponse,
} from '@cpa/shared';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityAnswerDto } from './dto/create-community-answer.dto';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { ListCommunityPostsDto } from './dto/list-community-posts.dto';

const postInclude = {
  author: { select: { username: true, displayName: true } },
  _count: { select: { answers: true } },
} satisfies Prisma.CommunityPostInclude;

const answerInclude = {
  author: { select: { username: true, displayName: true } },
} satisfies Prisma.CommunityAnswerInclude;

type CommunityPostRecord = Prisma.CommunityPostGetPayload<{
  include: typeof postInclude;
}>;

type CommunityAnswerRecord = Prisma.CommunityAnswerGetPayload<{
  include: typeof answerInclude;
}>;

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listPosts(
    query: ListCommunityPostsDto,
    user?: AuthenticatedUser,
  ): Promise<CommunityPostListResponse> {
    if (query.board === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }
    if (query.mine && !user) {
      throw new UnauthorizedException('Login is required.');
    }

    const where: Prisma.CommunityPostWhereInput = {};
    if (query.board) {
      where.boardType = query.board;
    } else if (!(await this.canAccessTrainee(user))) {
      where.boardType = { not: CommunityBoardType.TRAINEE };
    }
    if (query.mine && user) {
      where.authorId = user.id;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const items = await this.prisma.communityPost.findMany({
      where,
      include: postInclude,
      orderBy:
        query.sort === 'popular'
          ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
      take: 100,
    });

    return { items: items.map((post) => this.toPostItem(post)) };
  }

  async getPost(
    id: string,
    user?: AuthenticatedUser,
  ): Promise<CommunityPostDetailResponse> {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!post) throw new NotFoundException('Community post not found.');
    if (post.boardType === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }

    const [viewedPost, answers] = await this.prisma.$transaction([
      this.prisma.communityPost.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        include: postInclude,
      }),
      this.prisma.communityAnswer.findMany({
        where: { postId: id },
        include: answerInclude,
        orderBy: [
          { isAccepted: 'desc' },
          { likeCount: 'desc' },
          { createdAt: 'asc' },
        ],
      }),
    ]);

    return {
      post: this.toPostItem(viewedPost),
      answers: answers.map((answer) => this.toAnswerItem(answer)),
    };
  }

  async createPost(
    user: AuthenticatedUser,
    dto: CreateCommunityPostDto,
  ): Promise<CommunityPostItem> {
    if (dto.boardType === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }

    const title = dto.title.trim();
    const content = dto.content.trim();
    if (!title || !content) {
      throw new BadRequestException('Title and content are required.');
    }

    const post = await this.prisma.communityPost.create({
      data: {
        boardType: dto.boardType,
        title,
        content,
        status:
          dto.boardType === CommunityBoardType.FREE
            ? CommunityPostStatus.FREE
            : CommunityPostStatus.QUESTION,
        tags: this.normalizeTags(dto.tags),
        authorId: user.id,
        isAnonymous: dto.isAnonymous ?? true,
      },
      include: postInclude,
    });

    return this.toPostItem(post);
  }

  async createAnswer(
    user: AuthenticatedUser,
    postId: string,
    dto: CreateCommunityAnswerDto,
  ): Promise<CommunityAnswerItem> {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, boardType: true },
    });
    if (!post) throw new NotFoundException('Community post not found.');
    if (post.boardType === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }

    const content = dto.content.trim();
    if (!content) throw new BadRequestException('Answer content is required.');

    const answer = await this.prisma.communityAnswer.create({
      data: {
        postId,
        authorId: user.id,
        content,
        isAnonymous: dto.isAnonymous ?? true,
      },
      include: answerInclude,
    });

    return this.toAnswerItem(answer);
  }

  async likePost(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CommunityPostItem> {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: { id: true, boardType: true },
    });
    if (!post) throw new NotFoundException('Community post not found.');
    if (post.boardType === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
      include: postInclude,
    });
    return this.toPostItem(updated);
  }

  async likeAnswer(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CommunityAnswerItem> {
    const answer = await this.prisma.communityAnswer.findUnique({
      where: { id },
      include: { post: { select: { boardType: true } } },
    });
    if (!answer) throw new NotFoundException('Community answer not found.');
    if (answer.post.boardType === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }

    const updated = await this.prisma.communityAnswer.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
      include: answerInclude,
    });
    return this.toAnswerItem(updated);
  }

  async resolvePost(
    user: AuthenticatedUser,
    postId: string,
    answerId: string,
  ): Promise<CommunityPostDetailResponse> {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, boardType: true },
    });
    if (!post) throw new NotFoundException('Community post not found.');
    if (post.boardType === CommunityBoardType.TRAINEE) {
      await this.assertTraineeAccess(user);
    }
    if (post.authorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the post author can accept an answer.',
      );
    }

    const answer = await this.prisma.communityAnswer.findFirst({
      where: { id: answerId, postId },
      select: { id: true },
    });
    if (!answer) {
      throw new BadRequestException('Answer does not belong to this post.');
    }

    await this.prisma.$transaction([
      this.prisma.communityAnswer.updateMany({
        where: { postId },
        data: { isAccepted: false },
      }),
      this.prisma.communityAnswer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      }),
      this.prisma.communityPost.update({
        where: { id: postId },
        data: {
          status: CommunityPostStatus.ANSWERED,
          acceptedAnswerId: answerId,
        },
      }),
    ]);

    return this.getPost(postId, user);
  }

  private async assertTraineeAccess(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Login is required.');
    }
    if (user.role === UserRole.ADMIN) return;
    if (user.role !== UserRole.JOB_SEEKER) {
      throw new ForbiddenException('Only verified CPA members can enter.');
    }
    if (!(await this.hasVerifiedCpa(user.id))) {
      throw new ForbiddenException('CPA verification is required.');
    }
  }

  private async canAccessTrainee(user?: AuthenticatedUser) {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    if (user.role !== UserRole.JOB_SEEKER) return false;
    return this.hasVerifiedCpa(user.id);
  }

  private async hasVerifiedCpa(userId: string) {
    const profile = await this.prisma.personalProfile.findUnique({
      where: { userId },
      select: { cpaVerificationStatus: true },
    });
    return (
      profile?.cpaVerificationStatus === CpaVerificationStatus.CPA_VERIFIED
    );
  }

  private normalizeTags(tags: string[] | undefined) {
    const normalized = (tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    return Array.from(new Set(normalized));
  }

  private toPostItem(post: CommunityPostRecord): CommunityPostItem {
    return {
      id: post.id,
      boardType: post.boardType,
      title: post.title,
      content: post.content,
      status: post.status,
      tags: post.tags,
      authorName: post.isAnonymous
        ? '익명'
        : (post.author.displayName ?? post.author.username),
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      viewCount: post.viewCount,
      commentCount: post._count.answers,
      likeCount: post.likeCount,
      isResolved: post.status === CommunityPostStatus.ANSWERED,
      acceptedAnswerId: post.acceptedAnswerId,
    };
  }

  private toAnswerItem(answer: CommunityAnswerRecord): CommunityAnswerItem {
    return {
      id: answer.id,
      postId: answer.postId,
      content: answer.content,
      authorName: answer.isAnonymous
        ? '익명'
        : (answer.author.displayName ?? answer.author.username),
      isAnonymous: answer.isAnonymous,
      createdAt: answer.createdAt.toISOString(),
      updatedAt: answer.updatedAt.toISOString(),
      likeCount: answer.likeCount,
      isAccepted: answer.isAccepted,
    };
  }
}
