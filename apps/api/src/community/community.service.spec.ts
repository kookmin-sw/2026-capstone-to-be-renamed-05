import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  CommunityBoardType,
  CommunityPostStatus,
  CpaVerificationStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityService } from './community.service';

const createdAt = new Date('2026-05-10T00:00:00.000Z');
const communityAuthorSelect = {
  username: true,
  displayName: true,
  profileImageUrl: true,
  profileImageAsset: { select: { publicUrl: true } },
};

describe('CommunityService trainee room access', () => {
  let prisma: {
    personalProfile: { findUnique: jest.Mock };
    communityPost: { findMany: jest.Mock; findUnique: jest.Mock };
    communityAnswer: { create: jest.Mock };
  };
  let service: CommunityService;

  beforeEach(() => {
    prisma = {
      personalProfile: { findUnique: jest.fn() },
      communityPost: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      communityAnswer: { create: jest.fn() },
    };
    service = new CommunityService(prisma as unknown as PrismaService);
  });

  it('requires login to read trainee board posts', async () => {
    await expect(
      service.listPosts({ board: CommunityBoardType.TRAINEE }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires login to filter posts by the current author', async () => {
    await expect(service.listPosts({ mine: true })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.communityPost.findMany).not.toHaveBeenCalled();
  });

  it('rejects unverified job seekers from the trainee board', async () => {
    prisma.personalProfile.findUnique.mockResolvedValue({
      cpaVerificationStatus: CpaVerificationStatus.UNVERIFIED,
    });

    await expect(
      service.listPosts(
        { board: CommunityBoardType.TRAINEE },
        {
          id: 'user-1',
          username: 'jobseeker',
          role: UserRole.JOB_SEEKER,
          companyId: null,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows verified CPA users to read trainee board posts', async () => {
    prisma.personalProfile.findUnique.mockResolvedValue({
      cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
    });
    prisma.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-1',
        boardType: CommunityBoardType.TRAINEE,
        title: 'Trainee question',
        content: 'How should I prepare?',
        status: CommunityPostStatus.QUESTION,
        tags: [],
        authorId: 'user-1',
        author: { username: 'jobseeker', displayName: null },
        isAnonymous: true,
        viewCount: 0,
        likeCount: 0,
        acceptedAnswerId: null,
        createdAt,
        updatedAt: createdAt,
        _count: { answers: 0 },
      },
    ]);

    const result = await service.listPosts(
      { board: CommunityBoardType.TRAINEE },
      {
        id: 'user-1',
        username: 'jobseeker',
        role: UserRole.JOB_SEEKER,
        companyId: null,
      },
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].boardType).toBe(CommunityBoardType.TRAINEE);
  });

  it('filters current users posts with existing board search and sort filters', async () => {
    prisma.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-1',
        boardType: CommunityBoardType.FREE,
        title: 'Interview memo',
        content: 'Big4 interview',
        status: CommunityPostStatus.FREE,
        tags: ['Big4'],
        authorId: 'user-1',
        author: { username: 'jobseeker', displayName: null },
        isAnonymous: false,
        viewCount: 3,
        likeCount: 7,
        acceptedAnswerId: null,
        createdAt,
        updatedAt: createdAt,
        _count: { answers: 2 },
      },
    ]);

    await service.listPosts(
      {
        board: CommunityBoardType.FREE,
        search: 'Big4',
        sort: 'popular',
        mine: true,
      },
      {
        id: 'user-1',
        username: 'jobseeker',
        role: UserRole.JOB_SEEKER,
        companyId: null,
      },
    );

    expect(prisma.communityPost.findMany).toHaveBeenCalledWith({
      where: {
        boardType: CommunityBoardType.FREE,
        authorId: 'user-1',
        OR: [
          { title: { contains: 'Big4', mode: 'insensitive' } },
          { content: { contains: 'Big4', mode: 'insensitive' } },
          { tags: { has: 'Big4' } },
        ],
      },
      include: {
        author: { select: communityAuthorSelect },
        _count: { select: { answers: true } },
      },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  });

  it('returns asset and fallback author profile images for non-anonymous posts', async () => {
    prisma.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-asset',
        boardType: CommunityBoardType.FREE,
        title: 'Asset profile',
        content: 'Uses uploaded asset',
        status: CommunityPostStatus.FREE,
        tags: [],
        authorId: 'user-1',
        author: {
          username: 'asset-user',
          displayName: 'Asset User',
          profileImageUrl: 'https://legacy.example.com/profile.png',
          profileImageAsset: {
            publicUrl: 'https://assets.example.com/profile.png',
          },
        },
        isAnonymous: false,
        viewCount: 1,
        likeCount: 0,
        acceptedAnswerId: null,
        createdAt,
        updatedAt: createdAt,
        _count: { answers: 0 },
      },
      {
        id: 'post-fallback',
        boardType: CommunityBoardType.FREE,
        title: 'Fallback profile',
        content: 'Uses legacy url',
        status: CommunityPostStatus.FREE,
        tags: [],
        authorId: 'user-2',
        author: {
          username: 'fallback-user',
          displayName: null,
          profileImageUrl: 'https://legacy.example.com/fallback.png',
          profileImageAsset: null,
        },
        isAnonymous: false,
        viewCount: 1,
        likeCount: 0,
        acceptedAnswerId: null,
        createdAt,
        updatedAt: createdAt,
        _count: { answers: 0 },
      },
    ]);

    const result = await service.listPosts({ board: CommunityBoardType.FREE });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'post-asset',
          authorName: 'Asset User',
          authorProfileImageUrl: 'https://assets.example.com/profile.png',
        }),
        expect.objectContaining({
          id: 'post-fallback',
          authorName: 'fallback-user',
          authorProfileImageUrl: 'https://legacy.example.com/fallback.png',
        }),
      ]),
    );
  });

  it('hides author profile images for anonymous posts and answers', async () => {
    prisma.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-anonymous',
        boardType: CommunityBoardType.FREE,
        title: 'Anonymous profile',
        content: 'Should hide author profile',
        status: CommunityPostStatus.FREE,
        tags: [],
        authorId: 'user-1',
        author: {
          username: 'hidden-user',
          displayName: 'Hidden User',
          profileImageUrl: 'https://legacy.example.com/hidden.png',
          profileImageAsset: {
            publicUrl: 'https://assets.example.com/hidden.png',
          },
        },
        isAnonymous: true,
        viewCount: 1,
        likeCount: 0,
        acceptedAnswerId: null,
        createdAt,
        updatedAt: createdAt,
        _count: { answers: 0 },
      },
    ]);
    prisma.communityPost.findUnique.mockResolvedValue({
      id: 'post-anonymous',
      boardType: CommunityBoardType.FREE,
    });
    prisma.communityAnswer.create.mockResolvedValue({
      id: 'answer-1',
      postId: 'post-anonymous',
      content: 'Anonymous answer',
      authorId: 'user-1',
      author: {
        username: 'hidden-user',
        displayName: 'Hidden User',
        profileImageUrl: 'https://legacy.example.com/hidden-answer.png',
        profileImageAsset: {
          publicUrl: 'https://assets.example.com/hidden-answer.png',
        },
      },
      isAnonymous: true,
      likeCount: 0,
      isAccepted: false,
      createdAt,
      updatedAt: createdAt,
    });

    const posts = await service.listPosts({ board: CommunityBoardType.FREE });
    const answer = await service.createAnswer(
      {
        id: 'user-1',
        username: 'hidden-user',
        role: UserRole.JOB_SEEKER,
        companyId: null,
      },
      'post-anonymous',
      { content: 'Anonymous answer', isAnonymous: true },
    );

    expect(posts.items[0]).toEqual(
      expect.objectContaining({
        authorName: '익명',
        authorProfileImageUrl: null,
      }),
    );
    expect(answer).toEqual(
      expect.objectContaining({
        authorName: '익명',
        authorProfileImageUrl: null,
      }),
    );
  });
});
