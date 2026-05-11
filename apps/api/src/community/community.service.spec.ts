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

describe('CommunityService trainee room access', () => {
  let prisma: {
    personalProfile: { findUnique: jest.Mock };
    communityPost: { findMany: jest.Mock };
  };
  let service: CommunityService;

  beforeEach(() => {
    prisma = {
      personalProfile: { findUnique: jest.fn() },
      communityPost: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new CommunityService(prisma as unknown as PrismaService);
  });

  it('requires login to read trainee board posts', async () => {
    await expect(
      service.listPosts({ board: CommunityBoardType.TRAINEE }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
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
});
